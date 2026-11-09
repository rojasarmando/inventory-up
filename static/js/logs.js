/**
 * logs.js — audit trail page: table of log rows with translated event names.
 */

(function () {
  function formatDate(iso) {
    if (!iso) return "-";
    const date = new Date(iso);
    return date.toLocaleString();
  }

  function renderTable(rows) {
    const tbody = document.getElementById("logsTableBody");
    if (!tbody) return;
    tbody.innerHTML = rows
      .map(
        (row) => `<tr>
          <td class="text-nowrap">${formatDate(row.date)}</td>
          <td>${KajatacaApi.escapeHtml(row.user_nick || "-")}</td>
          <td>${KajatacaApi.escapeHtml(KajatacaI18n.t("event." + row.event, row.event))}</td>
          <td>${KajatacaApi.escapeHtml(row.description)}</td>
        </tr>`
      )
      .join("");
  }

  async function loadLogs() {
    try {
      const res = await KajatacaApi.get("/api/logs");
      renderTable(res.data);
    } catch (err) {
      renderTable([]);
    }
  }

  function initLogsPage() {
    if (!document.getElementById("logsTableBody")) return;
    loadLogs();
  }

  document.addEventListener("DOMContentLoaded", initLogsPage);
})();
