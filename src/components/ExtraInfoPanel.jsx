import { useState, useMemo } from 'react';

export default function ExtraInfoPanel({ isOpen, onClose, data }) {
  // data is an array of extra information records for the currently selected project(s)
  const [selectedYear, setSelectedYear] = useState('All');

  const years = useMemo(() => {
    const list = new Set();
    data.forEach((r) => {
      if (r.year) list.add(r.year.toString().trim());
    });
    return ['All', ...Array.from(list).sort((a, b) => b.localeCompare(a))];
  }, [data]);

  const filteredData = useMemo(() => {
    if (selectedYear === 'All') return data;
    return data.filter((r) => r.year && r.year.toString().trim() === selectedYear);
  }, [data, selectedYear]);

  return (
    <>
      <div className={`extra-info-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} />
      <div className={`extra-info-panel ${isOpen ? 'open' : ''}`}>
        <div className="panel-header">
          <h2>Extra Information</h2>
          <button className="btn-close-panel" onClick={onClose}>×</button>
        </div>
        
        <div className="panel-body">
          {years.length > 1 && (
            <div className="panel-filter">
              <label>Filter by Year:</label>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(e.target.value)}
                className="filter-select year-select"
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          )}

          <div className="panel-content">
            {filteredData.length === 0 ? (
              <p className="no-info">No extra information available for this selection.</p>
            ) : (
              filteredData.map((item, idx) => (
                <div key={idx} className="info-block">
                  {item['project/organization'] && <h3 className="info-proj">{item['project/organization']}</h3>}
                  <div className="info-meta">
                    {item.year && <span className="info-badge">Year: {item.year}</span>}
                    {item['headquarter/country'] && <span className="info-badge">Headquarter: {item['headquarter/country']}</span>}
                    {item.beneficiary_population && <span className="info-badge">Beneficiaries: {item.beneficiary_population}</span>}
                  </div>
                  {item.information && (
                    <div className="info-text" dangerouslySetInnerHTML={{ __html: item.information.replace(/\n/g, '<br/>') }} />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
