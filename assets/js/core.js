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

    // スラッシュ必須。#confirm のような画面用ハッシュを slug と誤認しないため。
    var h = location.hash.match(/^#\/([\w-]+)/);
    if (h) return h[1].toLowerCase();

    return null;
  }

  /**
   * チーム設定の取得。将来 API 化する場合はここだけ差し替えれば済みます。
   * 設定本体は書き換えず、コピーを返します。
   */
  function getTeam(slug) {
    if (!slug) return null;
    // hasOwnProperty で判定しないと "__proto__" や "constructor" が
    // チームとして取れてしまい、設定を壊したうえ画面が落ちる。
    if (!Object.prototype.hasOwnProperty.call(TEAMS, slug)) return null;
    var src = TEAMS[slug];
    if (!src || typeof src !== "object") return null;

    var t = {};
    for (var k in src) if (Object.prototype.hasOwnProperty.call(src, k)) t[k] = src[k];
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
      var ctrl = ("AbortController" in window) ? new AbortController() : null;
      var timer = ctrl && setTimeout(function () { ctrl.abort(); }, 15000);
      return fetch(CONFIG.orderEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: ctrl ? ctrl.signal : undefined
      }).then(function (res) {
        if (timer) clearTimeout(timer);
        if (!res.ok) throw new Error("Order failed: " + res.status);
        // 200 で本文が空／JSON でない場合も成功として扱う
        return res.text().then(function (t) {
          try { return JSON.parse(t); } catch (e) { return { raw: t }; }
        });
      }, function (err) {
        if (timer) clearTimeout(timer);
        throw err;
      });
    }

    // デモモード: ブラウザ内に保存する。保存できなければ「注文できた」と
    // 誤解させないよう失敗として扱う。
    return new Promise(function (resolve, reject) {
      var key = "nof.orders";
      try {
        var store = JSON.parse(localStorage.getItem(key) || "[]");
        store.push(payload);
        localStorage.setItem(key, JSON.stringify(store));
      } catch (e) {
        reject(new Error("注文内容を保存できませんでした: " + e.message));
        return;
      }
      setTimeout(function () { resolve(payload); }, 450);
    });
  }

  /* =========================================================================
     PRINT — 手袋のプリント仕様（LP のシミュレーターとチームページ共通）
     -------------------------------------------------------------------------
     土台は実写の切り抜き写真 1枚。プリント位置は画像に対する比率で持つので、
     写真を差し替えるときは POS だけ合わせ直せば両方の画面に反映されます。
     ========================================================================= */

  /* プリントはカッティング（切り文字）のため、線が細い書体・ステンシル・
     装飾の多い書体は入れていません。すべて塗りが太く単純な書体です。 */
  var FONTS = [
    { id: "anton",    label: "BLOCK",     stack: "'Anton', sans-serif" },
    { id: "bebas",    label: "CONDENSED", stack: "'Bebas Neue', sans-serif" },
    { id: "archivo",  label: "GOTHIC",    stack: "'Archivo Black', sans-serif" },
    { id: "teko",     label: "SQUARE",    stack: "'Teko', sans-serif", weight: 600 },
    { id: "russo",    label: "TECH",      stack: "'Russo One', sans-serif" },
    { id: "graduate", label: "COLLEGE",   stack: "'Graduate', serif" },
    { id: "alfa",     label: "SLAB",      stack: "'Alfa Slab One', serif" },
    { id: "bowlby",   label: "HEAVY",     stack: "'Bowlby One', sans-serif" },
    { id: "racing",   label: "SPEED",     stack: "'Racing Sans One', sans-serif" }
  ];

  /* 背番号に使えるフォント（数字が読みやすい書体に限定） */
  var NUMBER_FONT_IDS = ["anton", "bebas", "teko", "racing"];

  var SCALES = [
    { id: "s", label: "S", name: 6.2,  number: 7.4 },
    { id: "m", label: "M", name: 7.9,  number: 9.2 },
    { id: "l", label: "L", name: 9.8,  number: 11.2 }
  ];

  /**
   * プリント内容の唯一の定義。
   * teams.js の printType と、シミュレーターの選択肢は同じ語彙を使います。
   * inDesigner: シミュレーターの選択肢に出すかどうか（ロゴは扱わないので除外）
   */
  var TYPES = {
    "logo-number": { logo: true,  name: false, number: true,  label: "チームロゴ ＋ 背番号", inDesigner: false },
    "logo":        { logo: true,  name: false, number: false, label: "チームロゴ",           inDesigner: false },
    "name-number": { logo: false, name: true,  number: true,  label: "チーム名 ＋ 背番号",   inDesigner: true  },
    "name":        { logo: false, name: true,  number: false, label: "チーム名のみ",         inDesigner: true  },
    "number":      { logo: false, name: false, number: true,  label: "背番号のみ",           inDesigner: true  }
  };

  var PRINT = {
    GLOVE_SRC: "assets/images/glove-blank.png",
    GLOVE_W: 354,
    GLOVE_H: 723,
    RATIO: "354 / 723",
    COLOR: "#F4F4F2",
    /* プリント位置（画像に対する比率）。写真を差し替えたらここだけ直します。 */
    POS: {
      name:   { x: 0.510, y: 0.535, maxW: 0.45 },
      number: { x: 0.520, y: 0.855, maxW: 0.27 },
      logo:   { x: 0.510, y: 0.520, maxW: 0.30 }
    },
    FONTS: FONTS,
    NUMBER_FONT_IDS: NUMBER_FONT_IDS,
    SCALES: SCALES,
    TYPES: TYPES,

    font: function (id) { return pick(FONTS, id); },
    numberFont: function (id) {
      return (NUMBER_FONT_IDS.indexOf(id) >= 0) ? pick(FONTS, id) : pick(FONTS, NUMBER_FONT_IDS[0]);
    },
    scale: function (id) { return pick(SCALES, id); },

    /**
     * チーム設定から実際に描くプリント内容を決める。
     * ロゴ指定なのにロゴ画像が無い場合は、矛盾を表示せず文字に降格させる。
     */
    resolve: function (team) {
      var t = TYPES[team && team.printType] || TYPES["name-number"];
      if (t.logo && !(team && team.logo)) {
        t = (team.printType === "logo-number") ? TYPES["name-number"] : TYPES["name"];
      }
      return t;
    },

    /** 文字がプリント範囲に収まるよう縮小する */
    fitText: function (el, stageW, maxRatio, basePx) {
      var maxW = stageW * maxRatio;
      if (!(maxW > 0)) return;
      el.style.fontSize = basePx + "px";
      var w = el.scrollWidth;
      if (w > maxW && w > 0) el.style.fontSize = (basePx * (maxW / w)) + "px";
    },

    /** Canvas に1行描く。画面と同じ位置・同じ収まり方になるよう字面の中央で揃える。 */
    drawText: function (ctx, str, pos, sizePct, font, W, H) {
      if (!str) return;
      var weight = font.weight || 400;
      var px = W * sizePct / 100;
      ctx.font = weight + " " + px + "px " + font.stack;
      var maxW = W * pos.maxW;
      var m = ctx.measureText(str);
      if (m.width > maxW && m.width > 0) {
        px = px * (maxW / m.width);
        ctx.font = weight + " " + px + "px " + font.stack;
        m = ctx.measureText(str);
      }
      // CSS は行ボックス中央、Canvas の middle は em ボックス中央でズレるため
      // 実際の字面（ink）の中央に合わせる
      var asc = m.actualBoundingBoxAscent, desc = m.actualBoundingBoxDescent;
      if (typeof asc === "number" && typeof desc === "number") {
        ctx.textBaseline = "alphabetic";
        ctx.fillText(str, W * pos.x, H * pos.y + (asc - desc) / 2);
      } else {
        ctx.textBaseline = "middle";
        ctx.fillText(str, W * pos.x, H * pos.y);
      }
    },

    /** 書き出し用の背景（プレビューと同じ雰囲気） */
    paintBackground: function (ctx, W, H) {
      var bg = ctx.createRadialGradient(W * 0.5, H * 0.40, 0, W * 0.5, H * 0.40, H * 0.72);
      bg.addColorStop(0, "#3A3A3A");
      bg.addColorStop(0.6, "#1A1A1A");
      bg.addColorStop(1, "#0D0D0D");
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
    }
  };

  function pick(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return list[0];
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
    print: PRINT,
    initReveal: initReveal,
    initHeader: initHeader,
    applyFocal: applyFocal,
    makeFig: makeFig,
    escapeHtml: escapeHtml
  };
})(window);
