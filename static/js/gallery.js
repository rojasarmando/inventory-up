/**
 * gallery.js — image gallery page.
 *
 * Static image cards rendered from a known list of files in static/images/.
 * No backend endpoint is used (images are served by the /static mount).
 */

(function () {
  // Known files present in static/images/ (logo.gif and icono.ico are
  // deliberately excluded: dated logo / favicon, not gallery material).
  const IMAGES = [
    { src: "/static/images/kajataca.jpg", captionKey: "gallery.kajataca", alt: "Kajataca" },
    { src: "/static/images/kajataca2.jpg", captionKey: "gallery.kajataca2", alt: "Kajataca 2" },
    { src: "/static/images/negocio.jpeg", captionKey: "gallery.negocio", alt: "Negocio" },
    { src: "/static/images/banner.jpeg", captionKey: "gallery.banner", alt: "Banner" },
    { src: "/static/images/Anuncio.png", captionKey: "gallery.anuncio", alt: "Anuncio" },
    { src: "/static/images/background.jpg", captionKey: "gallery.background", alt: "Background" },
  ];

  function renderGallery() {
    const grid = document.getElementById("galleryGrid");
    if (!grid) return;

    grid.innerHTML = IMAGES.map(
      (img) => `
        <div class="col-md-6 col-lg-4">
          <figure class="gallery mb-0">
            <img src="${img.src}" alt="${img.alt}" loading="lazy">
            <figcaption class="gallery-caption">
              <i class="bi bi-image text-accent me-2"></i>
              ${KajatacaI18n.t(img.captionKey)}
            </figcaption>
          </figure>
        </div>`
    ).join("");
  }

  document.addEventListener("DOMContentLoaded", renderGallery);
})();
