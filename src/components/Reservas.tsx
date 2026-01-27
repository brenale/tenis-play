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

// ================== CONSTANTS ==================
const HORARIOS_DISPONIVEIS = [
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

// ================== UTILS ==================
const formatDate = (date: Date): string => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split("T")[0];
};

const isSameDay = (a: Date, b: Date) =>
  a.toDateString() === b.toDateString();

// ================== COMPONENT ==================
export function Reservas() {
  const location = useLocation();
  const navigate = useNavigate();

  const { cidade } = (location.state as LocationState) || {};

  const [dataSelecionada, setDataSelecionada] = useState<Date>(new Date());
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [cliente, setCliente] = useState("");
  const [horario, setHorario] = useState("");

  // ================== PROTEÇÃO DE ROTA ==================
  useEffect(() => {
    if (!cidade) navigate("/");
  }, [cidade, navigate]);

  // ================== CARREGAR HISTÓRICO POR CIDADE ==================
  useEffect(() => {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return;

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
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      const all: Agendamento[] = data ? JSON.parse(data) : [];

      const outros = all.filter((a) => a.cidade !== cidade);
      const atualizado = [...outros, ...agendamentos];

      localStorage.setItem(STORAGE_KEY, JSON.stringify(atualizado));
    } catch (error) {
      console.error("Erro ao salvar agendamentos:", error);
    }
  }, [agendamentos, cidade]);

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
  const cadastrarAgendamento = () => {
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
      alert("Não foi possível cadastrar a reserva. Tente novamente.");
    }
  };

  // ================== EXCLUIR ==================
  const excluirAgendamento = (id: number) => {
    try {
      setAgendamentos((prev) => prev.filter((a) => a.id !== id));
    } catch (error) {
      console.error("Erro ao excluir agendamento:", error);
      alert("Não foi possível excluir a reserva.");
    }
  };

  return (
    <div className="reservas-page">
      <header className="reservas-header">
        <h1 className="titulo">Agenda da Quadra</h1>
        {cidade && <p className="cidade">{cidade}</p>}
      </header>

      <section className="calendar-container">
        <Calendar
          locale="pt-BR"
          calendarType="gregory"
          view="month"
          showNeighboringMonth={true}
          showFixedNumberOfWeeks={true}
          value={dataSelecionada}
          onChange={(value) => {
            if (value instanceof Date) setDataSelecionada(value);
          }}
          className="calendar"
          formatShortWeekday={(_, date) =>
            ["DOM", "SEG", "TER", "QUA", "QUI", "SEX", "SÁB"][date.getDay()]
          }
          tileDisabled={({ date }) => date < hoje}
          tileClassName={({ date }) => {
            const day = formatDate(date);

            if (date < hoje) return "day-past";
            if (isSameDay(date, hoje)) return "day-today";
            if (diasComReserva.has(day)) return "day-reserved";

            return "day-future";
          }}
        />
      </section>

      <section className="form-agendamento">
        <input
          type="text"
          placeholder="preencha seu nome"
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
