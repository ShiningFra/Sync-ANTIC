import { useState } from "react";
import API from "../api";

export default function Login({ setToken }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {
    try {
      const res = await API.post("/auth/login", { email, password });
      localStorage.setItem("token", res.data.token);
      setToken(res.data.token);
    } catch {
      alert("Erreur de connexion");
    }
  };

  return (
    <div className="login">
      <h1>ANTIC - Connexion</h1>
      <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
      <input type="password" placeholder="Mot de passe" onChange={e => setPassword(e.target.value)} />
      <button onClick={login}>Se connecter</button>
    </div>
  );
}
