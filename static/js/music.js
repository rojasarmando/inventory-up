/**
 * music.js — music page: upload (multipart), list and delete songs.
 *
 * The upload is a raw multipart request (FormData) — the JSON wrapper in
 * api.js must not set a Content-Type for it, so this module issues its own
 * fetch and reuses the same toast/error conventions.
 */

(function () {
  let songs = [];

  function escape(value) {
    return KajatacaApi.escapeHtml(value);
  }

  function fmtDate(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString(KajatacaI18n.currentLangCode());
  }

  function confirmDelete(onConfirm) {
    const modalEl = document.getElementById("confirmModal");
    modalEl.querySelector(".modal-body").textContent = KajatacaI18n.t(
      "common.confirm_delete"
    );
    const okBtn = modalEl.querySelector("#confirmOk");
    const handler = () => {
      onConfirm();
      okBtn.removeEventListener("click", handler);
    };
    okBtn.addEventListener("click", handler);
    new bootstrap.Modal(modalEl).show();
  }

  function renderSongs() {
    const grid = document.getElementById("songsGrid");
    if (!grid) return;
    const auth = window.KajatacaAuth;
    const canManage = auth.can("music.manage");

    if (!songs.length) {
      grid.innerHTML = `<div class="col-12">
        <div class="card"><div class="empty-state">
          <i class="bi bi-music-note"></i>
          <div>${escape(KajatacaI18n.t("music.no_songs"))}</div>
        </div></div>
      </div>`;
      return;
    }

    grid.innerHTML = songs
      .map(
        (song) => `
        <div class="col-md-6">
          <div class="music-card">
            <div class="d-flex align-items-start justify-content-between mb-2">
              <div class="d-flex align-items-center gap-2">
                <i class="bi bi-music-note-beamed music-icon"></i>
                <div>
                  <div class="fw-semibold">${escape(song.title)}</div>
                  <small class="text-muted">${escape(fmtDate(song.created_at))}</small>
                </div>
              </div>
              ${
                canManage
                  ? `<button class="btn btn-sm btn-outline-danger btn-delete-song" data-id="${song.id}" title="${escape(
                      KajatacaI18n.t("common.delete")
                    )}">
                      <i class="bi bi-trash"></i>
                    </button>`
                  : ""
              }
            </div>
            <audio controls preload="none" src="${escape(song.url)}"></audio>
          </div>
        </div>`
      )
      .join("");
  }

  async function loadSongs() {
    try {
      const res = await KajatacaApi.get("/api/music");
      songs = res.data;
    } catch (err) {
      songs = [];
    }
    renderSongs();
  }

  async function uploadSong() {
    const title = document.getElementById("songTitle").value.trim();
    const fileInput = document.getElementById("songFile");

    const titleResult = title
      ? { valid: true, message: "" }
      : { valid: false, message: "error.invalid_title" };
    KajatacaValidators.markField(
      document.getElementById("songTitle"),
      titleResult
    );
    if (!titleResult.valid) {
      KajatacaApi.showToast(KajatacaI18n.t("error.invalid_title"), "warning");
      return;
    }
    if (!fileInput.files.length) {
      KajatacaApi.showToast(KajatacaI18n.t("music.choose_file"), "warning");
      fileInput.classList.add("is-invalid");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("file", fileInput.files[0]);

    const btn = document.getElementById("btnUploadSong");
    const btnLabel = btn.querySelector("span");
    const originalLabel = KajatacaI18n.t("music.upload");
    btn.disabled = true;
    btnLabel.textContent = KajatacaI18n.t("music.uploading");

    try {
      const response = await fetch("/api/music", {
        method: "POST",
        credentials: "same-origin",
        body: formData,
      });
      const body = await response.json();
      if (!response.ok || (body && body.ok === false)) {
        const detail = body && body.detail ? body.detail : "error.something_went_wrong";
        KajatacaApi.showToast(KajatacaI18n.t(detail), "danger");
        return;
      }
      KajatacaApi.showToast(KajatacaI18n.t("music.upload_success"), "success");
      document.getElementById("songTitle").value = "";
      fileInput.value = "";
      fileInput.classList.remove("is-invalid");
      loadSongs();
    } catch (err) {
      KajatacaApi.showToast(KajatacaI18n.t("error.network"), "danger");
    } finally {
      btn.disabled = false;
      btnLabel.textContent = originalLabel;
    }
  }

  function initMusicPage() {
    const uploadForm = document.getElementById("musicUploadForm");
    const grid = document.getElementById("songsGrid");
    if (!uploadForm || !grid) return;

    loadSongs();

    uploadForm.addEventListener("submit", (event) => {
      event.preventDefault();
      uploadSong();
    });

    grid.addEventListener("click", (event) => {
      const deleteBtn = event.target.closest(".btn-delete-song");
      if (!deleteBtn) return;
      const id = Number(deleteBtn.getAttribute("data-id"));
      const song = songs.find((s) => s.id === id);
      if (!song) return;
      confirmDelete(async () => {
        try {
          await KajatacaApi.del(`/api/music/${id}`);
          KajatacaApi.showToast(KajatacaI18n.t("music.delete_success"), "success");
          loadSongs();
        } catch (err) {
          // error toast already shown by api.js
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", initMusicPage);
})();
