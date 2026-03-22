import { useEffect, useState } from "react";
import API from "../api";

export default function Dashboard() {
  const [dossiers, setDossiers] = useState([]);

  useEffect(() => {
    API.get("/dossiers").then(res => setDossiers(res.data));
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      {dossiers.map(d => (
        <div key={d.id}>{d.title}</div>
      ))}
    </div>
  );
}
