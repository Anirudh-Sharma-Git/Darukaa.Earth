import { useState } from "react";
import SiteMap from "../components/SiteMap";

function MapTest() {
  const [geometry, setGeometry] = useState(null);

  return (
    <main style={{ padding: "24px" }}>
      <h1>Mapbox Test</h1>
      <p>Draw a polygon on the map.</p>

      <SiteMap onPolygonCreated={setGeometry} />

      {geometry && (
        <pre style={{ marginTop: "20px", overflow: "auto" }}>
          {JSON.stringify(geometry, null, 2)}
        </pre>
      )}
    </main>
  );
}

export default MapTest;
