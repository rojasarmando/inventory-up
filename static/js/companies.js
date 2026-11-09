/**
 * companies.js — companies page (empresas): table + modal form + validators.
 */

(function () {
  let companies = [];

  function confirmAction(message, onConfirm) {
    const modalEl = document.getElementById("confirmModal");
    modalEl.querySelector(".modal-body").textContent = message;
    const okBtn = modalEl.querySelector("#confirmOk");
    const handler = () => {
      onConfirm();
      okBtn.removeEventListener("click", handler);
    };
    okBtn.addEventListener("click", handler);
    new bootstrap.Modal(modalEl).show();
  }

  function statusBadge(active) {
    return active
      ? `<span class="badge text-bg-success">${KajatacaI18n.t("status.active")}</span>`
      : `<span class="badge text-bg-secondary">${KajatacaI18n.t("status.inactive")}</span>`;
  }

  function renderTable() {
    const tbody = document.getElementById("companiesTableBody");
    if (!tbody) return;
    const auth = window.KajatacaAuth;
    const canEdit = auth.can("companies.edit");
    const canDelete = auth.can("companies.delete");
    const canToggle = auth.can("companies.toggle_status");

    tbody.innerHTML = companies
      .map((c) => {
        const actions = [];
        if (canEdit) {
          actions.push(
            `<button class="btn btn-sm btn-outline-primary btn-edit" data-id="${c.id}">${KajatacaI18n.t("common.edit")}</button>`
          );
        }
        if (canToggle) {
          actions.push(
            `<button class="btn btn-sm btn-outline-warning btn-toggle" data-id="${c.id}">${KajatacaI18n.t("common.status")}</button>`
          );
        }
        if (canDelete) {
          actions.push(
            `<button class="btn btn-sm btn-outline-danger btn-delete" data-id="${c.id}">${KajatacaI18n.t("common.delete")}</button>`
          );
        }
        return `<tr>
          <td>${c.id}</td>
          <td>${KajatacaApi.escapeHtml(c.rif)}</td>
          <td>${KajatacaApi.escapeHtml(c.name)}</td>
          <td>${KajatacaApi.escapeHtml(c.description || "-")}</td>
          <td>${statusBadge(c.status)}</td>
          <td class="text-nowrap">${actions.join(" ")}</td>
        </tr>`;
      })
      .join("");
  }

  async function loadCompanies() {
    try {
      const res = await KajatacaApi.get("/api/companies");
      companies = res.data;
      renderTable();
    } catch (err) {
      companies = [];
      renderTable();
    }
  }

  function openCompanyModal(company) {
    document.getElementById("companyModalTitle").textContent = company
      ? KajatacaI18n.t("companies.edit")
      : KajatacaI18n.t("companies.add");
    document.getElementById("companyId").value = company ? company.id : "";
    document.getElementById("companyRif").value = company ? company.rif : "";
    document.getElementById("companyName").value = company ? company.name : "";
    document.getElementById("companyDescription").value = company
      ? company.description || ""
      : "";
    new bootstrap.Modal(document.getElementById("companyModal")).show();
  }

  function validateCompanyForm(data) {
    const checks = [
      ["companyRif", KajatacaValidators.validateRif(data.rif)],
      ["companyName", KajatacaValidators.validateName(data.name)],
    ];
    let allValid = true;
    checks.forEach(([id, result]) => {
      KajatacaValidators.markField(document.getElementById(id), result);
      if (!result.valid) allValid = false;
    });
    return allValid;
  }

  async function submitCompanyForm() {
    const id = document.getElementById("companyId").value;
    const data = {
      rif: document.getElementById("companyRif").value.trim(),
      name: document.getElementById("companyName").value.trim(),
      description: document.getElementById("companyDescription").value.trim(),
    };
    if (!validateCompanyForm(data)) {
      KajatacaApi.showToast(KajatacaI18n.t("error.validation"), "warning");
      return;
    }
    try {
      if (id) {
        await KajatacaApi.put(`/api/companies/${id}`, data);
      } else {
        await KajatacaApi.post("/api/companies", data);
      }
      bootstrap.Modal.getInstance(document.getElementById("companyModal")).hide();
      loadCompanies();
    } catch (err) {}
  }

  function initCompaniesPage() {
    const tbody = document.getElementById("companiesTableBody");
    if (!tbody) return;

    loadCompanies();

    document
      .getElementById("btnAddCompany")
      .addEventListener("click", () => openCompanyModal(null));
    document
      .getElementById("btnSaveCompany")
      .addEventListener("click", submitCompanyForm);

    tbody.addEventListener("click", (event) => {
      const editBtn = event.target.closest(".btn-edit");
      const deleteBtn = event.target.closest(".btn-delete");
      const toggleBtn = event.target.closest(".btn-toggle");
      const id = Number(
        (editBtn || deleteBtn || toggleBtn || {}).getAttribute("data-id")
      );
      const company = companies.find((c) => c.id === id);
      if (!company) return;

      if (editBtn) {
        openCompanyModal(company);
      } else if (toggleBtn) {
        confirmAction(KajatacaI18n.t("common.confirm_status"), async () => {
          try {
            await KajatacaApi.patch(`/api/companies/${id}/status`, {});
            loadCompanies();
          } catch (err) {}
        });
      } else if (deleteBtn) {
        confirmAction(KajatacaI18n.t("common.confirm_delete"), async () => {
          try {
            await KajatacaApi.del(`/api/companies/${id}`);
            loadCompanies();
          } catch (err) {}
        });
      }
    });
  }

  document.addEventListener("DOMContentLoaded", initCompaniesPage);
})();
