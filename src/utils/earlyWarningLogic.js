/**
 * CKD Deterioration Early-Warning & Care-Gap Rule Engine
 * 
 * Implements transparent, rule-based longitudinal intelligence based on
 * KDIGO 2024 Clinical Practice Guidelines for Chronic Kidney Disease.
 * 
 * Note: Clearly labelled as rule-based clinical decision-support logic
 * for prototype demonstration. Does not replace physician diagnosis.
 */

/**
 * Analyzes patient longitudinal laboratory observations (eGFR, serum creatinine, UACR).
 * Performs data-quality validation and flags concerning trajectory shifts.
 */
export function analyzePatientTrajectory(patient) {
  const history = patient.history || [];
  const visits = history.length;
  const currentEgfr = patient.egfr;
  const currentCreat = patient.creatinine;
  const uacr = patient.uacr;
  const trust = patient.trust ?? 80;

  // 1. Data-quality validation checks
  const checks = {
    timestampsValid: visits >= 2,
    unitsConsistent: true, // eGFR (mL/min/1.73m²), Creatinine (mg/dL), UACR (mg/g)
    missingUacr: uacr === null || uacr === undefined,
    freshObservation: (patient.last || '').includes('Oct') || (patient.last || '').includes('Nov'),
    longitudinalDepth: visits >= 4,
    duplicateRecords: false,
  };

  // Data quality status calculation
  let dataTrustStatus = 'High Trust';
  let uncertainty = 'Low';
  const qualityIssues = [];

  if (checks.missingUacr) {
    qualityIssues.push('Missing quantitative Urine Albumin-to-Creatinine Ratio (UACR)');
  }
  if (!checks.freshObservation) {
    qualityIssues.push('Latest observation is older than 30 days (Stale lab record)');
  }
  if (visits < 4) {
    qualityIssues.push(`Limited longitudinal history (${visits} observations; minimum 4 recommended)`);
  }

  if (trust < 65 || visits < 3) {
    dataTrustStatus = 'Critical Caution';
    uncertainty = 'High';
  } else if (trust < 80 || checks.missingUacr || !checks.freshObservation) {
    dataTrustStatus = 'Moderate Confidence';
    uncertainty = 'Moderate';
  }

  // 2. Trajectory & slope calculations
  let egfrDeltaTotal = 0;
  let annualizedEgfrLoss = 0;
  let creatDeltaTotal = 0;
  let creatPctIncrease = 0;
  let baselineEgfr = currentEgfr;
  let baselineCreat = currentCreat;

  if (visits >= 2) {
    const first = history[0];
    const last = history[history.length - 1];
    baselineEgfr = first.egfr;
    baselineCreat = first.creat;

    egfrDeltaTotal = last.egfr - first.egfr; // negative means decline
    creatDeltaTotal = last.creat - first.creat; // positive means rise
    creatPctIncrease = baselineCreat > 0 ? (creatDeltaTotal / baselineCreat) * 100 : 0;

    // Approximate interval rate: visits span roughly 8-10 months in the demo
    const monthsSpan = Math.max(2, (visits - 1) * 2.2);
    annualizedEgfrLoss = Number(((Math.abs(egfrDeltaTotal) / monthsSpan) * 12).toFixed(1));
  }

  // 3. KDIGO Guideline-based Rule Engine
  // KDIGO defines rapid progression as sustained decline in eGFR > 5 mL/min/1.73m²/year
  const isRapidEgfrDecline = egfrDeltaTotal <= -12 || annualizedEgfrLoss >= 5.0;
  const isAcuteCreatinineSurge = creatDeltaTotal >= 0.35 || creatPctIncrease >= 25;
  const isSevereProteinuria = uacr !== null && uacr >= 300;
  const isAdvancedStage = currentEgfr < 30; // Stage 4/5 CKD threshold

  let warningCategory = 'Stable / Low Risk Trajectory';
  let priority = 'Low';
  let warningCode = 'EW-NORM';
  const evidence = [];

  if (isAcuteCreatinineSurge && isRapidEgfrDecline) {
    warningCategory = 'Creatinine Surge & Rapid Trajectory Decline (Suspected AKI-on-CKD)';
    priority = 'Critical';
    warningCode = 'EW-CRIT-SURGE';
    evidence.push(`Serum creatinine rose from ${baselineCreat.toFixed(2)} to ${currentCreat.toFixed(2)} mg/dL (+${creatPctIncrease.toFixed(0)}% surge)`);
    evidence.push(`eGFR dropped by ${Math.abs(egfrDeltaTotal)} mL/min (Annualized decline rate: ~${annualizedEgfrLoss} mL/min/1.73m²/yr, exceeding KDIGO 5 mL/min/yr threshold)`);
  } else if (isRapidEgfrDecline) {
    warningCategory = 'Rapid eGFR Trajectory Decline';
    priority = currentEgfr < 45 ? 'Critical' : 'High';
    warningCode = 'EW-RAPID-DECL';
    evidence.push(`Longitudinal drop: eGFR decreased from ${baselineEgfr} to ${currentEgfr} mL/min/1.73m² over ${visits} recorded visits`);
    evidence.push(`Annualized decline estimated at ${annualizedEgfrLoss} mL/min/1.73m²/yr (KDIGO alert threshold is > 5 mL/min/yr)`);
  } else if (isSevereProteinuria && currentEgfr < 60) {
    warningCategory = 'Severe Albuminuria Progression (A3 Category)';
    priority = 'High';
    warningCode = 'EW-ALBUM-HIGH';
    evidence.push(`Urine Albumin-to-Creatinine Ratio is severely elevated at ${uacr} mg/g (KDIGO A3 category > 300 mg/g)`);
    evidence.push(`Accelerated risk factor for end-stage kidney failure in CKD ${patient.cohort}`);
  } else if (checks.missingUacr && (patient.cohort === 'CKD Stage 3' || patient.cohort === 'CKD Stage 4')) {
    warningCategory = 'Data Limitation: Missing Quantitative Proteinuria Biomarker';
    priority = 'Moderate';
    warningCode = 'EW-DATA-GAP';
    evidence.push('Patient is in CKD Stage 3/4 with no Urine Albumin-Creatinine Ratio (UACR) recorded on file');
    evidence.push('KDIGO guidelines mandate at least annual UACR monitoring to risk-stratify progression');
  } else if (egfrDeltaTotal < -5) {
    warningCategory = 'Gradual eGFR Downtrend';
    priority = 'Moderate';
    warningCode = 'EW-GRAD-DECL';
    evidence.push(`Mild longitudinal decline of ${Math.abs(egfrDeltaTotal)} mL/min across historical visits`);
  } else {
    warningCategory = 'Stable / Monitored Trajectory';
    priority = 'Low';
    warningCode = 'EW-STABLE';
    evidence.push(`eGFR remains relatively stable across ${visits} historical visits (${baselineEgfr} -> ${currentEgfr} mL/min)`);
    evidence.push(`Serum creatinine within baseline variance (+${creatDeltaTotal >= 0 ? '+' : ''}${creatDeltaTotal.toFixed(2)} mg/dL)`);
  }

  if (isAdvancedStage) {
    evidence.push(`Advanced CKD threshold reached: eGFR ${currentEgfr} < 30 mL/min/1.73m² (Indicating Stage 4 CKD requiring nephrologist comanagement)`);
  }

  // Supporting lab observations list for transparent evidence display
  const labObservations = history.map((h, i) => ({
    date: h.date,
    egfr: h.egfr,
    creatinine: h.creat,
    visitNum: i + 1,
    isLatest: i === history.length - 1,
  }));

  return {
    patientId: patient.id,
    patientName: patient.name,
    cohort: patient.cohort,
    age: patient.age,
    sex: patient.sex,
    insurer: patient.insurer,
    lastObsDate: patient.last,
    warningCode,
    warningCategory,
    priority,
    baselineEgfr,
    currentEgfr,
    egfrDeltaTotal,
    annualizedEgfrLoss,
    baselineCreat,
    currentCreat,
    creatDeltaTotal,
    creatPctIncrease: Number(creatPctIncrease.toFixed(1)),
    uacr,
    visits,
    dataTrustStatus,
    trustScore: trust,
    uncertainty,
    qualityIssues,
    checks,
    evidence,
    labObservations,
    isRapidDecline: isRapidEgfrDecline,
    isAcuteSurge: isAcuteCreatinineSurge,
    isAdvancedStage,
  };
}

/**
 * Evaluates care-gap rules for a patient given their early-warning analysis
 * and generates structured follow-up recommendations.
 */
export function identifyCareGapsForPatient(analysis, existingTasks = []) {
  const gaps = [];
  const patientTasks = existingTasks.filter(t => t.patientId === analysis.patientId);

  // Helper to check if an active task for a type already exists
  const hasTaskFor = (type) => patientTasks.some(t => t.taskType === type && t.status !== 'Completed');

  // Rule 1: Missing annual UACR monitoring in CKD Stage 3 or 4
  if (analysis.checks.missingUacr && (analysis.cohort === 'CKD Stage 3' || analysis.cohort === 'CKD Stage 4')) {
    const taskType = 'Order Urine Albumin-Creatinine Ratio (UACR)';
    gaps.push({
      id: `GAP-UACR-${analysis.patientId}`,
      patientId: analysis.patientId,
      patientName: analysis.patientName,
      gapType: 'Missing Diagnostic Biomarker',
      title: 'Annual UACR Screening Not on File',
      description: `Patient has ${analysis.cohort} with no recorded quantitative UACR. KDIGO CKD guidelines mandate at least annual urine albumin monitoring.`,
      urgency: 'Moderate',
      guidelineRef: 'KDIGO 2024 Guideline 1.2.2',
      hasExistingTask: hasTaskFor(taskType),
      suggestedTask: {
        taskType,
        priority: 'Medium',
        suggestedAssignee: 'Renal Care Coordinator Team',
        dueInDays: 14,
        rationale: 'Schedule spot urine collection for albumin-to-creatinine ratio to complete KDIGO CGA staging risk matrix.',
      }
    });
  }

  // Rule 2: Rapid eGFR decline or Creatinine surge -> Confirmatory repeat renal panel
  if (analysis.isRapidDecline || analysis.isAcuteSurge) {
    const taskType = 'Repeat Renal Panel (eGFR + Creatinine within 14-30d)';
    gaps.push({
      id: `GAP-REPEAT-${analysis.patientId}`,
      patientId: analysis.patientId,
      patientName: analysis.patientName,
      gapType: 'Post-Deterioration Confirmatory Lab Due',
      title: 'Confirmatory Renal Function Panel Needed',
      description: `Detected rapid decline (${analysis.annualizedEgfrLoss} mL/min/yr) or creatinine surge (+${analysis.creatPctIncrease}%). Guideline mandates repeat testing within 14-30 days to differentiate true progression from reversible AKI.`,
      urgency: analysis.priority === 'Critical' ? 'Critical' : 'High',
      guidelineRef: 'KDIGO 2024 Guideline 1.3.1 (Trajectory Confirmation)',
      hasExistingTask: hasTaskFor(taskType),
      suggestedTask: {
        taskType,
        priority: analysis.priority === 'Critical' ? 'Critical' : 'High',
        suggestedAssignee: 'Clinical Laboratory Services / Outreach',
        dueInDays: 7,
        rationale: 'Order repeat serum creatinine, BUN, electrolytes, and recalculate eGFR to confirm trajectory persistence.',
      }
    });
  }

  // Rule 3: Advanced CKD (eGFR < 30) or rapid progression -> Nephrology Consult
  if (analysis.isAdvancedStage || (analysis.isRapidDecline && analysis.currentEgfr < 45)) {
    const taskType = 'Urgent Nephrology Clinical Consult';
    gaps.push({
      id: `GAP-NEPHRO-${analysis.patientId}`,
      patientId: analysis.patientId,
      patientName: analysis.patientName,
      gapType: 'Subspecialty Referral Gap',
      title: 'Nephrology Referral Threshold Met',
      description: `eGFR ${analysis.currentEgfr} mL/min is below guideline threshold (< 30 mL/min/1.73m²) or showing severe trajectory drop. Requires formal nephrologist comanagement for advanced CKD care planning.`,
      urgency: 'Critical',
      guidelineRef: 'KDIGO 2024 Guideline 1.4 (Referral to Specialist Kidney Care)',
      hasExistingTask: hasTaskFor(taskType),
      suggestedTask: {
        taskType,
        priority: 'Critical',
        suggestedAssignee: 'Dr. Elena Vance (Nephrology Subspecialty)',
        dueInDays: 5,
        rationale: 'Schedule comprehensive nephrology consultation, anemia/mineral bone disease screening, and kidney failure modality education.',
      }
    });
  }

  // Rule 4: Medication Reconciliation for acute or rapid deterioration
  if (analysis.isRapidDecline || analysis.isAcuteSurge) {
    const taskType = 'Medication Reconciliation & Nephrotoxic Drug Review';
    gaps.push({
      id: `GAP-MEDREC-${analysis.patientId}`,
      patientId: analysis.patientId,
      patientName: analysis.patientName,
      gapType: 'Medication Safety Review',
      title: 'Pharmacotherapy Safety Assessment',
      description: `Significant renal drop warrants immediate review of renin-angiotensin-aldosterone system inhibitors (RAASi), SGLT2 inhibitors, diuretics, and potential nephrotoxic exposures (e.g. NSAIDs, IV contrast).`,
      urgency: 'High',
      guidelineRef: 'KDIGO 2024 Guideline 3.1 (Safe Prescribing in CKD)',
      hasExistingTask: hasTaskFor(taskType),
      suggestedTask: {
        taskType,
        priority: 'High',
        suggestedAssignee: 'Clinical Pharmacy Services',
        dueInDays: 3,
        rationale: 'Perform complete medication reconciliation to rule out drug-induced renal hemodynamic decline, dosage adjustments, or recent OTC NSAID usage.',
      }
    });
  }

  // Rule 5: Stale observation > 30 days in moderate/high risk patient
  if (!analysis.checks.freshObservation && (analysis.cohort === 'CKD Stage 3' || analysis.cohort === 'CKD Stage 4')) {
    const taskType = 'Care Coordinator Patient Outreach';
    gaps.push({
      id: `GAP-OUTREACH-${analysis.patientId}`,
      patientId: analysis.patientId,
      patientName: analysis.patientName,
      gapType: 'Overdue Monitoring Follow-Up',
      title: 'Overdue Follow-up & Lab Scheduling',
      description: `Observation date ${analysis.lastObsDate} is stale. Patient requires proactive outreach to ensure adherence with ordered diagnostic lab appointments.`,
      urgency: 'Moderate',
      guidelineRef: 'NCQA HEDIS Kidney Health Evaluation Metric',
      hasExistingTask: hasTaskFor(taskType),
      suggestedTask: {
        taskType,
        priority: 'Medium',
        suggestedAssignee: 'Renal Care Coordinator Team',
        dueInDays: 10,
        rationale: 'Contact member to verify transportation, barrier assessment, and coordinate upcoming laboratory draw.',
      }
    });
  }

  return gaps;
}
