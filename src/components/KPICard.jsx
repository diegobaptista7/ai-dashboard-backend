import { useEffect, useRef } from 'react';

function formatValue(val, type) {
  if (type === 'sum') {
    return Math.round(val).toLocaleString();
  }
  if (type === 'avg') return Math.round(val).toLocaleString();
  return val.toLocaleString();
}

export default function KPICard({ label, value, subtitle, icon, colorClass, type = '' }) {
  const displayRef = useRef(null);
  const prevRef = useRef(0);

  useEffect(() => {
    if (typeof value === 'string' || isNaN(Number(value))) {
      if (displayRef.current) displayRef.current.textContent = value;
      return;
    }
    const target = Number(value) || 0;
    const start = prevRef.current;
    prevRef.current = target;
    const duration = 700;
    const t0 = performance.now();
    function step(t) {
      const p = Math.min((t - t0) / duration, 1);
      const cur = start + p * (target - start);
      if (displayRef.current) displayRef.current.textContent = formatValue(Math.round(cur * 10) / 10, type);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }, [value, type]);

  return (
    <div className="kpi-card">
      <div className={`kpi-icon ${colorClass}`}>
        <span className="kpi-emoji">{icon}</span>
      </div>
      <div className="kpi-body">
        <p className="kpi-label">{label}</p>
        <h2 className="kpi-value" ref={displayRef}>—</h2>
        <p className="kpi-sub">{subtitle}</p>
      </div>
    </div>
  );
}
