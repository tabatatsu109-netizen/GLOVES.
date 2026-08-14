/* ==========================================================================
   NOF — DESIGN SIMULATOR
   チーム名・背番号・フォント・色を選んで、その場で完成イメージをつくる。
   画像（PNG）として保存できます。
   ========================================================================== */
(function () {
  "use strict";

  var root = document.getElementById("designer");
  if (!root) return;

  var $  = function (s, r) { return (r || root).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || root).querySelectorAll(s)); };

  /* ------------------------------------------------------------- 設定 --- */

  /* プリントに使えるフォント。追加するときはここに1行足すだけです。 */
  var FONTS = [
    { id: "anton",    label: "BLOCK",     family: "Anton",            stack: "'Anton', sans-serif" },
    { id: "bebas",    label: "CONDENSED", family: "Bebas Neue",       stack: "'Bebas Neue', sans-serif" },
    { id: "archivo",  label: "GOTHIC",    family: "Archivo Black",    stack: "'Archivo Black', sans-serif" },
    { id: "teko",     label: "SQUARE",    family: "Teko",             stack: "'Teko', sans-serif", weight: 600 },
    { id: "graduate", label: "COLLEGE",   family: "Graduate",         stack: "'Graduate', serif" },
    { id: "alfa",     label: "SLAB",      family: "Alfa Slab One",    stack: "'Alfa Slab One', serif" },
    { id: "stencil",  label: "STENCIL",   family: "Saira Stencil One",stack: "'Saira Stencil One', sans-serif" },
    { id: "racing",   label: "SPEED",     family: "Racing Sans One",  stack: "'Racing Sans One', sans-serif" },
    { id: "jp",       label: "日本語",     family: "Noto Sans JP",     stack: "'Noto Sans JP', sans-serif", weight: 900, jp: true }
  ];

  var COLORS = [
    { id: "white",  label: "ホワイト", hex: "#F7F7F5" },
    { id: "yellow", label: "イエロー", hex: "#F5D000" },
    { id: "lime",   label: "ライム",   hex: "#D8FF00" }
  ];

  var LAYOUTS = [
    { id: "name-number", label: "チーム名 ＋ 背番号", name: true,  number: true  },
    { id: "name",        label: "チーム名のみ",       name: true,  number: false },
    { id: "number",      label: "背番号のみ",         name: false, number: true  }
  ];

  var SCALES = [
    { id: "s", label: "S", name: 6.6, number: 8.0 },
    { id: "m", label: "M", name: 8.4, number: 9.8 },
    { id: "l", label: "L", name: 10.4, number: 11.8 }
  ];

  /* プリント位置（グローブ画像に対する比率）。画像を差し替えたらここを調整します。 */
  var POS = {
    name:   { x: 0.43, y: 0.485, maxW: 0.46 },
    number: { x: 0.40, y: 0.805, maxW: 0.26 }
  };

  var GLOVE_SRC = "assets/images/glove-blank.jpg";

  /* ------------------------------------------------------------ 状態 --- */
  var state = {
    text: "TEAM FC",
    number: "10",
    font: FONTS[0],
    color: COLORS[0],
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
    colors: $("#dsColors"),
    layouts:$("#dsLayouts"),
    scales: $("#dsScales"),
    numberField: $("#dsNumberField"),
    textField:   $("#dsTextField"),
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
      "&family=Graduate" +
      "&family=Racing+Sans+One" +
      "&family=Saira+Stencil+One" +
      "&family=Teko:wght@600" +
      "&display=swap";
    document.head.appendChild(link);
  }

  /* ------------------------------------------------------- UI 組み立て -- */
  function chip(cls, active, dataAttr, value, inner, style) {
    return '<button type="button" class="' + cls + (active ? " is-on" : "") + '" ' +
           dataAttr + '="' + value + '"' + (style ? ' style="' + style + '"' : "") + '>' +
           inner + '</button>';
  }

  function renderControls() {
    els.layouts.innerHTML = LAYOUTS.map(function (l) {
      return chip("ds-chip", l.id === state.layout.id, "data-layout", l.id, l.label);
    }).join("");

    els.fonts.innerHTML = FONTS.map(function (f) {
      var sample = f.jp ? "チーム" : "Team";
      return chip("ds-font", f.id === state.font.id, "data-font", f.id,
        '<span class="ds-font__sample" style="font-family:' + f.stack +
        (f.weight ? ";font-weight:" + f.weight : "") + '">' + sample + '</span>' +
        '<span class="ds-font__label">' + f.label + '</span>');
    }).join("");

    els.colors.innerHTML = COLORS.map(function (c) {
      return chip("ds-swatch", c.id === state.color.id, "data-color", c.id,
        '<i style="background:' + c.hex + '"></i>' + c.label);
    }).join("");

    els.scales.innerHTML = SCALES.map(function (s) {
      return chip("ds-chip ds-chip--sq", s.id === state.scale.id, "data-scale", s.id, s.label);
    }).join("");
  }

  /* ---------------------------------------------------------- 反映 --- */
  function fit(el, maxRatio, basePx) {
    // 文字がプリント範囲に収まるよう自動で縮小する
    el.style.fontSize = basePx + "px";
    var maxW = els.stage.clientWidth * maxRatio;
    var w = el.scrollWidth;
    if (w > maxW && w > 0) el.style.fontSize = (basePx * (maxW / w)) + "px";
  }

  function apply() {
    var stageW = els.stage.clientWidth || 1;
    var f = state.font;

    els.name.hidden = !state.layout.name;
    els.num.hidden = !state.layout.number;
    els.textField.classList.toggle("is-off", !state.layout.name);
    els.numberField.classList.toggle("is-off", !state.layout.number);

    var text = state.text.trim() || "TEAM";
    if (!f.jp) text = text.toUpperCase();

    els.name.textContent = text;
    els.name.style.fontFamily = f.stack;
    els.name.style.fontWeight = f.weight || 400;
    els.name.style.color = state.color.hex;
    els.name.style.left = (POS.name.x * 100) + "%";
    els.name.style.top  = (POS.name.y * 100) + "%";
    fit(els.name, POS.name.maxW, stageW * state.scale.name / 100);

    els.num.textContent = state.number.trim();
    els.num.style.fontFamily = f.stack;
    els.num.style.fontWeight = f.weight || 400;
    els.num.style.color = state.color.hex;
    els.num.style.left = (POS.number.x * 100) + "%";
    els.num.style.top  = (POS.number.y * 100) + "%";
    fit(els.num, POS.number.maxW, stageW * state.scale.number / 100);
  }

  /* ------------------------------------------------------ PNG 書き出し -- */
  function download() {
    els.status.textContent = "画像を作成中…";
    els.save.disabled = true;

    var img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = function () {
      var ready = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
      ready.then(function () {
        var scale = 2;
        var W = img.naturalWidth * scale, H = img.naturalHeight * scale;
        var cv = document.createElement("canvas");
        cv.width = W; cv.height = H;
        var ctx = cv.getContext("2d");
        ctx.drawImage(img, 0, 0, W, H);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = state.color.hex;

        var f = state.font;
        var weight = f.weight || 400;

        function draw(str, pos, sizePct) {
          if (!str) return;
          var px = W * sizePct / 100;
          ctx.font = weight + " " + px + "px " + f.stack;
          var maxW = W * pos.maxW;
          var m = ctx.measureText(str).width;
          if (m > maxW && m > 0) {
            px = px * (maxW / m);
            ctx.font = weight + " " + px + "px " + f.stack;
          }
          ctx.fillText(str, W * pos.x, H * pos.y);
        }

        var text = state.text.trim() || "TEAM";
        if (!f.jp) text = text.toUpperCase();
        if (state.layout.name)   draw(text, POS.name, state.scale.name);
        if (state.layout.number) draw(state.number.trim(), POS.number, state.scale.number);

        cv.toBlob(function (blob) {
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
      });
    };
    img.onerror = function () {
      els.status.textContent = "画像の作成に失敗しました。";
      els.save.disabled = false;
    };
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
      var btn = e.target.closest("[data-font], [data-color], [data-layout], [data-scale]");
      if (!btn) return;
      loadFonts();

      function pick(list, id) {
        for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
        return list[0];
      }

      if (btn.dataset.font)   { state.font   = pick(FONTS,   btn.dataset.font); }
      if (btn.dataset.color)  { state.color  = pick(COLORS,  btn.dataset.color); }
      if (btn.dataset.layout) { state.layout = pick(LAYOUTS, btn.dataset.layout); }
      if (btn.dataset.scale)  { state.scale  = pick(SCALES,  btn.dataset.scale); }

      var group = btn.parentElement;
      $$("button", group).forEach(function (b) { b.classList.toggle("is-on", b === btn); });
      apply();
    });

    els.text.addEventListener("focus", loadFonts);
    els.save.addEventListener("click", download);
    window.addEventListener("resize", apply);
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
