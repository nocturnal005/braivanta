/* ==========================================================================
   Braivanta validation site — team evidence views
   Access is granted only when the server accepts the team token (Authorization: Bearer).
   The token lives in this module's memory for the page session: it is never hard-coded,
   stored in the browser or read from the URL. All figures come from the server's summary of
   the central store; nothing here is persisted locally, and nothing is scored or classified.
   ========================================================================== */

let token = null;
let pendingTab = null;
let lastData = null;

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
};

async function fetchEvidence(candidate) {
  const response = await fetch("/api/admin/responses", {
    headers: { Authorization: `Bearer ${candidate}` },
    cache: "no-store",
  });
  const body = await response.json().catch(() => null);
  return { status: response.status, body };
}

function setStatus(id, message, isError = false) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = message;
  el.classList.toggle("admin-error", isError);
}

// ---------------------------------------------------------------------------
// Rendering helpers: every figure shows "count of denominator (percentage)".
function distributionTable(title, dist) {
  const rows = dist.rows
    .map(
      (row) => `
        <tr>
          <th scope="row">${escapeHtml(row.option)}</th>
          <td class="num">${escapeHtml(row.label)}</td>
          <td class="bar-cell" aria-hidden="true"><span class="bar" style="width:${row.percentage ?? 0}%"></span></td>
        </tr>`,
    )
    .join("");
  return `
    <div class="evidence-block">
      <h4>${escapeHtml(title)}</h4>
      <p class="denominator">Denominator: ${dist.denominator} response${dist.denominator === 1 ? "" : "s"}.${dist.note ? ` ${escapeHtml(dist.note)}` : ""}</p>
      <table class="data-table evidence-table">
        <thead><tr><th scope="col">Answer</th><th scope="col">Count of denominator</th><th scope="col"><span class="visually-hidden">Proportion</span></th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function rawList(title, items, emptyText) {
  const body = items.length
    ? `<ul class="raw-list">${items
        .map((item) => `<li><span class="raw-meta">${escapeHtml(item.role)} · ${escapeHtml(item.organisation_type)}</span> ${escapeHtml(item.text)}</li>`)
        .join("")}</ul>`
    : `<p class="subtext">${escapeHtml(emptyText)}</p>`;
  return `<div class="evidence-block span-2"><h4>${escapeHtml(title)} <span class="subtext">(${items.length} raw response${items.length === 1 ? "" : "s"}, unedited)</span></h4>${body}</div>`;
}

function section(letter, title, inner) {
  return `<section class="evidence-section card shadow-sm" aria-labelledby="evidence-${letter}"><h3 id="evidence-${letter}">${letter}. ${escapeHtml(title)}</h3><div class="evidence-grid">${inner}</div></section>`;
}

function renderDashboard(data) {
  const s = data.summary;
  const container = document.getElementById("dashboard-content");
  const orgs = s.sample.namedOrganisations;
  const sample = `
    <div class="evidence-block">
      <h4>Completed responses</h4>
      <p class="metric-value">${s.sample.completedResponses}</p>
      <p class="subtext">Stored in the central database.</p>
    </div>
    <div class="evidence-block">
      <h4>Named organisations</h4>
      <p class="metric-value">${orgs.count}</p>
      <p class="subtext">${orgs.respondentsWithName} response${orgs.respondentsWithName === 1 ? "" : "s"} named an organisation; ${orgs.respondentsWithoutName} did not. ${escapeHtml(orgs.note)}</p>
    </div>
    ${distributionTable("Respondents by role (Q1)", s.sample.byRole)}
    ${distributionTable("Respondents by organisation type (Q2)", s.sample.byOrganisationType)}`;
  const problem = `
    ${distributionTable("Problem frequency (Q4)", s.problem.frequency)}
    ${distributionTable("Staff time spent (Q6)", s.problem.staffTime)}
    ${distributionTable("Reported impact (Q5)", s.problem.impacts)}
    ${distributionTable("Current approach / alternative (Q7)", s.problem.currentApproaches)}
    ${rawList("Main problem statements (Q3, before the demo)", s.problem.mainProblems, "No problem statements yet.")}
    ${rawList("Other impacts described (Q5)", s.problem.impactsOther, "No other impacts described.")}
    ${rawList("Other current approaches described (Q7)", s.problem.approachesOther, "No other approaches described.")}`;
  const solution = `
    ${distributionTable("Functions actually tested (Q8)", s.solution.testedFeatures)}
    ${distributionTable("Technical blocker (Q9)", s.solution.technicalBlocker)}
    ${rawList("Technical issues described (Q9)", s.solution.technicalDetails, "No technical issues reported.")}
    ${distributionTable("Would Braivanta help with the main problem? (Q10)", s.solution.solutionHelp)}
    ${distributionTable("Compared with current process (Q11)", s.solution.comparison)}
    ${distributionTable("Main adoption barrier (Q13)", s.solution.barriers)}
    ${rawList("Main benefit (Q12)", s.solution.mainBenefits, "No benefit statements yet.")}
    ${rawList("Other barriers described (Q13)", s.solution.barrierOther, "No other barriers described.")}`;
  const commercial = `
    ${distributionTable("Willingness to pay (Q14)", s.commercial.willingnessToPay)}
    ${distributionTable("Annual budget range (Q14, conditional)", s.commercial.annualBudget)}
    ${distributionTable("Next-step position (Q15)", s.commercial.nextStep)}
    ${distributionTable("Follow-up permission (Q15)", s.commercial.followupPermission)}`;

  const qualitativeRows = s.qualitative.length
    ? s.qualitative
        .map(
          (r) => `<tr>
            <td>${escapeHtml(r.role)}</td><td>${escapeHtml(r.organisation_type)}</td><td>${escapeHtml(r.main_problem)}</td>
            <td>${escapeHtml(r.main_benefit)}</td><td>${escapeHtml(r.technical_issue)}</td><td>${escapeHtml(r.main_barrier)}</td>
            <td>${escapeHtml(r.next_step_position)}</td></tr>`,
        )
        .join("")
    : `<tr><td colspan="7" class="empty-cell">0 responses recorded.</td></tr>`;
  const qualitative = `
    <section class="evidence-section card shadow-sm" aria-labelledby="evidence-qualitative">
      <h3 id="evidence-qualitative">Qualitative evidence</h3>
      <p class="subtext">Respondents' own words, unedited. No sentiment or themes are assigned automatically.</p>
      <div class="table-responsive">
        <table class="data-table">
          <thead><tr><th scope="col">Role</th><th scope="col">Organisation type</th><th scope="col">Main problem</th><th scope="col">Main benefit</th><th scope="col">Technical issue</th><th scope="col">Main barrier</th><th scope="col">Next-step position</th></tr></thead>
          <tbody>${qualitativeRows}</tbody>
        </table>
      </div>
    </section>`;

  container.innerHTML = [
    section("A", "Sample and respondents", sample),
    section("B", "Problem validation", problem),
    section("C", "Solution validation", solution),
    section("D", "Commercial validation", commercial),
    qualitative,
  ].join("");
}

function renderExportTable(data) {
  const container = document.getElementById("export-content");
  const rows = data.responses.length
    ? data.responses
        .map(
          (r) => `<tr>
            <td>${escapeHtml(formatDate(r.created_at))}</td><td>${escapeHtml(r.role)}</td><td>${escapeHtml(r.organisation_type)}</td>
            <td>${escapeHtml(r.organisation_name ?? "")}</td><td>${escapeHtml(r.problem_frequency)}</td><td>${escapeHtml(r.solution_help)}</td>
            <td>${escapeHtml(r.current_process_comparison)}</td><td>${escapeHtml(r.willingness_to_pay)}</td>
            <td>${escapeHtml(r.annual_budget_range ?? "")}</td><td>${escapeHtml(r.next_step_position)}</td></tr>`,
        )
        .join("")
    : `<tr><td colspan="10" class="empty-cell">0 responses recorded.</td></tr>`;
  container.innerHTML = `
    <div class="table-responsive">
      <table class="data-table">
        <thead><tr><th scope="col">Submitted</th><th scope="col">Role</th><th scope="col">Organisation type</th><th scope="col">Organisation</th><th scope="col">Frequency (Q4)</th><th scope="col">Would help (Q10)</th><th scope="col">Comparison (Q11)</th><th scope="col">Pay (Q14)</th><th scope="col">Budget (Q14)</th><th scope="col">Next step (Q15)</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`;
}

function renderAll(data) {
  lastData = data;
  const n = data.responses.length;
  setStatus("admin-status", `${n} response${n === 1 ? "" : "s"} in the central store (loaded ${formatDate(new Date())}).`);
  setStatus("export-status", `${n} response${n === 1 ? "" : "s"} available for export.`);
  renderDashboard(data);
  renderExportTable(data);
}

function showLoadError(message) {
  // Never show stale data as if it were current.
  lastData = null;
  document.getElementById("dashboard-content").innerHTML = "";
  document.getElementById("export-content").innerHTML = "";
  setStatus("admin-status", message, true);
  setStatus("export-status", message, true);
}

async function refresh() {
  if (!token) return;
  let result;
  try {
    result = await fetchEvidence(token);
  } catch {
    result = { status: 0 };
  }
  if (result.status === 200 && result.body?.summary) renderAll(result.body);
  else showLoadError(result.status === 401 ? "Team access was refused. Please log in again." : "Evidence data could not be loaded. Please try again.");
}

async function downloadCsv() {
  if (!token) return;
  let response;
  try {
    response = await fetch("/api/admin/export", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  } catch {
    response = null;
  }
  if (!response?.ok) {
    setStatus("export-status", "The export could not be produced. Please try again.", true);
    return;
  }
  const blob = await response.blob();
  const name = /filename="([^"]+)"/.exec(response.headers.get("Content-Disposition") ?? "")?.[1] ?? "braivanta-validation-responses.csv";
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function initAdmin({ showTab, closeLogin }) {
  const formEl = document.getElementById("admin-auth-form");
  const input = document.getElementById("admin-token-input");
  const error = document.getElementById("admin-token-error");

  formEl.addEventListener("submit", async (event) => {
    event.preventDefault();
    error.hidden = true;
    const candidate = input.value.trim();
    if (!candidate) {
      error.textContent = "Enter the team token.";
      error.hidden = false;
      return;
    }
    let result;
    try {
      result = await fetchEvidence(candidate);
    } catch {
      result = { status: 0 };
    }
    if (result.status === 200 && result.body?.summary) {
      token = candidate;
      input.value = "";
      document.getElementById("admin-auth-btn").textContent = "Team access active";
      for (const icon of document.querySelectorAll(".admin-tab .lock-icon")) icon.hidden = true;
      renderAll(result.body);
      closeLogin();
      showTab(pendingTab ?? "dashboard-tab");
      pendingTab = null;
      return;
    }
    error.textContent =
      result.status === 401
        ? "That team token was not accepted."
        : result.status === 503
          ? "Team access is not configured on the server."
          : "Evidence data could not be loaded. Please try again.";
    error.hidden = false;
  });

  for (const btn of document.querySelectorAll("[data-admin-refresh]")) btn.addEventListener("click", refresh);
  document.getElementById("export-csv").addEventListener("click", downloadCsv);

  return {
    isUnlocked: () => token !== null,
    setPendingTab: (tabId) => {
      pendingTab = tabId;
    },
    hasData: () => lastData !== null,
  };
}
