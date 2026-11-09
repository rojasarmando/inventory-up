/**
 * menu.js — renders the top navbar from GET /api/menu.
 *
 * Menu is built from the backend, which already filters sub-modules by the
 * current user's permissions (Root sees everything).
 */

(function () {
  function renderMenu(items) {
    const container = document.getElementById("mainNav");
    if (!container) return;

    items.forEach((module) => {
      const item = document.createElement("li");
      item.className = "nav-item dropdown";

      const link = document.createElement("a");
      link.className = "nav-link dropdown-toggle";
      link.href = "#";
      link.setAttribute("data-bs-toggle", "dropdown");
      link.setAttribute("role", "button");
      link.setAttribute("aria-expanded", "false");
      link.textContent = KajatacaI18n.t("module." + module.name.toLowerCase());

      const menu = document.createElement("ul");
      menu.className = "dropdown-menu";

      module.sub_modules.forEach((sub) => {
        const subItem = document.createElement("li");
        const subLink = document.createElement("a");
        subLink.className = "dropdown-item";
        subLink.href = sub.url;
        subLink.textContent = KajatacaI18n.t("menu." + sub.key.replace(".", "_"));
        subItem.appendChild(subLink);
        menu.appendChild(subItem);
      });

      item.appendChild(link);
      item.appendChild(menu);
      container.appendChild(item);
    });
  }

  async function initMenu() {
    const container = document.getElementById("mainNav");
    if (!container) return;
    try {
      const res = await KajatacaApi.get("/api/menu");
      renderMenu(res.data);
    } catch (err) {
      // Unauthenticated or error — the session guard will redirect.
    }
  }

  document.addEventListener("DOMContentLoaded", initMenu);
})();
