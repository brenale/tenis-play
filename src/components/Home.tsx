import "../styles/home.css";
import logoImg from "../assets/logo.png";
import quadraImg from "../assets/quadra-tenis.png";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export function Home() {
  const [cidade, setCidade] = useState<string>("");
  const navigate = useNavigate();

  const handleReservar = () => {
    if (!cidade.trim()) {
      alert("Por favor, informe a cidade antes de reservar.");
      return;
    }

    navigate("/reservas", { state: { cidade } });
  };

  return (
    <div className="home-page">
      <div className="banner">
        <img src={quadraImg} alt="Quadra de tênis" className="banner-img" />
        <img src={logoImg} alt="Reserva dos Vinhedos" className="banner-logo" />
      </div>

      <div className="home-container">
        <main className="home-content">
          <h1>Clube de Tênis Reserva dos Vinhedos</h1>
          <p>Reserve sua quadra de tênis com facilidade</p>

          <input
            type="text"
            placeholder="Digite sua cidade"
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
            className="input-cidade"
          />

          <button type="button" className="btn-reservar" onClick={handleReservar}>
            Reservar
          </button>
        </main>
      </div>

      <footer className="home-footer">
        © 2026 - BrenaleTenisPlay | Sistema de Reservas
      </footer>
    </div>
  );
}
