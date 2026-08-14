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
  /* 書体・プリント位置・色は core.js の NOF.print に集約してあります。
     チームページのプレビューと同じ定義を使うので、片方だけズレることがありません。 */
  var P = NOF.print;
  var FONTS = P.FONTS;
  var SCALES = P.SCALES;
  var POS = P.POS;
  var PRINT_COLOR = P.COLOR;
  var GLOVE_SRC = P.GLOVE_SRC;

  var NUMBER_FONTS = P.NUMBER_FONT_IDS.map(function (id) { return P.font(id); });

  /* シミュレーターで選べるプリント内容（ロゴは扱わない） */
  var LAYOUTS = Object.keys(P.TYPES)
    .filter(function (k) { return P.TYPES[k].inDesigner; })
    .map(function (k) {
      var t = P.TYPES[k];
      return { id: k, label: t.label, name: t.name, number: t.number };
    });

  function byId(list, id) {
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return list[0];
  }

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


  /* ------------------------------------------------------- UI 組み立て -- */
  function fontChip(f, active, attr, sample, kind) {
    return '<button type="button" class="ds-font' + (active ? " is-on" : "") + '" ' +
      attr + '="' + f.id + '" aria-pressed="' + active + '"' +
      ' aria-label="' + kind + 'の書体 ' + f.label + '">' +
      '<span class="ds-font__sample" style="font-family:' + f.stack +
      (f.weight ? ";font-weight:" + f.weight : "") + '" aria-hidden="true">' + sample + '</span>' +
      '<span class="ds-font__label" aria-hidden="true">' + f.label + '</span></button>';
  }

  function renderControls() {
    els.layouts.innerHTML = LAYOUTS.map(function (l) {
      var on = l.id === state.layout.id;
      return '<button type="button" class="ds-chip' + (on ? " is-on" : "") +
             '" data-layout="' + l.id + '" aria-pressed="' + on + '">' + l.label + '</button>';
    }).join("");

    els.fonts.innerHTML = FONTS.map(function (f) {
      return fontChip(f, f.id === state.font.id, "data-font", "Team", "チーム名");
    }).join("");

    els.numFonts.innerHTML = NUMBER_FONTS.map(function (f) {
      return fontChip(f, f.id === state.numberFont.id, "data-numfont", "10", "背番号");
    }).join("");

    els.scales.innerHTML = SCALES.map(function (s) {
      var on = s.id === state.scale.id;
      return '<button type="button" class="ds-chip ds-chip--sq' + (on ? " is-on" : "") +
             '" data-scale="' + s.id + '" aria-pressed="' + on + '"' +
             ' aria-label="大きさ ' + s.label + '">' + s.label + '</button>';
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
    P.fitText(el, els.stage.clientWidth, maxRatio, basePx);
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
        P.paintBackground(ctx, W, H);
        ctx.drawImage(img, 0, 0, W, H);
        ctx.textAlign = "center";
        ctx.fillStyle = PRINT_COLOR;

        var text = (state.text.trim() || "TEAM").toUpperCase();
        if (state.layout.name) {
          P.drawText(ctx, text, POS.name, state.scale.name, state.font, W, H);
        }
        if (state.layout.number) {
          P.drawText(ctx, state.number.trim(), POS.number, state.scale.number, state.numberFont, W, H);
        }

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

      if (btn.dataset.font)     state.font       = byId(FONTS, btn.dataset.font);
      if (btn.dataset.numfont)  state.numberFont = byId(NUMBER_FONTS, btn.dataset.numfont);
      if (btn.dataset.layout)   state.layout     = byId(LAYOUTS, btn.dataset.layout);
      if (btn.dataset.scale)    state.scale      = byId(SCALES, btn.dataset.scale);

      $$("button", btn.parentElement).forEach(function (b) {
        var on = b === btn;
        b.classList.toggle("is-on", on);
        b.setAttribute("aria-pressed", String(on));
      });
      apply();
    });

    els.save.addEventListener("click", download);

    // 画像の遅延読込などでステージ幅が 0 → 実寸 に変わったときに描き直す
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () { apply(); }).observe(els.stage);
    } else {
      window.addEventListener("resize", apply);
    }
    window.addEventListener("load", apply);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(apply);
  }

  /* ------------------------------------------------------------ init --- */
  els.text.value = state.text;
  els.number.value = state.number;
  renderControls();
  bind();
  apply();
})();
