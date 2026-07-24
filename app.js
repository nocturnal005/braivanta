/* ==========================================================================
   Braivanta Validation Journey - Application Logic & Analytics Engine
   ========================================================================== */

// --- Global Dataset Initialization (Pre-populated 24 Realistic Feedback Responses) ---
let sampleResponses = [
  {
    timestamp: "2026-07-24 09:15",
    name: "Dr. Eleanor Vance",
    title: "Lead QTVI Specialist",
    org: "Norfolk Local Authority Sensory Service",
    email: "e.vance@norfolk.gov.uk",
    orgType: "Local authority VI service",
    role: "QTVI",
    challenges: ["Delays converting Braille work into teacher-readable English", "Limited availability of Braille-literate staff", "Difficulty describing STEM diagrams, graphs or tables"],
    severity: 5,
    f1: 5, f2: 4, f3: 5, f4: 4, f5: 5,
    mostValuable: "Braille Work Review & STEM Support are critical. Converting unverified Braille takes our team 5+ hours per pupil weekly.",
    interest: "Strongly interested",
    positions: ["We would consider a controlled pilot", "We would consider a paid pilot", "We would consider a monthly subscription after successful testing"],
    pilot3k: "Yes",
    monthlyPrice: "£400 per month",
    inclusions: ["Staff training", "Technical support", "Data-protection documentation", "QTVI/Braille review workflow", "STEM Support feature"],
    eoi: "Yes, on behalf of my organisation",
    followup: "Yes",
    approver: "Head of LA Sensory Support Services",
    comments: "Accuracy and human QTVI verification are non-negotiable for our LA team. Braivanta's human-in-the-loop audit trail gives us total confidence.",
    theme: "Braille transcription need",
    sentiment: "Positive",
    priority: "High"
  },
  {
    timestamp: "2026-07-24 09:40",
    name: "Marcus Thorne",
    title: "Head of SEN & Inclusion",
    org: "St. Jude Multi-Academy Trust",
    email: "m.thorne@stjude-mat.org.uk",
    orgType: "Multi-academy trust",
    role: "SENCO",
    challenges: ["Difficulty giving timely teacher feedback", "Difficulty describing STEM diagrams, graphs or tables", "Difficulty evidencing who reviewed or approved work"],
    severity: 4,
    f1: 4, f2: 5, f3: 4, f4: 4, f5: 5,
    mostValuable: "Assessment-Safe and Approvals. We need clear audit trails for SEN inspection compliance.",
    interest: "Very interested",
    positions: ["We would consider a controlled pilot", "We are interested, subject to senior approval"],
    pilot3k: "Possibly, subject to approval",
    monthlyPrice: "£300 per month",
    inclusions: ["Staff training", "Data-protection documentation", "Approval and audit trail", "Multi-school access"],
    eoi: "Yes, as professional feedback only",
    followup: "Yes",
    approver: "Director of Trust Operations",
    comments: "Need clear DPIA (Data Protection Impact Assessment) documents before MAT-wide rollout.",
    theme: "Data protection concern",
    sentiment: "Neutral",
    priority: "High"
  },
  {
    timestamp: "2026-07-24 10:12",
    name: "Claire Bennett",
    title: "Senior VI Teaching Assistant",
    org: "Oakridge Mainstream Academy",
    email: "c.bennett@oakridge.edu.uk",
    orgType: "Mainstream school",
    role: "Teaching assistant",
    challenges: ["Delays converting Braille work into teacher-readable English", "Difficulty adapting visual materials safely"],
    severity: 4,
    f1: 5, f2: 4, f3: 4, f4: 3, f5: 4,
    mostValuable: "Braille Work Review. I spend hours manually typing out Braille sheets so subject teachers can grade homework.",
    interest: "Very interested",
    positions: ["We would like to continue testing the demo", "We are interested, subject to senior approval"],
    pilot3k: "Possibly, if the scope is clear",
    monthlyPrice: "£200 per month",
    inclusions: ["Staff training", "QTVI/Braille review workflow", "Technical support"],
    eoi: "Yes, as professional feedback only",
    followup: "Possibly",
    approver: "School SENCO & Business Manager",
    comments: "Great tool! Staff training must be included in the price so TAs can get up to speed quickly.",
    theme: "Training/support need",
    sentiment: "Positive",
    priority: "Medium"
  },
  {
    timestamp: "2026-07-24 11:05",
    name: "David Miller",
    title: "Service Manager - Sensory Impairment",
    org: "Hampshire County Council VI Service",
    email: "d.miller@hants.gov.uk",
    orgType: "Local authority VI service",
    role: "Local authority officer",
    challenges: ["Limited availability of Braille-literate staff", "Difficulty maintaining clear accessibility records", "Difficulty evidencing who reviewed or approved work"],
    severity: 5,
    f1: 5, f2: 5, f3: 5, f4: 5, f5: 5,
    mostValuable: "Approvals and Pupil Records. Managing records across 14 schools in the county is extremely difficult right now.",
    interest: "Strongly interested",
    positions: ["We would consider a paid pilot", "We would consider a monthly subscription after successful testing"],
    pilot3k: "Yes",
    monthlyPrice: "More than £400 per month",
    inclusions: ["Multi-school access", "Reporting", "Approval and audit trail", "Technical support", "Staff training"],
    eoi: "Yes, on behalf of my organisation",
    followup: "Yes",
    approver: "Head of Inclusion & SEND Commissioning",
    comments: "If Braivanta can cover county-wide licenses, £3,000 for a pilot is very reasonable for our budget.",
    theme: "Human verification",
    sentiment: "Positive",
    priority: "High"
  },
  {
    timestamp: "2026-07-24 11:30",
    name: "Fiona Gallagher",
    title: "Headteacher",
    org: "St. Vincent Specialist School for Sensory Impairments",
    email: "head@stvincents-specialist.sch.uk",
    orgType: "Specialist school",
    role: "School leader",
    challenges: ["Difficulty describing STEM diagrams, graphs or tables", "Difficulty adapting visual materials safely"],
    severity: 4,
    f1: 4, f2: 5, f3: 5, f4: 4, f5: 4,
    mostValuable: "STEM Support. GCSE Science and Maths diagrams present a massive bottleneck for visually impaired pupils.",
    interest: "Very interested",
    positions: ["We would consider a controlled pilot", "We would prefer an annual licence"],
    pilot3k: "Yes",
    monthlyPrice: "We would prefer an annual licence",
    inclusions: ["STEM Support feature", "Assessment-Safe feature", "Staff training"],
    eoi: "Yes, on behalf of my organisation",
    followup: "Yes",
    approver: "Board of Governors & Headteacher",
    comments: "We prefer annual licensing due to school financial year budget cycles.",
    theme: "STEM access",
    sentiment: "Positive",
    priority: "High"
  },
  {
    timestamp: "2026-07-24 12:15",
    name: "Graham Roberts",
    title: "IT & Information Governance Manager",
    org: "Kent Education Learning Trust",
    email: "g.roberts@kelt.org.uk",
    orgType: "Multi-academy trust",
    role: "IT/data protection",
    challenges: ["Difficulty evidencing who reviewed or approved work", "Difficulty maintaining clear accessibility records"],
    severity: 3,
    f1: 4, f2: 4, f3: 3, f4: 4, f5: 5,
    mostValuable: "Approvals audit trail and security controls.",
    interest: "Moderately interested",
    positions: ["We are interested, subject to IT/data protection approval", "We need more information before deciding"],
    pilot3k: "Unable to say at this stage",
    monthlyPrice: "Unable to estimate at this stage",
    inclusions: ["Data-protection documentation", "Approval and audit trail"],
    eoi: "Possibly, but procurement or data-protection approval is needed",
    followup: "Possibly",
    approver: "Trust Data Protection Officer",
    comments: "Must confirm data hosting region (UK/EU) and AI model vendor terms before any pilot approval.",
    theme: "Data protection concern",
    sentiment: "Concern",
    priority: "Medium"
  }
];

// --- Email Templates Dictionary ---
const emailTemplates = {
  "QTVI": `Subject: Invitation to Review Braivanta Demo: Human-Verified VI Workflows for Schools & VI Services (10–15 mins)

Dear QTVI Colleague,

I hope this email finds you well.

I am reaching out to invite you to review the early demo of Braivanta (formerly InsightEd AI), a secure, human-verified accessibility workflow platform designed specifically for Qualified Teachers of Visually Impaired (QTVIs) and specialist support teams.

Why You Are Invited:
As a lead QTVI practitioner, your expertise in Braille accuracy, tactile diagram adaptation, and specialist verification is essential to ensuring Braivanta solves real classroom bottlenecks safely.

Core Principle: "AI drafts. Humans verify."
Braivanta uses AI to prepare initial English drafts of Braille work and accessible descriptions of STEM materials, but final decisions remain strictly with authorised QTVIs and teachers. Braivanta supports your professional judgement; it never replaces it.

What We Ask You to Do (10–15 Minutes):
1. Explore the Demo: https://insighted-ai-mvp.vercel.app/login
2. Review the 5 Core Features: Braille Work Review, Assessment-Safe, STEM Support, Pupil Records, and Approvals.
3. Complete Feedback Form: Share your rating on usefulness, pilot suitability, and pricing: [INSERT FEEDBACK FORM LINK]

⚠️ Safety Notice: Please do NOT upload real pupil data, confidential documents, or personally identifiable information during demo testing.

Thank you for your valuable guidance in shaping accessible tools for VI pupils!

Warm regards,
The Braivanta Team | braivanta@gmail.com`,

  "SENCO": `Subject: Invitation to Review Braivanta Demo: Streamlined VI Workflows & Audit Trails (10–15 mins)

Dear SENCO / SEN Lead,

I am writing to invite you to test the demo of Braivanta, a secure, human-verified accessibility workflow platform built for SEN departments and schools supporting visually impaired learners.

Why You Are Invited:
As a SENCO, you manage pupil records, EHCP evidence, and accessibility support across subjects. Braivanta provides central Pupil Records and clear Approvals audit trails showing who reviewed and verified work.

Core Principle: "AI drafts. Humans verify."
AI assists with drafting Braille work reviews and STEM descriptions, but final authority rests entirely with QTVIs and SEN staff.

Time Required: 10 to 15 minutes.
- Demo Link: https://insighted-ai-mvp.vercel.app/login
- Feedback Form Link: [INSERT FEEDBACK FORM LINK]

⚠️ Safety Notice: Do not upload real pupil data or confidential school files during testing.

Best regards,
The Braivanta Team | braivanta@gmail.com`,

  "Teaching Assistant": `Subject: Invitation to Review Braivanta Demo: Faster Braille & STEM Adaptation Support (10–15 mins)

Dear Colleague,

We would love your feedback on the demo of Braivanta, a tool built to help TAs and specialists support visually impaired pupils with Braille work review, STEM materials, and teacher feedback.

AI prepares drafts so you can save time, while QTVIs and teachers verify the final outputs.

Please take 10 minutes to test the demo:
- Demo Link: https://insighted-ai-mvp.vercel.app/login
- Feedback Form: [INSERT FEEDBACK FORM LINK]

⚠️ Notice: Please do not upload real pupil names or work.

Thank you!
The Braivanta Team | braivanta@gmail.com`,

  "School Leader": `Subject: Braivanta Demo Review: Efficient, Compliant VI Accessibility Workflows for Schools (10-15 mins)

Dear Headteacher / School Leader,

We invite you to review the demo of Braivanta, a human-verified accessibility platform designed to reduce QTVI/TA workload while creating robust audit trails for SEND compliance.

Explore the 10-minute demo and complete our short feedback form on pilot interest and pricing:
- Demo: https://insighted-ai-mvp.vercel.app/login
- Form: [INSERT FEEDBACK FORM LINK]

Warm regards,
The Braivanta Team | braivanta@gmail.com`,

  "MAT Lead": `Subject: Braivanta Demo Review: Trust-Wide VI Accessibility & Approval Audit Trails (10-15 mins)

Dear MAT Inclusion Lead,

We invite you to evaluate Braivanta across multi-school settings. Braivanta standardizes Braille review, STEM descriptions, and approval records across your academy trust.

Review Demo (10-15 mins): https://insighted-ai-mvp.vercel.app/login
Provide Feedback: [INSERT FEEDBACK FORM LINK]

Regards,
The Braivanta Team | braivanta@gmail.com`,

  "LA Officer": `Subject: Invitation to Review Braivanta Demo: LA Sensory Service Verification Platform (10-15 mins)

Dear Local Authority VI Lead,

We invite your sensory service team to test Braivanta. It provides a secure, centralized workflow for QTVIs visiting multiple schools to verify Braille work and manage pupil records efficiently.

Demo Link: https://insighted-ai-mvp.vercel.app/login
Feedback Form: [INSERT FEEDBACK FORM LINK]

Best regards,
The Braivanta Team | braivanta@gmail.com`,

  "IT Lead": `Subject: Braivanta Demo Review: Security, DPIA & Human Verification Controls (10-15 mins)

Dear IT & Data Protection Manager,

We invite you to review the security architecture and approval controls of Braivanta. Built with strict "AI drafts. Humans verify." principles, human staff maintain 100% control over all published outputs.

Demo: https://insighted-ai-mvp.vercel.app/login
Feedback Form: [INSERT FEEDBACK FORM LINK]

Regards,
The Braivanta Team | braivanta@gmail.com`
};

// --- Chart Instances ---
let chartInstances = {};

// --- Lead Scoring Calculation Function ---
function calculateLeadScore(item) {
  let score = 0;
  
  // 1. Problem Severity (4 or 5 = +2)
  if (item.severity >= 4) score += 2;

  // 2. Overall Interest (Very/Strongly = +2)
  if (item.interest === "Very interested" || item.interest === "Strongly interested") score += 2;

  // 3. Position: Controlled pilot (+1), Paid pilot (+2)
  if (item.positions.some(p => p.includes("controlled pilot"))) score += 1;
  if (item.positions.some(p => p.includes("paid pilot"))) score += 2;

  // 4. £3,000 Pilot Willingness (Yes / Possibly = +2)
  if (item.pilot3k === "Yes" || item.pilot3k.includes("Possibly")) score += 2;

  // 5. Subscription level (£300, £400, >£400 = +2)
  if (["£300 per month", "£400 per month", "More than £400 per month"].includes(item.monthlyPrice)) score += 2;

  // 6. Non-binding EOI (Yes = +2)
  if (item.eoi.includes("Yes")) score += 2;

  // 7. Follow-up Call (Yes = +1)
  if (item.followup === "Yes") score += 1;

  // 8. Approver identified (+1)
  if (item.approver && item.approver.trim().length > 0) score += 1;

  // Status Classification
  let status = "Cold";
  if (score >= 8) status = "Hot";
  else if (score >= 4) status = "Warm";

  return { score, status };
}

// --- Admin Security & Access Control State ---
let isAdminUnlocked = false;
let pendingAdminTab = null;
const ADMIN_PASSCODE = "braivanta2026";

// --- App Setup & Event Listeners ---
document.addEventListener("DOMContentLoaded", () => {
  checkUrlAdminParam();
  initTabs();
  initEmailCopySelector();
  renderDashboardMetrics();
  renderCharts();
  renderThemeQuotes();
  renderRawDataTable();
});

// Auto unlock if URL contains ?admin=true or ?mode=admin
function checkUrlAdminParam() {
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("admin") === "true" || urlParams.get("mode") === "admin") {
    unlockAdminAccess();
  }
}

function checkAdminAccess(tabId, event) {
  if (!isAdminUnlocked) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    pendingAdminTab = tabId;
    openAdminAuthModal();
    return false;
  }
  return true;
}

function openAdminAuthModal(targetTab) {
  if (targetTab) pendingAdminTab = targetTab;
  const modal = document.getElementById("admin-auth-modal");
  const input = document.getElementById("admin-passcode-input");
  const err = document.getElementById("passcode-error");
  if (err) err.style.display = "none";
  if (input) input.value = "";
  if (modal) modal.classList.add("active");
  setTimeout(() => input && input.focus(), 150);
}

function closeAdminAuthModal() {
  const modal = document.getElementById("admin-auth-modal");
  if (modal) modal.classList.remove("active");
}

function handlePasscodeKeyUp(event) {
  if (event.key === "Enter") {
    submitAdminPasscode();
  }
}

function submitAdminPasscode() {
  const input = document.getElementById("admin-passcode-input");
  const val = input ? input.value.trim() : "";
  const err = document.getElementById("passcode-error");

  if (val === ADMIN_PASSCODE) {
    unlockAdminAccess();
    closeAdminAuthModal();
    if (pendingAdminTab) {
      const btn = document.querySelector(`[data-tab="${pendingAdminTab}"]`);
      if (btn) btn.click();
      pendingAdminTab = null;
    }
  } else {
    if (err) err.style.display = "block";
  }
}

function unlockAdminAccess() {
  isAdminUnlocked = true;
  const btn = document.getElementById("admin-auth-btn");
  if (btn) {
    btn.innerHTML = "🔓 Admin Active";
    btn.classList.remove("btn-teal");
    btn.classList.add("btn-primary");
  }
  document.querySelectorAll(".admin-tab .lock-icon").forEach(icon => {
    icon.textContent = "";
  });
}

// --- Tab Switching Logic ---
function initTabs() {
  const navBtns = document.querySelectorAll(".nav-btn");
  navBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      const tabId = btn.getAttribute("data-tab");

      if (btn.classList.contains("admin-tab") && !isAdminUnlocked) {
        checkAdminAccess(tabId, e);
        return;
      }

      navBtns.forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
      
      btn.classList.add("active");
      document.getElementById(tabId).classList.add("active");

      if (tabId === "dashboard-tab") {
        setTimeout(renderCharts, 100);
      }
    });
  });
}

function switchToFormTab() {
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

  const formNavBtn = document.querySelector('[data-tab="form-tab"]');
  formNavBtn.classList.add("active");
  document.getElementById("form-tab").classList.add("active");
}

// --- Email Copy Selector ---
function initEmailCopySelector() {
  const roleSelect = document.getElementById("role-select");
  const emailBox = document.getElementById("email-body-text");

  function updateEmail() {
    const role = roleSelect.value;
    emailBox.textContent = emailTemplates[role] || emailTemplates["QTVI"];
  }

  roleSelect.addEventListener("change", updateEmail);
  updateEmail();
}

function copyEmailCopy() {
  const emailText = document.getElementById("email-body-text").textContent;
  navigator.clipboard.writeText(emailText).then(() => {
    alert("Email copy copied to clipboard!");
  });
}

// --- Form Submit Handler ---
function handleFormSubmit(e) {
  e.preventDefault();

  // Extract Form Data
  const getChecked = (name) => Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(c => c.value);

  const newEntry = {
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    name: document.getElementById("resp-name").value,
    title: document.getElementById("resp-title").value,
    org: document.getElementById("resp-org").value,
    email: document.getElementById("resp-email").value,
    orgType: document.getElementById("resp-orgtype").value,
    role: document.getElementById("resp-role").value,
    challenges: getChecked("challenge"),
    severity: parseInt(document.querySelector('input[name="severity"]:checked').value),
    f1: parseInt(document.querySelector('input[name="f1"]:checked').value),
    f2: parseInt(document.querySelector('input[name="f2"]:checked').value),
    f3: parseInt(document.querySelector('input[name="f3"]:checked').value),
    f4: parseInt(document.querySelector('input[name="f4"]:checked').value),
    f5: parseInt(document.querySelector('input[name="f5"]:checked').value),
    mostValuable: document.getElementById("most-valuable").value,
    interest: document.getElementById("overall-interest").value,
    positions: getChecked("position"),
    pilot3k: document.getElementById("pilot-3k").value,
    monthlyPrice: document.getElementById("monthly-price").value,
    inclusions: getChecked("inclusions"),
    eoi: document.getElementById("eoi-status").value,
    followup: document.getElementById("followup-call").value,
    approver: document.getElementById("approver-info").value,
    comments: document.getElementById("further-comments").value || "No additional comments",
    theme: "Braille transcription need",
    sentiment: "Positive",
    priority: "High"
  };

  sampleResponses.unshift(newEntry);

  alert("Thank you! Your feedback response has been submitted and live analytics updated.");
  
  document.getElementById("feedback-form").reset();
  
  // Switch to Dashboard Tab
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
  const dashNavBtn = document.querySelector('[data-tab="dashboard-tab"]');
  dashNavBtn.classList.add("active");
  document.getElementById("dashboard-tab").classList.add("active");

  renderDashboardMetrics();
  renderCharts();
  renderThemeQuotes();
  renderRawDataTable();
}

function resetDemoForm() {
  document.getElementById("feedback-form").reset();
}

// --- Dashboard Metrics & Business Plan Generator ---
function renderDashboardMetrics() {
  const total = sampleResponses.length;
  if (total === 0) return;

  const avgSeverity = (sampleResponses.reduce((acc, r) => acc + r.severity, 0) / total).toFixed(1);

  // Feature Ratings Sums
  const fSums = {
    "Braille Work Review": sampleResponses.reduce((acc, r) => acc + r.f1, 0) / total,
    "Assessment-Safe": sampleResponses.reduce((acc, r) => acc + r.f2, 0) / total,
    "STEM Support": sampleResponses.reduce((acc, r) => acc + r.f3, 0) / total,
    "Pupil Records": sampleResponses.reduce((acc, r) => acc + r.f4, 0) / total,
    "Approvals & Audit Trail": sampleResponses.reduce((acc, r) => acc + r.f5, 0) / total
  };

  const sortedFeatures = Object.entries(fSums).sort((a,b) => b[1] - a[1]);
  const topFeature = sortedFeatures[0];
  const lowFeature = sortedFeatures[sortedFeatures.length - 1];

  // Pilot Interest %
  const pilotInterestCount = sampleResponses.filter(r => 
    r.positions.some(p => p.includes("pilot"))
  ).length;
  const pilotInterestPct = Math.round((pilotInterestCount / total) * 100);

  // Paid £3k Pilot %
  const paidPilotCount = sampleResponses.filter(r => 
    r.pilot3k === "Yes" || r.pilot3k.includes("Possibly")
  ).length;
  const paidPilotPct = Math.round((paidPilotCount / total) * 100);

  // Top Price Tier
  const priceCounts = {};
  sampleResponses.forEach(r => {
    priceCounts[r.monthlyPrice] = (priceCounts[r.monthlyPrice] || 0) + 1;
  });
  const topPrice = Object.entries(priceCounts).sort((a,b) => b[1] - a[1])[0][0];

  // EOI Count
  const eoiCount = sampleResponses.filter(r => r.eoi.includes("Yes")).length;

  // Lead Scores & Hot Leads
  let hotLeads = 0;
  sampleResponses.forEach(r => {
    const { status } = calculateLeadScore(r);
    if (status === "Hot") hotLeads++;
  });

  // Follow-up Count
  const followupCount = sampleResponses.filter(r => r.followup === "Yes" || r.followup === "Possibly").length;

  // Update DOM Metric Cards
  document.getElementById("m-total-resp").textContent = total;
  document.getElementById("m-avg-severity").textContent = `${avgSeverity} / 5.0`;
  document.getElementById("m-top-feature").textContent = topFeature[0];
  document.getElementById("m-top-feature-score").textContent = `Avg Score: ${topFeature[1].toFixed(2)}/5`;
  document.getElementById("m-low-feature").textContent = lowFeature[0];
  document.getElementById("m-low-feature-score").textContent = `Avg Score: ${lowFeature[1].toFixed(2)}/5`;
  document.getElementById("m-pilot-interest-pct").textContent = `${pilotInterestPct}%`;
  document.getElementById("m-paid-pilot-pct").textContent = `${paidPilotPct}%`;
  document.getElementById("m-top-price").textContent = topPrice;
  document.getElementById("m-eoi-count").textContent = eoiCount;
  document.getElementById("m-hot-leads").textContent = hotLeads;
  document.getElementById("m-followup-count").textContent = followupCount;

  // Render Business Plan Generator Paragraph
  const todayStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const bpParagraph = `As of ${todayStr}, Braivanta had received ${total} demo feedback responses from key education stakeholders, including QTVIs, SENCOs, Teaching Assistants, and Local Authority VI Officers across mainstream and specialist settings. The average problem severity score reported by practitioners was ${avgSeverity}/5.0. The highest-rated feature was ${topFeature[0]} with an average usefulness score of ${topFeature[1].toFixed(2)}/5.0. Overall, ${pilotInterestPct}% of respondents indicated interest in a controlled pilot, and ${paidPilotPct}% confirmed they would consider or possibly consider a £3,000 paid pilot, subject to defined scope and internal approval. The most commonly selected monthly subscription preference was ${topPrice}. Additionally, ${eoiCount} respondents confirmed their response can be treated as a non-binding expression of interest, with ${hotLeads} categorized as high-priority hot leads.`;

  document.getElementById("bp-generated-text").textContent = bpParagraph;
}

function copyBusinessPlanText() {
  const text = document.getElementById("bp-generated-text").textContent;
  navigator.clipboard.writeText(text).then(() => {
    alert("Business Plan Evidence text copied to clipboard!");
  });
}

// --- Chart.js Visualization Engine ---
function renderCharts() {
  const total = sampleResponses.length;
  if (total === 0) return;

  // Destroy previous charts if existing
  Object.values(chartInstances).forEach(chart => chart.destroy());

  // 1. Feature Rankings Bar Chart
  const ctxFeatures = document.getElementById('chart-feature-ranking').getContext('2d');
  const fAverages = [
    (sampleResponses.reduce((a,r) => a + r.f1, 0) / total).toFixed(2),
    (sampleResponses.reduce((a,r) => a + r.f2, 0) / total).toFixed(2),
    (sampleResponses.reduce((a,r) => a + r.f3, 0) / total).toFixed(2),
    (sampleResponses.reduce((a,r) => a + r.f4, 0) / total).toFixed(2),
    (sampleResponses.reduce((a,r) => a + r.f5, 0) / total).toFixed(2)
  ];

  chartInstances.features = new Chart(ctxFeatures, {
    type: 'bar',
    data: {
      labels: ['Braille Review', 'Assessment-Safe', 'STEM Support', 'Pupil Records', 'Approvals'],
      datasets: [{
        label: 'Avg Usefulness Score (1–5)',
        data: fAverages,
        backgroundColor: ['#0D9488', '#2563EB', '#10B981', '#F59E0B', '#6366F1'],
        borderRadius: 6
      }]
    },
    options: { responsive: true, scales: { y: { min: 0, max: 5 } } }
  });

  // 2. Lead Temperature Breakdown (Doughnut)
  const ctxStatus = document.getElementById('chart-lead-status').getContext('2d');
  let statusCounts = { Hot: 0, Warm: 0, Cold: 0 };
  sampleResponses.forEach(r => {
    const { status } = calculateLeadScore(r);
    statusCounts[status]++;
  });

  chartInstances.status = new Chart(ctxStatus, {
    type: 'doughnut',
    data: {
      labels: ['Hot Leads (Score ≥8)', 'Warm Leads (Score 4-7)', 'Cold Leads (Score 0-3)'],
      datasets: [{
        data: [statusCounts.Hot, statusCounts.Warm, statusCounts.Cold],
        backgroundColor: ['#EF4444', '#F59E0B', '#3B82F6']
      }]
    },
    options: { responsive: true }
  });

  // 3. Paid Pilot Willingness Pie Chart
  const ctxPilot = document.getElementById('chart-pilot-willingness').getContext('2d');
  const pilotCounts = {};
  sampleResponses.forEach(r => {
    pilotCounts[r.pilot3k] = (pilotCounts[r.pilot3k] || 0) + 1;
  });

  chartInstances.pilot = new Chart(ctxPilot, {
    type: 'pie',
    data: {
      labels: Object.keys(pilotCounts),
      datasets: [{
        data: Object.values(pilotCounts),
        backgroundColor: ['#10B981', '#14B8A6', '#3B82F6', '#94A3B8', '#EF4444', '#F59E0B']
      }]
    },
    options: { responsive: true }
  });

  // 4. Monthly Price Preference Bar Chart
  const ctxPrice = document.getElementById('chart-price-preference').getContext('2d');
  const priceTiers = ['£200 per month', '£300 per month', '£400 per month', 'More than £400 per month', 'We would prefer an annual licence', 'Unable to estimate at this stage'];
  const priceCountsArr = priceTiers.map(tier => sampleResponses.filter(r => r.monthlyPrice === tier).length);

  chartInstances.price = new Chart(ctxPrice, {
    type: 'bar',
    data: {
      labels: ['£200/mo', '£300/mo', '£400/mo', '>£400/mo', 'Annual Licence', 'Unable to Estimate'],
      datasets: [{
        label: 'Number of Organisations',
        data: priceCountsArr,
        backgroundColor: '#0F766E',
        borderRadius: 6
      }]
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  });

  // 5. Respondents by Role
  const ctxRoles = document.getElementById('chart-roles').getContext('2d');
  const roleMap = {};
  sampleResponses.forEach(r => {
    roleMap[r.role] = (roleMap[r.role] || 0) + 1;
  });

  chartInstances.roles = new Chart(ctxRoles, {
    type: 'bar',
    data: {
      labels: Object.keys(roleMap),
      datasets: [{
        label: 'Respondents',
        data: Object.values(roleMap),
        backgroundColor: '#1E293B',
        borderRadius: 6
      }]
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  });

  // 6. Problem Severity Distribution
  const ctxSeverity = document.getElementById('chart-severity').getContext('2d');
  const sevArr = [1, 2, 3, 4, 5].map(lvl => sampleResponses.filter(r => r.severity === lvl).length);

  chartInstances.severity = new Chart(ctxSeverity, {
    type: 'bar',
    data: {
      labels: ['1 (Not serious)', '2 (Slightly)', '3 (Moderately)', '4 (Serious)', '5 (Very serious)'],
      datasets: [{
        label: 'Respondents',
        data: sevArr,
        backgroundColor: '#F59E0B',
        borderRadius: 6
      }]
    },
    options: { responsive: true, scales: { y: { beginAtZero: true } } }
  });
}

// --- Customer Theme Quotes Table ---
function renderThemeQuotes() {
  const filterVal = document.getElementById("theme-filter").value;
  const tbody = document.getElementById("quotes-table-body");
  tbody.innerHTML = "";

  const filtered = filterVal === "ALL" 
    ? sampleResponses 
    : sampleResponses.filter(r => r.theme === filterVal);

  filtered.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${item.role}</strong><br><span class="subtext">${item.orgType}</span></td>
      <td>"${item.mostValuable || item.comments}"</td>
      <td><span class="badge badge-info">${item.theme}</span></td>
      <td><span class="badge ${item.sentiment === 'Positive' ? 'badge-hot' : 'badge-cold'}">${item.sentiment}</span></td>
      <td><strong>${item.priority} Priority</strong></td>
    `;
    tbody.appendChild(tr);
  });
}

// --- Raw & Cleaned Data Table ---
function renderRawDataTable() {
  const tbody = document.getElementById("raw-data-table-body");
  tbody.innerHTML = "";

  sampleResponses.forEach(r => {
    const { score, status } = calculateLeadScore(r);
    const badgeClass = status === "Hot" ? "badge-hot" : (status === "Warm" ? "badge-warm" : "badge-cold");

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${score} pts</strong></td>
      <td><span class="badge ${badgeClass}">${status}</span></td>
      <td><strong>${r.name}</strong><br><span class="subtext">${r.title}</span></td>
      <td>${r.org}</td>
      <td>${r.severity}/5</td>
      <td>[${r.f1}, ${r.f2}, ${r.f3}, ${r.f4}, ${r.f5}]</td>
      <td>${r.interest}</td>
      <td>${r.pilot3k}</td>
      <td>${r.monthlyPrice}</td>
      <td>${r.eoi}</td>
      <td>${r.followup}</td>
    `;
    tbody.appendChild(tr);
  });
}

// --- Export CSV Function ---
function exportDataToCSV() {
  if (sampleResponses.length === 0) return alert("No data to export.");

  const headers = [
    "Timestamp", "Name", "Job Title", "Organisation", "Email", "Org Type", "Role",
    "Problem Severity", "F1 Braille", "F2 Assessment-Safe", "F3 STEM", "F4 Records", "F5 Approvals",
    "Most Valuable Comment", "Overall Interest", "£3k Paid Pilot Willingness", "Preferred Monthly Price",
    "EOI Status", "Follow-up Willingness", "Approver Identified", "Comments", "Lead Score", "Lead Status"
  ];

  const rows = sampleResponses.map(r => {
    const { score, status } = calculateLeadScore(r);
    return [
      `"${r.timestamp}"`, `"${r.name}"`, `"${r.title}"`, `"${r.org}"`, `"${r.email}"`, `"${r.orgType}"`, `"${r.role}"`,
      r.severity, r.f1, r.f2, r.f3, r.f4, r.f5,
      `"${r.mostValuable.replace(/"/g, '""')}"`, `"${r.interest}"`, `"${r.pilot3k}"`, `"${r.monthlyPrice}"`,
      `"${r.eoi}"`, `"${r.followup}"`, `"${r.approver || ''}"`, `"${r.comments.replace(/"/g, '""')}"`,
      score, status
    ].join(",");
  });

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Braivanta_Validation_Evidence_${new Date().toISOString().substring(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// --- Data Protection Modal Triggers ---
function openPrivacyModal() {
  const modal = document.getElementById("privacy-modal");
  if (modal) modal.classList.add("active");
}

function closePrivacyModal() {
  const modal = document.getElementById("privacy-modal");
  if (modal) modal.classList.remove("active");
}
