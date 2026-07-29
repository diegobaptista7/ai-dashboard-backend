import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = [
  '#0F766E', // Dark Teal
  '#D97706', // Muted Yellow/Orange
  '#4338CA', // Indigo / Muted Purple
  '#64748B', // Gray
  '#15803D', // Muted Green
  '#BE185D', // Muted Pinkish Red
  '#0369A1', // Muted Blue
  '#8B5CF6', // Purple
  '#B45309', // Dark Orange / Rust
  '#0F172A', // Dark Slate
  '#047857', // Forest Green
  '#7C3AED', // Muted Violet
  '#C2410C', // Burnt Orange
  '#1D4ED8', // Royal Blue
];

const SHADOW_COLORS = [
  '#0D5953', // Dark Teal Shadow
  '#A15C04', // Muted Yellow Shadow
  '#312E81', // Indigo Shadow
  '#475569', // Gray Shadow
  '#14532D', // Green Shadow
  '#831843', // Pink Red Shadow
  '#0C4A6E', // Blue Shadow
  '#5B21B6', // Purple Shadow
  '#78350F', // Rust Shadow
  '#020617', // Slate Shadow
  '#022C22', // Forest Shadow
  '#4C1D95', // Violet Shadow
  '#7C2D12', // Burnt Orange Shadow
  '#1E3A8A', // Royal Blue Shadow
];

// Provide perfectly stable uniqueness per category
const globalCategoryIndexes = new Map();
let nextGlobalIndex = 0;

const getColorIndex = (name) => {
  if (globalCategoryIndexes.has(name)) {
    return globalCategoryIndexes.get(name);
  }
  const idx = nextGlobalIndex;
  globalCategoryIndexes.set(name, idx);
  nextGlobalIndex++;
  return idx;
};

const RADIAN = Math.PI / 180;
const renderLabel = ({ cx, cy, midAngle, outerRadius, innerRadius, percent }) => {
  if (percent < 0.05) return null;
  
  // If the category covers the entire chart (100%), place the label safely centered 
  // at the top inside the donut to prevent getting cut off by the container edge.
  if (percent > 0.99) {
    const r = (innerRadius + outerRadius) / 2;
    // Places it at the top middle of the donut (angle 90 or 270 depending on SVG coordinates)
    // Actually, simply using the midAngle provided by Recharts for the single slice:
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight={600} fontFamily="Inter, sans-serif">
        100%
      </text>
    );
  }
  
  const r = outerRadius + 26;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#64748B" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fontFamily="Inter, sans-serif">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const { name, value } = payload[0];
    const total = payload[0].payload.total;
    return (
      <div className="chart-tooltip">
        <p style={{ fontWeight: 600 }}>{name}</p>
        <p>{value} projects · {((value / total) * 100).toFixed(1)}%</p>
      </div>
    );
  }
  return null;
};

// Strip ALL Unicode whitespace (including non-breaking spaces, zero-width chars, BOM, etc.)
function cleanStr(s) {
  return (s || '').replace(/[\s\u00A0\u200B-\u200D\uFEFF\u2000-\u200A\u202F\u205F\u3000]+/g, ' ').trim();
}

export default function CategoryPieChart({ data, colors = COLORS, shadowColors = SHADOW_COLORS }) {
  // Build unique (project, category) pairs to count each combo only once,
  // regardless of how many rows a project occupies in the table.
  const seen = new Set(); // key: "proj|||cat"
  const categoryCounts = {};

  data.forEach((r) => {
    if (!r.category) return;
    // Aggressively normalize: strip all Unicode whitespace variants, then Title Case
    const cat = cleanStr(r.category).toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
    const proj = cleanStr(r.projects).toLowerCase();
    if (!cat || !proj) return;

    const key = `${proj}|||${cat}`;
    if (seen.has(key)) return; // already counted this project+category combo
    seen.add(key);

    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const total = Object.values(categoryCounts).reduce((a, b) => a + b, 0);
  const chartData = Object.entries(categoryCounts).map(([name, value]) => ({
    name,
    value,
    total,
  }));

  if (chartData.length === 0) {
    return <div className="chart-empty">No data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={380}>
      <PieChart margin={{ top: 55, right: 0, bottom: 20, left: 0 }}>
        {/* Shadow ring for 3D depth effect */}
        <Pie
          data={chartData}
          cx="50%"
          cy="54%"
          outerRadius={83}
          innerRadius={42}
          dataKey="value"
          tabIndex={-1}
          style={{ pointerEvents: 'none' }}
          labelLine={false}
          isAnimationActive={false}
          legendType="none"
        >
          {chartData.map((entry, i) => (
            <Cell key={`shadow-${i}`} fill={shadowColors[getColorIndex(entry.name) % shadowColors.length]} stroke="none" opacity={0.45} />
          ))}
        </Pie>
        {/* Main pie */}
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          outerRadius={82}
          innerRadius={42}
          dataKey="value"
          labelLine={false}
          label={renderLabel}
        >
          {chartData.map((entry, i) => (
            <Cell key={i} fill={colors[getColorIndex(entry.name) % colors.length]} strokeWidth={2} stroke="#fff" />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="circle"
          iconSize={10}
          wrapperStyle={{ fontSize: 12, fontFamily: 'Inter, sans-serif', color: '#64748B', paddingTop: 60 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
