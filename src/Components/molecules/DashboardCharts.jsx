"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

/**
 * Gráfico de Dona: Estado de Pacientes (PatientStatusChart).
 * 
 * Muestra visualmente la proporción de pacientes que tienen una cita próxima
 * versus aquellos que no tienen citas pendientes.
 * Incluye en el centro del gráfico el porcentaje de "Retención".
 * 
 * @param {Object} props - Propiedades del componente.
 * @param {Array} props.data - Arreglo de datos para el gráfico de dona.
 * @param {number} props.retentionPct - Porcentaje calculado de retención de pacientes.
 * @returns {JSX.Element | null} El gráfico renderizado o null si no hay datos.
 */
export function PatientStatusChart({ data, retentionPct }) {
  if (!data || data.length === 0) return null;
  return (
    <div className="flex-1 min-h-0 w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            innerRadius="60%"
            outerRadius="80%"
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              borderRadius: "12px",
              border: "none",
              boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
            }}
          />
          <Legend verticalAlign="bottom" height={36} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
        <span className="text-xs text-muted-foreground">Retención</span>
        <span className="text-2xl font-bold text-foreground">{retentionPct}%</span>
      </div>
    </div>
  );
}

/**
 * Gráfico de Barras: Actividad Semanal (WeeklyActivityChart).
 * 
 * Muestra visualmente el volumen de citas agendadas por día a lo largo
 * de la semana actual mediante barras interactivas.
 * 
 * @param {Object} props - Propiedades del componente.
 * @param {Array} props.data - Arreglo de objetos con los días y la cantidad de citas.
 * @returns {JSX.Element | null} El gráfico renderizado o null si no hay datos.
 */
export function WeeklyActivityChart({ data }) {
  if (!data || data.length === 0) return null;
  return (
    <div className="flex-1 w-full min-h-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748b" }} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: "#f1f5f9" }}
            contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }}
          />
          <Bar
            dataKey="citas"
            fill="#6366f1"
            radius={[6, 6, 0, 0]}
            barSize={40}
            animationDuration={1000}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
