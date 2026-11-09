/**
 * movements.js — stock movements page.
 *
 * - Ingreso / Compra: POST /api/movements/purchase (stock in)
 * - Salida / Venta: POST /api/movements/sale (stock out, backend checks stock)
 * - Historial: GET /api/movements
 *
 * Product selects show the current stock for each active product.
 */

(function () {
  let products = [];

  function escape(value) {
    return KajatacaApi.escapeHtml(value);
  }

  function fmt(value, digits = 2) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "-";
    return n.toLocaleString(KajatacaI18n.currentLangCode(), {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  }

  function fmtDate(iso) {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString(KajatacaI18n.currentLangCode());
  }

  function typeBadge(movementType) {
    const cls =
      movementType === "in" ? "badge-type-in" : "badge-type-out";
    const label = KajatacaI18n.t(movementType === "in" ? "type.in" : "type.out");
    return `<span class="badge ${cls}">${label}</span>`;
  }

  function kindBadge(kind) {
    const cls =
      kind === "purchase"
        ? "badge-kind-purchase"
        : kind === "sale"
          ? "badge-kind-sale"
          : "badge-kind-adjustment";
    const label = KajatacaI18n.t("kind." + kind);
    return `<span class="badge ${cls}">${label}</span>`;
  }

  /** Option label like "La Polar — Stock: 10". */
  function productOptionLabel(product) {
    const stockLabel = KajatacaI18n.t("movements.stock");
    return `${product.name} — ${stockLabel}: ${product.stock}`;
  }

  function fillProductSelect(selectId, selectedId) {
    const select = document.getElementById(selectId);
    if (!select) return;
    const active = products.filter((p) => p.status);
    if (!active.length) {
      select.innerHTML = `<option value="">${escape(
        KajatacaI18n.t("movements.no_products")
      )}</option>`;
      select.disabled = true;
      return;
    }
    select.disabled = false;
    select.innerHTML =
      `<option value="">${escape(KajatacaI18n.t("movements.select_product"))}</option>` +
      active
        .map(
          (p) =>
            `<option value="${p.id}" ${p.id === selectedId ? "selected" : ""}>${escape(
              productOptionLabel(p)
            )}</option>`
        )
        .join("");
  }

  async function loadProducts() {
    try {
      const res = await KajatacaApi.get("/api/products");
      products = res.data;
    } catch (err) {
      products = [];
    }
    fillProductSelect("purchaseProduct");
    fillProductSelect("saleProduct");
  }

  function renderHistory(movements) {
    const tbody = document.getElementById("movementsTableBody");
    if (!tbody) return;

    if (!movements.length) {
      tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state">
        <i class="bi bi-inbox"></i>
        <div>${escape(KajatacaI18n.t("movements.no_history"))}</div>
      </div></td></tr>`;
      return;
    }

    tbody.innerHTML = movements
      .map(
        (m) => `<tr>
          <td class="text-nowrap">${escape(fmtDate(m.created_at))}</td>
          <td class="fw-semibold">${escape(m.product_name || "-")}</td>
          <td>${typeBadge(m.movement_type)}</td>
          <td>${kindBadge(m.kind)}</td>
          <td class="stock-badge">${m.quantity}</td>
          <td class="stock-badge">${fmt(m.unit_price)}</td>
          <td>${escape(m.client || m.supplier || "-")}</td>
          <td>${escape(m.user_nick || "-")}</td>
        </tr>`
      )
      .join("");
  }

  async function loadHistory() {
    try {
      const res = await KajatacaApi.get("/api/movements");
      renderHistory(res.data);
    } catch (err) {
      renderHistory([]);
    }
  }

  function productOf(selectId) {
    const select = document.getElementById(selectId);
    const id = Number(select.value);
    return products.find((p) => p.id === id);
  }

  function validateForm(prefix) {
    const product = productOf(`${prefix}Product`);
    const checks = [];
    if (!product) {
      checks.push([
        `${prefix}Product`,
        { valid: false, message: "error.select_product" },
      ]);
    }
    checks.push([
      `${prefix}Quantity`,
      KajatacaValidators.validateQuantity(
        document.getElementById(`${prefix}Quantity`).value
      ),
    ]);
    checks.push([
      `${prefix}UnitPrice`,
      KajatacaValidators.validateUnitPrice(
        document.getElementById(`${prefix}UnitPrice`).value || 0
      ),
    ]);
    let allValid = true;
    checks.forEach(([id, result]) => {
      KajatacaValidators.markField(document.getElementById(id), result);
      if (!result.valid) allValid = false;
    });
    return { valid: allValid, product };
  }

  function readForm(prefix) {
    return {
      product_id: productOf(`${prefix}Product`).id,
      quantity: Number(document.getElementById(`${prefix}Quantity`).value),
      unit_price: Number(
        document.getElementById(`${prefix}UnitPrice`).value || 0
      ),
      supplier: document.getElementById(`${prefix}Supplier`).value.trim(),
      client: document.getElementById(`${prefix}Client`).value.trim(),
      description: document.getElementById(`${prefix}Description`).value.trim(),
    };
  }

  function resetForm(prefix) {
    document.getElementById(`${prefix}Quantity`).value = "";
    document.getElementById(`${prefix}UnitPrice`).value = "";
    document.getElementById(`${prefix}Supplier`).value = "";
    document.getElementById(`${prefix}Client`).value = "";
    document.getElementById(`${prefix}Description`).value = "";
  }

  async function submitMovement(prefix, kind, successKey) {
    const { valid, product } = validateForm(prefix);
    if (!valid) {
      KajatacaApi.showToast(KajatacaI18n.t("error.validation"), "warning");
      return;
    }
    const payload = readForm(prefix);
    if (kind === "sale" && payload.quantity > product.stock) {
      KajatacaApi.showToast(KajatacaI18n.t("error.stock_insufficient"), "danger");
      return;
    }
    try {
      if (kind === "sale") {
        await KajatacaApi.post("/api/movements/sale", payload);
      } else {
        await KajatacaApi.post("/api/movements/purchase", payload);
      }
      KajatacaApi.showToast(KajatacaI18n.t(successKey), "success");
      resetForm(prefix);
      loadProducts();
      loadHistory();
    } catch (err) {
      // error toast already shown by api.js
    }
  }

  function initMovementsPage() {
    const purchaseForm = document.getElementById("purchaseForm");
    const saleForm = document.getElementById("saleForm");
    const historyBody = document.getElementById("movementsTableBody");
    if (!purchaseForm || !saleForm || !historyBody) return;

    loadProducts();
    loadHistory();

    purchaseForm.addEventListener("submit", (event) => {
      event.preventDefault();
      submitMovement("purchase", "purchase", "movements.purchase_success");
    });
    saleForm.addEventListener("submit", (event) => {
      event.preventDefault();
      submitMovement("sale", "sale", "movements.sale_success");
    });
  }

  document.addEventListener("DOMContentLoaded", initMovementsPage);
})();
