/**
 * distributors.js — distributors page (distribuidoras): table + modal form.
 */

(function () {
  let distributors = [];
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

  async function loadCompanies() {
    try {
      const res = await KajatacaApi.get("/api/companies");
      companies = res.data;
      const filter = document.getElementById("filterCompany");
      filter.innerHTML =
        `<option value="">${KajatacaI18n.t("distributors.filter_company")} — ${KajatacaI18n.t("common.all")}</option>` +
        companies
          .map((c) => `<option value="${c.id}">${KajatacaApi.escapeHtml(c.name)}</option>`)
          .join("");
      fillCompanySelect(document.getElementById("distributorCompany"), null);
    } catch (err) {
      companies = [];
    }
  }

  function fillCompanySelect(select, selectedId) {
    if (!select) return;
    select.innerHTML = companies
      .map(
        (c) =>
          `<option value="${c.id}" ${c.id === selectedId ? "selected" : ""}>${KajatacaApi.escapeHtml(c.name)}</option>`
      )
      .join("");
  }

  function renderTable() {
    const tbody = document.getElementById("distributorsTableBody");
    if (!tbody) return;
    const auth = window.KajatacaAuth;
    const canEdit = auth.can("distributors.edit");
    const canDelete = auth.can("distributors.delete");
    const canToggle = auth.can("distributors.toggle_status");

    tbody.innerHTML = distributors
      .map((d) => {
        const actions = [];
        if (canEdit) {
          actions.push(
            `<button class="btn btn-sm btn-outline-primary btn-edit" data-id="${d.id}">${KajatacaI18n.t("common.edit")}</button>`
          );
        }
        if (canToggle) {
          actions.push(
            `<button class="btn btn-sm btn-outline-warning btn-toggle" data-id="${d.id}">${KajatacaI18n.t("common.status")}</button>`
          );
        }
        if (canDelete) {
          actions.push(
            `<button class="btn btn-sm btn-outline-danger btn-delete" data-id="${d.id}">${KajatacaI18n.t("common.delete")}</button>`
          );
        }
        return `<tr>
          <td>${d.id}</td>
          <td>${KajatacaApi.escapeHtml(d.name)}</td>
          <td>${KajatacaApi.escapeHtml(d.phone)}</td>
          <td>${KajatacaApi.escapeHtml(d.contact)}</td>
          <td>${KajatacaApi.escapeHtml(d.company_name || "-")}</td>
          <td>${statusBadge(d.status)}</td>
          <td class="text-nowrap">${actions.join(" ")}</td>
        </tr>`;
      })
      .join("");
  }

  async function loadDistributors() {
    const companyId = document.getElementById("filterCompany").value;
    try {
      const res = await KajatacaApi.get("/api/distributors", {
        company_id: companyId,
      });
      distributors = res.data;
      renderTable();
    } catch (err) {
      distributors = [];
      renderTable();
    }
  }

  function openDistributorModal(distributor) {
    document.getElementById("distributorModalTitle").textContent = distributor
      ? KajatacaI18n.t("distributors.edit")
      : KajatacaI18n.t("distributors.add");
    document.getElementById("distributorId").value = distributor ? distributor.id : "";
    document.getElementById("distributorName").value = distributor
      ? distributor.name
      : "";
    document.getElementById("distributorPhone").value = distributor
      ? distributor.phone
      : "";
    document.getElementById("distributorContact").value = distributor
      ? distributor.contact
      : "";
    fillCompanySelect(
      document.getElementById("distributorCompany"),
      distributor ? distributor.company_id : null
    );
    new bootstrap.Modal(document.getElementById("distributorModal")).show();
  }

  function validateDistributorForm(data) {
    const checks = [
      ["distributorName", KajatacaValidators.validateName(data.name)],
      ["distributorPhone", KajatacaValidators.validatePhone(data.phone)],
      ["distributorContact", KajatacaValidators.validateName(data.contact)],
    ];
    let allValid = true;
    checks.forEach(([id, result]) => {
      KajatacaValidators.markField(document.getElementById(id), result);
      if (!result.valid) allValid = false;
    });
    return allValid;
  }

  async function submitDistributorForm() {
    const id = document.getElementById("distributorId").value;
    const data = {
      name: document.getElementById("distributorName").value.trim(),
      phone: document.getElementById("distributorPhone").value.trim(),
      contact: document.getElementById("distributorContact").value.trim(),
      company_id: parseInt(document.getElementById("distributorCompany").value, 10),
    };
    if (!validateDistributorForm(data)) {
      KajatacaApi.showToast(KajatacaI18n.t("error.validation"), "warning");
      return;
    }
    try {
      if (id) {
        await KajatacaApi.put(`/api/distributors/${id}`, data);
      } else {
        await KajatacaApi.post("/api/distributors", data);
      }
      bootstrap.Modal.getInstance(document.getElementById("distributorModal")).hide();
      loadDistributors();
    } catch (err) {}
  }

  function initDistributorsPage() {
    const tbody = document.getElementById("distributorsTableBody");
    if (!tbody) return;

    loadCompanies().then(loadDistributors);

    document
      .getElementById("filterCompany")
      .addEventListener("change", loadDistributors);
    document
      .getElementById("btnAddDistributor")
      .addEventListener("click", () => openDistributorModal(null));
    document
      .getElementById("btnSaveDistributor")
      .addEventListener("click", submitDistributorForm);

    tbody.addEventListener("click", (event) => {
      const editBtn = event.target.closest(".btn-edit");
      const deleteBtn = event.target.closest(".btn-delete");
      const toggleBtn = event.target.closest(".btn-toggle");
      const id = Number(
        (editBtn || deleteBtn || toggleBtn || {}).getAttribute("data-id")
      );
      const distributor = distributors.find((d) => d.id === id);
      if (!distributor) return;

      if (editBtn) {
        openDistributorModal(distributor);
      } else if (toggleBtn) {
        confirmAction(KajatacaI18n.t("common.confirm_status"), async () => {
          try {
            await KajatacaApi.patch(`/api/distributors/${id}/status`, {});
            loadDistributors();
          } catch (err) {}
        });
      } else if (deleteBtn) {
        confirmAction(KajatacaI18n.t("common.confirm_delete"), async () => {
          try {
            await KajatacaApi.del(`/api/distributors/${id}`);
            loadDistributors();
          } catch (err) {}
        });
      }
    });
  }

  document.addEventListener("DOMContentLoaded", initDistributorsPage);
})();
