/**
 * dashboard.js — home page (dashboard).
 *
 * Fetches GET /api/dashboard and renders:
 *  - four stat cards (products, low stock, movements today, sales today)
 *  - a low stock table linking to /products
 *  - a latest movements table linking to /movements
 */

(function () {
  const LOW_STOCK_THRESHOLD = 5;

  /** Format a number with the active locale. */
  function fmt(value, digits = 2) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "-";
    return n.toLocaleString(KajatacaI18n.currentLangCode(), {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    });
  }

  /** Format an ISO date string for the active locale. */
  function fmtDate(iso) {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleString(KajatacaI18n.currentLangCode());
  }

  function escape(value) {
    return KajatacaApi.escapeHtml(value);
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

  function renderStatCards(data) {
    const ids = {
      statProducts: data.products_count,
      statLowStock: data.low_stock_count,
      statMovementsToday: data.movements_today,
      statSalesToday: data.sales_today,
    };
    Object.entries(ids).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el) el.textContent = fmt(value, 0);
    });
  }

  function renderLowStock(products) {
    const tbody = document.getElementById("lowStockBody");
    if (!tbody) return;

    if (!products.length) {
      tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state">
        <i class="bi bi-emoji-smile"></i>
        <div>${escape(KajatacaI18n.t("dashboard.no_low_stock"))}</div>
      </div></td></tr>`;
      return;
    }

    tbody.innerHTML = products
      .map(
        (p) => `<tr>
          <td><a class="row-link fw-semibold" href="/products">${escape(p.name)}</a></td>
          <td>${escape(p.company_name || "-")}</td>
          <td>
            <span class="badge ${p.stock <= LOW_STOCK_THRESHOLD ? "text-bg-danger" : "text-bg-warning"} stock-badge">
              ${p.stock}
            </span>
          </td>
          <td>${fmt(p.price)}</td>
        </tr>`
      )
      .join("");
  }

  function renderLatestMovements(movements) {
    const tbody = document.getElementById("latestMovementsBody");
    if (!tbody) return;

    if (!movements.length) {
      tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state">
        <i class="bi bi-inbox"></i>
        <div>${escape(KajatacaI18n.t("dashboard.no_movements"))}</div>
      </div></td></tr>`;
      return;
    }

    tbody.innerHTML = movements
      .map(
        (m) => `<tr>
          <td class="text-nowrap">${escape(fmtDate(m.created_at))}</td>
          <td><a class="row-link" href="/movements">${escape(m.product_name || "-")}</a></td>
          <td>${typeBadge(m.movement_type)}</td>
          <td>${kindBadge(m.kind)}</td>
          <td class="stock-badge">${m.quantity}</td>
          <td>${escape(m.user_nick || "-")}</td>
        </tr>`
      )
      .join("");
  }

  async function loadDashboard() {
    try {
      const res = await KajatacaApi.get("/api/dashboard");
      const data = res.data;
      renderStatCards(data);
      renderLowStock(data.low_stock || []);
      renderLatestMovements(data.latest_movements || []);
    } catch (err) {
      renderLowStock([]);
      renderLatestMovements([]);
    }
  }

  document.addEventListener("DOMContentLoaded", loadDashboard);
})();
