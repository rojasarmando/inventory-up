/**
 * api.js — fetch wrapper for the Kajataca backend.
 *
 * - Always sends JSON with credentials: 'same-origin' (HttpOnly cookie auth)
 * - Unwraps the {ok, data} / {ok, detail} response shape
 * - Shows error toasts (Bootstrap 5) with i18n-translated messages
 * - Redirects to /login on 401, and to /403 on forbidden API actions
 */

const KajatacaApi = (() => {
  /** Escape HTML so dynamic table content is safe. */
  function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /** Show a Bootstrap 5 toast notification. */
  function showToast(message, type = "success") {
    const container = document.getElementById("toastContainer");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = `toast align-items-center text-bg-${
      type === "danger" ? "danger" : type === "warning" ? "warning" : "success"
    } border-0`;
    toast.setAttribute("role", "alert");
    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${escapeHtml(message)}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto"
          data-bs-dismiss="toast" aria-label="Close"></button>
      </div>`;
    container.appendChild(toast);
    const instance = new bootstrap.Toast(toast, { delay: 4000 });
    instance.show();
    toast.addEventListener("hidden.bs.toast", () => toast.remove());
  }

  function isLoginPage() {
    return window.location.pathname === "/login";
  }

  /**
   * Core fetch helper.
   * Returns the parsed JSON body on success (2xx with ok:true).
   * Throws an Error with the server `detail` on failure.
   */
  async function api(path, options = {}) {
    const opts = {
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      ...options,
    };
    if (opts.body && typeof opts.body !== "string") {
      opts.body = JSON.stringify(opts.body);
    }

    let response;
    try {
      response = await fetch(path, opts);
    } catch (err) {
      showToast(KajatacaI18n.t("error.network"), "danger");
      throw new Error("network");
    }

    let body = null;
    try {
      body = await response.json();
    } catch (err) {
      body = null;
    }

    if (response.status === 401) {
      if (!isLoginPage()) {
        window.location.href = "/login";
        throw new Error("unauthorized");
      }
      const detail = body && body.detail ? body.detail : "error.invalid_credentials";
      showToast(KajatacaI18n.t(detail), "danger");
      throw new Error(detail);
    }

    if (response.status === 403) {
      window.location.href = "/403";
      throw new Error("forbidden");
    }

    if (!response.ok || (body && body.ok === false)) {
      const detail = body && body.detail ? body.detail : "error.something_went_wrong";
      showToast(KajatacaI18n.t(detail), "danger");
      throw new Error(detail);
    }

    return body;
  }

  /** GET with query params object. */
  function get(path, params = {}) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") qs.append(k, v);
    });
    const url = qs.toString() ? `${path}?${qs.toString()}` : path;
    return api(url, { method: "GET" });
  }

  function post(path, data) {
    return api(path, { method: "POST", body: JSON.stringify(data) });
  }

  function put(path, data) {
    return api(path, { method: "PUT", body: JSON.stringify(data) });
  }

  function patch(path, data) {
    return api(path, { method: "PATCH", body: JSON.stringify(data) });
  }

  function del(path) {
    return api(path, { method: "DELETE" });
  }

  return { api, get, post, put, patch, del, showToast, escapeHtml };
})();
