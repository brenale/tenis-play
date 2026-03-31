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
  // Estado para controlar se o menu hamburger está aberto
  const [menuAberto, setMenuAberto] = useState<boolean>(false);
  // Estado para controlar se o formulário de reserva deve ser mostrado
  const [mostrarReserva, setMostrarReserva] = useState<boolean>(false);
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

  // Função para navegar para reservas através do menu
  const handleMenuReservas = () => {
    setMenuAberto(false);
    setMostrarReserva(true);
    // Scroll para a seção de reserva após um pequeno delay para garantir que o elemento esteja visível
    setTimeout(() => {
      document.getElementById('reserva-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Função para fechar menu
  const fecharMenu = () => {
    setMenuAberto(false);
  };

  return (
    <div className="home-page">
      {/* Header com menu hamburger */}
      <header className="home-header">
        <div className="header-content">
          <button
            className={`hamburger ${menuAberto ? 'open' : ''}`}
            onClick={() => setMenuAberto(!menuAberto)}
            aria-label="Menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <h2 className="header-title">Clube de Tênis Reserva dos Vinhedos</h2>
        </div>

        {/* Menu overlay */}
        {menuAberto && (
          <div className="menu-overlay" onClick={fecharMenu}>
            <nav className="menu-content" onClick={(e) => e.stopPropagation()}>
              <button className="menu-close" onClick={fecharMenu}>×</button>
              <ul className="menu-list">
                <li>
                  <button onClick={() => {
                    setMenuAberto(false);
                    setMostrarReserva(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}>
                    Home
                  </button>
                </li>
                {!mostrarReserva && (
                  <li>
                    <button onClick={handleMenuReservas}>
                      Reservas
                    </button>
                  </li>
                )}
                {mostrarReserva && (
                  <li>
                    <button onClick={() => {
                      setMenuAberto(false);
                      setMostrarReserva(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}>
                      Voltar
                    </button>
                  </li>
                )}
                <li>
                  <button onClick={() => { setMenuAberto(false); alert('Ajuda - Em desenvolvimento'); }}>
                    Ajuda
                  </button>
                </li>
                <li>
                  <button onClick={() => { setMenuAberto(false); alert('Saindo...'); }}>
                    Sair
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </header>

      {/* Banner com imagem de fundo e logo */}
      <div className="banner">
        <img src={quadraImg} alt="Quadra de tênis" className="banner-img" />
        <img src={logoImg} alt="Reserva dos Vinhedos" className="banner-logo" />
      </div>

      <div className="home-container">
        <main className="home-content" id="reserva-section">
          {/* Título principal */}
          <h1>
            {mostrarReserva
              ? "Reserve sua quadra de tênis com facilidade"
              : "Bem-vindo ao Clube de Tênis Reserva dos Vinhedos"
            }
          </h1>

          {/* Formulário de reserva - só aparece quando solicitado */}
          {mostrarReserva && (
            <>
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
                Confirmar
              </button>
            </>
          )}
        </main>
      </div>

      {/* Rodapé da página */}
      <footer className="home-footer">
        © 2026 - BrenaleTenisPlay | Sistema de Reservas
      </footer>
    </div>
  );
}
