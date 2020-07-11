import React, { useRef, useEffect } from "react";
import mapboxgl from "mapbox-gl";
import useSWR from "swr";
import lookup from "country-code-lookup";
import "./App.scss";
// Need mapbox css for tooltips later in the tutorial
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken =
  "pk.eyJ1Ijoibm90YWxlbWVzYSIsImEiOiJjazhiOTZnb2gwM3NxM2ZucGp1Z21mNjZ0In0.Z4nS6wdB4WzflkDItyXSIQ";

function App() {
  const mapboxElRef = useRef(null); // DOM element to render map

  // Fetch data here

  // Initialize our map
  useEffect(() => {
    // Mapbox functionality goes here
    new mapboxgl.Map({
      container: mapboxElRef.current,
      style: "mapbox://styles/notalemesa/ck8dqwdum09ju1ioj65e3ql3k",
      center: [10, 40], // initial geo location
      zoom: 2 // initial zoom
    });
  }, []);

  return (
    <div className="App">
      <div className="mapContainer">
        {/* Mapbox Container */}
        <div className="mapBox" ref={mapboxElRef} />
      </div>
    </div>
  );
}

export default App;
