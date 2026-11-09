/**
 * theme.js — light/dark theme manager.
 *
 * Theme is persisted in localStorage under the `theme` key ('light' | 'dark').
 * Default follows the OS preference via prefers-color-scheme. The theme is
 * applied by setting data-bs-theme on the <html> element (Bootstrap 5.3 native
 * dark mode); the same attribute drives the custom design tokens in app.css.
 *
 * An inline script in the <head> of every template sets the initial attribute
 * before the body renders to avoid a flash of the wrong theme (FOUC). This
 * module wires the toggle button and keeps the icon/aria-label in sync.
 *
 * Storage access is guarded: if localStorage throws (private mode, disabled
 * storage), the theme still applies for the session and the toggle keeps
 * working — it just cannot persist.
 */

const KajatacaTheme = (() => {
  const STORAGE_KEY = "theme";
  const root = () => document.documentElement;

  /** Read the saved theme ('light' | 'dark' | null) — never throws. */
  function readSaved() {
    try {
      const t = localStorage.getItem(STORAGE_KEY);
      return t === "light" || t === "dark" ? t : null;
    } catch (err) {
      return null;
    }
  }

  /** Persist the theme choice — never throws. */
  function writeSaved(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (err) {
      // Storage unavailable — the session theme still applies.
    }
  }

  /** Resolve the current theme from the <html> attribute. */
  function currentTheme() {
    const el = root();
    return el && el.getAttribute("data-bs-theme") === "dark" ? "dark" : "light";
  }

  /** Apply a theme to the document and (optionally) persist it. */
  function setTheme(theme, persist = true) {
    root().setAttribute("data-bs-theme", theme);
    if (persist) writeSaved(theme);
    syncIcons();
  }

  /** Sync sun/moon icons, aria-label and title on every [data-theme-toggle]. */
  function syncIcons() {
    const dark = currentTheme() === "dark";
    const label =
      typeof KajatacaI18n !== "undefined"
        ? KajatacaI18n.t("theme.toggle")
        : "Toggle theme";
    document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
      const icon = btn.querySelector(".bi");
      if (icon) {
        icon.className = "bi " + (dark ? "bi-sun" : "bi-moon-stars");
      }
      btn.setAttribute("aria-label", label);
      btn.title = label;
    });
  }

  /** Toggle between light and dark. */
  function toggleTheme() {
    setTheme(currentTheme() === "dark" ? "light" : "dark");
  }

  /**
   * Initialize the theme attribute. Prefers the persisted choice; falls back
   * to the OS preference. Follows OS changes only while no explicit choice
   * has been saved by the user.
   */
  function initTheme() {
    const saved = readSaved();
    let theme = null;
    if (saved) {
      theme = saved;
    } else {
      theme =
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    }
    // Set the attribute directly (no persistence) — the head script already
    // applied the same value, this only guards against inline-script failures.
    root().setAttribute("data-bs-theme", theme);

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", (event) => {
        if (!readSaved()) {
          setTheme(event.matches ? "dark" : "light", false);
        }
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
      btn.addEventListener("click", toggleTheme);
    });
    syncIcons();
  });

  return { initTheme, toggleTheme, currentTheme, setTheme };
})();
