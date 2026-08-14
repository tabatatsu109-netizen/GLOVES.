/* ==========================================================================
   NOF — Landing page behaviour
   ========================================================================== */
(function () {
  "use strict";

  var header = document.getElementById("siteHeader");

  /* -------------------------------------------------- SIZE cards (05) --- */
  function renderSizes() {
    var host = document.getElementById("sizes");
    if (!host) return;
    var sizes = (NOF.config.product && NOF.config.product.sizes) || [];

    host.innerHTML = sizes.map(function (s, i) {
      return '' +
        '<article class="size-card reveal" style="--d:' + (i * 90) + 'ms">' +
          '<div class="size-card__head">' +
            '<span class="size-card__id">' + s.label + '</span>' +
            '<span class="size-card__dim">' +
              '<strong>' + s.height + ' × ' + s.width + '<span style="font-size:.6em"> cm</span></strong>' +
              '<span>縦 × 横</span>' +
            '</span>' +
          '</div>' +
          '<div class="fig fig--zoom" style="--px:50%; --py:50%; --z:1.02">' +
            '<img src="' + s.image + '" alt="' + s.label + 'サイズのフィールドグローブ"' +
            ' width="1024" height="1024" loading="lazy" decoding="async">' +
          '</div>' +
          '<p class="note">' + (s.hint || "") + '</p>' +
        '</article>';
    }).join("");
  }

  /* ------------------------------------------------- Demo team links --- */
  function renderTeamLinks() {
    var host = document.getElementById("teamLinks");
    if (!host) return;
    host.innerHTML = NOF.listTeams().map(function (t) {
      return '<li><a href="' + NOF.teamUrl(t.slug) + '">' +
        NOF.escapeHtml(t.teamName) + '<i>/team/' + t.slug + '</i></a></li>';
    }).join("");
  }

  /* -------------------------------------------------- Smooth anchors --- */
  function initAnchors() {
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute("href");
      if (id === "#" || id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - 40;
      window.scrollTo({ top: top, behavior: "smooth" });
      history.replaceState(null, "", id);
    });
  }

  /* ------------------------------------------------------------ init --- */
  renderSizes();
  renderTeamLinks();
  NOF.normalizeTeamLinks(document);
  NOF.initHeader(header);
  NOF.initReveal(document);
  initAnchors();
})();
