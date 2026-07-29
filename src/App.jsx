import { useState, useEffect, useMemo } from 'react';
import { fetchSheetData } from './lib/sheets';
import KPICard from './components/KPICard';
import FilterBar from './components/FilterBar';
import CategoryPieChart from './components/CategoryPieChart';
import WorldMap from './components/WorldMap';
import ContinentBarChart from './components/ContinentBarChart';
import ExtraInfoPanel from './components/ExtraInfoPanel';
import PasswordGate from './components/PasswordGate';
import AdminControl from './components/AdminControl';
import AiAssistantWidget from './components/AiAssistantWidget';

// The new shared pie chart colors handling Development overrides cleanly.
const UNIFIED_COLORS = [
  '#0F766E', // Dark Teal
  '#94A3B8', // Soft Gray
  '#4338CA', // Indigo
  '#64748B', // Gray
  '#15803D', // Muted Green
  '#BE185D', // Pinkish Red
  '#0369A1', // Muted Blue
  '#8B5CF6', // Purple
  '#6D28D9', // Strong Purple
  '#0F172A', // Dark Slate
  '#047857', // Forest Green
  '#7C3AED', // Muted Violet
  '#C2410C', // Burnt Orange
  '#1D4ED8', // Royal Blue
];

const UNIFIED_SHADOW_COLORS = [
  '#0D5953', '#475569', '#312E81', '#475569', '#14532D', '#831843',
  '#0C4A6E', '#5B21B6', '#4C1D95', '#020617', '#022C22', '#4C1D95',
  '#7C2D12', '#1E3A8A',
];

export default function App() {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter States
  const [projectType, setProjectType] = useState('all');
  const [selectedProjects, setSelectedProjects] = useState([]);
  
  // Extra Info State
  const [extraData, setExtraData] = useState([]);
  const [isExtraInfoOpen, setIsExtraInfoOpen] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(sessionStorage.getItem('authenticated') === 'true');
  const [config, setConfig] = useState({ password_enabled: false, dashboard_password: '' });
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Check for admin mode and config on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'tutator-admin-2026') {
      setIsAdminMode(true);
    }
    fetchConfig();
    logAccess();
  }, []);

  async function fetchConfig() {
    try {
      const data = await fetchSheetData('dashboard_config');
      if (data && data.length > 0) {
        const enabled = data.find(c => c.key === 'password_enabled')?.value === 'true';
        const password = data.find(c => c.key === 'dashboard_password')?.value || '';
        setConfig({ password_enabled: enabled, dashboard_password: password });
      }
    } catch (e) {
      // dashboard_config tab might be empty or unconfigured
    } finally {
      setLoadingConfig(false);
    }
  }

  async function logAccess() {
    // Optional logging handler
  }

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
    sessionStorage.setItem('authenticated', 'true');
  };
  
  const [retries, setRetries] = useState(0);

  // Fetch data from Google Sheets from ALL tabs concurrently
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [deployedData, devData, extraInfoData] = await Promise.all([
          fetchSheetData('deployed_projects'),
          fetchSheetData('development_projects'),
          fetchSheetData('extra_information')
        ]);
        
        // Tag rows with their strict origin to allow easy filtering
        const deployedTagged = (deployedData || []).map(row => ({ ...row, _project_type: 'deployed' }));
        const devTagged = (devData || []).map(row => ({ ...row, _project_type: 'development' }));
        
        setRawData([...deployedTagged, ...devTagged]);
        setExtraData(extraInfoData || []);
      } catch (err) {
        if (retries < 2) {
          setTimeout(() => setRetries((r) => r + 1), 2000);
        } else {
          setError(err.message || 'Failed to connect to Google Sheets');
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [retries]);

  // First Filter Gate: Project Type
  const typeFilteredData = useMemo(() => {
    if (projectType === 'all') return rawData;
    return rawData.filter(r => r._project_type === projectType);
  }, [rawData, projectType]);

  // Second Filter Gate: Selected Projects
  const finalFilteredData = useMemo(() => {
    if (selectedProjects.length === 0) return typeFilteredData;
    return typeFilteredData.filter((r) => selectedProjects.includes(r.projects));
  }, [typeFilteredData, selectedProjects]);

  // Derived Extra Information matching the visible rows
  const matchedExtraInfo = useMemo(() => {
    // We only show it if the user has specifically selected a project and it has extra data
    if (selectedProjects.length === 0) return [];
    
    // Create a Set of current unique projects in final data (which should strictly match our selection)
    const uniqueVisibleProjects = new Set(finalFilteredData.map(r => (r.projects || '').trim().toLowerCase()).filter(Boolean));
    const rawPartners = finalFilteredData.map(r => (r.partners || '').toLowerCase()).filter(Boolean);
    
    return extraData.filter(e => {
      const projOrOrg = (e['project/organization'] || '').trim().toLowerCase();
      
      const matchProject = uniqueVisibleProjects.has(projOrOrg);
      // Checking for substring match allows matching "pivot, inc." even if it was in a comma-separated list
      // and safely ignores the internal comma
      const matchPartner = rawPartners.some(pText => pText.includes(projOrOrg));
      
      // Explicit fix for Pivoth Pathways / Pivot just in case
      let matchPivoth = false;
      if (projOrOrg.includes('pivot')) {
        matchPivoth = uniqueVisibleProjects.has('pivoth pathways') || rawPartners.some(p => p.includes('pivot'));
      }
      
      return matchProject || matchPartner || matchPivoth;
    });
  }, [extraData, selectedProjects, finalFilteredData]);

  // KPI calculations
  const kpis = useMemo(() => {
    const partners = new Set(finalFilteredData.map((r) => r.partners).filter(Boolean));
    const countriesSet = new Set(finalFilteredData.map((r) => r.countries).filter(Boolean));
    const uniqueProjectsCheck = new Set(finalFilteredData.map(r => (r.projects || '').trim()).filter(Boolean));
    
    let countries = countriesSet.size;
    if (uniqueProjectsCheck.size === 1 && uniqueProjectsCheck.has('The Global Detention Project (GDP)')) {
      if (countries === 0) {
        countries = 'No data';
      }
    }
    
    let hasBeneficiaryData = false;
    const beneficiariesSum = finalFilteredData.reduce((s, r) => {
      const val = parseFloat(r.beneficiaries);
      if (!isNaN(val)) {
        hasBeneficiaryData = true;
        return s + val;
      }
      return s;
    }, 0);
    const beneficiaries = hasBeneficiaryData ? beneficiariesSum : 'No data';
    
    const uniqueProjects = new Set(finalFilteredData.map((r) => r.projects).filter(Boolean)).size;
    
    // Deduplicate: one timeframe per unique project
    const projectTimeframes = {};
    finalFilteredData.forEach((r) => {
      const tf = parseFloat(r.timeframe);
      const proj = (r.projects || '').trim();
      if (!isNaN(tf) && proj && !(proj in projectTimeframes)) {
        projectTimeframes[proj] = tf;
      }
    });
    const times = Object.values(projectTimeframes);
    const avgTime = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;
    
    return { partners: partners.size, countries: countries, beneficiaries, avgTime, uniqueProjects: uniqueProjectsCheck.size };
  }, [finalFilteredData]);

  // Unique project list for filter dropdown (cascades from Project Type filter)
  const projectList = useMemo(() => {
    const map = new Map();
    typeFilteredData.forEach((r) => {
      if (r.projects && !map.has(r.projects)) {
        map.set(r.projects, r._project_type || 'deployed');
      }
    });
    return Array.from(map.entries())
      .map(([name, type]) => ({ name, type }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [typeFilteredData]);

  const handleClear = () => {
    setSelectedProjects([]);
    setProjectType('all');
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader" />
        <p>Loading projects from database…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        <div className="error-icon">⚠</div>
        <h2>Connection Error</h2>
        <p>{error}</p>
        <button className="btn-retry" onClick={() => { setRetries(0); setError(null); }}>
          Retry
        </button>
      </div>
    );
  }

  if (loadingConfig) return null;

  if (isAdminMode) {
    return <AdminControl onExit={() => (window.location.href = window.location.origin + window.location.pathname)} />;
  }

  if (config.password_enabled && !isAuthenticated) {
    return <PasswordGate onAuthenticated={handleAuthenticated} correctPassword={config.dashboard_password} />;
  }

  return (
    <div className="dashboard">
      {/* ── Header ── */}
      <header className="dashboard-header">
        <div className="header-left">
          <div className="logo">
            <div className="logo-brand">
              <span className="logo-text tutator-text">Tutator</span>
              <img src="/tutator-logo.png" alt="Tutator logo" className="tutator-logo" />
            </div>
          </div>
          <div className="header-titles">
            <h1 className="page-title">Projects Dashboard</h1>
          </div>
        </div>
        <div className="header-right">
          <FilterBar
            projectType={projectType}
            onTypeChange={setProjectType}
            projects={projectList}
            selected={selectedProjects}
            onChange={setSelectedProjects}
            onClear={handleClear}
            customWidth="680px"
          >
            <button 
              className={`btn-extra-info ${matchedExtraInfo.length > 0 ? 'visible' : ''}`}
              onClick={() => setIsExtraInfoOpen(true)}
            >
              <span>📄 Extra Information</span>
            </button>
          </FilterBar>
        </div>
      </header>

      <main className="dashboard-main">
        {/* ── KPI Cards ── */}
        <section className="kpi-row">
          <KPICard
            label="Unique Projects"
            value={kpis.uniqueProjects}
            subtitle="Distinct values"
            icon="🚀"
            colorClass="kpi-orange"
          />
          <KPICard
            label="Unique Partners"
            value={kpis.partners}
            subtitle="Organizations"
            icon="🤝"
            colorClass="kpi-blue"
          />
          <KPICard
            label="Countries"
            value={kpis.countries}
            subtitle="Unique nations"
            icon="🌐"
            colorClass="kpi-purple"
          />
          <KPICard
            label="Total Beneficiaries"
            value={kpis.beneficiaries}
            subtitle="People reached"
            icon="👥"
            colorClass="kpi-teal"
            type="sum"
          />
          <KPICard
            label="Avg. Timeframe"
            value={Math.round(kpis.avgTime)}
            subtitle="Years per project"
            icon="⏱"
            colorClass="kpi-indigo"
            type="avg"
          />
        </section>

        {/* ── Charts Row ── */}
        <section className="charts-row">
          {/* Pie Chart */}
          <div className="card chart-card">
            <div className="card-header">
              <h3 className="card-title">Category Distribution</h3>
              <span className="card-badge">By percentage</span>
            </div>
            <CategoryPieChart 
              data={finalFilteredData} 
              colors={UNIFIED_COLORS} 
              shadowColors={UNIFIED_SHADOW_COLORS} 
            />
          </div>

          {/* Continent Bar Chart */}
          <div className="card chart-card">
            <div className="card-header">
              <h3 className="card-title">Projects by Continent</h3>
              <span className="card-badge">Total</span>
            </div>
            <ContinentBarChart data={finalFilteredData} />
          </div>

          {/* World Map */}
          <div className="card chart-card map-card">
            <div className="card-header">
              <h3 className="card-title">Geographic Coverage</h3>
              <span className="card-badge">Project frequency</span>
            </div>
            <div className="map-wrapper">
              <WorldMap data={finalFilteredData} />
            </div>
          </div>
        </section>
      </main>

      <ExtraInfoPanel 
        isOpen={isExtraInfoOpen} 
        onClose={() => setIsExtraInfoOpen(false)} 
        data={matchedExtraInfo} 
      />

      <AiAssistantWidget />
    </div>
  );
}
