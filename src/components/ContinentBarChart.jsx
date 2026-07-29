import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const COLORS = [
  '#0F766E', '#4338CA', '#15803D', '#BE185D', '#0369A1', '#B45309', '#047857'
];

export default function ContinentBarChart({ data }) {
  // Aggregate distinct countries by continent
  const continentCountries = {};
  
  const uniqueProjectsSet = new Set(data.map(r => (r.projects || '').trim()).filter(Boolean));
  const isGeneralView = uniqueProjectsSet.size > 1;

  data.forEach((r) => {
    // 1. Skip if continent or country is missing/empty
    if (!r.continent || !r.continent.trim() || !r.countries || !r.countries.trim()) return;
    
    const continent = r.continent.trim();
    const projName = (r.projects || '').trim();
    const country = r.countries.trim().toLowerCase();
    
    if (isGeneralView && projName === 'The Global Detention Project (GDP)') {
      return;
    }

    if (!continentCountries[continent]) {
      continentCountries[continent] = new Set();
    }
    // Set ensures we only count each distinct country once per continent
    continentCountries[continent].add(country);
  });

  const continentCounts = {};
  for (const [continent, countriesSet] of Object.entries(continentCountries)) {
    continentCounts[continent] = countriesSet.size;
  }

  const totalCount = Object.values(continentCounts).reduce((a, b) => a + b, 0);

  const chartData = Object.entries(continentCounts)
    .map(([name, value]) => ({ name, value, total: totalCount }))
    .sort((a, b) => b.value - a.value);

  if (chartData.length === 0) {
    return <div className="chart-empty">No data available</div>;
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const { name, value, total } = payload[0].payload;
      const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
      return (
        <div className="chart-tooltip">
          <p style={{ fontWeight: 600 }}>{name}</p>
          <p>{value} countries ({percentage}%)</p>
        </div>
      );
    }
    return null;
  };

  const renderCustomBarLabel = ({ x, y, width, height, value, total }) => {
    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
    // Position label strictly at the end of the bar, inside or outside depending on width
    const textX = width > 40 ? x + width - 5 : x + width + 5;
    const isInside = width > 40;
    return (
      <text
        x={textX}
        y={y + height / 2}
        fill={isInside ? "#fff" : "#64748B"}
        textAnchor={isInside ? "end" : "start"}
        dominantBaseline="central"
        fontSize={12}
        fontFamily="Inter, sans-serif"
        fontWeight={600}
      >
        {percentage}%
      </text>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={380}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 20, right: 30, left: 40, bottom: 45 }}
      >
        <XAxis type="number" hide />
        <YAxis 
          dataKey="name" 
          type="category" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#64748B', fontSize: 13, fontFamily: 'Inter, sans-serif' }} 
        />
        <Tooltip cursor={{ fill: '#F1F5F9' }} content={<CustomTooltip />} />
        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24} label={(props) => renderCustomBarLabel({...props, ...chartData[props.index]})}>
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
