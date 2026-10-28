import React, { useState, useMemo } from 'react';
import {
  ListChecks, AlertTriangle, CheckCircle2, Clock3, Filter, Plus,
  Search, ArrowRight, UserCheck, Download, Edit3, X, Check,
  Sparkles, History, Info, ChevronRight, Play, RefreshCw, Send,
  FileCheck2, ShieldAlert, HeartPulse
} from 'lucide-react';
import { teamAssignees, careTaskTypes, taskStatuses } from '../data/initialData';
import { identifyCareGapsForPatient } from '../utils/earlyWarningLogic';

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
          <span> vs target</span>
        </div>
      )}
      {foot && <div className="metric-foot">{foot}</div>}
    </div>
  );
}

export default function CareGapTrackerView({
  tasks,
  onUpdateTask,
  onCreateTask,
  analyses,
  patients,
  onLogAudit,
  onNotify,
  onNavigate,
  onSelectPatient
}) {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterAssignee, setFilterAssignee] = useState('All');

  // Modals
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAgenticModal, setShowAgenticModal] = useState(false);
  const [agenticProposal, setAgenticProposal] = useState(null);

  // New task form state
  const [newTaskPatientId, setNewTaskPatientId] = useState(patients[0]?.id || 'PM-10482');
  const [newTaskType, setNewTaskType] = useState(careTaskTypes[0]);
  const [newTaskPriority, setNewTaskPriority] = useState('High');
  const [newTaskAssignee, setNewTaskAssignee] = useState(teamAssignees[0]);
  const [newTaskDueDate, setNewTaskDueDate] = useState('Nov 05, 2026');
  const [newTaskNotes, setNewTaskNotes] = useState('');

  // Status update modal note
  const [updateStatusVal, setUpdateStatusVal] = useState('');
  const [updateStatusNote, setUpdateStatusNote] = useState('');

  // Scan for all care gaps across patients
  const allIdentifiedGaps = useMemo(() => {
    const list = [];
    analyses.forEach(analysis => {
      const gaps = identifyCareGapsForPatient(analysis, tasks);
      list.push(...gaps);
    });
    return list;
  }, [analyses, tasks]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchSearch = `${t.id} ${t.patientName} ${t.patientId} ${t.taskType} ${t.assignee} ${t.notes}`.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'All' || t.status === filterStatus;
      const matchPriority = filterPriority === 'All' || t.priority === filterPriority;
      const matchType = filterType === 'All' || t.taskType === filterType;
      const matchAssignee = filterAssignee === 'All' || t.assignee === filterAssignee;
      return matchSearch && matchStatus && matchPriority && matchType && matchAssignee;
    });
  }, [tasks, search, filterStatus, filterPriority, filterType, filterAssignee]);

  // Metrics
  const openCount = tasks.filter(t => t.status !== 'Completed').length;
  const pendingCount = tasks.filter(t => t.status === 'Pending Review' || t.status === 'New').length;
  const escalatedCount = tasks.filter(t => t.status === 'Escalated').length;
  const completedCount = tasks.filter(t => t.status === 'Completed').length;

  // Handlers
  const handleQuickStatusChange = (taskId, newStatus) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const now = new Date().toLocaleTimeString('en-US', { hour12: false }) + ', ' + new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const updatedHistory = [
      { timestamp: now, actor: 'Authorized Reviewer', action: `Status changed to ${newStatus}`, note: `Updated via Care-Gap Tracker` },
      ...(task.history || [])
    ];
    onUpdateTask(taskId, { status: newStatus, updatedAt: now, history: updatedHistory });
    onLogAudit('Care-Gap Tracker', `Updated task status to: ${newStatus}`, `${task.id} (${task.patientId})`, `New status: ${newStatus}`, 'Care gap');
    onNotify(`Task ${taskId} updated to ${newStatus}`);
  };

  const handleCreateNewTask = (e) => {
    e.preventDefault();
    const patient = patients.find(p => p.id === newTaskPatientId) || patients[0];
    const analysis = analyses.find(a => a.patientId === newTaskPatientId);
    const id = `TSK-${1080 + tasks.length + 1}`;
    const now = new Date().toLocaleTimeString('en-US', { hour12: false }) + ', ' + new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const newTask = {
      id,
      patientId: patient.id,
      patientName: patient.name,
      cohort: patient.cohort,
      warningRef: analysis ? analysis.warningCode : 'EW-MANUAL',
      warningCategory: analysis ? analysis.warningCategory : 'Manual Clinical Oversight',
      taskType: newTaskType,
      priority: newTaskPriority,
      assignee: newTaskAssignee,
      assignedTeam: newTaskAssignee.includes('Nephrology') ? 'Renal Specialty Care' : newTaskAssignee.includes('Pharmacy') ? 'Pharmacy Services' : 'Care Management',
      dueDate: newTaskDueDate,
      status: 'Assigned',
      notes: newTaskNotes || `Follow-up intervention created for ${patient.name}.`,
      createdAt: now,
      updatedAt: now,
      history: [
        { timestamp: now, actor: 'Authorized Reviewer', action: 'Created new intervention task', note: newTaskNotes || 'Initiated manually' }
      ]
    };

    onCreateTask(newTask);
    onLogAudit('Care-Gap Tracker', `Created intervention task: ${newTaskType}`, `${id} (${patient.id})`, `Assigned to ${newTaskAssignee}`, 'Care gap');
    onNotify(`Task ${id} created and assigned to ${newTaskAssignee}`);
    setShowCreateModal(false);
    setNewTaskNotes('');
  };

  // Agentic trigger: review an identified gap and propose a task
  const handleProposeAgenticTask = (gap) => {
    setAgenticProposal(gap);
    setShowAgenticModal(true);
  };

  const handleConfirmAgenticProposal = () => {
    if (!agenticProposal) return;
    const gap = agenticProposal;
    const patient = patients.find(p => p.id === gap.patientId);
    const analysis = analyses.find(a => a.patientId === gap.patientId);
    const id = `TSK-${1080 + tasks.length + 1}`;
    const now = new Date().toLocaleTimeString('en-US', { hour12: false }) + ', ' + new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const dueDateObj = new Date();
    dueDateObj.setDate(dueDateObj.getDate() + (gap.suggestedTask.dueInDays || 7));
    const formattedDue = dueDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const createdTask = {
      id,
      patientId: gap.patientId,
      patientName: gap.patientName,
      cohort: patient ? patient.cohort : 'CKD',
      warningRef: analysis ? analysis.warningCode : 'EW-AGENTIC',
      warningCategory: analysis ? analysis.warningCategory : 'Agentic AI Care-Gap Identification',
      taskType: gap.suggestedTask.taskType,
      priority: gap.suggestedTask.priority,
      assignee: gap.suggestedTask.suggestedAssignee,
      assignedTeam: gap.suggestedTask.suggestedAssignee.includes('Nephrology') ? 'Renal Specialty Care' : 'Care Management',
      dueDate: formattedDue,
      status: 'Assigned',
      notes: `${gap.suggestedTask.rationale} (Guideline reference: ${gap.guidelineRef})`,
      createdAt: now,
      updatedAt: now,
      history: [
        { timestamp: now, actor: 'Agentic AI Care-Gap Tracker', action: 'Proposed intervention via clinical rule', note: gap.guidelineRef },
        { timestamp: now, actor: 'Authorized Human Reviewer', action: 'Approved and created follow-up task', note: `Assigned to ${gap.suggestedTask.suggestedAssignee}` }
      ]
    };

    onCreateTask(createdTask);
    onLogAudit('Agentic Care-Gap AI', `Human approved agentic task recommendation: ${createdTask.taskType}`, `${id} (${gap.patientId})`, `Approved for execution`, 'Care gap');
    onNotify(`Human-in-the-loop approval: Task ${id} created for ${gap.patientName}`);
    setShowAgenticModal(false);
    setAgenticProposal(null);
  };

  const handleExportTasks = () => {
    const headers = 'Task ID,Patient ID,Patient Name,Task Type,Priority,Assignee,Due Date,Status,Created At';
    const rows = tasks.map(t => [
      t.id, t.patientId, `"${t.patientName}"`, `"${t.taskType}"`, t.priority, `"${t.assignee}"`, t.dueDate, t.status, `"${t.createdAt}"`
    ].join(','));
    const csv = [headers, ...rows].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'predictmed-care-gap-tasks.csv';
    a.click();
    URL.revokeObjectURL(url);
    onNotify('Care-gap tasks CSV exported.');
  };

  return (
    <div className="care-gap-module">
      <div className="section-title">
        <div>
          <div className="eyebrow">WORKFLOW AUTOMATION & CLINICAL GOVERNANCE · FEATURE 2</div>
          <h1>Agentic AI Care-Gap & Intervention Tracker</h1>
          <p>
            Transforms early-warning signals and missing observations into trackable, human-approved clinical interventions.
            Monitors follow-up deadlines, specialist referrals, and medication safety reviews.
          </p>
        </div>
        <div className="section-actions">
          <button className="btn secondary" onClick={handleExportTasks}>
            <Download size={15} /> Export tasks
          </button>
          <button className="btn primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={15} /> Create intervention task
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="metric-grid">
        <MetricCard
          label="Open care gaps"
          value={allIdentifiedGaps.filter(g => !g.hasExistingTask).length}
          change="Action required"
          icon={AlertTriangle}
          tone="amber"
          foot="Unaddressed guideline gaps"
        />
        <MetricCard
          label="Active follow-up tasks"
          value={openCount}
          change={`${pendingCount} pending triage`}
          icon={ListChecks}
          tone="blue"
          foot="Assigned & in-progress tasks"
        />
        <MetricCard
          label="Escalated / critical tasks"
          value={escalatedCount}
          change="Requires attention"
          icon={ShieldAlert}
          tone="rose"
          foot="High-priority escalations"
        />
        <MetricCard
          label="Completed interventions"
          value={completedCount}
          change="+1 this week"
          icon={CheckCircle2}
          tone="green"
          foot="Resolved follow-ups"
        />
      </div>

      {/* Agentic Care-Gap Proactive Recommendations Section */}
      <section className="panel agentic-recommendation-panel" style={{ marginBottom: '16px' }}>
        <div className="panel-heading">
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <div className="sparkle-badge"><Sparkles size={16} /></div>
            <div>
              <h3>Agentic AI Care-Gap Engine: Recommended Interventions</h3>
              <p>Automated evaluation of active early warnings against KDIGO clinical monitoring guidelines</p>
            </div>
          </div>
          <Badge tone="blue">Controlled Workflow · Human Sign-off</Badge>
        </div>

        <div className="gap-proposals-grid">
          {allIdentifiedGaps.filter(g => !g.hasExistingTask).slice(0, 3).map(gap => (
            <div className="gap-proposal-card" key={gap.id}>
              <div className="gap-proposal-top">
                <div>
                  <span className="eyebrow">{gap.patientId} · {gap.gapType}</span>
                  <h4>{gap.title}</h4>
                </div>
                <span className={`risk-tag ${gap.urgency === 'Critical' ? 'high' : gap.urgency === 'High' ? 'elevated' : 'moderate'}`}>
                  {gap.urgency}
                </span>
              </div>
              <p>{gap.description}</p>
              <div className="gap-meta">
                <span><b>Proposed:</b> {gap.suggestedTask.taskType}</span>
                <span><b>Guideline:</b> {gap.guidelineRef}</span>
              </div>
              <div className="gap-card-footer">
                <button
                  className="btn small secondary"
                  onClick={() => {
                    onSelectPatient(gap.patientId);
                    onNavigate('Early-warning engine');
                  }}
                >
                  Inspect lab history
                </button>
                <button
                  className="btn small primary"
                  onClick={() => handleProposeAgenticTask(gap)}
                >
                  <Sparkles size={13} /> Review & approve task
                </button>
              </div>
            </div>
          ))}
        </div>

        {allIdentifiedGaps.filter(g => !g.hasExistingTask).length === 0 && (
          <div className="empty-state" style={{ minHeight: '120px', padding: '16px' }}>
            <CheckCircle2 size={24} className="green-text" />
            <h3>All identified care gaps currently have tracked tasks!</h3>
            <p>Every flagged patient trajectory has an active follow-up assigned.</p>
          </div>
        )}
      </section>

      {/* Search and Filters Bar */}
      <div className="filter-bar">
        <div className="list-search" style={{ margin: 0, minWidth: '220px' }}>
          <Search size={15} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by task, patient, assignee, notes..."
          />
        </div>
        <label>
          Status
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="All">All statuses</option>
            {taskStatuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label>
          Priority
          <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
            <option value="All">All priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </label>
        <label>
          Task Type
          <select value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value="All">All types</option>
            {careTaskTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label>
          Assignee
          <select value={filterAssignee} onChange={e => setFilterAssignee(e.target.value)}>
            <option value="All">All assignees</option>
            {teamAssignees.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </label>
        <button
          className="text-btn"
          onClick={() => {
            setSearch('');
            setFilterStatus('All');
            setFilterPriority('All');
            setFilterType('All');
            setFilterAssignee('All');
          }}
        >
          Reset filters
        </button>
      </div>

      {/* Main Tasks Table */}
      <section className="panel table-panel">
        <div className="panel-heading">
          <div>
            <h3>Active intervention & follow-up ledger</h3>
            <p>{filteredTasks.length} tasks matching filters</p>
          </div>
          <Badge tone="neutral">{tasks.length} total tasks</Badge>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>TASK ID</th>
                <th>MEMBER</th>
                <th>INTERVENTION TYPE</th>
                <th>ASSIGNED TO</th>
                <th>DUE DATE</th>
                <th>PRIORITY</th>
                <th>STATUS</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredTasks.map(t => (
                <tr key={t.id}>
                  <td className="mono">
                    <button
                      className="text-btn"
                      onClick={() => setSelectedTaskForDetail(t)}
                      style={{ fontWeight: 700 }}
                    >
                      {t.id}
                    </button>
                  </td>
                  <td>
                    <div className="member-cell">
                      <div>
                        <b>{t.patientName}</b>
                        <span>{t.patientId} · {t.cohort}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <b>{t.taskType}</b>
                      <span className="muted" style={{ fontSize: '9px' }}>Ref: {t.warningRef}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span>{t.assignee}</span>
                      <small className="muted">{t.assignedTeam}</small>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Clock3 size={13} className="muted" />
                      <span>{t.dueDate}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`risk-tag ${t.priority === 'Critical' ? 'high' : t.priority === 'High' ? 'elevated' : 'moderate'}`}>
                      {t.priority}
                    </span>
                  </td>
                  <td>
                    <select
                      className="status-select-inline"
                      value={t.status}
                      onChange={e => handleQuickStatusChange(t.id, e.target.value)}
                    >
                      {taskStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td>
                    <button
                      className="btn small secondary"
                      onClick={() => setSelectedTaskForDetail(t)}
                    >
                      Inspect <ArrowRight size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTasks.length === 0 && (
          <div className="empty-state">
            <ListChecks size={28} />
            <h3>No tasks found matching criteria</h3>
            <p>Try resetting the filters or creating a new intervention task.</p>
          </div>
        )}
      </section>

      {/* Task Detail Modal */}
      {selectedTaskForDetail && (
        <div className="modal-backdrop" onClick={() => setSelectedTaskForDetail(null)}>
          <div className="modal task-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-heading">
              <div>
                <div className="eyebrow">{selectedTaskForDetail.id} · {selectedTaskForDetail.priority} PRIORITY</div>
                <h2>{selectedTaskForDetail.taskType}</h2>
                <p>Linked to member: <b>{selectedTaskForDetail.patientName}</b> ({selectedTaskForDetail.patientId})</p>
              </div>
              <button className="icon-btn" onClick={() => setSelectedTaskForDetail(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="modal-summary">
              <div>
                <span>Assigned Team / Specialist</span>
                <b>{selectedTaskForDetail.assignee}</b>
              </div>
              <div>
                <span>Target Due Date</span>
                <b>{selectedTaskForDetail.dueDate}</b>
              </div>
              <div>
                <span>Current Status</span>
                <b>{selectedTaskForDetail.status}</b>
              </div>
            </div>

            <div className="task-detail-section">
              <h4>Clinical Rationale & Notes</h4>
              <p className="task-notes-box">{selectedTaskForDetail.notes}</p>
            </div>

            <div className="task-detail-section">
              <h4>Related Early-Warning Context</h4>
              <div className="callout info">
                <AlertTriangle size={16} />
                <span>
                  <b>Warning Flag:</b> {selectedTaskForDetail.warningCategory} ({selectedTaskForDetail.warningRef})
                </span>
              </div>
            </div>

            {/* Task History & Audit Ledger */}
            <div className="task-detail-section">
              <h4>Task Audit History & Actions</h4>
              <div className="task-history-timeline">
                {(selectedTaskForDetail.history || []).map((h, i) => (
                  <div className="history-item" key={i}>
                    <div className="history-dot" />
                    <div className="history-content">
                      <div className="history-header">
                        <b>{h.action}</b>
                        <span>{h.timestamp}</span>
                      </div>
                      <small className="muted">Actor: {h.actor}</small>
                      {h.note && <p className="history-note">{h.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions inside modal */}
            <div className="modal-actions">
              <button
                className="btn secondary"
                onClick={() => {
                  onSelectPatient(selectedTaskForDetail.patientId);
                  onNavigate('Patient intelligence');
                  setSelectedTaskForDetail(null);
                }}
              >
                View Patient Intelligence
              </button>
              <button
                className="btn secondary"
                onClick={() => {
                  handleQuickStatusChange(selectedTaskForDetail.id, 'In Progress');
                  setSelectedTaskForDetail(prev => ({ ...prev, status: 'In Progress' }));
                }}
              >
                Mark In Progress
              </button>
              <button
                className="btn primary"
                onClick={() => {
                  handleQuickStatusChange(selectedTaskForDetail.id, 'Completed');
                  setSelectedTaskForDetail(prev => ({ ...prev, status: 'Completed' }));
                }}
              >
                Mark Completed <Check size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Human-in-the-Loop Agentic Proposal Confirmation Modal */}
      {showAgenticModal && agenticProposal && (
        <div className="modal-backdrop" onClick={() => setShowAgenticModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-heading">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="sparkle-badge"><Sparkles size={16} /></div>
                <div>
                  <div className="eyebrow">AGENTIC CLINICAL WORKFLOW · HUMAN CONFIRMATION</div>
                  <h2>Confirm Care-Gap Intervention</h2>
                  <p>{agenticProposal.patientName} ({agenticProposal.patientId})</p>
                </div>
              </div>
              <button className="icon-btn" onClick={() => setShowAgenticModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="callout warning">
              <ShieldAlert size={16} />
              <span>
                <b>Autonomous Action Guardrail:</b> The Agentic AI has formulated this intervention based on verified
                KDIGO guidelines. Clinical and operational actions require explicit human confirmation before execution.
              </span>
            </div>

            <div className="proposal-review-box">
              <div className="proposal-row">
                <span>Identified Care Gap:</span>
                <b>{agenticProposal.title}</b>
              </div>
              <div className="proposal-row">
                <span>Clinical Guideline:</span>
                <b>{agenticProposal.guidelineRef}</b>
              </div>
              <div className="proposal-row">
                <span>Proposed Intervention:</span>
                <b>{agenticProposal.suggestedTask.taskType}</b>
              </div>
              <div className="proposal-row">
                <span>Suggested Assignee:</span>
                <b>{agenticProposal.suggestedTask.suggestedAssignee}</b>
              </div>
              <div className="proposal-row">
                <span>Target Due Date:</span>
                <b>Within {agenticProposal.suggestedTask.dueInDays} days</b>
              </div>
              <div className="proposal-row">
                <span>Rationale:</span>
                <p style={{ margin: 0, fontSize: '10px', color: '#55657d', lineHeight: 1.5 }}>
                  {agenticProposal.suggestedTask.rationale}
                </p>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn secondary" onClick={() => setShowAgenticModal(false)}>
                Reject proposal
              </button>
              <button className="btn primary" onClick={handleConfirmAgenticProposal}>
                <Check size={15} /> Authorize & create task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Create Task Modal */}
      {showCreateModal && (
        <div className="modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-heading">
              <div>
                <div className="eyebrow">NEW INTERVENTION</div>
                <h2>Create Care-Gap Follow-up Task</h2>
                <p>Assign follow-up actions to clinical or care management teams</p>
              </div>
              <button className="icon-btn" onClick={() => setShowCreateModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateNewTask}>
              <label className="form-label">
                Select Member
                <select
                  value={newTaskPatientId}
                  onChange={e => setNewTaskPatientId(e.target.value)}
                  style={{ padding: '8px', borderRadius: '7px', border: '1px solid #e1e5ed' }}
                >
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id} · {p.cohort})
                    </option>
                  ))}
                </select>
              </label>

              <label className="form-label">
                Intervention Task Type
                <select
                  value={newTaskType}
                  onChange={e => setNewTaskType(e.target.value)}
                  style={{ padding: '8px', borderRadius: '7px', border: '1px solid #e1e5ed' }}
                >
                  {careTaskTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <label className="form-label">
                  Priority
                  <select
                    value={newTaskPriority}
                    onChange={e => setNewTaskPriority(e.target.value)}
                    style={{ padding: '8px', borderRadius: '7px', border: '1px solid #e1e5ed' }}
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </label>
                <label className="form-label">
                  Due Date
                  <input
                    type="text"
                    value={newTaskDueDate}
                    onChange={e => setNewTaskDueDate(e.target.value)}
                    style={{ padding: '8px', borderRadius: '7px', border: '1px solid #e1e5ed' }}
                  />
                </label>
              </div>

              <label className="form-label">
                Assigned Team or Specialist
                <select
                  value={newTaskAssignee}
                  onChange={e => setNewTaskAssignee(e.target.value)}
                  style={{ padding: '8px', borderRadius: '7px', border: '1px solid #e1e5ed' }}
                >
                  {teamAssignees.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </label>

              <label className="form-label">
                Clinical Rationale & Notes
                <textarea
                  value={newTaskNotes}
                  onChange={e => setNewTaskNotes(e.target.value)}
                  placeholder="Detail instructions, target biomarkers, or follow-up goals..."
                  rows={3}
                />
              </label>

              <div className="modal-actions">
                <button type="button" className="btn secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn primary">
                  <Check size={15} /> Create task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
