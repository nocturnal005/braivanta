/* ==========================================================================
   Braivanta validation site — team evidence views
   Access is granted only when the server accepts the team token
   (Authorization: Bearer). The token lives in this module's memory for the page session:
   it is never hard-coded, stored in the browser or read from the URL.
   ========================================================================== */

let token = null;
let pendingTab = null;

async function fetchResponses(candidate) {
  const response = await fetch("/api/admin/responses", {
    headers: { Authorization: `Bearer ${candidate}` },
    cache: "no-store",
  });
  const body = await response.json().catch(() => null);
  return { status: response.status, body };
}

function setStatus(message) {
  const status = document.getElementById("admin-status");
  if (status) status.textContent = message;
}

function render(body) {
  const count = Array.isArray(body?.responses) ? body.responses.length : 0;
  setStatus(`${count} response${count === 1 ? "" : "s"} stored centrally.`);
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
      result = await fetchResponses(candidate);
    } catch {
      result = { status: 0 };
    }
    if (result.status === 200) {
      token = candidate;
      input.value = "";
      document.getElementById("admin-auth-btn").textContent = "Team access active";
      for (const icon of document.querySelectorAll(".admin-tab .lock-icon")) icon.hidden = true;
      render(result.body);
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

  return {
    isUnlocked: () => token !== null,
    setPendingTab: (tabId) => {
      pendingTab = tabId;
    },
  };
}
