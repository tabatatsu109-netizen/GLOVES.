/* ==========================================================================
   NOF — Core helpers (shared by the LP and the team store)
   ========================================================================== */
(function (global) {
  "use strict";

  var CONFIG = global.NOF_CONFIG || {};
  var TEAMS = global.NOF_TEAMS || {};

  /* ---------------------------------------------------------------- format */
  function yen(n) {
    return "¥" + Number(n || 0).toLocaleString("ja-JP");
  }

  function pad(n, len) {
    return String(n).padStart(len, "0");
  }

  /* ------------------------------------------------------------------ team */

  /**
   * URL から slug を解決する。対応する形式:
   *   /team/grande        （本番: rewrite 設定あり）
   *   team.html?team=grande
   *   team.html#/grande
   */
  function resolveSlug() {
    var m = location.pathname.match(/\/team\/([^\/?#]+)\/?$/i);
    if (m) return decodeURIComponent(m[1]).toLowerCase();

    var q = new URLSearchParams(location.search);
    var qs = q.get("team") || q.get("t");
    if (qs) return qs.toLowerCase();

    var h = location.hash.match(/^#\/?([\w-]+)/);
    if (h) return h[1].toLowerCase();

    return null;
  }

  /**
   * チーム設定の取得。将来 API 化する場合はここだけ差し替えれば済みます。
   */
  function getTeam(slug) {
    if (!slug) return null;
    var t = TEAMS[slug] || null;
    if (!t) return null;
    // 卸価格が未設定なら共通の既定値を使う
    if (t.wholesalePrice == null) {
      t.wholesalePrice = (CONFIG.product && CONFIG.product.defaultWholesalePrice) || 0;
    }
    return t;
  }

  function listTeams() {
    return Object.keys(TEAMS).map(function (k) { return TEAMS[k]; });
  }

  /** チーム専用ページの URL。CONFIG.prettyUrls で形式を切り替えます。 */
  function teamUrl(slug) {
    return CONFIG.prettyUrls
      ? "/team/" + encodeURIComponent(slug)
      : "team.html?team=" + encodeURIComponent(slug);
  }

  /** 静的HTML内に直書きされたチームリンクを現在の形式に合わせる */
  function normalizeTeamLinks(root) {
    if (!CONFIG.prettyUrls) return;
    var links = (root || document).querySelectorAll('a[href*="team.html?team="]');
    Array.prototype.forEach.call(links, function (a) {
      var m = a.getAttribute("href").match(/team=([\w-]+)/);
      if (m) a.setAttribute("href", teamUrl(m[1]));
    });
  }

  function sizeById(id) {
    var sizes = (CONFIG.product && CONFIG.product.sizes) || [];
    for (var i = 0; i < sizes.length; i++) if (sizes[i].id === id) return sizes[i];
    return null;
  }

  /* ----------------------------------------------------------------- order */

  /**
   * 注文内容の集計。
   * 購入者に見せるのは subtotal / unitPrice のみ。
   * wholesale・margin は内部（管理画面・NOF 側）用の値です。
   */
  function calcOrder(team, players) {
    var qty = players.reduce(function (s, p) { return s + (Number(p.qty) || 0); }, 0);
    var unitPrice = Number(team.price) || 0;
    var wholesale = Number(team.wholesalePrice) || 0;
    return {
      quantity: qty,
      unitPrice: unitPrice,
      subtotal: unitPrice * qty,
      // ---- internal only ----
      wholesaleUnitPrice: wholesale,
      wholesaleTotal: wholesale * qty,
      teamMarginUnit: unitPrice - wholesale,
      teamMarginTotal: (unitPrice - wholesale) * qty
    };
  }

  function orderNumber(date) {
    var d = date || new Date();
    var rand = Math.floor(Math.random() * 9000) + 1000;
    return [
      CONFIG.orderPrefix || "NOF",
      String(d.getFullYear()).slice(2) + pad(d.getMonth() + 1, 2) + pad(d.getDate(), 2),
      rand
    ].join("-");
  }

  /**
   * 注文の確定。endpoint が設定されていれば POST、
   * 無ければブラウザ内（localStorage）に保存するデモモード。
   * 管理画面／決済を足すときはここを差し替えます。
   */
  function submitOrder(payload) {
    if (CONFIG.orderEndpoint) {
      return fetch(CONFIG.orderEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).then(function (res) {
        if (!res.ok) throw new Error("Order failed: " + res.status);
        return res.json();
      });
    }
    return new Promise(function (resolve) {
      try {
        var key = "nof.orders";
        var store = JSON.parse(localStorage.getItem(key) || "[]");
        store.push(payload);
        localStorage.setItem(key, JSON.stringify(store));
      } catch (e) { /* localStorage 不可でも注文完了は妨げない */ }
      setTimeout(function () { resolve(payload); }, 450);
    });
  }

  /* -------------------------------------------------------------- UI utils */

  /**
   * .reveal 要素をスクロールに応じて表示する。
   * IntersectionObserver は環境によってコールバックが遅れる／届かないことがあり、
   * 「本文が見えないまま」が最悪のケースなので、位置を直接測る方式にしています。
   */
  function initReveal(root) {
    var els = Array.prototype.slice.call(
      (root || document).querySelectorAll(".reveal, .reveal-x, .reveal-mask")
    );
    if (!els.length) return;

    var queued = false;

    function sweep() {
      queued = false;
      var vh = window.innerHeight || document.documentElement.clientHeight;
      for (var i = els.length - 1; i >= 0; i--) {
        if (els[i].getBoundingClientRect().top < vh * 0.92) {
          els[i].classList.add("is-in");
          els.splice(i, 1);
        }
      }
      if (!els.length) {
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onScroll);
      }
    }

    function onScroll() {
      if (queued) return;
      queued = true;
      setTimeout(sweep, 60);
    }

    sweep();                                  // 初期表示ぶんはすぐ出す
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    window.addEventListener("load", sweep);
  }

  /** ヘッダーの背景切り替え */
  function initHeader(header) {
    if (!header) return;
    var onScroll = function () {
      header.classList.toggle("is-stuck", window.scrollY > 40);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /** .fig の焦点／ズームを設定 */
  function applyFocal(figEl, spec) {
    if (!figEl || !spec) return;
    if (spec.px != null) figEl.style.setProperty("--px", spec.px + "%");
    if (spec.py != null) figEl.style.setProperty("--py", spec.py + "%");
    if (spec.z != null) figEl.style.setProperty("--z", spec.z);
  }

  /** <div class="fig"><img></div> を生成 */
  function makeFig(spec, extraClass) {
    var d = document.createElement("div");
    d.className = "fig" + (extraClass ? " " + extraClass : "");
    var img = document.createElement("img");
    img.src = spec.src;
    img.alt = spec.alt || "";
    img.loading = "lazy";
    img.decoding = "async";
    d.appendChild(img);
    applyFocal(d, spec);
    return d;
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  global.NOF = {
    config: CONFIG,
    teams: TEAMS,
    yen: yen,
    resolveSlug: resolveSlug,
    getTeam: getTeam,
    listTeams: listTeams,
    teamUrl: teamUrl,
    normalizeTeamLinks: normalizeTeamLinks,
    sizeById: sizeById,
    calcOrder: calcOrder,
    orderNumber: orderNumber,
    submitOrder: submitOrder,
    initReveal: initReveal,
    initHeader: initHeader,
    applyFocal: applyFocal,
    makeFig: makeFig,
    escapeHtml: escapeHtml
  };
})(window);
