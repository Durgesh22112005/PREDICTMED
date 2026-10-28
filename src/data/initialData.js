/**
 * Initial dataset for CKD Early Warnings and Care-Gap Intervention Tasks.
 * Matches existing prototype synthetic members.
 */

export const initialCareTasks = [
  {
    id: 'TSK-1081',
    patientId: 'PM-10482',
    patientName: 'Jordan Mitchell',
    cohort: 'CKD Stage 3',
    warningRef: 'EW-RAPID-DECL',
    warningCategory: 'Rapid eGFR Trajectory Decline',
    taskType: 'Repeat Renal Panel (eGFR + Creatinine within 14-30d)',
    priority: 'Critical',
    assignee: 'Clinical Laboratory Services / Outreach',
    assignedTeam: 'Diagnostic Services',
    dueDate: 'Nov 02, 2026',
    status: 'In Progress',
    notes: 'Urgent repeat ordered to verify rapid eGFR descent from 51 to 42 mL/min. Member outreach scheduled for tomorrow morning.',
    createdAt: 'Oct 27, 2026, 14:35',
    updatedAt: 'Oct 28, 2026, 09:15',
    history: [
      { timestamp: 'Oct 27, 2026, 14:35', actor: 'Care-Gap Intervention Agent', action: 'Created task via human approval', note: 'Triggered by Rapid eGFR decline rule' },
      { timestamp: 'Oct 27, 2026, 15:10', actor: 'Dr. Elena Vance', action: 'Assigned to Diagnostic Services', note: 'Flagged for priority processing' },
      { timestamp: 'Oct 28, 2026, 09:15', actor: 'Care Coordinator', action: 'Status changed to In Progress', note: 'Outreach in progress with patient' },
    ]
  },
  {
    id: 'TSK-1082',
    patientId: 'PM-10507',
    patientName: 'Casey Morgan',
    cohort: 'CKD Stage 4',
    warningRef: 'EW-CRIT-SURGE',
    warningCategory: 'Creatinine Surge & Rapid Trajectory Decline',
    taskType: 'Urgent Nephrology Clinical Consult',
    priority: 'Critical',
    assignee: 'Dr. Elena Vance (Nephrology Subspecialty)',
    assignedTeam: 'Renal Specialty Care',
    dueDate: 'Oct 30, 2026',
    status: 'Assigned',
    notes: 'Advanced Stage 4 CKD with eGFR 24 and creatinine 2.21 mg/dL. Requires comprehensive evaluation of renal replacement therapy readiness and vascular access planning.',
    createdAt: 'Oct 26, 2026, 11:20',
    updatedAt: 'Oct 27, 2026, 08:45',
    history: [
      { timestamp: 'Oct 26, 2026, 11:20', actor: 'Review Team', action: 'Created task from Review Queue', note: 'Patient escalated due to eGFR < 30 threshold' },
      { timestamp: 'Oct 27, 2026, 08:45', actor: 'Triage Nurse', action: 'Assigned to Dr. Elena Vance', note: 'Scheduled for virtual pre-visit chart review' },
    ]
  },
  {
    id: 'TSK-1083',
    patientId: 'PM-10491',
    patientName: 'Taylor Brooks',
    cohort: 'CKD Stage 3',
    warningRef: 'EW-RAPID-DECL',
    warningCategory: 'Rapid eGFR Trajectory Decline',
    taskType: 'Medication Reconciliation & Nephrotoxic Drug Review',
    priority: 'High',
    assignee: 'Clinical Pharmacy Services',
    assignedTeam: 'Pharmacy Care Team',
    dueDate: 'Nov 04, 2026',
    status: 'Pending Review',
    notes: 'eGFR dropped from 66 to 49 mL/min. Pharmacist to review prescription fill history for NSAID co-prescribing or ACEi dosage adjustments.',
    createdAt: 'Oct 28, 2026, 09:00',
    updatedAt: 'Oct 28, 2026, 09:00',
    history: [
      { timestamp: 'Oct 28, 2026, 09:00', actor: 'Care-Gap Intervention Agent', action: 'Created task proposal', note: 'Pending clinical pharmacist sign-off' },
    ]
  },
  {
    id: 'TSK-1084',
    patientId: 'PM-10531',
    patientName: 'Sam Patel',
    cohort: 'CKD Stage 3',
    warningRef: 'EW-DATA-GAP',
    warningCategory: 'Data Limitation: Missing Quantitative Proteinuria Biomarker',
    taskType: 'Order Urine Albumin-Creatinine Ratio (UACR)',
    priority: 'Medium',
    assignee: 'Renal Care Coordinator Team',
    assignedTeam: 'Care Coordination',
    dueDate: 'Nov 08, 2026',
    status: 'New',
    notes: 'No quantitative UACR test in past 12 months. Essential to establish baseline albuminuria for KDIGO risk stratification and SGLT2i guideline qualification.',
    createdAt: 'Oct 28, 2026, 10:15',
    updatedAt: 'Oct 28, 2026, 10:15',
    history: [
      { timestamp: 'Oct 28, 2026, 10:15', actor: 'TrustGuard Quality Monitor', action: 'Identified missing diagnostic biomarker', note: 'Task drafted for care team confirmation' },
    ]
  },
  {
    id: 'TSK-1085',
    patientId: 'PM-10563',
    patientName: 'Avery Chen',
    cohort: 'CKD Stage 4',
    warningRef: 'EW-RAPID-DECL',
    warningCategory: 'Rapid eGFR Trajectory Decline',
    taskType: 'Urgent Nephrology Clinical Consult',
    priority: 'Critical',
    assignee: 'Dr. Elena Vance (Nephrology Subspecialty)',
    assignedTeam: 'Renal Specialty Care',
    dueDate: 'Nov 01, 2026',
    status: 'Escalated',
    notes: 'eGFR 29 mL/min with severe macroalbuminuria (UACR 330 mg/g). Rapid decline of 6 mL/min in 2 months. Escalated for direct nephrology outreach.',
    createdAt: 'Oct 25, 2026, 16:00',
    updatedAt: 'Oct 28, 2026, 11:30',
    history: [
      { timestamp: 'Oct 25, 2026, 16:00', actor: 'Early-Warning Engine', action: 'Critical warning flag created', note: 'Rapid descent below 30 mL/min' },
      { timestamp: 'Oct 28, 2026, 11:30', actor: 'Review Prioritization Agent', action: 'Escalated due to approaching due date', note: 'Escalation sent to team lead' },
    ]
  },
  {
    id: 'TSK-1078',
    patientId: 'PM-10519',
    patientName: 'Alex Rivera',
    cohort: 'CKD Stage 2',
    warningRef: 'EW-STABLE',
    warningCategory: 'Stable / Monitored Trajectory',
    taskType: 'Care Coordinator Patient Outreach',
    priority: 'Low',
    assignee: 'Renal Care Coordinator Team',
    assignedTeam: 'Care Coordination',
    dueDate: 'Oct 24, 2026',
    status: 'Completed',
    notes: 'Annual preventive wellness check-in completed. Patient confirmed routine lab follow-up completed with stable eGFR 76.',
    createdAt: 'Oct 15, 2026, 10:00',
    updatedAt: 'Oct 24, 2026, 16:45',
    history: [
      { timestamp: 'Oct 15, 2026, 10:00', actor: 'Care Coordination', action: 'Created routine wellness task', note: 'Routine protocol' },
      { timestamp: 'Oct 24, 2026, 16:45', actor: 'Care Coordinator', action: 'Marked Completed', note: 'Lab panel received and reviewed' },
    ]
  }
];

export const teamAssignees = [
  'Dr. Elena Vance (Nephrology Subspecialty)',
  'Dr. Marcus Reed (Primary Care)',
  'Renal Care Coordinator Team',
  'Clinical Pharmacy Services',
  'Clinical Laboratory Services / Outreach',
  'Quality Care Management Team'
];

export const careTaskTypes = [
  'Repeat Renal Panel (eGFR + Creatinine within 14-30d)',
  'Order Urine Albumin-Creatinine Ratio (UACR)',
  'Urgent Nephrology Clinical Consult',
  'Medication Reconciliation & Nephrotoxic Drug Review',
  'Care Coordinator Patient Outreach',
  'Dietary & Renal Nutrition Referral',
  'Blood Pressure & RAASi Optimization Follow-up'
];

export const taskStatuses = [
  'New',
  'Pending Review',
  'Assigned',
  'In Progress',
  'Awaiting Information',
  'Completed',
  'Escalated'
];
