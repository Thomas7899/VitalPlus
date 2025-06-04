import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { HealthData } from "@/hooks/useHealthData";
import { metrics } from "@/components/metrics";

type Props = {
  data: HealthData[];
  metric: typeof metrics[number];
};

export function HealthChart({ data, metric }: Props) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data.slice().reverse()} margin={{ top: 20, right: 30 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip
          formatter={(value) => `${value}`}
          labelFormatter={(label: string) => new Date(label).toLocaleDateString("de-DE")}
        />
        <Line type="monotone" dataKey={metric.key} stroke={metric.color} name={metric.label} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
