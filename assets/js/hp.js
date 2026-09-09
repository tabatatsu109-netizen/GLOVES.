/* ==========================================================================
   NO FOOTBALL (NOF) — 公式サイト共通スクリプト
   - ヘッダー固定切替（スクロールで .is-upper）
   - SP ハンバーガーメニュー
   - メインビジュアルのスライダー（依存ライブラリなし）
   - スクロール表示アニメーション（.anim）
   - お知らせの描画（assets/js/news-data.js の NOF_NEWS）
   - 共通リンク（Instagram / BASE）の差し込み
   ========================================================================== */
(function () {
  "use strict";

  var SITE = window.NOF_SITE || {};
  var html = document.documentElement;
  var body = document.body;

  /* ------------------------------------------------ 共通リンクの差し込み --- */
  function applySiteLinks() {
    var map = {
      "data-link-shop": SITE.shopUrl,
      "data-link-instagram": SITE.instagramUrl
    };
    Object.keys(map).forEach(function (attr) {
      if (!map[attr]) return;
      document.querySelectorAll("a[" + attr + "]").forEach(function (a) {
        a.href = map[attr];
        a.target = "_blank";
        a.rel = "noopener";
      });
    });
    if (SITE.contactEmail) {
      document.querySelectorAll("[data-contact-email]").forEach(function (el) {
        el.textContent = SITE.contactEmail;
        if (el.tagName === "A") el.href = "mailto:" + SITE.contactEmail;
      });
      document.querySelectorAll("[data-contact-email-row]").forEach(function (el) { el.hidden = false; });
    }
  }

  /* -------------------------------------------------- 固定ヘッダー --- */
  function initHeader() {
    var header = document.querySelector(".hp-header");
    if (!header) return;
    var threshold = header.offsetHeight + 40;
    var setH = function () {
      html.style.setProperty("--hp-header-h", header.offsetHeight + "px");
    };
    var onScroll = function () {
      body.classList.toggle("is-upper", window.scrollY > threshold);
    };
    setH();
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", setH);

    var toggle = document.querySelector(".hp-nav__toggle");
    if (toggle) {
      toggle.addEventListener("click", function () {
        var open = body.classList.toggle("is-nav-open");
        toggle.setAttribute("aria-expanded", open ? "true" : "false");
      });
      document.querySelectorAll(".hp-header .hp-nav a").forEach(function (a) {
        a.addEventListener("click", function () {
          body.classList.remove("is-nav-open");
          toggle.setAttribute("aria-expanded", "false");
        });
      });
    }

    var pagetop = document.querySelector(".pagetop");
    if (pagetop) {
      pagetop.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    /* 現在ページをナビで強調 */
    var here = location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll(".hp-nav__list a").forEach(function (a) {
      var href = a.getAttribute("href") || "";
      if (href && href.split("#")[0] === here) a.classList.add("is-current");
    });
  }

  /* -------------------------------------------------- スライダー --- */
  function initSlider() {
    var mv = document.querySelector(".mv");
    if (!mv) return;
    var slides = Array.prototype.slice.call(mv.querySelectorAll(".mv__slide"));
    if (slides.length < 2) { if (slides[0]) slides[0].classList.add("is-active"); return; }

    var dotsHost = mv.querySelector(".mv__dots");
    var dots = [];
    if (dotsHost) {
      slides.forEach(function (_, i) {
        var b = document.createElement("button");
        b.type = "button";
        b.setAttribute("aria-label", "スライド " + (i + 1));
        b.addEventListener("click", function () { go(i, true); });
        dotsHost.appendChild(b);
        dots.push(b);
      });
    }

    var current = 0, timer = null, INTERVAL = 6000;
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function go(i, manual) {
      current = (i + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle("is-active", k === current); });
      dots.forEach(function (d, k) { d.classList.toggle("is-active", k === current); });
      if (manual) restart();
    }
    function restart() {
      if (timer) clearInterval(timer);
      if (reduce) return;
      timer = setInterval(function () { go(current + 1); }, INTERVAL);
    }

    var prev = mv.querySelector(".mv__arrow--prev");
    var next = mv.querySelector(".mv__arrow--next");
    if (prev) prev.addEventListener("click", function () { go(current - 1, true); });
    if (next) next.addEventListener("click", function () { go(current + 1, true); });

    go(0);
    restart();
  }

  /* ------------------------------------------ 表示アニメーション --- */
  function initAnim() {
    var els = document.querySelectorAll(".anim");
    if (!els.length) return;
    if (!("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* -------------------------------------------------- お知らせ --- */
  function escapeHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function renderNews() {
    var list = window.NOF_NEWS || [];
    document.querySelectorAll("[data-news-list]").forEach(function (host) {
      var limit = parseInt(host.getAttribute("data-news-list"), 10) || list.length;
      var withBody = host.hasAttribute("data-news-body");
      var items = list.slice(0, limit);
      if (!items.length) {
        host.innerHTML = '<p style="color:#666">現在お知らせはありません。</p>';
        return;
      }
      host.innerHTML = "<dl>" + items.map(function (n) {
        var title = escapeHtml(n.title);
        var inner = n.url ? '<a href="' + escapeHtml(n.url) + '"' + (/^https?:/.test(n.url) ? ' target="_blank" rel="noopener"' : "") + ">" + title + "</a>" : title;
        var tag = n.tag ? '<span class="tag">' + escapeHtml(n.tag) + "</span>" : "";
        var bodyHtml = (withBody && n.body) ? "<p>" + escapeHtml(n.body).replace(/\n/g, "<br>") + "</p>" : "";
        return "<dt>" + escapeHtml(n.date) + "</dt><dd>" + tag + inner + bodyHtml + "</dd>";
      }).join("") + "</dl>";
    });
  }

  /* -------------------------------------------- お問い合わせフォーム --- */
  function initContactForm() {
    var form = document.getElementById("contactForm");
    if (!form) return;
    var status = document.getElementById("contactStatus");
    var alt = document.getElementById("contactAlt");
    var endpoint = SITE.contactEndpoint || "";

    function say(msg, cls) {
      status.textContent = msg;
      status.className = "form__status" + (cls ? " " + cls : "");
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var data = new FormData(form);
      var btn = form.querySelector('button[type="submit"]');

      if (!endpoint) {
        /* 送信先未設定: 偽って「送信しました」と出さず、メール／BASE の案内に切り替える */
        var lines = [];
        data.forEach(function (v, k) { if (k !== "_gotcha") lines.push(k + ": " + v); });
        var bodyText = encodeURIComponent(lines.join("\n"));
        if (SITE.contactEmail) {
          location.href = "mailto:" + SITE.contactEmail + "?subject=" +
            encodeURIComponent("[NOF公式サイト] お問い合わせ") + "&body=" + bodyText;
          say("メールソフトが開きます。開かない場合は下記の連絡先へ直接ご連絡ください。", "");
        } else {
          say("フォームの送信先が未設定のため送信できません。下記の方法でお問い合わせください。", "is-error");
        }
        if (alt) alt.hidden = false;
        return;
      }

      btn.disabled = true;
      say("送信しています…", "");
      fetch(endpoint, { method: "POST", body: data, headers: { Accept: "application/json" } })
        .then(function (r) {
          if (!r.ok) throw new Error("HTTP " + r.status);
          form.reset();
          say("お問い合わせを送信しました。担当者より折り返しご連絡いたします。", "is-ok");
        })
        .catch(function () {
          say("送信に失敗しました。お手数ですが時間をおいて再度お試しいただくか、下記の方法でお問い合わせください。", "is-error");
          if (alt) alt.hidden = false;
        })
        .then(function () { btn.disabled = false; });
    });
  }

  /* ------------------------------------------------------------ init --- */
  applySiteLinks();
  initHeader();
  initSlider();
  initAnim();
  renderNews();
  initContactForm();
})();
