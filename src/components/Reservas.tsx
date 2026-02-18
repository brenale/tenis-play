import "../styles/Reservas.css";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

// ================== TYPES ==================
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

const STORAGE_KEY = "@tenisplay_agendamentos";
const OPENWEATHER_API_KEY = "f473b08efcfe780ec11c9da7abc5fff4";

// ================== UTILS ==================
/**
 * Normaliza a data para formato ISO yyyy-mm-dd
 */
const formatDate = (date: Date): string => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
};

/**
 * Verifica se duas datas são o mesmo dia
 */
const isSameDay = (a: Date, b: Date): boolean =>
  a.toDateString() === b.toDateString();

/**
 * Busca clima atual da OpenWeather API
 */
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

/**
 * Busca dados de clima da OpenWeather API
 */
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
export function Reservas() {
  const location = useLocation();
  const navigate = useNavigate();

  const { cidade } = (location.state as LocationState) || {};

  const [dataSelecionada, setDataSelecionada] = useState<Date>(new Date());
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [cliente, setCliente] = useState<string>("");
  const [horario, setHorario] = useState<string>("");
  const [clima, setClima] = useState<DadosClima | null>(null);
  const [carregandoClima, setCarregandoClima] = useState(false);

  // ================== PROTEÇÃO DE ROTA ==================
  useEffect(() => {
    if (!cidade) navigate("/");
  }, [cidade, navigate]);

  // ================== CARREGAR HISTÓRICO ==================
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

  const hoje = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const dataFormatada = useMemo(
    () => formatDate(dataSelecionada),
    [dataSelecionada]
  );

  const reservasDoDia = useMemo(
    () => agendamentos.filter((a) => a.data === dataFormatada),
    [agendamentos, dataFormatada]
  );

  const horariosOcupados = useMemo(
    () => reservasDoDia.map((r) => r.horario),
    [reservasDoDia]
  );

  const diasComReserva = useMemo(
    () => new Set(agendamentos.map((a) => a.data)),
    [agendamentos]
  );

  // ================== CADASTRAR ==================
  const cadastrarAgendamento = (): void => {
    try {
      if (!cliente.trim() || !horario) {
        alert("Informe o nome do cliente e o horário.");
        return;
      }

      if (horariosOcupados.includes(horario)) {
        alert("Esse horário já está reservado.");
        return;
      }

      const novo: Agendamento = {
        id: Date.now(),
        data: dataFormatada,
        horario,
        cliente,
        cidade: cidade || "",
      };

      setAgendamentos((prev) => [...prev, novo]);
      setCliente("");
      setHorario("");
    } catch (error) {
      console.error("Erro ao cadastrar agendamento:", error);
      alert("Não foi possível cadastrar a reserva.");
    }
  };

  // ================== EXCLUIR ==================
  const excluirAgendamento = (id: number): void => {
    try {
      setAgendamentos((prev) => prev.filter((a) => a.id !== id));
    } catch (error) {
      console.error("Erro ao excluir agendamento:", error);
      alert("Erro ao excluir reserva.");
    }
  };

  // ================== RENDER ==================
  return (
    <div className="reservas-page">
      <header className="reservas-header">
        <h1 className="titulo">Agenda da Quadra</h1>
        {cidade && <p className="cidade">{cidade}</p>}
      </header>

      <section className="calendar-container">
        <Calendar
          locale="pt-BR"
          view="month"
          showNavigation={true} // Permite navegar entre meses
          showNeighboringMonth={true}
          value={dataSelecionada}
          onChange={(value) => {
            if (value instanceof Date) setDataSelecionada(value);
          }}
          className="calendar"
          formatShortWeekday={(_, date) =>
            ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"][date.getDay()]
          }
          tileClassName={({ date }) => {
            const dia = formatDate(date);

            if (date < hoje) return "day-past";
            if (isSameDay(date, hoje)) return "day-today";
            if (diasComReserva.has(dia) && date >= hoje)
              return "day-reserved";

            return "";
          }}
        />
      </section>

      <section className="form-agendamento">
        <input
          type="text"
          placeholder="Preencha seu nome"
          value={cliente}
          onChange={(e) => setCliente(e.target.value)}
          className="input-cliente"
        />

        <select
          value={horario}
          onChange={(e) => setHorario(e.target.value)}
          className="select-horario"
        >
          <option value="">Selecione um horário</option>
          {HORARIOS_DISPONIVEIS.map((h) => (
            <option key={h} value={h} disabled={horariosOcupados.includes(h)}>
              {h} {horariosOcupados.includes(h) ? "(ocupado)" : ""}
            </option>
          ))}
        </select>

        <button onClick={cadastrarAgendamento} className="btn-cadastrar">
          Reservar
        </button>
      </section>

      {/* ================== CLIMA ================== */}
      {carregandoClima ? (
        <section className="clima-container carregando">
          <p>Carregando informações de clima...</p>
        </section>
      ) : clima ? (
        <section className="clima-container">
          <div className="clima-header">
            <h3>Previsão para {dataFormatada}</h3>
          </div>
          <div className="clima-grid">
            <div className="clima-item">
              <span className="clima-label">Temperatura</span>
              <span className="clima-valor">{clima.temperatura}°C</span>
            </div>
            <div className="clima-item">
              <span className="clima-label">Condição</span>
              <span className="clima-valor clima-descricao">{clima.descricao}</span>
            </div>
            <div className="clima-item">
              <span className="clima-label">Probabilidade de Chuva</span>
              <span className="clima-valor">{clima.probabilidadeChuva}%</span>
            </div>
            <div className="clima-item">
              <span className="clima-label">Umidade</span>
              <span className="clima-valor">{clima.umidade}%</span>
            </div>
            <div className="clima-item">
              <span className="clima-label">Vento</span>
              <span className="clima-valor">{clima.velocidadeVento} m/s</span>
            </div>
          </div>

          {clima.probabilidadeChuva > 40 && (
            <div className="alerta-chuva">
              ⚠️ Atenção: Há {clima.probabilidadeChuva}% de probabilidade de chuva neste dia!
            </div>
          )}
        </section>
      ) : null}

      <section className="lista-agendamentos">
        <h2>Reservas do dia {dataFormatada}</h2>

        {reservasDoDia.length === 0 ? (
          <p className="empty">Nenhuma reserva para este dia.</p>
        ) : (
          <ul>
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
