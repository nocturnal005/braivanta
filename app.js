/* ==========================================================================
   Braivanta Validation Journey - Application Logic & Analytics Engine
   Live Data Collection Mode (Sample Data Removed)
   ========================================================================== */

// --- Global Dataset Initialization ---
// Array to store real user form submissions, persisted in localStorage
let capturedResponses = [];

function loadCapturedResponses() {
  try {
    const data = localStorage.getItem("braivanta_live_responses");
    if (data) {
      capturedResponses = JSON.parse(data);
    } else {
      capturedResponses = [];
    }
  } catch (e) {
    console.error("Failed to load response data from localStorage:", e);
    capturedResponses = [];
  }
}

function saveCapturedResponses() {
  try {
    localStorage.setItem("braivanta_live_responses", JSON.stringify(capturedResponses));
  } catch (e) {
    console.error("Failed to save response data to localStorage:", e);
  }
}

function clearAllCapturedData() {
  if (capturedResponses.length === 0) {
    alert("There is currently no captured user data to clear.");
    return;
  }
  if (confirm("Are you sure you want to clear all captured user feedback data? This action cannot be undone.")) {
    capturedResponses = [];
    localStorage.removeItem("braivanta_live_responses");
    renderDashboardMetrics();
    renderCharts();
    renderThemeQuotes();
    renderRawDataTable();
    alert("All captured response data has been cleared.");
  }
}

// Utility function to escape HTML string rendering
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

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
  if (Array.isArray(item.positions)) {
    if (item.positions.some(p => p.includes("controlled pilot"))) score += 1;
    if (item.positions.some(p => p.includes("paid pilot"))) score += 2;
  }

  // 4. £3,000 Pilot Willingness (Yes / Possibly = +2)
  if (item.pilot3k === "Yes" || (item.pilot3k && item.pilot3k.includes("Possibly"))) score += 2;

  // 5. Subscription level (£300, £400, >£400 = +2)
  if (["£300 per month", "£400 per month", "More than £400 per month"].includes(item.monthlyPrice)) score += 2;

  // 6. Non-binding EOI (Yes = +2)
  if (item.eoi && item.eoi.includes("Yes")) score += 2;

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
  loadCapturedResponses();
  checkUrlAdminParam();
  initTabs();
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
  if (formNavBtn) formNavBtn.classList.add("active");
  const formTab = document.getElementById("form-tab");
  if (formTab) formTab.classList.add("active");
}

// --- Form Submit Handler ---
function handleFormSubmit(e) {
  e.preventDefault();

  // Extract Form Data
  const getChecked = (name) => Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map(c => c.value);

  const severityEl = document.querySelector('input[name="severity"]:checked');
  const f1El = document.querySelector('input[name="f1"]:checked');
  const f2El = document.querySelector('input[name="f2"]:checked');
  const f3El = document.querySelector('input[name="f3"]:checked');
  const f4El = document.querySelector('input[name="f4"]:checked');
  const f5El = document.querySelector('input[name="f5"]:checked');

  const newEntry = {
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    name: document.getElementById("resp-name").value,
    title: document.getElementById("resp-title").value,
    org: document.getElementById("resp-org").value,
    email: document.getElementById("resp-email").value,
    orgType: document.getElementById("resp-orgtype").value,
    role: document.getElementById("resp-role").value,
    challenges: getChecked("challenge"),
    severity: severityEl ? parseInt(severityEl.value) : 3,
    f1: f1El ? parseInt(f1El.value) : 3,
    f2: f2El ? parseInt(f2El.value) : 3,
    f3: f3El ? parseInt(f3El.value) : 3,
    f4: f4El ? parseInt(f4El.value) : 3,
    f5: f5El ? parseInt(f5El.value) : 3,
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

  capturedResponses.unshift(newEntry);
  saveCapturedResponses();

  alert("Thank you! Your feedback response has been recorded and live analytics updated.");
  
  document.getElementById("feedback-form").reset();
  
  // Switch to Dashboard Tab
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
  const dashNavBtn = document.querySelector('[data-tab="dashboard-tab"]');
  if (dashNavBtn) dashNavBtn.classList.add("active");
  const dashTab = document.getElementById("dashboard-tab");
  if (dashTab) dashTab.classList.add("active");

  renderDashboardMetrics();
  renderCharts();
  renderThemeQuotes();
  renderRawDataTable();
}

function resetDemoForm() {
  const form = document.getElementById("feedback-form");
  if (form) form.reset();
}

// --- Dashboard Metrics ---
function renderDashboardMetrics() {
  const total = capturedResponses.length;
  const banner = document.getElementById("no-data-banner");

  if (total === 0) {
    if (banner) banner.style.display = "block";

    document.getElementById("m-total-resp").textContent = "0";
    document.getElementById("m-avg-severity").textContent = "0.0 / 5.0";
    document.getElementById("m-top-feature").textContent = "N/A";
    document.getElementById("m-top-feature-score").textContent = "Score: N/A";
    document.getElementById("m-low-feature").textContent = "N/A";
    document.getElementById("m-low-feature-score").textContent = "Score: N/A";
    document.getElementById("m-pilot-interest-pct").textContent = "0%";
    document.getElementById("m-paid-pilot-pct").textContent = "0%";
    document.getElementById("m-top-price").textContent = "N/A";
    document.getElementById("m-eoi-count").textContent = "0";
    document.getElementById("m-hot-leads").textContent = "0";
    document.getElementById("m-followup-count").textContent = "0";
    return;
  }

  if (banner) banner.style.display = "none";

  const avgSeverity = (capturedResponses.reduce((acc, r) => acc + (r.severity || 0), 0) / total).toFixed(1);

  // Feature Ratings Sums
  const fSums = {
    "Braille Work Review": capturedResponses.reduce((acc, r) => acc + (r.f1 || 0), 0) / total,
    "Assessment-Safe": capturedResponses.reduce((acc, r) => acc + (r.f2 || 0), 0) / total,
    "STEM Support": capturedResponses.reduce((acc, r) => acc + (r.f3 || 0), 0) / total,
    "Pupil Records": capturedResponses.reduce((acc, r) => acc + (r.f4 || 0), 0) / total,
    "Approvals & Audit Trail": capturedResponses.reduce((acc, r) => acc + (r.f5 || 0), 0) / total
  };

  const sortedFeatures = Object.entries(fSums).sort((a,b) => b[1] - a[1]);
  const topFeature = sortedFeatures[0];
  const lowFeature = sortedFeatures[sortedFeatures.length - 1];

  // Pilot Interest %
  const pilotInterestCount = capturedResponses.filter(r => 
    Array.isArray(r.positions) && r.positions.some(p => p.includes("pilot"))
  ).length;
  const pilotInterestPct = Math.round((pilotInterestCount / total) * 100);

  // Paid £3k Pilot %
  const paidPilotCount = capturedResponses.filter(r => 
    r.pilot3k === "Yes" || (r.pilot3k && r.pilot3k.includes("Possibly"))
  ).length;
  const paidPilotPct = Math.round((paidPilotCount / total) * 100);

  // Top Price Tier
  const priceCounts = {};
  capturedResponses.forEach(r => {
    if (r.monthlyPrice) {
      priceCounts[r.monthlyPrice] = (priceCounts[r.monthlyPrice] || 0) + 1;
    }
  });
  const sortedPrices = Object.entries(priceCounts).sort((a,b) => b[1] - a[1]);
  const topPrice = sortedPrices.length > 0 ? sortedPrices[0][0] : "N/A";

  // EOI Count
  const eoiCount = capturedResponses.filter(r => r.eoi && r.eoi.includes("Yes")).length;

  // Lead Scores & Hot Leads
  let hotLeads = 0;
  capturedResponses.forEach(r => {
    const { status } = calculateLeadScore(r);
    if (status === "Hot") hotLeads++;
  });

  // Follow-up Count
  const followupCount = capturedResponses.filter(r => r.followup === "Yes" || r.followup === "Possibly").length;

  // Update DOM Metric Cards
  document.getElementById("m-total-resp").textContent = total;
  document.getElementById("m-avg-severity").textContent = `${avgSeverity} / 5.0`;
  document.getElementById("m-top-feature").textContent = topFeature ? topFeature[0] : "N/A";
  document.getElementById("m-top-feature-score").textContent = topFeature ? `Avg Score: ${topFeature[1].toFixed(2)}/5` : "Score: N/A";
  document.getElementById("m-low-feature").textContent = lowFeature ? lowFeature[0] : "N/A";
  document.getElementById("m-low-feature-score").textContent = lowFeature ? `Avg Score: ${lowFeature[1].toFixed(2)}/5` : "Score: N/A";
  document.getElementById("m-pilot-interest-pct").textContent = `${pilotInterestPct}%`;
  document.getElementById("m-paid-pilot-pct").textContent = `${paidPilotPct}%`;
  document.getElementById("m-top-price").textContent = topPrice;
  document.getElementById("m-eoi-count").textContent = eoiCount;
  document.getElementById("m-hot-leads").textContent = hotLeads;
  document.getElementById("m-followup-count").textContent = followupCount;
}

// --- Chart.js Visualization Engine ---
function renderCharts() {
  const total = capturedResponses.length;

  // Destroy previous charts if existing
  Object.values(chartInstances).forEach(chart => {
    if (chart && typeof chart.destroy === 'function') {
      chart.destroy();
    }
  });
  chartInstances = {};

  // 1. Feature Rankings Bar Chart
  const ctxFeaturesEl = document.getElementById('chart-feature-ranking');
  if (ctxFeaturesEl) {
    const ctxFeatures = ctxFeaturesEl.getContext('2d');
    const fAverages = total > 0 ? [
      (capturedResponses.reduce((a,r) => a + (r.f1 || 0), 0) / total).toFixed(2),
      (capturedResponses.reduce((a,r) => a + (r.f2 || 0), 0) / total).toFixed(2),
      (capturedResponses.reduce((a,r) => a + (r.f3 || 0), 0) / total).toFixed(2),
      (capturedResponses.reduce((a,r) => a + (r.f4 || 0), 0) / total).toFixed(2),
      (capturedResponses.reduce((a,r) => a + (r.f5 || 0), 0) / total).toFixed(2)
    ] : [0, 0, 0, 0, 0];

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
  }

  // 2. Lead Temperature Breakdown (Doughnut)
  const ctxStatusEl = document.getElementById('chart-lead-status');
  if (ctxStatusEl) {
    const ctxStatus = ctxStatusEl.getContext('2d');
    let statusCounts = { Hot: 0, Warm: 0, Cold: 0 };
    if (total > 0) {
      capturedResponses.forEach(r => {
        const { status } = calculateLeadScore(r);
        statusCounts[status]++;
      });
    }

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
  }

  // 3. Paid Pilot Willingness Pie Chart
  const ctxPilotEl = document.getElementById('chart-pilot-willingness');
  if (ctxPilotEl) {
    const ctxPilot = ctxPilotEl.getContext('2d');
    const pilotCounts = {};
    if (total > 0) {
      capturedResponses.forEach(r => {
        if (r.pilot3k) pilotCounts[r.pilot3k] = (pilotCounts[r.pilot3k] || 0) + 1;
      });
    } else {
      pilotCounts["Awaiting Live Data"] = 0;
    }

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
  }

  // 4. Monthly Price Preference Bar Chart
  const ctxPriceEl = document.getElementById('chart-price-preference');
  if (ctxPriceEl) {
    const ctxPrice = ctxPriceEl.getContext('2d');
    const priceTiers = ['£200 per month', '£300 per month', '£400 per month', 'More than £400 per month', 'We would prefer an annual licence', 'Unable to estimate at this stage'];
    const priceCountsArr = priceTiers.map(tier => total > 0 ? capturedResponses.filter(r => r.monthlyPrice === tier).length : 0);

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
  }

  // 5. Respondents by Role
  const ctxRolesEl = document.getElementById('chart-roles');
  if (ctxRolesEl) {
    const ctxRoles = ctxRolesEl.getContext('2d');
    const roleMap = {};
    if (total > 0) {
      capturedResponses.forEach(r => {
        if (r.role) roleMap[r.role] = (roleMap[r.role] || 0) + 1;
      });
    } else {
      roleMap["Awaiting Data"] = 0;
    }

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
  }

  // 6. Problem Severity Distribution
  const ctxSeverityEl = document.getElementById('chart-severity');
  if (ctxSeverityEl) {
    const ctxSeverity = ctxSeverityEl.getContext('2d');
    const sevArr = [1, 2, 3, 4, 5].map(lvl => total > 0 ? capturedResponses.filter(r => r.severity === lvl).length : 0);

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
}

// --- Customer Theme Quotes Table ---
function renderThemeQuotes() {
  const filterEl = document.getElementById("theme-filter");
  const filterVal = filterEl ? filterEl.value : "ALL";
  const tbody = document.getElementById("quotes-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  const filtered = filterVal === "ALL" 
    ? capturedResponses 
    : capturedResponses.filter(r => r.theme === filterVal);

  if (filtered.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td colspan="5" style="text-align: center; padding: 2rem; color: #64748b;">
        <em>No user feedback quotes recorded yet. Submissions from visitors will appear here automatically.</em>
      </td>
    `;
    tbody.appendChild(tr);
    return;
  }

  filtered.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${escapeHtml(item.role)}</strong><br><span class="subtext">${escapeHtml(item.orgType)}</span></td>
      <td>"${escapeHtml(item.mostValuable || item.comments)}"</td>
      <td><span class="badge badge-info">${escapeHtml(item.theme)}</span></td>
      <td><span class="badge ${item.sentiment === 'Positive' ? 'badge-hot' : 'badge-cold'}">${escapeHtml(item.sentiment)}</span></td>
      <td><strong>${escapeHtml(item.priority)} Priority</strong></td>
    `;
    tbody.appendChild(tr);
  });
}

// --- Raw & Cleaned Data Table ---
function renderRawDataTable() {
  const tbody = document.getElementById("raw-data-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (capturedResponses.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td colspan="11" style="text-align: center; padding: 2rem; color: #64748b;">
        <em>No live user data captured yet. As visitors submit feedback using the form, real-time responses will be displayed here.</em>
      </td>
    `;
    tbody.appendChild(tr);
    return;
  }

  capturedResponses.forEach(r => {
    const { score, status } = calculateLeadScore(r);
    const badgeClass = status === "Hot" ? "badge-hot" : (status === "Warm" ? "badge-warm" : "badge-cold");

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><strong>${score} pts</strong></td>
      <td><span class="badge ${badgeClass}">${status}</span></td>
      <td><strong>${escapeHtml(r.name)}</strong><br><span class="subtext">${escapeHtml(r.title)}</span></td>
      <td>${escapeHtml(r.org)}</td>
      <td>${r.severity || 0}/5</td>
      <td>[${r.f1||0}, ${r.f2||0}, ${r.f3||0}, ${r.f4||0}, ${r.f5||0}]</td>
      <td>${escapeHtml(r.interest)}</td>
      <td>${escapeHtml(r.pilot3k)}</td>
      <td>${escapeHtml(r.monthlyPrice)}</td>
      <td>${escapeHtml(r.eoi)}</td>
      <td>${escapeHtml(r.followup)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// --- Export CSV Function ---
function exportDataToCSV() {
  if (capturedResponses.length === 0) {
    return alert("No live user feedback data has been captured yet to export.");
  }

  const headers = [
    "Timestamp", "Name", "Job Title", "Organisation", "Email", "Org Type", "Role",
    "Problem Severity", "F1 Braille", "F2 Assessment-Safe", "F3 STEM", "F4 Records", "F5 Approvals",
    "Most Valuable Comment", "Overall Interest", "£3k Paid Pilot Willingness", "Preferred Monthly Price",
    "EOI Status", "Follow-up Willingness", "Approver Identified", "Comments", "Lead Score", "Lead Status"
  ];

  const rows = capturedResponses.map(r => {
    const { score, status } = calculateLeadScore(r);
    return [
      `"${r.timestamp}"`,
      `"${(r.name || '').replace(/"/g, '""')}"`,
      `"${(r.title || '').replace(/"/g, '""')}"`,
      `"${(r.org || '').replace(/"/g, '""')}"`,
      `"${(r.email || '').replace(/"/g, '""')}"`,
      `"${(r.orgType || '').replace(/"/g, '""')}"`,
      `"${(r.role || '').replace(/"/g, '""')}"`,
      r.severity || 0, r.f1 || 0, r.f2 || 0, r.f3 || 0, r.f4 || 0, r.f5 || 0,
      `"${(r.mostValuable || '').replace(/"/g, '""')}"`,
      `"${(r.interest || '').replace(/"/g, '""')}"`,
      `"${(r.pilot3k || '').replace(/"/g, '""')}"`,
      `"${(r.monthlyPrice || '').replace(/"/g, '""')}"`,
      `"${(r.eoi || '').replace(/"/g, '""')}"`,
      `"${(r.followup || '').replace(/"/g, '""')}"`,
      `"${(r.approver || '').replace(/"/g, '""')}"`,
      `"${(r.comments || '').replace(/"/g, '""')}"`,
      score, status
    ].join(",");
  });

  const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `Braivanta_Live_User_Data_${new Date().toISOString().substring(0,10)}.csv`);
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
