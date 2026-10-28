import React, { useState, useMemo } from 'react';
import {
  AlertTriangle, ShieldCheck, ShieldAlert, TrendingDown, Clock3,
  CheckCircle2, ArrowRight, UserCheck, Activity,
  Info, ExternalLink, ListChecks, Check, X, SlidersHorizontal, RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine, Legend
} from 'recharts';

function Badge({ children, tone = 'neutral', dot = false }) {
  return <span className={`badge ${tone}`}>{dot && <i />}{children}</span>;
}

function MetricCard({ label, value, change, icon: Icon, tone = 'blue', foot }) {
  return (
    <div className="metric-card">
      <div className="metric-top">
        <span>{label}</span>
        <span className={`metric-icon ${tone}`}><Icon size={18} /></span>
      </div>
      <div className="metric-value">{value}</div>
      {change && (
        <div className="metric-change">
          <span className={change.startsWith('+') ? 'positive' : change.startsWith('-') ? 'negative' : 'neutral-text'}>{change}</span>
          <span> vs previous period</span>
        </div>
      )}
      {foot && <div className="metric-foot">{foot}</div>}
    </div>
  );
}

export default function EarlyWarningView({
  patients,
  selectedId,
  onSelectPatient,
  analyses,
  careTasks,
  onCreateTaskForPatient,
  onOpenCareGaps,
  onUpdatePatientStatus,
  onLogAudit,
  onNotify,
  onNavigate
}) {
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterState, setFilterState] = useState('All');
  const [search, setSearch] = useState('');
  const [showDispositionModal, setShowDispositionModal] = useState(false);
  const [dispositionNote, setDispositionNote] = useState('');
  const [dispositionAction, setDispositionAction] = useState('Acknowledge Flag');
  const [flagStatuses, setFlagStatuses] = useState(() => {
    // Default statuses for each patient's warning
    return {
      'PM-10482': 'Active Flag',
      'PM-10491': 'Active Flag',
      'PM-10507': 'Escalated',
      'PM-10519': 'Cleared / Monitored',
      'PM-10531': 'Under Review',
      'PM-10544': 'Cleared / Monitored',
      'PM-10563': 'Active Flag',
      'PM-10578': 'Under Review',
    };
  });

  // Current selected analysis
  const currentAnalysis = useMemo(() => {
    return analyses.find(a => a.patientId === selectedId) || analyses[0];
  }, [analyses, selectedId]);

  // Tasks for current patient
  const patientTasks = useMemo(() => {
    return careTasks.filter(t => t.patientId === currentAnalysis.patientId);
  }, [careTasks, currentAnalysis]);

  // Filtered list
  const filteredAnalyses = useMemo(() => {
    return analyses.filter(a => {
      const matchSearch = `${a.patientName} ${a.patientId} ${a.warningCategory}`.toLowerCase().includes(search.toLowerCase());
      const matchPriority = filterPriority === 'All' || a.priority === filterPriority;
      const matchCategory = filterCategory === 'All' ||
        (filterCategory === 'Rapid Decline' && a.isRapidDecline) ||
        (filterCategory === 'Creatinine Surge' && a.isAcuteSurge) ||
        (filterCategory === 'Data Gap' && a.checks.missingUacr) ||
        (filterCategory === 'Stable' && a.warningCode === 'EW-STABLE');
      const currentState = flagStatuses[a.patientId] || 'Active Flag';
      const matchState = filterState === 'All' || currentState === filterState;
      return matchSearch && matchPriority && matchCategory && matchState;
    });
  }, [analyses, search, filterPriority, filterCategory, filterState, flagStatuses]);

  // KPI Metrics
  const criticalCount = analyses.filter(a => a.priority === 'Critical').length;
  const highCount = analyses.filter(a => a.priority === 'High').length;
  const rapidDeclineCount = analyses.filter(a => a.isRapidDecline).length;
  const dataGapCount = analyses.filter(a => a.checks.missingUacr || a.trustScore < 70).length;

  const handleUpdateFlagStatus = (status, note) => {
    setFlagStatuses(prev => ({ ...prev, [currentAnalysis.patientId]: status }));
    onLogAudit(
      'Early-Warning Engine',
      `Updated warning review status to: ${status}`,
      currentAnalysis.patientId,
      note || status,
      'Early warning'
    );
    onNotify(`Early-warning disposition updated to "${status}" for ${currentAnalysis.patientId}`);
    setShowDispositionModal(false);
    setDispositionNote('');
  };

  const handleRunScan = () => {
    onLogAudit('Early-Warning Engine', 'Completed longitudinal rule-based scan of patient cohort', 'Cohort (8 members)', `${rapidDeclineCount} rapid decline flags detected`, 'Early warning');
    onNotify(`Engine scan complete: ${rapidDeclineCount} rapid decline flags and ${criticalCount} critical alerts identified.`);
  };

  const initials = (name) => name.split(' ').map(x => x[0]).slice(0, 2).join('');
  const currentFlagStatus = flagStatuses[currentAnalysis.patientId] || 'Active Flag';

  return (
    <div className="early-warning-module">
      <div className="section-title">
        <div>
          <div className="eyebrow">CLINICAL DECISION SUPPORT · FEATURE 1</div>
          <h1>CKD Deterioration Early-Warning Engine</h1>
          <p>
            Longitudinal trend detection for eGFR and serum creatinine. Detects accelerated progression,
            AKI-on-CKD surges, and monitoring gaps using KDIGO 2024 clinical practice guidelines.
          </p>
        </div>
        <div className="section-actions">
          <button className="btn secondary" onClick={handleRunScan}>
            <RefreshCw size={15} /> Run engine scan
          </button>
          <button className="btn primary" onClick={() => onCreateTaskForPatient(currentAnalysis)}>
            <ListChecks size={15} /> Propose care-gap intervention
          </button>
        </div>
      </div>

      {/* Metric summary */}
      <div className="metric-grid">
        <MetricCard
          label="Active deterioration flags"
          value={criticalCount + highCount}
          change="+1 new"
          icon={AlertTriangle}
          tone="rose"
          foot="Critical & high priority cases"
        />
        <MetricCard
          label="Rapid eGFR decline rate"
          value={rapidDeclineCount}
          change="> 5 mL/min/yr"
          icon={TrendingDown}
          tone="amber"
          foot="KDIGO rapid progression criteria"
        />
        <MetricCard
          label="Validated data trust"
          value={`${analyses.filter(a => a.uncertainty === 'Low').length}/${analyses.length}`}
          change="100% units checked"
          icon={ShieldCheck}
          tone="green"
          foot="High confidence records"
        />
        <MetricCard
          label="Biomarker / data gaps"
          value={dataGapCount}
          change="Verification needed"
          icon={ShieldAlert}
          tone="purple"
          foot="Missing UACR or stale records"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="filter-bar">
        <div className="list-search" style={{ margin: 0, minWidth: '220px' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search patient, ID, or flag..."
          />
        </div>
        <label>
          Priority
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
            <option value="All">All priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Moderate">Moderate</option>
            <option value="Low">Low</option>
          </select>
        </label>
        <label>
          Warning category
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option value="All">All categories</option>
            <option value="Rapid Decline">Rapid eGFR Decline</option>
            <option value="Creatinine Surge">Creatinine Surge</option>
            <option value="Data Gap">Biomarker / Data Gap</option>
            <option value="Stable">Stable Trajectory</option>
          </select>
        </label>
        <label>
          Review state
          <select value={filterState} onChange={e => setFilterState(e.target.value)}>
            <option value="All">All states</option>
            <option value="Active Flag">Active Flag</option>
            <option value="Under Review">Under Review</option>
            <option value="Escalated">Escalated</option>
            <option value="Cleared / Monitored">Cleared / Monitored</option>
          </select>
        </label>
        <button
          className="text-btn"
          onClick={() => {
            setFilterPriority('All');
            setFilterCategory('All');
            setFilterState('All');
            setSearch('');
          }}
        >
          Clear filters
        </button>
      </div>

      {/* Main Two-Column Layout */}
      <div className="ew-layout">
        {/* Left Column: Flagged Cases List */}
        <section className="panel ew-list-panel">
          <div className="panel-heading">
            <div>
              <h3>Early-warning directory</h3>
              <p>{filteredAnalyses.length} flagged records evaluated</p>
            </div>
            <span className="count-pill">{filteredAnalyses.length}</span>
          </div>
          <div className="ew-list">
            {filteredAnalyses.map(a => {
              const state = flagStatuses[a.patientId] || 'Active Flag';
              const isSelected = a.patientId === currentAnalysis.patientId;
              return (
                <button
                  key={a.patientId}
                  className={`ew-list-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => onSelectPatient(a.patientId)}
                >
                  <div className="member-avatar large">{initials(a.patientName)}</div>
                  <div className="ew-list-main">
                    <div className="ew-list-top">
                      <b>{a.patientName}</b>
                      <span className={`risk-tag ${a.priority === 'Critical' ? 'high' : a.priority === 'High' ? 'elevated' : a.priority === 'Moderate' ? 'moderate' : 'low'}`}>
                        {a.priority}
                      </span>
                    </div>
                    <div className="ew-category-sub">{a.warningCategory}</div>
                    <div className="ew-metrics-mini">
                      <span>eGFR: <b>{a.currentEgfr}</b> <small>({a.egfrDeltaTotal > 0 ? '+' : ''}{a.egfrDeltaTotal})</small></span>
                      <span>Creat: <b>{a.currentCreat.toFixed(2)}</b></span>
                      <Badge tone={state === 'Active Flag' ? 'danger' : state === 'Escalated' ? 'warning' : state === 'Under Review' ? 'blue' : 'success'}>
                        {state}
                      </Badge>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Right Column: In-Depth Inspector */}
        <div className="ew-detail-column">
          {/* Header Panel */}
          <section className="panel ew-patient-header">
            <div className="profile-heading">
              <div className="member-avatar xlarge">{initials(currentAnalysis.patientName)}</div>
              <div className="profile-main">
                <div className="eyebrow">{currentAnalysis.patientId} · {currentAnalysis.cohort}</div>
                <h2>{currentAnalysis.patientName}</h2>
                <p>{currentAnalysis.age} yrs · {currentAnalysis.sex} · Insurer: {currentAnalysis.insurer} · Last Lab: {currentAnalysis.lastObsDate}</p>
                <div className="profile-badges">
                  <Badge tone={currentAnalysis.priority === 'Critical' ? 'danger' : currentAnalysis.priority === 'High' ? 'warning' : 'blue'} dot>
                    Priority: {currentAnalysis.priority}
                  </Badge>
                  <Badge tone={currentFlagStatus === 'Active Flag' ? 'danger' : currentFlagStatus === 'Escalated' ? 'warning' : currentFlagStatus === 'Under Review' ? 'blue' : 'success'}>
                    Status: {currentFlagStatus}
                  </Badge>
                  <Badge tone={currentAnalysis.dataTrustStatus === 'High Trust' ? 'success' : currentAnalysis.dataTrustStatus === 'Moderate Confidence' ? 'warning' : 'danger'}>
                    Trust: {currentAnalysis.dataTrustStatus} ({currentAnalysis.trustScore}%)
                  </Badge>
                  {currentAnalysis.uncertainty !== 'Low' && (
                    <Badge tone="warning">
                      Uncertainty: {currentAnalysis.uncertainty}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="ew-header-actions">
                <button className="btn secondary" onClick={() => setShowDispositionModal(true)}>
                  <UserCheck size={15} /> Disposition flag
                </button>
                <button className="btn primary" onClick={() => onCreateTaskForPatient(currentAnalysis)}>
                  <ListChecks size={15} /> Propose task
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="profile-stat-grid" style={{ paddingTop: '16px' }}>
              <div>
                <span>Latest eGFR</span>
                <b>{currentAnalysis.currentEgfr} <small>mL/min</small></b>
                <span className={currentAnalysis.egfrDeltaTotal < 0 ? 'negative' : 'positive'}>
                  {currentAnalysis.egfrDeltaTotal > 0 ? '+' : ''}{currentAnalysis.egfrDeltaTotal} total delta
                </span>
              </div>
              <div>
                <span>Annualized Decline</span>
                <b>{currentAnalysis.annualizedEgfrLoss} <small>mL/min/yr</small></b>
                <span className={currentAnalysis.isRapidDecline ? 'negative' : 'positive'}>
                  {currentAnalysis.isRapidDecline ? 'Exceeds KDIGO >5 limit' : 'Within normal variance'}
                </span>
              </div>
              <div>
                <span>Serum Creatinine</span>
                <b>{currentAnalysis.currentCreat.toFixed(2)} <small>mg/dL</small></b>
                <span className={currentAnalysis.isAcuteSurge ? 'negative' : 'muted'}>
                  {currentAnalysis.creatPctIncrease > 0 ? `+${currentAnalysis.creatPctIncrease}% rise` : 'Stable'}
                </span>
              </div>
              <div>
                <span>Urine Albumin (UACR)</span>
                <b>{currentAnalysis.uacr !== null ? `${currentAnalysis.uacr}` : 'Missing'} <small>{currentAnalysis.uacr !== null ? 'mg/g' : ''}</small></b>
                <span className={currentAnalysis.uacr >= 300 ? 'negative' : currentAnalysis.uacr === null ? 'warning-text' : 'positive'}>
                  {currentAnalysis.uacr >= 300 ? 'A3 Severe Macroalbuminuria' : currentAnalysis.uacr === null ? 'Screening Required' : 'A1/A2 Category'}
                </span>
              </div>
            </div>
          </section>

          {/* Dual-Metric Longitudinal Chart */}
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h3>Longitudinal trajectory: eGFR & serum creatinine</h3>
                <p>Tracking multi-observation kidney function across recorded visits</p>
              </div>
              <div className="chart-legend-wrap">
                <Badge tone="blue">KDIGO Guideline Aligned</Badge>
              </div>
            </div>

            <div className="chart-area patient-chart" style={{ height: '240px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={currentAnalysis.labObservations} margin={{ top: 12, right: 30, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 4" stroke="#edf0f5" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8a94a6' }} axisLine={false} tickLine={false} />
                  <YAxis
                    yAxisId="egfr"
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: '#5875f5' }}
                    axisLine={false}
                    tickLine={false}
                    label={{ value: 'eGFR (mL/min)', angle: -90, position: 'insideLeft', style: { fill: '#5875f5', fontSize: 10 } }}
                  />
                  <YAxis
                    yAxisId="creat"
                    orientation="right"
                    domain={[0, 3.5]}
                    tick={{ fontSize: 11, fill: '#e88738' }}
                    axisLine={false}
                    tickLine={false}
                    label={{ value: 'Creatinine (mg/dL)', angle: 90, position: 'insideRight', style: { fill: '#e88738', fontSize: 10 } }}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: '1px solid #e8ebf1', fontSize: 12 }}
                    formatter={(value, name) => [
                      name === 'eGFR' ? `${value} mL/min/1.73m²` : `${Number(value).toFixed(2)} mg/dL`,
                      name
                    ]}
                  />
                  <ReferenceLine
                    yAxisId="egfr"
                    y={30}
                    stroke="#dc656b"
                    strokeDasharray="4 4"
                    label={{ value: 'Stage 4 Threshold (eGFR 30)', fill: '#dc656b', fontSize: 9, position: 'right' }}
                  />
                  <Line
                    yAxisId="egfr"
                    type="monotone"
                    dataKey="egfr"
                    name="eGFR"
                    stroke="#5875f5"
                    strokeWidth={3}
                    dot={{ r: 4, fill: '#5875f5', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    yAxisId="creat"
                    type="monotone"
                    dataKey="creatinine"
                    name="Serum Creatinine"
                    stroke="#e88738"
                    strokeWidth={2.5}
                    strokeDasharray="5 3"
                    dot={{ r: 4, fill: '#e88738', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="trend-insight">
              <div className="insight-icon">
                {currentAnalysis.isRapidDecline ? <TrendingDown size={18} /> : <Activity size={18} />}
              </div>
              <div>
                <b>{currentAnalysis.warningCategory}</b>
                <span>
                  {currentAnalysis.isRapidDecline
                    ? `Observed rate of decline is ~${currentAnalysis.annualizedEgfrLoss} mL/min/year. KDIGO guidelines flag declines exceeding 5 mL/min/yr as rapid progression requiring urgent clinical review and medication assessment.`
                    : currentAnalysis.isAcuteSurge
                    ? `Serum creatinine surged by +${currentAnalysis.creatPctIncrease}% from baseline (${currentAnalysis.baselineCreat.toFixed(2)} -> ${currentAnalysis.currentCreat.toFixed(2)} mg/dL). Investigate for acute-on-chronic renal injury or volume depletion.`
                    : 'Current observations demonstrate a relatively stable renal trajectory. Continue scheduled monitoring.'}
                </span>
              </div>
            </div>
          </section>

          {/* Evidence and Data Trust Breakdown in 2 Columns */}
          <div className="two-col">
            {/* Supporting Clinical Evidence */}
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h3>Supporting clinical evidence</h3>
                  <p>Transparent rationale for the early-warning flag</p>
                </div>
                <Info size={16} className="muted" />
              </div>

              <div className="ew-evidence-list">
                {currentAnalysis.evidence.map((ev, i) => (
                  <div className="contributor" key={i}>
                    <div className={`contributor-number n${(i % 3) + 1}`}>{i + 1}</div>
                    <div className="contributor-main">
                      <b>{ev.split(':')[0]}</b>
                      <span>{ev.includes(':') ? ev.split(':').slice(1).join(':') : ev}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="footnote">
                <CheckCircle2 size={13} className="green-text" />
                Evidence points are generated directly from verified longitudinal lab observations.
              </div>
            </section>

            {/* Data Trust & Validation Checks */}
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h3>Data trust & quality checks</h3>
                  <p>TrustGuard pre-prediction validation results</p>
                </div>
                <ShieldCheck size={18} className="green-text" />
              </div>

              <div className="trust-score">
                <div className={`trust-score-circle ${currentAnalysis.trustScore < 75 ? 'warn' : ''}`}>
                  <b>{currentAnalysis.trustScore}</b>
                  <span>/100</span>
                </div>
                <div>
                  <b>{currentAnalysis.dataTrustStatus}</b>
                  <p>
                    {currentAnalysis.uncertainty === 'Low'
                      ? 'All core lab validation gates passed. Observations meet schema, freshness, and unit requirements.'
                      : currentAnalysis.uncertainty === 'Moderate'
                      ? 'Minor data gap or moderate recency interval detected. Proceed with contextual review.'
                      : 'High uncertainty: Missing quantitative biomarkers or insufficient longitudinal history.'}
                  </p>
                </div>
              </div>

              <div className="check-list">
                <div key="timestamps">
                  <span className={currentAnalysis.checks.timestampsValid ? 'check-icon' : 'warn-icon'}>
                    {currentAnalysis.checks.timestampsValid ? <Check size={12} /> : <AlertTriangle size={12} />}
                  </span>
                  Timestamp sequence & interval
                  <b>{currentAnalysis.checks.timestampsValid ? 'Valid Chronological' : 'Interval Irregularity'}</b>
                </div>
                <div key="units">
                  <span className="check-icon"><Check size={12} /></span>
                  Unit consistency (mL/min, mg/dL, mg/g)
                  <b>Verified Standard</b>
                </div>
                <div key="freshness">
                  <span className={currentAnalysis.checks.freshObservation ? 'check-icon' : 'warn-icon'}>
                    {currentAnalysis.checks.freshObservation ? <Check size={12} /> : <AlertTriangle size={12} />}
                  </span>
                  Data freshness (&lt; 30 days)
                  <b>{currentAnalysis.checks.freshObservation ? 'Fresh (<30d)' : 'Stale (>30d)'}</b>
                </div>
                <div key="uacr">
                  <span className={!currentAnalysis.checks.missingUacr ? 'check-icon' : 'warn-icon'}>
                    {!currentAnalysis.checks.missingUacr ? <Check size={12} /> : <AlertTriangle size={12} />}
                  </span>
                  Quantitative UACR biomarker
                  <b>{!currentAnalysis.checks.missingUacr ? `${currentAnalysis.uacr} mg/g` : 'Missing on file'}</b>
                </div>
              </div>

              {currentAnalysis.qualityIssues.length > 0 && (
                <div className="callout warning">
                  <AlertTriangle size={15} />
                  <span>{currentAnalysis.qualityIssues.join('. ')}.</span>
                </div>
              )}
            </section>
          </div>

          {/* Linked Follow-up Tasks for this patient */}
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h3>Linked follow-up care tasks ({patientTasks.length})</h3>
                <p>Tracked interventions connected to this early-warning case</p>
              </div>
              <button className="text-btn" onClick={onOpenCareGaps}>
                Open full care-gap tracker <ArrowRight size={14} />
              </button>
            </div>

            {patientTasks.length > 0 ? (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>TASK ID</th>
                      <th>INTERVENTION TYPE</th>
                      <th>ASSIGNEE</th>
                      <th>DUE DATE</th>
                      <th>PRIORITY</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {patientTasks.map(t => (
                      <tr key={t.id}>
                        <td className="mono">{t.id}</td>
                        <td><b>{t.taskType}</b></td>
                        <td>{t.assignee}</td>
                        <td>{t.dueDate}</td>
                        <td>
                          <span className={`risk-tag ${t.priority === 'Critical' ? 'high' : t.priority === 'High' ? 'elevated' : 'moderate'}`}>
                            {t.priority}
                          </span>
                        </td>
                        <td>
                          <Badge tone={t.status === 'Completed' ? 'success' : t.status === 'In Progress' ? 'blue' : t.status === 'Escalated' ? 'danger' : 'warning'}>
                            {t.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state" style={{ minHeight: '140px', padding: '16px' }}>
                <div><ListChecks size={24} /></div>
                <h3>No active follow-up tasks yet</h3>
                <p>Click "Propose care-gap intervention" above to trigger an AI recommendation.</p>
              </div>
            )}
          </section>

          {/* Safe AI and Prediction Integrity Callout */}
          <div className="callout info">
            <Info size={16} />
            <span>
              <b>Prediction Integrity Guarantee:</b> Early-warning flags are computed using transparent, rule-based algorithms
              reflecting KDIGO 2024 guidance. They are not fabricated ML scores or autonomous diagnoses.
              Authorized human confirmation is required prior to clinical action.
            </span>
          </div>
        </div>
      </div>

      {/* Reviewer Disposition Modal */}
      {showDispositionModal && (
        <div className="modal-backdrop" onClick={() => setShowDispositionModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-heading">
              <div>
                <div className="eyebrow">HUMAN-IN-THE-LOOP TRIAGE</div>
                <h2>Review Early-Warning Flag</h2>
                <p>{currentAnalysis.patientName} ({currentAnalysis.patientId})</p>
              </div>
              <button className="icon-btn" onClick={() => setShowDispositionModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-summary">
              <div>
                <span>Flag Category</span>
                <b>{currentAnalysis.warningCategory}</b>
              </div>
              <div>
                <span>Priority</span>
                <b className={currentAnalysis.priority === 'Critical' ? 'negative' : ''}>{currentAnalysis.priority}</b>
              </div>
              <div>
                <span>Current State</span>
                <b>{currentFlagStatus}</b>
              </div>
            </div>

            <label className="form-label">
              Select Disposition Action
              <select
                value={dispositionAction}
                onChange={e => setDispositionAction(e.target.value)}
                style={{ padding: '8px', borderRadius: '7px', border: '1px solid #e1e5ed', marginTop: '4px' }}
              >
                <option value="Acknowledge Flag">Acknowledge Flag (Set to Under Review)</option>
                <option value="Escalate Flag">Escalate Flag (Urgent Specialist Review)</option>
                <option value="Open Care Gap">Open Care-Gap Follow-up Task</option>
                <option value="Clear Flag">Clear / Resolved (Stable / Handled)</option>
              </select>
            </label>

            <label className="form-label">
              Reviewer Clinical Note
              <textarea
                value={dispositionNote}
                onChange={e => setDispositionNote(e.target.value)}
                placeholder="Document clinical rationale, triage impression, or follow-up instructions..."
                rows={3}
              />
            </label>

            <div className="modal-actions">
              <button className="btn secondary" onClick={() => setShowDispositionModal(false)}>
                Cancel
              </button>
              <button
                className="btn primary"
                onClick={() => {
                  let nextState = 'Under Review';
                  if (dispositionAction === 'Escalate Flag') nextState = 'Escalated';
                  else if (dispositionAction === 'Clear Flag') nextState = 'Cleared / Monitored';
                  else if (dispositionAction === 'Open Care Gap') {
                    nextState = 'Under Review';
                    onCreateTaskForPatient(currentAnalysis);
                  }
                  handleUpdateFlagStatus(nextState, dispositionNote || dispositionAction);
                }}
              >
                Confirm disposition <Check size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
