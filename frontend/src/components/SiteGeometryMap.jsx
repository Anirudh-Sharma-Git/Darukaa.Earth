import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

function SiteGeometryMap({ geometry }) {
  const mapContainerRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current || !geometry) {
      return;
    }

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: [72.8777, 19.076],
      zoom: 10,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.on("load", () => {
      const feature = {
        type: "Feature",
        properties: {},
        geometry,
      };

      map.addSource("site-geometry", {
        type: "geojson",
        data: feature,
      });

      map.addLayer({
        id: "site-fill",
        type: "fill",
        source: "site-geometry",
        paint: {
          "fill-opacity": 0.35,
        },
      });

      map.addLayer({
        id: "site-outline",
        type: "line",
        source: "site-geometry",
        paint: {
          "line-width": 3,
        },
      });

      const bounds = new mapboxgl.LngLatBounds();

      geometry.coordinates.forEach((ring) => {
        ring.forEach((coordinate) => {
          bounds.extend(coordinate);
        });
      });

      map.fitBounds(bounds, {
        padding: 70,
        maxZoom: 15,
      });
    });

    return () => {
      map.remove();
    };
  }, [geometry]);

  return (
    <div
      ref={mapContainerRef}
      style={{
        width: "100%",
        height: "450px",
        borderRadius: "16px",
        overflow: "hidden",
      }}
    />
  );
}

export default SiteGeometryMap;
