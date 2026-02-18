// Importa estilos CSS
import "../styles/home.css";
// Importa imagens do logo e quadra
import logoImg from "../assets/logo.png";
import quadraImg from "../assets/quadra-tenis.png";
// Importa hooks do React para estado e navegação
import { useState } from "react";
import { useNavigate } from "react-router-dom";

// Componente principal da página inicial
export function Home() {
  // Estado para armazenar a cidade digitada pelo usuário
  const [cidade, setCidade] = useState<string>("");
  // Hook para navegar entre páginas
  const navigate = useNavigate();

  // Função para validar e navegar para página de reservas
  const handleReservar = () => {
    // Valida se a cidade foi preenchida
    if (!cidade.trim()) {
      alert("Por favor, informe a cidade antes de reservar.");
      return;
    }

    // Navega para página de reservas passando a cidade como parâmetro
    navigate("/reservas", { state: { cidade } });
  };

  return (
    <div className="home-page">
      {/* Banner com imagem de fundo e logo */}
      <div className="banner">
        <img src={quadraImg} alt="Quadra de tênis" className="banner-img" />
        <img src={logoImg} alt="Reserva dos Vinhedos" className="banner-logo" />
      </div>

      <div className="home-container">
        <main className="home-content">
          {/* Título principal */}
          <h1>Clube de Tênis Reserva dos Vinhedos</h1>
          {/* Subtítulo */}
          <p>Reserve sua quadra de tênis com facilidade</p>

          {/* Campo para entrada da cidade */}
          <input
            type="text"
            placeholder="Digite sua cidade"
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
            className="input-cidade"
          />

          {/* Botão para iniciar a reserva */}
          <button type="button" className="btn-reservar" onClick={handleReservar}>
            Reservar
          </button>
        </main>
      </div>

      {/* Rodapé da página */}
      <footer className="home-footer">
        © 2026 - BrenaleTenisPlay | Sistema de Reservas
      </footer>
    </div>
  );
}
