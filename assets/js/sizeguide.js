/* ==========================================================================
   NOF — Size guide modal (shared by the LP and the team store)
   [data-size-guide] を持つ要素をクリックすると開きます。
   ========================================================================== */
(function () {
  "use strict";

  var modal = null;
  var lastFocus = null;
  var prevOverflow = "";
  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])';

  function sizes() {
    return (window.NOF_CONFIG && window.NOF_CONFIG.product && window.NOF_CONFIG.product.sizes) || [];
  }

  function build() {
    var list = sizes();
    var el = document.createElement("div");
    el.className = "sg";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.setAttribute("aria-labelledby", "sgTitle");
    el.hidden = true;

    el.innerHTML =
      '<div class="sg__backdrop" data-sg-close></div>' +
      '<div class="sg__panel" tabindex="-1">' +
        '<div class="sg__head">' +
          '<div>' +
            '<p class="kicker">SIZE GUIDE</p>' +
            '<h2 class="display display--s" id="sgTitle">Size.</h2>' +
          '</div>' +
          '<button type="button" class="sg__close" data-sg-close aria-label="閉じる">CLOSE ✕</button>' +
        '</div>' +
        '<div class="sg__grid">' +
          list.map(function (s) {
            return '<figure class="sg__item">' +
              '<div class="fig"><img src="' + s.image + '" alt="' + s.label + 'サイズ 縦' + s.height + 'cm 横' + s.width + 'cm" width="1024" height="1024" loading="lazy"></div>' +
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
    prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    setMainInert(true);
    requestAnimationFrame(function () { modal.classList.add("is-open"); });
    var btn = modal.querySelector(".sg__close");
    if (btn) btn.focus();
    document.addEventListener("keydown", onKey, true);
  }

  function close() {
    if (!modal) return;
    modal.classList.remove("is-open");
    document.body.style.overflow = prevOverflow;
    setMainInert(false);
    document.removeEventListener("keydown", onKey, true);
    // フォーカスを戻してからパネルを隠す（順序が逆だと戻し先が消えていることがある）
    if (lastFocus && lastFocus.focus && document.contains(lastFocus)) {
      lastFocus.focus({ preventScroll: true });
    }
    setTimeout(function () { if (modal) modal.hidden = true; }, 260);
  }

  /** 背後のページを支援技術・Tab から切り離す */
  function setMainInert(on) {
    var main = document.getElementById("main") || document.querySelector("main");
    if (!main) return;
    if (on) { main.setAttribute("inert", ""); main.setAttribute("aria-hidden", "true"); }
    else    { main.removeAttribute("inert"); main.removeAttribute("aria-hidden"); }
  }

  function onKey(e) {
    if (e.key === "Escape") { close(); return; }
    if (e.key !== "Tab" || !modal || modal.hidden) return;
    // Tab をパネル内に閉じ込める
    var panel = modal.querySelector(".sg__panel");
    var items = Array.prototype.filter.call(panel.querySelectorAll(FOCUSABLE), function (el) {
      return el.offsetParent !== null || el === document.activeElement;
    });
    if (!items.length) { e.preventDefault(); panel.focus(); return; }
    var first = items[0], last = items[items.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  }

  document.addEventListener("click", function (e) {
    var trigger = e.target.closest("[data-size-guide]");
    if (trigger) { e.preventDefault(); open(); }
  });

  window.NOFSizeGuide = { open: open, close: close };
})();
