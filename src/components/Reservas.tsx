// Importa estilos CSS
import "../styles/Reservas.css";
import "../styles/home.css"; // Importar estilos do header
// Importa hooks do React para estado, efeitos e memoização
import { useEffect, useMemo, useState } from "react";
// Importa funções de navegação e acesso ao estado da rota
import { useLocation, useNavigate } from "react-router-dom";
// Importa componente de calendário
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

// ================== TYPES ==================
// Interface para armazenar dados de cada agendamento/reserva
interface Agendamento {
  id: number;
  data: string;
  horario: string;
  cliente: string;
  cidade: string;
}

interface LocationState {
  cidade?: string;
}

// Interface para dados de clima da API OpenWeather
interface DadosClima {
  temperatura: number;
  descricao: string;
  condicao: string;
  umidade: number;
  velocidadeVento: number;
  probabilidadeChuva: number;
  icone: string;
}

// ================== CONSTANTS ==================
// Lista de horários disponíveis para reserva
const HORARIOS_DISPONIVEIS: string[] = [
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
];

// Chave para armazenar agendamentos no localStorage
const STORAGE_KEY = "@tenisplay_agendamentos";
// Chave de API da OpenWeather obtida de variável de ambiente
const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY;

// ================== UTILS ==================
// Converte uma data para formato ISO (yyyy-mm-dd) para comparações
const formatDate = (date: Date): string => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
};

// Compara se duas datas representam o mesmo dia
const isSameDay = (a: Date, b: Date): boolean =>
  a.toDateString() === b.toDateString();

// Obtém dados de clima atual (hoje) da API OpenWeather
const buscarClimaAtual = async (cidade: string): Promise<DadosClima | null> => {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${cidade}&appid=${OPENWEATHER_API_KEY}&lang=pt_br&units=metric`
    );

    if (!response.ok) {
      console.error("Erro ao buscar clima atual:", response.statusText);
      return null;
    }

    const dados = await response.json();

    return {
      temperatura: Math.round(dados.main.temp),
      descricao: dados.weather[0].description,
      condicao: dados.weather[0].main,
      umidade: dados.main.humidity,
      velocidadeVento: Math.round(dados.wind.speed),
      probabilidadeChuva: 0, // API atual não fornece PoP
      icone: dados.weather[0].icon,
    };
  } catch (error) {
    console.error("Erro ao buscar clima atual:", error);
    return null;
  }
};

// Busca dados de clima para uma data específica (hoje ou futuro)
const buscarClima = async (cidade: string, data: string): Promise<DadosClima | null> => {
  try {
    // Se for hoje, usa a API de weather atual
    const hoje = formatDate(new Date());
    if (data === hoje) {
      return await buscarClimaAtual(cidade);
    }

    // Para datas futuras, usa forecast
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${cidade}&appid=${OPENWEATHER_API_KEY}&lang=pt_br&units=metric`
    );

    if (!response.ok) {
      console.error("Erro ao buscar clima:", response.statusText);
      return null;
    }

    const dados = await response.json();
    const dataObj = new Date(data);
    
    // Procura por forecasts do dia selecionado
    const forecastsDoDia = dados.list.filter((item: any) => {
      const forecastDate = new Date(item.dt * 1000);
      const forecastDateOnly = new Date(forecastDate.getFullYear(), forecastDate.getMonth(), forecastDate.getDate());
      const dataSelecionadaOnly = new Date(dataObj.getFullYear(), dataObj.getMonth(), dataObj.getDate());
      return forecastDateOnly.getTime() === dataSelecionadaOnly.getTime();
    });

    // Se não encontrar, retorna null
    if (forecastsDoDia.length === 0) {
      console.log("Nenhum forecast encontrado para", data);
      return null;
    }

    // Pega o primeiro forecast do dia (geralmente pela manhã)
    const forecastDoDia = forecastsDoDia[0];

    return {
      temperatura: Math.round(forecastDoDia.main.temp),
      descricao: forecastDoDia.weather[0].description,
      condicao: forecastDoDia.weather[0].main,
      umidade: forecastDoDia.main.humidity,
      velocidadeVento: Math.round(forecastDoDia.wind.speed),
      probabilidadeChuva: Math.round((forecastDoDia.pop || 0) * 100),
      icone: forecastDoDia.weather[0].icon,
    };
  } catch (error) {
    console.error("Erro ao buscar clima:", error);
    return null;
  }
};

// ================== COMPONENT ==================
// Componente principal da página de reservas
export function Reservas() {
  // Hook para acessar o estado passado pela rota (cidade)
  const location = useLocation();
  // Hook para navegação entre páginas
  const navigate = useNavigate();

  // Extrai a cidade do estado passado pela rota
  const { cidade } = (location.state as LocationState) || {};

  // Estado para data selecionada no calendário
  const [dataSelecionada, setDataSelecionada] = useState<Date>(new Date());
  // Estado para lista de agendamentos
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  // Estado para nome do cliente
  const [cliente, setCliente] = useState<string>("");
  // Estado para horário selecionado
  const [horario, setHorario] = useState<string>("");
  // Estado para dados de clima
  const [clima, setClima] = useState<DadosClima | null>(null);
  // Estado para indicar se está carregando clima
  const [carregandoClima, setCarregandoClima] = useState(false);
  // Estado para controlar se o menu hamburger está aberto
  const [menuAberto, setMenuAberto] = useState<boolean>(false);

  // ================== PROTEÇÃO DE ROTA ==================
  // Redireciona para home se não houver cidade informada
  useEffect(() => {
    if (!cidade) navigate("/");
  }, [cidade, navigate]);

  // ================== CARREGAR HISTÓRICO ==================
  // Carrega agendamentos salvos do localStorage para a cidade atual
  useEffect(() => {
    if (!cidade) return;
    
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) {
        setAgendamentos([]);
        return;
      }

      const parsed: Agendamento[] = JSON.parse(data);
      const filtrados = parsed.filter((a) => a.cidade === cidade);

      setAgendamentos(filtrados);
    } catch (error) {
      console.error("Erro ao carregar agendamentos:", error);
      setAgendamentos([]);
    }
  }, [cidade]);

  // ================== SALVAR ==================
  // Salva automaticamente os agendamentos no localStorage quando mudam
  useEffect(() => {
    if (!cidade || agendamentos.length === 0) return;
    
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      const all: Agendamento[] = data ? JSON.parse(data) : [];

      // Remove agendamentos da cidade atual
      const outros = all.filter((a) => a.cidade !== cidade);
      
      // Adiciona os agendamentos atuais
      const atualizado = [...outros, ...agendamentos];

      localStorage.setItem(STORAGE_KEY, JSON.stringify(atualizado));
    } catch (error) {
      console.error("Erro ao salvar agendamentos:", error);
    }
  }, [agendamentos, cidade]);

  // ================== CARREGAR CLIMA ==================
  // Carrega dados de clima para a data selecionada
  useEffect(() => {
    const carregarClima = async () => {
      if (!cidade) {
        setClima(null);
        return;
      }

      setCarregandoClima(true);
      const dataFormatada = formatDate(dataSelecionada);
      const dados = await buscarClima(cidade, dataFormatada);
      setClima(dados);
      setCarregandoClima(false);
    };

    carregarClima();
  }, [dataSelecionada, cidade]);

  // Memoiza a data de hoje para comparações
  const hoje = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Formata a data selecionada em string ISO
  const dataFormatada = useMemo(
    () => formatDate(dataSelecionada),
    [dataSelecionada]
  );

  // Filtra agendamentos que são do dia selecionado
  const reservasDoDia = useMemo(
    () => agendamentos.filter((a) => a.data === dataFormatada),
    [agendamentos, dataFormatada]
  );

  // Extrai horários que já estão ocupados no dia
  const horariosOcupados = useMemo(
    () => reservasDoDia.map((r) => r.horario),
    [reservasDoDia]
  );

  // Cria conjunto de datas que possuem pelo menos uma reserva
  const diasComReserva = useMemo(
    () => new Set(agendamentos.map((a) => a.data)),
    [agendamentos]
  );

  // ================== CADASTRAR ==================
  // Cria uma nova reserva após validações
  const cadastrarAgendamento = (): void => {
    try {
      // Valida se cliente e horário foram preenchidos
      if (!cliente.trim() || !horario) {
        alert("Informe o nome do cliente e o horário.");
        return;
      }

      // Verifica se o horário já está ocupado
      if (horariosOcupados.includes(horario)) {
        alert("Esse horário já está reservado.");
        return;
      }

      // Cria novo agendamento com dados preenchidos
      const novo: Agendamento = {
        id: Date.now(),
        data: dataFormatada,
        horario,
        cliente,
        cidade: cidade || "",
      };

      // Adiciona à lista e limpa os campos
      setAgendamentos((prev) => [...prev, novo]);
      setCliente("");
      setHorario("");
    } catch (error) {
      console.error("Erro ao cadastrar agendamento:", error);
      alert("Não foi possível cadastrar a reserva.");
    }
  };

  // ================== EXCLUIR ==================
  // Remove um agendamento pelo ID
  const excluirAgendamento = (id: number): void => {
    try {
      setAgendamentos((prev) => prev.filter((a) => a.id !== id));
    } catch (error) {
      console.error("Erro ao excluir agendamento:", error);
      alert("Erro ao excluir reserva.");
    }
  };

  // ================== MENU ==================
  // Função para navegar para home através do menu
  const handleMenuHome = () => {
    setMenuAberto(false);
    navigate("/");
  };

  // Função para fechar menu
  const fecharMenu = () => {
    setMenuAberto(false);
  };

  // ================== CLIMA NOS DIAS ==================
  // Função para obter conteúdo de clima para um dia específico
  const getClimaDia = (_date: Date) => {
    // Por enquanto, retorna o clima atual para todos os dias
    // Futuramente pode ser expandido para forecast por dia
    if (clima && !carregandoClima) {
      return {
        icone: clima.icone,
        temperatura: clima.temperatura
      };
    }
    return null;
  };

  // ================== RENDER ==================
  return (
    <div className="reservas-page">
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
                  <button onClick={handleMenuHome}>
                    Home
                  </button>
                </li>
                <li>
                  <button onClick={() => { setMenuAberto(false); alert('Reservas - Você já está aqui'); }}>
                    Reservas
                  </button>
                </li>
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

      {/* Cabeçalho com título e cidade */}
      <header className="reservas-header">
        <h1 className="titulo">Agenda da Quadra</h1>
        {cidade && <p className="cidade">{cidade}</p>}
      </header>

      {/* Calendário para seleção de data */}
      <section className="calendar-container">
        {/* Título do mês acima do calendário */}
        <div className="calendar-title">
          {dataSelecionada.toLocaleDateString('pt-BR', { 
            month: 'long', 
            year: 'numeric' 
          })}
        </div>
        
        <Calendar
          locale="pt-BR"
          view="month"
          showNavigation={true}
          showNeighboringMonth={true}
          navigationLabel={({ date: _date, label, locale: _locale, view: _view }) => {
            return `${label}`;
          }}
          prevLabel="<"
          nextLabel=">"
          value={dataSelecionada}
          onChange={(value) => {
            if (value instanceof Date) setDataSelecionada(value);
          }}
          className="calendar"
          // Formata os dias da semana em português
          formatShortWeekday={(_, date) =>
            ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"][date.getDay()]
          }
          // Adiciona classes CSS para estilizar dias
          tileClassName={({ date }) => {
            const dia = formatDate(date);

            if (date < hoje) return "day-past";
            if (isSameDay(date, hoje)) return "day-today";
            if (diasComReserva.has(dia) && date >= hoje)
              return "day-reserved";

            return "";
          }}
          // Adiciona conteúdo customizado (ícone e temperatura) em cada dia
          tileContent={({ date, view }) => {
            if (view === 'month') {
              const climaDia = getClimaDia(date);
              if (climaDia) {
                return (
                  <div className="day-weather">
                    <img
                      src={`https://openweathermap.org/img/wn/${climaDia.icone}.png`}
                      alt="Condição do tempo"
                      className="weather-icon"
                    />
                    <span className="weather-temp">{climaDia.temperatura}°</span>
                  </div>
                );
              }
            }
            return null;
          }}
        />
      </section>

      {/* Formulário para criar nova reserva */}
      <section className="form-agendamento">
        {/* Campo para nome do cliente */}
        <input
          type="text"
          placeholder="Preencha seu nome"
          value={cliente}
          onChange={(e) => setCliente(e.target.value)}
          className="input-cliente"
        />

        {/* Seletor de horários disponíveis */}
        <select
          value={horario}
          onChange={(e) => setHorario(e.target.value)}
          className="select-horario"
        >
          <option value="">Selecione um horário</option>
          {/* Lista horários e marca como ocupados */}
          {HORARIOS_DISPONIVEIS.map((h) => (
            <option key={h} value={h} disabled={horariosOcupados.includes(h)}>
              {h} {horariosOcupados.includes(h) ? "(ocupado)" : ""}
            </option>
          ))}
        </select>

        {/* Botão para confirmar reserva */}
        <button onClick={cadastrarAgendamento} className="btn-cadastrar">
          Reservar
        </button>
      </section>

      {/* Seção de clima - versão compacta */}

      {/* Lista de reservas do dia selecionado */}
      <section className="lista-agendamentos">
        <h2>Reservas do dia {dataFormatada}</h2>

        {/* Mensagem vazia se não houver reservas */}
        {reservasDoDia.length === 0 ? (
          <p className="empty">Nenhuma reserva para este dia.</p>
        ) : (
          <ul>
            {/* Lista de reservas com opção de excluir */}
            {reservasDoDia.map((a) => (
              <li key={a.id} className="item-agendamento">
                <span>
                  ⏰ {a.horario} - {a.cliente}
                </span>
                <button
                  onClick={() => excluirAgendamento(a.id)}
                  className="btn-excluir"
                >
                  Excluir
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
