import { useState, useRef, useEffect } from 'react';

export default function FilterBar({ projectType, onTypeChange, projects, selected, onChange, onClear, customWidth, children }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (val) => {
    if (!val) {
      onChange([]);
    } else {
      onChange([val]);
    }
    setIsOpen(false);
  };

  return (
    <div className="filter-bar">
      <div className="filter-group">
        <label className="filter-label">Project Type</label>
        <select
          className="filter-select filter-dropdown"
          value={projectType}
          onChange={(e) => onTypeChange(e.target.value)}
          style={{ width: '220px' }}
        >
          <option value="all">All Projects</option>
          <option value="deployed">Deployed Projects</option>
          <option value="development">Development Projects</option>
        </select>
      </div>

      <div className="filter-group" ref={dropdownRef}>
        <label className="filter-label">Filter by Project</label>
        <div 
          className="filter-select custom-select-button" 
          style={customWidth ? { width: customWidth } : {}}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="custom-select-text">
            {selected.length === 1 ? selected[0] : 'All Projects'}
          </span>
        </div>
        {isOpen && (
          <div className="custom-select-menu" style={customWidth ? { width: customWidth } : {}}>
            <div 
              className={`custom-select-option ${selected.length === 0 ? 'selected' : ''}`}
              onClick={() => handleSelect('')}
            >
              All Projects
            </div>
            {projects.map((p) => (
              <div 
                key={p.name} 
                className={`custom-select-option two-col-option ${selected.includes(p.name) ? 'selected' : ''}`}
                onClick={() => handleSelect(p.name)}
              >
                <span className="proj-name">{p.name}</span>
                <span className={`proj-badge proj-badge-${p.type}`}>{p.type}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <button className="btn-clear" onClick={onClear}>
        Clear Filters
      </button>
      {children}
    </div>
  );
}
