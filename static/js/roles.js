/**
 * roles.js — roles page: role list + permission manager modal.
 *
 * Permissions are managed with checkboxes grouped by module. The Root role
 * has full access and its permissions are read-only.
 */

(function () {
  let roles = [];
  let catalog = [];
  let currentRoleId = null;

  function renderRoles() {
    const tbody = document.getElementById("rolesTableBody");
    if (!tbody) return;
    tbody.innerHTML = roles
      .map((role) => {
        const isRoot = role.name.toLowerCase() === "root";
        const manageBtn = `<button class="btn btn-sm btn-outline-primary btn-permissions" data-id="${role.id}">${KajatacaI18n.t("roles.manage")}</button>`;
        const badge = isRoot
          ? `<span class="badge text-bg-danger ms-1">${KajatacaI18n.t("common.active")}</span>`
          : "";
        return `<tr>
          <td>${role.id}</td>
          <td>${KajatacaApi.escapeHtml(role.name)}${badge}</td>
          <td>${KajatacaApi.escapeHtml(role.description || "-")}</td>
          <td>${manageBtn}</td>
        </tr>`;
      })
      .join("");
  }

  async function loadRoles() {
    try {
      const res = await KajatacaApi.get("/api/roles");
      roles = res.data;
      renderRoles();
    } catch (err) {
      roles = [];
      renderRoles();
    }
  }

  async function loadCatalog() {
    try {
      const res = await KajatacaApi.get("/api/roles/permission-catalog");
      catalog = res.data;
    } catch (err) {
      catalog = [];
    }
  }

  function renderPermissionCheckboxes(selected) {
    const container = document.getElementById("permissionCheckboxes");
    if (!container) return;
    container.innerHTML = catalog
      .map((module) => {
        const checkboxes = module.sub_modules
          .map((sub) => {
            const key = "menu." + sub.key.replace(".", "_");
            return `<div class="form-check form-check-inline col-auto">
              <input class="form-check-input perm-check" type="checkbox"
                value="${sub.id}" id="perm-${sub.id}"
                ${selected.has(sub.id) ? "checked" : ""}>
              <label class="form-check-label" for="perm-${sub.id}">
                ${KajatacaApi.escapeHtml(KajatacaI18n.t(key, sub.name))}
              </label>
            </div>`;
          })
          .join("");
        return `<div class="mb-3">
          <strong>${KajatacaApi.escapeHtml(KajatacaI18n.t("module." + module.name.toLowerCase(), module.name))}</strong>
          <div class="d-flex flex-wrap gap-2 mt-1">${checkboxes}</div>
        </div>`;
      })
      .join("");
  }

  async function openPermissionManager(roleId) {
    currentRoleId = roleId;
    const role = roles.find((r) => r.id === roleId);
    const isRoot = role && role.name.toLowerCase() === "root";
    document.getElementById("permissionModalTitle").textContent =
      KajatacaI18n.t("roles.permissions") + " — " + role.name;

    const note = document.getElementById("rootPermissionNote");
    const saveBtn = document.getElementById("btnSavePermissions");
    if (isRoot) {
      note.classList.remove("d-none");
      saveBtn.disabled = true;
    } else {
      note.classList.add("d-none");
      saveBtn.disabled = false;
    }

    try {
      const res = await KajatacaApi.get(`/api/roles/${roleId}/permissions`);
      renderPermissionCheckboxes(new Set(res.data.sub_module_ids));
    } catch (err) {
      renderPermissionCheckboxes(new Set());
    }
    new bootstrap.Modal(document.getElementById("permissionModal")).show();
  }

  async function savePermissions() {
    if (!currentRoleId) return;
    const subModuleIds = Array.from(
      document.querySelectorAll(".perm-check:checked")
    ).map((el) => Number(el.value));
    try {
      await KajatacaApi.put(`/api/roles/${currentRoleId}/permissions`, {
        sub_module_ids: subModuleIds,
      });
      bootstrap.Modal.getInstance(document.getElementById("permissionModal")).hide();
      KajatacaApi.showToast(KajatacaI18n.t("roles.save"), "success");
    } catch (err) {}
  }

  function initRolesPage() {
    const tbody = document.getElementById("rolesTableBody");
    if (!tbody) return;

    loadCatalog().then(loadRoles);

    tbody.addEventListener("click", (event) => {
      const btn = event.target.closest(".btn-permissions");
      if (!btn) return;
      openPermissionManager(Number(btn.getAttribute("data-id")));
    });

    document
      .getElementById("btnSavePermissions")
      .addEventListener("click", savePermissions);
  }

  document.addEventListener("DOMContentLoaded", initRolesPage);
})();
