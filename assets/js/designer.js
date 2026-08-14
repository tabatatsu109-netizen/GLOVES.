/* ==========================================================================
   NOF — DESIGN SIMULATOR
   チーム名・背番号・フォントを選んで、その場で完成イメージをつくる。
   画像（PNG）として保存できます。
   --------------------------------------------------------------------------
   ※ プリントはカッティング（切り文字）のため、書体は「線が太く・単純で・
      細かいディテールが無いもの」だけを用意しています。
   ========================================================================== */
(function () {
  "use strict";

  var root = document.getElementById("designer");
  if (!root) return;

  var $  = function (s, r) { return (r || root).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || root).querySelectorAll(s)); };

  /* ------------------------------------------------------------- 設定 --- */

  /* チーム名に使えるフォント。追加するときはここに1行足し、
     loadFonts() の URL にもファミリー名を追記します。 */
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

  /* プリント色はホワイトのみ */
  var PRINT_COLOR = "#F4F4F2";

  var LAYOUTS = [
    { id: "name-number", label: "チーム名 ＋ 背番号", name: true,  number: true  },
    { id: "name",        label: "チーム名のみ",       name: true,  number: false },
    { id: "number",      label: "背番号のみ",         name: false, number: true  }
  ];

  var SCALES = [
    { id: "s", label: "S", name: 6.2,  number: 7.4 },
    { id: "m", label: "M", name: 7.9,  number: 9.2 },
    { id: "l", label: "L", name: 9.8,  number: 11.2 }
  ];

  /* プリント位置（グローブ画像に対する比率）。画像を差し替えたらここを調整します。 */
  var POS = {
    name:   { x: 0.510, y: 0.535, maxW: 0.45 },
    number: { x: 0.520, y: 0.855, maxW: 0.27 }
  };

  var GLOVE_SRC = "assets/images/glove-blank.png";

  function byId(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return list[0];
  }
  var NUMBER_FONTS = NUMBER_FONT_IDS.map(function (id) { return byId(FONTS, id); });

  /* ------------------------------------------------------------ 状態 --- */
  var state = {
    text: "TEAM FC",
    number: "10",
    font: FONTS[0],
    numberFont: NUMBER_FONTS[0],
    layout: LAYOUTS[0],
    scale: SCALES[1]
  };

  var els = {
    stage:  $("#dzStage"),
    name:   $("#dzName"),
    num:    $("#dzNum"),
    text:   $("#dsText"),
    number: $("#dsNumber"),
    fonts:  $("#dsFonts"),
    numFonts: $("#dsNumFonts"),
    layouts:$("#dsLayouts"),
    scales: $("#dsScales"),
    numberField: $("#dsNumberField"),
    textField:   $("#dsTextField"),
    fontBlock:    $("#dsFontBlock"),
    numFontBlock: $("#dsNumFontBlock"),
    save:   $("#dsSave"),
    status: $("#dsStatus")
  };

  /* -------------------------------------------------- Webフォント読込 --- */
  var fontsRequested = false;
  function loadFonts() {
    if (fontsRequested) return;
    fontsRequested = true;
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2" +
      "?family=Alfa+Slab+One" +
      "&family=Archivo+Black" +
      "&family=Bebas+Neue" +
      "&family=Bowlby+One" +
      "&family=Graduate" +
      "&family=Racing+Sans+One" +
      "&family=Russo+One" +
      "&family=Teko:wght@600" +
      "&display=swap";
    document.head.appendChild(link);
  }

  /* ------------------------------------------------------- UI 組み立て -- */
  function fontChip(f, active, attr) {
    return '<button type="button" class="ds-font' + (active ? " is-on" : "") + '" ' +
      attr + '="' + f.id + '">' +
      '<span class="ds-font__sample" style="font-family:' + f.stack +
      (f.weight ? ";font-weight:" + f.weight : "") + '">Team</span>' +
      '<span class="ds-font__label">' + f.label + '</span></button>';
  }

  function numChip(f, active) {
    return '<button type="button" class="ds-font' + (active ? " is-on" : "") + '" ' +
      'data-numfont="' + f.id + '">' +
      '<span class="ds-font__sample" style="font-family:' + f.stack +
      (f.weight ? ";font-weight:" + f.weight : "") + '">10</span>' +
      '<span class="ds-font__label">' + f.label + '</span></button>';
  }

  function renderControls() {
    els.layouts.innerHTML = LAYOUTS.map(function (l) {
      return '<button type="button" class="ds-chip' + (l.id === state.layout.id ? " is-on" : "") +
             '" data-layout="' + l.id + '">' + l.label + '</button>';
    }).join("");

    els.fonts.innerHTML = FONTS.map(function (f) {
      return fontChip(f, f.id === state.font.id, "data-font");
    }).join("");

    els.numFonts.innerHTML = NUMBER_FONTS.map(function (f) {
      return numChip(f, f.id === state.numberFont.id);
    }).join("");

    els.scales.innerHTML = SCALES.map(function (s) {
      return '<button type="button" class="ds-chip ds-chip--sq' + (s.id === state.scale.id ? " is-on" : "") +
             '" data-scale="' + s.id + '">' + s.label + '</button>';
    }).join("");
  }

  /* ---------------------------------------------------------- 反映 --- */

  /** 使わない項目を無効化する。disabled にしないとキーボードで操作できてしまう。 */
  function setOff(el, off) {
    if (!el) return;
    el.classList.toggle("is-off", off);
    Array.prototype.forEach.call(el.querySelectorAll("input, button, textarea, select"),
      function (c) { c.disabled = off; });
  }

  function fit(el, maxRatio, basePx) {
    var maxW = els.stage.clientWidth * maxRatio;
    if (!(maxW > 0)) return;          // ステージ未表示時に 0px にしてしまわない
    el.style.fontSize = basePx + "px";
    var w = el.scrollWidth;
    if (w > maxW && w > 0) el.style.fontSize = (basePx * (maxW / w)) + "px";
  }

  function apply() {
    var stageW = els.stage.clientWidth;
    if (!stageW) return;              // 幅が取れるまで待つ（ResizeObserver が再実行する）

    els.name.hidden = !state.layout.name;
    els.num.hidden = !state.layout.number;
    setOff(els.textField, !state.layout.name);
    setOff(els.numberField, !state.layout.number);
    setOff(els.numFontBlock, !state.layout.number);
    setOff(els.fontBlock, !state.layout.name);

    var f = state.font;
    var text = (state.text.trim() || "TEAM").toUpperCase();
    els.name.textContent = text;
    els.name.style.fontFamily = f.stack;
    els.name.style.fontWeight = f.weight || 400;
    els.name.style.color = PRINT_COLOR;
    els.name.style.left = (POS.name.x * 100) + "%";
    els.name.style.top  = (POS.name.y * 100) + "%";
    fit(els.name, POS.name.maxW, stageW * state.scale.name / 100);

    var nf = state.numberFont;
    els.num.textContent = state.number.trim();
    els.num.style.fontFamily = nf.stack;
    els.num.style.fontWeight = nf.weight || 400;
    els.num.style.color = PRINT_COLOR;
    els.num.style.left = (POS.number.x * 100) + "%";
    els.num.style.top  = (POS.number.y * 100) + "%";
    fit(els.num, POS.number.maxW, stageW * state.scale.number / 100);
  }

  /* ------------------------------------------------------ PNG 書き出し -- */
  function download() {
    els.status.textContent = "画像を作成中…";
    els.save.disabled = true;

    function fail(msg) {
      els.status.textContent = msg || "画像の作成に失敗しました。";
      els.save.disabled = false;
    }

    var img = new Image();
    img.onload = function () {
      var ready = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
      ready.catch(function () { /* フォント読込失敗でも書き出しは進める */ }).then(function () {
        var scale = 2;
        var W = img.naturalWidth * scale, H = img.naturalHeight * scale;
        var cv = document.createElement("canvas");
        cv.width = W; cv.height = H;
        var ctx = cv.getContext("2d");

        // 背景（プレビューと同じ雰囲気に）
        var bg = ctx.createRadialGradient(W * 0.5, H * 0.40, 0, W * 0.5, H * 0.40, H * 0.72);
        bg.addColorStop(0, "#3A3A3A");
        bg.addColorStop(0.6, "#1A1A1A");
        bg.addColorStop(1, "#0D0D0D");
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, W, H);

        ctx.drawImage(img, 0, 0, W, H);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = PRINT_COLOR;

        function draw(str, pos, sizePct, font) {
          if (!str) return;
          var weight = font.weight || 400;
          var px = W * sizePct / 100;
          ctx.font = weight + " " + px + "px " + font.stack;
          var maxW = W * pos.maxW;
          var m = ctx.measureText(str).width;
          if (m > maxW && m > 0) {
            px = px * (maxW / m);
            ctx.font = weight + " " + px + "px " + font.stack;
          }
          ctx.fillText(str, W * pos.x, H * pos.y);
        }

        var text = (state.text.trim() || "TEAM").toUpperCase();
        if (state.layout.name)   draw(text, POS.name, state.scale.name, state.font);
        if (state.layout.number) draw(state.number.trim(), POS.number, state.scale.number, state.numberFont);

        cv.toBlob(function (blob) {
          if (!blob) { fail("画像の作成に失敗しました。"); return; }
          var url = URL.createObjectURL(blob);
          var a = document.createElement("a");
          var safe = (state.text.trim() || "team").replace(/[^\w\-]+/g, "_").slice(0, 24);
          a.href = url;
          a.download = "NOF_design_" + safe + ".png";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
          els.status.textContent = "画像を保存しました。NOF担当者へお送りください。";
          els.save.disabled = false;
        }, "image/png");
      }).catch(function () { fail(); });
    };
    img.onerror = function () { fail("手袋画像を読み込めませんでした。"); };
    img.src = GLOVE_SRC;
  }

  /* ------------------------------------------------------------ 入力 --- */
  function bind() {
    els.text.addEventListener("input", function () {
      state.text = this.value.slice(0, 16);
      apply();
    });

    els.number.addEventListener("input", function () {
      this.value = this.value.replace(/[^\d]/g, "").slice(0, 3);
      state.number = this.value;
      apply();
    });

    root.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-font], [data-numfont], [data-layout], [data-scale]");
      if (!btn) return;
      loadFonts();

      if (btn.dataset.font)     state.font       = byId(FONTS, btn.dataset.font);
      if (btn.dataset.numfont)  state.numberFont = byId(NUMBER_FONTS, btn.dataset.numfont);
      if (btn.dataset.layout)   state.layout     = byId(LAYOUTS, btn.dataset.layout);
      if (btn.dataset.scale)    state.scale      = byId(SCALES, btn.dataset.scale);

      $$("button", btn.parentElement).forEach(function (b) { b.classList.toggle("is-on", b === btn); });
      apply();
    });

    els.text.addEventListener("focus", loadFonts);
    els.save.addEventListener("click", download);

    // 画像の遅延読込などでステージ幅が 0 → 実寸 に変わったときに描き直す
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () { apply(); }).observe(els.stage);
    } else {
      window.addEventListener("resize", apply);
    }
    window.addEventListener("load", function () { loadFonts(); apply(); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(apply);
  }

  /* ------------------------------------------------------------ init --- */
  els.text.value = state.text;
  els.number.value = state.number;
  renderControls();
  bind();
  apply();
})();
