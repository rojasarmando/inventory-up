/**
 * auth.js — login, logout, session guard and the 3-step password recovery.
 */

(function () {
  let currentUser = null;
  let permissions = null; // null = full access (Root)

  /** True when the user may perform the action identified by `key`. */
  function can(key) {
    if (permissions === null) return true;
    return permissions.includes(key);
  }

  /** Store current session info for page scripts. */
  async function loadSession() {
    try {
      const res = await KajatacaApi.get("/api/auth/me");
      currentUser = res.data.user;
      permissions = res.data.permissions;
      const nameEl = document.getElementById("navbarUserName");
      if (nameEl) nameEl.textContent = currentUser.name;
      return currentUser;
    } catch (err) {
      return null;
    }
  }

  function initSessionGuard() {
    // On protected pages, redirect to /login when not authenticated.
    const protectedPaths = [
      "/home", "/users", "/companies", "/distributors",
      "/logs", "/roles", "/reports",
      "/products", "/movements", "/music", "/gallery",
    ];
    if (protectedPaths.includes(window.location.pathname)) {
      loadSession().then((user) => {
        if (!user && !window.location.pathname.endsWith("/login")) {
          window.location.href = "/login";
        }
      });
    }
  }

  function initLoginForm() {
    const form = document.getElementById("loginForm");
    if (!form) return;
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const nick = document.getElementById("loginNick").value.trim();
      const password = document.getElementById("loginPassword").value;
      if (!nick || !password) return;
      try {
        const res = await KajatacaApi.post("/api/auth/login", { nick, password });
        currentUser = res.data.user;
        window.location.href = "/home";
      } catch (err) {
        // Error toast already shown by api.js
      }
    });
  }

  function initLogout() {
    const btn = document.getElementById("logoutBtn");
    if (!btn) return;
    btn.addEventListener("click", async () => {
      try {
        await KajatacaApi.post("/api/auth/logout", {});
      } catch (err) {
        // ignore, still redirect
      }
      window.location.href = "/login";
    });
  }

  // ------------------------------------------------------------------
  // Password recovery (3 steps in a Bootstrap modal)
  // ------------------------------------------------------------------

  function showRecoveryStep(step) {
    for (let i = 1; i <= 3; i++) {
      const el = document.getElementById(`recoveryStep${i}`);
      if (el) el.classList.toggle("d-none", i !== step);
    }
  }

  async function handleRecoveryStep1(modalBody) {
    const cedula = document.getElementById("recoveryCedula").value.trim();
    const result = KajatacaValidators.validateCedula(cedula);
    KajatacaValidators.markField(document.getElementById("recoveryCedula"), result);
    if (!result.valid) return;
    try {
      const res = await KajatacaApi.post("/api/auth/recover/step1", { cedula });
      const questionEl = document.getElementById("recoveryQuestionText");
      if (questionEl) questionEl.textContent = res.data.question;
      window.__recoveryCedula = cedula;
      showRecoveryStep(2);
    } catch (err) {
      // toast already shown
    }
  }

  async function handleRecoveryStep2() {
    const answer = document.getElementById("recoveryAnswer").value.trim();
    if (!answer) return;
    const cedula = window.__recoveryCedula;
    try {
      const res = await KajatacaApi.post("/api/auth/recover/step2", { cedula, answer });
      window.__resetToken = res.data.reset_token;
      showRecoveryStep(3);
    } catch (err) {
      // toast already shown
    }
  }

  async function handleRecoveryStep3(modal) {
    const newPassword = document.getElementById("recoveryNewPassword").value;
    const confirmPassword = document.getElementById("recoveryConfirmPassword").value;
    const result = KajatacaValidators.validatePassword(newPassword);
    KajatacaValidators.markField(
      document.getElementById("recoveryNewPassword"),
      result
    );
    if (!result.valid) return;
    if (newPassword !== confirmPassword) {
      KajatacaValidators.markField(
        document.getElementById("recoveryConfirmPassword"),
        { valid: false, message: "error.password_mismatch" }
      );
      return;
    }
    const cedula = window.__recoveryCedula;
    const resetToken = window.__resetToken;
    try {
      await KajatacaApi.post("/api/auth/recover/step3", {
        cedula,
        reset_token: resetToken,
        new_password: newPassword,
      });
      bootstrap.Modal.getInstance(modal).hide();
      KajatacaApi.showToast(KajatacaI18n.t("rec.success"), "success");
    } catch (err) {
      // toast already shown
    }
  }

  function initRecoveryModal() {
    const modalEl = document.getElementById("recoveryModal");
    if (!modalEl) return;
    modalEl.addEventListener("show.bs.modal", () => {
      showRecoveryStep(1);
    });
    const next1 = document.getElementById("recoveryNext1");
    if (next1) next1.addEventListener("click", () => handleRecoveryStep1(modalEl));
    const next2 = document.getElementById("recoveryNext2");
    if (next2) next2.addEventListener("click", handleRecoveryStep2);
    const back2 = document.getElementById("recoveryBack2");
    if (back2) back2.addEventListener("click", () => showRecoveryStep(1));
    const back3 = document.getElementById("recoveryBack3");
    if (back3) back3.addEventListener("click", () => showRecoveryStep(2));
    const finish = document.getElementById("recoveryFinish");
    if (finish) finish.addEventListener("click", () => handleRecoveryStep3(modalEl));
  }

  // ------------------------------------------------------------------

  document.addEventListener("DOMContentLoaded", () => {
    KajatacaI18n.initI18n();
    initLoginForm();
    initLogout();
    initSessionGuard();
    initRecoveryModal();
  });

  window.KajatacaAuth = { loadSession, can };
})();
