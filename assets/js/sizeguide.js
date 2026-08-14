/* ==========================================================================
   NOF — Size guide modal (shared by the LP and the team store)
   [data-size-guide] を持つ要素をクリックすると開きます。
   ========================================================================== */
(function () {
  "use strict";

  var modal = null;
  var lastFocus = null;

  function sizes() {
    return (window.NOF_CONFIG && window.NOF_CONFIG.product && window.NOF_CONFIG.product.sizes) || [];
  }

  function build() {
    var list = sizes();
    var el = document.createElement("div");
    el.className = "sg";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-label", "サイズ表");
    el.hidden = true;

    el.innerHTML =
      '<div class="sg__backdrop" data-sg-close></div>' +
      '<div class="sg__panel">' +
        '<div class="sg__head">' +
          '<div>' +
            '<p class="kicker">SIZE GUIDE</p>' +
            '<h2 class="display display--s">Size.</h2>' +
          '</div>' +
          '<button type="button" class="sg__close" data-sg-close aria-label="閉じる">CLOSE ✕</button>' +
        '</div>' +
        '<div class="sg__grid">' +
          list.map(function (s) {
            return '<figure class="sg__item">' +
              '<div class="fig"><img src="' + s.image + '" alt="' + s.label + 'サイズ 縦' + s.height + 'cm 横' + s.width + 'cm" loading="lazy"></div>' +
              '<figcaption>' +
                '<span class="sg__id">' + s.label + '</span>' +
                '<span class="sg__dim">縦 ' + s.height + 'cm ／ 横 ' + s.width + 'cm</span>' +
                '<span class="sg__hint">' + (s.hint || "") + '</span>' +
              '</figcaption>' +
            '</figure>';
          }).join("") +
        '</div>' +
        '<p class="note sg__note">※ 平置きでの実寸です。測り方により多少の誤差が生じる場合があります。<br>※ 迷った場合は、普段のグローブより少し大きめをおすすめします。</p>' +
      '</div>';

    document.body.appendChild(el);

    el.addEventListener("click", function (e) {
      if (e.target.closest("[data-sg-close]")) close();
    });
    return el;
  }

  function open() {
    if (!modal) modal = build();
    lastFocus = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(function () { modal.classList.add("is-open"); });
    var btn = modal.querySelector(".sg__close");
    if (btn) btn.focus();
    document.addEventListener("keydown", onKey);
  }

  function close() {
    if (!modal) return;
    modal.classList.remove("is-open");
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onKey);
    setTimeout(function () { if (modal) modal.hidden = true; }, 260);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function onKey(e) { if (e.key === "Escape") close(); }

  document.addEventListener("click", function (e) {
    var trigger = e.target.closest("[data-size-guide]");
    if (trigger) { e.preventDefault(); open(); }
  });

  window.NOFSizeGuide = { open: open, close: close };
})();
