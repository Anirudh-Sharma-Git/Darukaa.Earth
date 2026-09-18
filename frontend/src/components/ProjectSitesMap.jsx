import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

function ProjectSitesMap({ sites, onSiteClick }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const callbackRef = useRef(onSiteClick);

  useEffect(() => {
    callbackRef.current = onSiteClick;
  }, [onSiteClick]);

  useEffect(() => {
    if (!mapContainerRef.current) {
      return;
    }

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [72.8777, 19.076],
      zoom: 10,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    function handleSiteClick(event) {
      const feature = event.features?.[0];

      if (!feature) {
        return;
      }

      callbackRef.current?.(feature.properties.id);
    }

    function handleMouseEnter() {
      map.getCanvas().style.cursor = "pointer";
    }

    function handleMouseLeave() {
      map.getCanvas().style.cursor = "";
    }

    map.on("load", () => {
      const features = sites.map((site) => ({
        type: "Feature",
        properties: {
          id: site.id,
          name: site.name,
          area: site.area_hectares,
        },
        geometry: site.geometry,
      }));

      const geojson = {
        type: "FeatureCollection",
        features,
      };

      map.addSource("project-sites", {
        type: "geojson",
        data: geojson,
      });

      map.addLayer({
        id: "site-fill",
        type: "fill",
        source: "project-sites",
        paint: {
          "fill-opacity": 0.35,
        },
      });

      map.addLayer({
        id: "site-outline",
        type: "line",
        source: "project-sites",
        paint: {
          "line-width": 2,
        },
      });

      map.on("click", "site-fill", handleSiteClick);

      map.on("mouseenter", "site-fill", handleMouseEnter);

      map.on("mouseleave", "site-fill", handleMouseLeave);

      if (features.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();

        features.forEach((feature) => {
          if (feature.geometry?.type !== "Polygon") {
            return;
          }

          feature.geometry.coordinates.forEach((ring) => {
            ring.forEach((coordinate) => {
              bounds.extend(coordinate);
            });
          });
        });

        if (!bounds.isEmpty()) {
          map.fitBounds(bounds, {
            padding: 60,
            maxZoom: 15,
          });
        }
      }
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [sites]);

  return (
    <div
      ref={mapContainerRef}
      style={{
        width: "100%",
        height: "520px",
        borderRadius: "16px",
        overflow: "hidden",
      }}
    />
  );
}

export default ProjectSitesMap;
