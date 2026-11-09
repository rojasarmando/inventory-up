/**
 * users.js — users page: table + Bootstrap 5 modal form + validators + i18n.
 */

(function () {
  let roles = [];
  let users = [];

  function confirmAction(message, onConfirm) {
    const modalEl = document.getElementById("confirmModal");
    const body = modalEl.querySelector(".modal-body");
    body.textContent = message;
    const okBtn = modalEl.querySelector("#confirmOk");
    const handler = () => {
      onConfirm();
      okBtn.removeEventListener("click", handler);
    };
    okBtn.addEventListener("click", handler);
    new bootstrap.Modal(modalEl).show();
  }

  async function loadRoles() {
    try {
      const res = await KajatacaApi.get("/api/roles");
      roles = res.data;
      const filter = document.getElementById("filterRole");
      filter.innerHTML =
        `<option value="">${KajatacaI18n.t("users.filter_role")}</option>` +
        roles
          .map((r) => `<option value="${r.id}">${KajatacaApi.escapeHtml(r.name)}</option>`)
          .join("");
    } catch (err) {
      roles = [];
    }
  }

  function roleName(roleId) {
    const role = roles.find((r) => r.id === roleId);
    return role ? role.name : roleId;
  }

  function statusBadge(active) {
    return active
      ? `<span class="badge text-bg-success">${KajatacaI18n.t("status.active")}</span>`
      : `<span class="badge text-bg-secondary">${KajatacaI18n.t("status.inactive")}</span>`;
  }

  function renderTable() {
    const tbody = document.getElementById("usersTableBody");
    if (!tbody) return;
    const auth = window.KajatacaAuth;
    const canEdit = auth.can("users.edit");
    const canDelete = auth.can("users.delete");
    const canToggle = auth.can("users.toggle_status");

    tbody.innerHTML = users
      .map((u) => {
        const actions = [];
        if (canEdit) {
          actions.push(
            `<button class="btn btn-sm btn-outline-primary btn-edit" data-id="${u.id}">${KajatacaI18n.t("common.edit")}</button>`
          );
        }
        if (canToggle) {
          actions.push(
            `<button class="btn btn-sm btn-outline-warning btn-toggle" data-id="${u.id}">${KajatacaI18n.t("common.status")}</button>`
          );
        }
        if (canDelete) {
          actions.push(
            `<button class="btn btn-sm btn-outline-danger btn-delete" data-id="${u.id}">${KajatacaI18n.t("common.delete")}</button>`
          );
        }
        return `<tr>
          <td>${u.id}</td>
          <td>${KajatacaApi.escapeHtml(u.name)}</td>
          <td>${KajatacaApi.escapeHtml(u.nick)}</td>
          <td>${KajatacaApi.escapeHtml(u.cedula)}</td>
          <td>${KajatacaApi.escapeHtml(roleName(u.role_id))}</td>
          <td>${statusBadge(u.status)}</td>
          <td class="text-nowrap">${actions.join(" ")}</td>
        </tr>`;
      })
      .join("");
  }

  async function loadUsers() {
    const roleId = document.getElementById("filterRole").value;
    const status = document.getElementById("filterStatus").value;
    const params = {};
    if (roleId) params.role_id = roleId;
    if (status === "1" || status === "0") params.status = status;
    try {
      const res = await KajatacaApi.get("/api/users", params);
      users = res.data;
      renderTable();
    } catch (err) {
      users = [];
      renderTable();
    }
  }

  function fillRoleSelect(select, selectedId) {
    select.innerHTML = roles
      .map(
        (r) =>
          `<option value="${r.id}" ${r.id === selectedId ? "selected" : ""}>${KajatacaApi.escapeHtml(r.name)}</option>`
      )
      .join("");
  }

  function openUserModal(user) {
    const modalEl = document.getElementById("userModal");
    document.getElementById("userModalTitle").textContent = user
      ? KajatacaI18n.t("users.edit")
      : KajatacaI18n.t("users.add");
    document.getElementById("userId").value = user ? user.id : "";
    document.getElementById("userName").value = user ? user.name : "";
    document.getElementById("userNick").value = user ? user.nick : "";
    document.getElementById("userCedula").value = user ? user.cedula : "";
    document.getElementById("userPassword").value = "";
    document.getElementById("userConfirmPassword").value = "";
    document.getElementById("userQuestion").value = user ? user.question : "";
    document.getElementById("userAnswer").value = "";
    fillRoleSelect(document.getElementById("userRole"), user ? user.role_id : "");
    const pwHelp = document.getElementById("passwordHelp");
    if (pwHelp) pwHelp.textContent = KajatacaI18n.t("users.change_password_hint");
    new bootstrap.Modal(modalEl).show();
  }

  function collectUserForm() {
    const data = {
      name: document.getElementById("userName").value.trim(),
      nick: document.getElementById("userNick").value.trim(),
      cedula: document.getElementById("userCedula").value.trim(),
      password: document.getElementById("userPassword").value,
      question: document.getElementById("userQuestion").value.trim(),
      answer: document.getElementById("userAnswer").value.trim(),
      role_id: parseInt(document.getElementById("userRole").value, 10),
    };
    const id = document.getElementById("userId").value;
    if (id) data.id = parseInt(id, 10);
    return data;
  }

  function validateUserForm(data, isEdit) {
    const checks = [
      ["userName", KajatacaValidators.validateName(data.name)],
      ["userNick", KajatacaValidators.validateNick(data.nick)],
      ["userCedula", KajatacaValidators.validateCedula(data.cedula)],
      ["userQuestion", KajatacaValidators.validateQuestion(data.question)],
    ];
    if (!isEdit || data.password) {
      checks.push(["userPassword", KajatacaValidators.validatePassword(data.password)]);
      if (data.password !== document.getElementById("userConfirmPassword").value) {
        checks.push([
          "userConfirmPassword",
          { valid: false, message: "error.password_mismatch" },
        ]);
      }
    }
    if (!isEdit || data.answer) {
      checks.push(["userAnswer", KajatacaValidators.validateAnswer(data.answer)]);
    }
    let allValid = true;
    checks.forEach(([id, result]) => {
      KajatacaValidators.markField(document.getElementById(id), result);
      if (!result.valid) allValid = false;
    });
    return allValid;
  }

  async function submitUserForm() {
    const isEdit = !!document.getElementById("userId").value;
    const data = collectUserForm();
    if (!validateUserForm(data, isEdit)) {
      KajatacaApi.showToast(KajatacaI18n.t("error.validation"), "warning");
      return;
    }
    // On edit, empty password/answer mean "keep the current value".
    if (isEdit) {
      if (!data.password) delete data.password;
      if (!data.answer) delete data.answer;
    }
    try {
      if (isEdit) {
        await KajatacaApi.put(`/api/users/${data.id}`, data);
      } else {
        await KajatacaApi.post("/api/users", data);
      }
      bootstrap.Modal.getInstance(document.getElementById("userModal")).hide();
      KajatacaApi.showToast(
        isEdit ? KajatacaI18n.t("users.edit") : KajatacaI18n.t("users.add"),
        "success"
      );
      loadUsers();
    } catch (err) {
      // toast already shown
    }
  }

  function initUsersPage() {
    const tbody = document.getElementById("usersTableBody");
    if (!tbody) return;

    loadRoles().then(loadUsers);

    document.getElementById("filterRole").addEventListener("change", loadUsers);
    document.getElementById("filterStatus").addEventListener("change", loadUsers);

    document.getElementById("btnAddUser").addEventListener("click", () => openUserModal(null));
    document.getElementById("btnSaveUser").addEventListener("click", submitUserForm);

    tbody.addEventListener("click", (event) => {
      const editBtn = event.target.closest(".btn-edit");
      const deleteBtn = event.target.closest(".btn-delete");
      const toggleBtn = event.target.closest(".btn-toggle");
      const id = Number(
        (editBtn || deleteBtn || toggleBtn || {}).getAttribute("data-id")
      );
      const user = users.find((u) => u.id === id);
      if (!user) return;

      if (editBtn) {
        openUserModal(user);
      } else if (toggleBtn) {
        confirmAction(KajatacaI18n.t("common.confirm_status"), async () => {
          try {
            await KajatacaApi.patch(`/api/users/${id}/status`, {});
            loadUsers();
          } catch (err) {}
        });
      } else if (deleteBtn) {
        confirmAction(KajatacaI18n.t("common.confirm_delete"), async () => {
          try {
            await KajatacaApi.del(`/api/users/${id}`);
            loadUsers();
          } catch (err) {}
        });
      }
    });
  }

  document.addEventListener("DOMContentLoaded", initUsersPage);
})();
