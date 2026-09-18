import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";

import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

function SiteMap({ onPolygonCreated }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const drawRef = useRef(null);
  const callbackRef = useRef(onPolygonCreated);

  // Always keep the latest callback available
  // without recreating the Mapbox instance.
  useEffect(() => {
    callbackRef.current = onPolygonCreated;
  }, [onPolygonCreated]);

  // Initialize Mapbox only once.
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

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        trash: true,
      },
    });

    map.addControl(
      new mapboxgl.NavigationControl(),
      "top-right",
    );

    map.addControl(draw, "top-left");

    function handleCreate(event) {
      const polygon = event.features?.[0];

      if (polygon) {
        callbackRef.current?.(polygon.geometry);
      }
    }

    function handleUpdate(event) {
      const polygon = event.features?.[0];

      if (polygon) {
        callbackRef.current?.(polygon.geometry);
      }
    }

    map.on("draw.create", handleCreate);
    map.on("draw.update", handleUpdate);

    mapRef.current = map;
    drawRef.current = draw;

    return () => {
      map.off("draw.create", handleCreate);
      map.off("draw.update", handleUpdate);
      map.remove();

      mapRef.current = null;
      drawRef.current = null;
    };
  }, []);

  return (
    <div
      ref={mapContainerRef}
      style={{
        width: "100%",
        height: "500px",
        borderRadius: "16px",
        overflow: "hidden",
      }}
    />
  );
}

export default SiteMap;