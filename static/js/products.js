/**
 * products.js — products page: table + create/edit modal + validators.
 *
 * - New product: POST /api/products
 * - Edit product: PUT /api/products/{id} (stock is NOT editable on edit)
 * - Toggle status: PATCH /api/products/{id}/status
 * - Delete: DELETE /api/products/{id} (soft delete, disabled when inactive)
 */

(function () {
  const LOW_STOCK_THRESHOLD = 5;

  let products = [];
  let companies = [];

  function fmt(value, digits = 2) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "-";
    return n.toLocaleString(KajatacaI18n.currentLangCode(), {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  }

  function escape(value) {
    return KajatacaApi.escapeHtml(value);
  }

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

  function stockBadge(stock) {
    const cls = stock <= LOW_STOCK_THRESHOLD ? "text-bg-danger" : "text-bg-success";
    return `<span class="badge ${cls} stock-badge">${stock}</span>`;
  }

  function renderTable() {
    const tbody = document.getElementById("productsTableBody");
    if (!tbody) return;
    const auth = window.KajatacaAuth;
    const canEdit = auth.can("products.edit");
    const canDelete = auth.can("products.delete");

    if (!products.length) {
      tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state">
        <i class="bi bi-inbox"></i>
        <div>${escape(KajatacaI18n.t("products.empty"))}</div>
      </div></td></tr>`;
      return;
    }

    tbody.innerHTML = products
      .map((p) => {
        const actions = [];
        if (canEdit) {
          actions.push(
            `<button class="btn btn-sm btn-outline-primary btn-edit" data-id="${p.id}" title="${escape(KajatacaI18n.t("common.edit"))}">
              <i class="bi bi-pencil"></i>
            </button>`
          );
          actions.push(
            `<button class="btn btn-sm btn-outline-warning btn-toggle" data-id="${p.id}" title="${escape(KajatacaI18n.t("products.toggle_status"))}">
              <i class="bi bi-toggle-on"></i>
            </button>`
          );
        }
        if (canDelete) {
          actions.push(
            `<button class="btn btn-sm btn-outline-danger btn-delete" data-id="${p.id}" ${p.status ? "" : "disabled"} title="${escape(KajatacaI18n.t("common.delete"))}">
              <i class="bi bi-trash"></i>
            </button>`
          );
        }
        return `<tr>
          <td class="fw-semibold">${escape(p.name)}</td>
          <td>${escape(p.company_name || "-")}</td>
          <td class="stock-badge">${fmt(p.price)}</td>
          <td>${fmt(p.tax_rate)}%</td>
          <td>${stockBadge(p.stock)}</td>
          <td>${statusBadge(p.status)}</td>
          <td class="text-nowrap">${actions.join(" ")}</td>
        </tr>`;
      })
      .join("");
  }

  async function loadProducts() {
    try {
      const res = await KajatacaApi.get("/api/products");
      products = res.data;
    } catch (err) {
      products = [];
    }
    renderTable();
  }

  async function loadCompanies() {
    try {
      const res = await KajatacaApi.get("/api/companies");
      companies = res.data.filter((c) => c.status);
    } catch (err) {
      companies = [];
    }
  }

  function fillCompanySelect(selectedId) {
    const select = document.getElementById("productCompany");
    if (!select) return;
    select.innerHTML =
      `<option value="">${KajatacaI18n.t("common.all")}</option>` +
      companies
        .map(
          (c) =>
            `<option value="${c.id}" ${c.id === selectedId ? "selected" : ""}>${escape(c.name)}</option>`
        )
        .join("");
  }

  function openProductModal(product) {
    document.getElementById("productModalTitle").textContent = product
      ? KajatacaI18n.t("products.edit")
      : KajatacaI18n.t("products.add");
    document.getElementById("productId").value = product ? product.id : "";
    document.getElementById("productName").value = product ? product.name : "";
    document.getElementById("productDescription").value = product
      ? product.description || ""
      : "";
    fillCompanySelect(product ? product.company_id : null);
    document.getElementById("productPrice").value = product ? product.price : "";
    document.getElementById("productTaxRate").value = product ? product.tax_rate : "";

    const stockInput = document.getElementById("productStock");
    const stockHint = document.getElementById("stockEditHint");
    if (product) {
      // Stock is owned by movements — read-only on edit.
      stockInput.value = product.stock;
      stockInput.disabled = true;
      stockInput.classList.remove("is-invalid", "is-valid");
      if (stockHint) stockHint.classList.remove("d-none");
    } else {
      stockInput.value = "";
      stockInput.disabled = false;
      if (stockHint) stockHint.classList.add("d-none");
    }

    new bootstrap.Modal(document.getElementById("productModal")).show();
  }

  function validateProductForm(data, isEdit) {
    const checks = [
      ["productName", KajatacaValidators.validateName(data.name)],
      ["productPrice", KajatacaValidators.validatePrice(data.price)],
      ["productTaxRate", KajatacaValidators.validateTaxRate(data.tax_rate)],
    ];
    if (!isEdit) {
      checks.push(["productStock", KajatacaValidators.validateStock(data.stock)]);
    }
    if (!data.company_id) {
      checks.push([
        "productCompany",
        { valid: false, message: "error.select_product" },
      ]);
    }
    let allValid = true;
    checks.forEach(([id, result]) => {
      const el = document.getElementById(id);
      if (el) KajatacaValidators.markField(el, result);
      if (!result.valid) allValid = false;
    });
    return allValid;
  }

  async function submitProductForm() {
    const id = document.getElementById("productId").value;
    const data = {
      name: document.getElementById("productName").value.trim(),
      description: document.getElementById("productDescription").value.trim(),
      price: Number(document.getElementById("productPrice").value),
      tax_rate: Number(document.getElementById("productTaxRate").value),
      stock: Number(document.getElementById("productStock").value || 0),
      company_id: Number(document.getElementById("productCompany").value),
    };
    if (!validateProductForm(data, Boolean(id))) {
      KajatacaApi.showToast(KajatacaI18n.t("error.validation"), "warning");
      return;
    }
    try {
      if (id) {
        await KajatacaApi.put(`/api/products/${id}`, data);
      } else {
        await KajatacaApi.post("/api/products", data);
      }
      bootstrap.Modal.getInstance(document.getElementById("productModal")).hide();
      loadProducts();
    } catch (err) {
      // error toast already shown by api.js
    }
  }

  function initProductsPage() {
    const tbody = document.getElementById("productsTableBody");
    if (!tbody) return;

    loadProducts();
    loadCompanies().then(() => fillCompanySelect());

    document
      .getElementById("btnAddProduct")
      .addEventListener("click", () => openProductModal(null));
    document
      .getElementById("btnSaveProduct")
      .addEventListener("click", submitProductForm);

    tbody.addEventListener("click", (event) => {
      const editBtn = event.target.closest(".btn-edit");
      const toggleBtn = event.target.closest(".btn-toggle");
      const deleteBtn = event.target.closest(".btn-delete");
      const button = editBtn || toggleBtn || deleteBtn;
      if (!button) return;
      const id = Number(button.getAttribute("data-id"));
      const product = products.find((p) => p.id === id);
      if (!product) return;

      if (editBtn) {
        openProductModal(product);
      } else if (toggleBtn) {
        confirmAction(KajatacaI18n.t("common.confirm_status"), async () => {
          try {
            await KajatacaApi.patch(`/api/products/${id}/status`, {});
            loadProducts();
          } catch (err) {}
        });
      } else if (deleteBtn) {
        confirmAction(KajatacaI18n.t("common.confirm_delete"), async () => {
          try {
            await KajatacaApi.del(`/api/products/${id}`);
            loadProducts();
          } catch (err) {}
        });
      }
    });
  }

  document.addEventListener("DOMContentLoaded", initProductsPage);
})();
