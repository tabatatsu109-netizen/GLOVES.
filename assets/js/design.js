/* ==========================================================================
   NOF — DESIGN SIMULATOR (専用ページ)
   素材 → カラー → プリント位置(左胸/右胸/胸中央/胸全面/背面) → 画像を自由配置
   → その場で完成イメージと概算金額。
   --------------------------------------------------------------------------
   商品を増やす/写真を差し替える → tools/build_catalog.py(素材/フォルダ)を参照。
   単価を変える                 → 下の PRICING を編集。
   プリント位置プリセットの調整   → tools/build_catalog.py の POS_BY_KIND を編集して再生成。
   ========================================================================== */
(function () {
  "use strict";

  var root = document.getElementById("studio");
  if (!root) return;

  var $  = function (s, r) { return (r || root).querySelector(s); };

  /* ------------------------------------------------------------- 価格データ */
  var PRICING = {
    taxRate: 0.10,
    quantityTiers: [
      { min: 1,   max: 3,   label: "1〜3枚" },
      { min: 4,   max: 9,   label: "4〜9枚" },
      { min: 10,  max: 19,  label: "10〜19枚" },
      { min: 20,  max: 39,  label: "20〜39枚" },
      { min: 40,  max: 49,  label: "40〜49枚" },
      { min: 50,  max: 69,  label: "50〜69枚" },
      { min: 70,  max: 99,  label: "70〜99枚" },
      { min: 100, max: null, label: "100枚〜" }
    ],
    multiLocationDiscount: [
      { locations: 1, rate: 0 },
      { locations: 2, rate: 0 },
      { locations: 3, rate: 0.15 },
      { locations: 4, rate: 0.20 }
    ],
    printPrices: {
      // 1〜19枚(先頭3要素)は少量対応の手間を踏まえ、20枚以降より高めの単価に設定(旧単価×1.2)。
      logo_light_1c: [2400, 1200, 720,  570, 510, 480, 450, 390],
      logo_dark_1c:  [1800, 1080, 840,  665, 595, 560, 525, 455],
      large_1c:      [2400, 1800, 1320, 1045, 935, 880, 825, 715],
      large_2c:      [3000, 2400, 1800, 1425, 1275, 1200, 1125, 975]
    }
  };

  var IMG = "../";

  // NOF公式ロゴ。生地の色(tone)に合わせて自動で白/黒を切り替える。
  var NOF_LOGO = {
    light: IMG + "assets/images/nof-logo-black.png", // 淡色生地には黒ロゴ
    dark: IMG + "assets/images/nof-logo-white.png"   // 濃色生地には白ロゴ
  };
  // NOFロゴを置ける位置: 前面は右胸/左胸のみ、背面は背面中央のみ。
  var NOF_FRONT_POSITIONS = ["rightChest", "leftChest"];
  var NOF_BACK_POSITION = "back";
  // NOFロゴの表示サイズ(位置プリセットの枠に対する縮尺)。
  // 胸ロゴは控えめな刺繍サイズ感、背中は大きめに、を参考画像に合わせて固定している。
  var NOF_SCALE = { chest: 0.48, back: 0.65 };
  var NOF_SCALE_RANGE = 0.25; // 基準サイズに対して ±25% まで調整可能

  function buildProducts() {
    var catalog = window.PRINT_CATALOG;
    if (!catalog) return [];
    return catalog.products.map(function (p) {
      var presets = catalog.posByKind[p.kind] || catalog.posByKind.tee;
      return {
        id: p.id, name: p.name, fabricNote: p.fabricNote,
        basePrice: p.basePrice, baseSource: p.baseSource,
        positions: presets,
        colors: p.colors.map(function (c) {
          return { id: c.id, name: c.name, hex: c.hex, tone: c.tone, img: { front: IMG + c.img.front, back: IMG + c.img.back } };
        })
      };
    });
  }

  var PRODUCTS = buildProducts();
  if (!PRODUCTS.length) return;

  /* ---------------------------------------------------------------- 状態 --- */
  var state = {
    productId: PRODUCTS[0].id,
    colorId: PRODUCTS[0].colors[0].id,
    viewId: "front",
    quantity: 10,
    selections: {}, // presetId -> { colorOption, dataUrl, scale, xPct, yPct, isNofLogo }
    nof: { front: null, back: false } // front: null | "leftChest" | "rightChest"
  };

  function product() { return PRODUCTS.filter(function (p) { return p.id === state.productId; })[0]; }
  function color() { return product().colors.filter(function (c) { return c.id === state.colorId; })[0]; }
  function presets() { return product().positions; }
  function presetsForView(viewId) { return presets().filter(function (p) { return p.view === viewId; }); }
  function byId(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return list[0]; }

  var els = {
    tabs: $("#pTabs"), colors: $("#pColors"), views: $("#pViews"), note: $("#pNote"),
    stage: $("#pzStage"), img: $("#pzImg"), overlay: $("#pzOverlay"),
    nofFront: $("#pNofFront"), nofBack: $("#pNofBack"),
    nofFrontScale: $("#pNofFrontScale"), nofBackScale: $("#pNofBackScale"),
    presetPicker: $("#pPresetPicker"), activeList: $("#pActiveList"),
    qtyVal: $("#pQtyVal"), tier: $("#pTier"),
    summary: $("#pSummary"),
    save: $("#pSave"), saveStatus: $("#pSaveStatus"),
    form: $("#pForm"), formStatus: $("#pFormStatus"), mailFallback: $("#pMailFallback"),
    stickybar: document.getElementById("pStickybar"),
    stickyValue: document.getElementById("pStickyValue"),
    stickyBtn: document.getElementById("pStickyBtn")
  };

  /* ------------------------------------------------------------- 価格計算 */
  function tierIndexFor(qty) {
    for (var i = 0; i < PRICING.quantityTiers.length; i++) {
      var t = PRICING.quantityTiers[i];
      if (qty >= t.min && (t.max === null || qty <= t.max)) return i;
    }
    return PRICING.quantityTiers.length - 1;
  }
  function printKeyFor(pos, colorOption, tone) {
    return pos.priceKey === "logo" ? ("logo_" + tone + "_" + colorOption) : (pos.priceKey + "_" + colorOption);
  }
  function discountRateFor(n) {
    var rows = PRICING.multiLocationDiscount.slice().reverse();
    for (var i = 0; i < rows.length; i++) if (n >= rows[i].locations) return rows[i].rate;
    return 0;
  }
  function computeQuote() {
    var sel = Object.keys(state.selections);
    if (!sel.length) return null;
    var tierIdx = tierIndexFor(state.quantity);
    var tier = PRICING.quantityTiers[tierIdx];
    var lines = sel.map(function (posId) {
      var pos = byId(presets(), posId);
      var s = state.selections[posId];
      var key = printKeyFor(pos, s.colorOption, color().tone);
      var table = PRICING.printPrices[key];
      return { pos: pos, price: table ? table[tierIdx] : null };
    });
    var missing = lines.some(function (l) { return l.price === null; });
    var printSubtotal = lines.reduce(function (s, l) { return s + (l.price || 0); }, 0);
    var discountRate = discountRateFor(sel.length);
    var printAfter = Math.round(printSubtotal * (1 - discountRate));
    var base = product().basePrice[color().tone] || 0;
    var perUnitEx = base + printAfter;
    var perUnitIn = Math.round(perUnitEx * (1 + PRICING.taxRate));
    return {
      ok: !missing, tier: tier, base: base, printSubtotal: printSubtotal,
      discountRate: discountRate, perUnitEx: perUnitEx, perUnitIn: perUnitIn,
      totalIn: perUnitIn * state.quantity, quantity: state.quantity
    };
  }

  /* ------------------------------------------------------- プリセット図解 -- */
  var SHIRT_OUTLINE = "M20 13 L38 3 L50 11 L62 3 L80 13 L93 26 L80 35 L74 29 L74 93 L26 93 L26 29 L20 35 L7 26 Z";
  function presetIconSVG(box, isBack) {
    return '<svg viewBox="0 0 100 100" class="preset-icon__svg" aria-hidden="true">' +
      '<path class="preset-icon__shirt" d="' + SHIRT_OUTLINE + '"/>' +
      (isBack ? '<path class="preset-icon__collar" d="M40 6 C44 12 56 12 60 6" fill="none"/>' : '') +
      '<rect class="preset-icon__zone" x="' + box.xPct + '" y="' + box.yPct + '" width="' + box.wPct + '" height="' + box.hPct + '" />' +
      '</svg>';
  }

  /* ------------------------------------------------------------- 描画 --- */
  function renderTabs() {
    els.tabs.innerHTML = PRODUCTS.map(function (p) {
      return '<button type="button" class="ds-chip' + (p.id === state.productId ? " is-on" : "") +
        '" data-product="' + p.id + '">' + p.name + '</button>';
    }).join("");
  }

  function renderColors() {
    els.colors.innerHTML = product().colors.map(function (c) {
      return '<button type="button" class="ds-swatch' + (c.id === state.colorId ? " is-on" : "") +
        '" data-color="' + c.id + '" title="' + c.name + '"><i style="background:' + c.hex + '"></i>' + c.name + '</button>';
    }).join("");
  }

  function renderViews() {
    var hasFront = presetsForView("front").length > 0;
    var hasBack = presetsForView("back").length > 0;
    var btns = [];
    if (hasFront) btns.push({ id: "front", label: "表" });
    if (hasBack) btns.push({ id: "back", label: "裏" });
    els.views.innerHTML = btns.length < 2 ? "" : btns.map(function (v) {
      return '<button type="button" class="ds-chip' + (v.id === state.viewId ? " is-on" : "") +
        '" data-view="' + v.id + '">' + v.label + '</button>';
    }).join("");
  }

  /* --------------------------------------------------------- 背景自動削除 -- */
  // 第一候補: ブラウザ内で動くAI(@imgly/background-removal, index.htmlでCDNから読み込み)。
  // 写真など複雑な背景にも対応できる。読み込み・初回推論に数秒〜十数秒かかることがある。
  // 失敗時・未読み込み時は、白/単色背景向けの簡易フラッドフィルにフォールバックする。
  function dataUrlToBlob(dataUrl) {
    return fetch(dataUrl).then(function (r) { return r.blob(); });
  }
  function blobToDataUrl(blob) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  // 透明になった余白をトリミングする。
  // 背景除去後の画像は、見えている絵柄の周りに透明な余白が残ったままのことが多く、
  // そのままだと配置枠(box)いっぱいに拡大しても絵柄自体は小さいまま表示されてしまう。
  // これを直すことで、スライダー100%(実寸)のときに絵柄がきちんと枠いっぱいまで来るようにする。
  function cropToOpaqueBounds(dataUrl) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () {
        var w = img.naturalWidth, h = img.naturalHeight;
        var cv = document.createElement("canvas");
        cv.width = w; cv.height = h;
        var ctx = cv.getContext("2d");
        ctx.drawImage(img, 0, 0);

        var data;
        try { data = ctx.getImageData(0, 0, w, h).data; } catch (err) { resolve(dataUrl); return; }

        var minX = w, minY = h, maxX = -1, maxY = -1;
        var ALPHA_MIN = 10;
        for (var y = 0; y < h; y++) {
          for (var x = 0; x < w; x++) {
            if (data[(y * w + x) * 4 + 3] > ALPHA_MIN) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        if (maxX < minX || maxY < minY) { resolve(dataUrl); return; } // 全面透明なら何もしない

        // 端がギリギリになりすぎないよう、少しだけ余白を残す
        var pad = Math.round(Math.max(maxX - minX, maxY - minY) * 0.03);
        minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
        maxX = Math.min(w - 1, maxX + pad); maxY = Math.min(h - 1, maxY + pad);

        var cw = maxX - minX + 1, ch = maxY - minY + 1;
        if (cw === w && ch === h) { resolve(dataUrl); return; } // 変化なし

        var out = document.createElement("canvas");
        out.width = cw; out.height = ch;
        out.getContext("2d").drawImage(cv, minX, minY, cw, ch, 0, 0, cw, ch);
        resolve(out.toDataURL("image/png"));
      };
      img.onerror = function () { resolve(dataUrl); };
      img.src = dataUrl;
    });
  }

  function removeBackgroundDataUrl(dataUrl) {
    var ready = window.NOF_bgRemovalReady || Promise.resolve(null);
    return ready.then(function (aiRemove) {
      if (!aiRemove) return removeBackgroundFloodFill(dataUrl).then(cropToOpaqueBounds);
      return dataUrlToBlob(dataUrl)
        .then(function (blob) { return aiRemove(blob); })
        .then(function (resultBlob) { return blobToDataUrl(resultBlob); })
        .then(cropToOpaqueBounds)
        .catch(function (err) {
          console.error("AI背景除去に失敗、簡易処理にフォールバックします", err);
          return removeBackgroundFloodFill(dataUrl).then(cropToOpaqueBounds);
        });
    });
  }

  // 白/単色背景向けの簡易フラッドフィル(AIが使えないときのフォールバック)。
  var BG_TOLERANCE = 32; // 背景色とみなす色距離のしきい値
  var BG_MAX_EDGE = 1400; // 処理前にこのサイズまで縮小(速度・保存容量のため)

  function removeBackgroundFloodFill(dataUrl) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () {
        var w = img.naturalWidth, h = img.naturalHeight;
        var scale = Math.min(1, BG_MAX_EDGE / Math.max(w, h));
        w = Math.max(1, Math.round(w * scale));
        h = Math.max(1, Math.round(h * scale));

        var cv = document.createElement("canvas");
        cv.width = w; cv.height = h;
        var ctx = cv.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);

        var imgData;
        try {
          imgData = ctx.getImageData(0, 0, w, h);
        } catch (err) {
          resolve(dataUrl); // 何らかの理由で読めなければ元画像のまま
          return;
        }
        var data = imgData.data;

        function at(x, y) { return (y * w + x) * 4; }
        function corner(x, y) { var i = at(x, y); return [data[i], data[i + 1], data[i + 2]]; }
        var c = [corner(0, 0), corner(w - 1, 0), corner(0, h - 1), corner(w - 1, h - 1)];
        var bg = [
          (c[0][0] + c[1][0] + c[2][0] + c[3][0]) / 4,
          (c[0][1] + c[1][1] + c[2][1] + c[3][1]) / 4,
          (c[0][2] + c[1][2] + c[2][2] + c[3][2]) / 4
        ];

        function matchesBg(i) {
          var dr = data[i] - bg[0], dg = data[i + 1] - bg[1], db = data[i + 2] - bg[2];
          return (dr * dr + dg * dg + db * db) <= BG_TOLERANCE * BG_TOLERANCE;
        }

        // 外周(4辺)を起点に、背景色とつながっている部分だけを透明化する。
        // ロゴの内側にある白(文字の隙間など)は起点から届かないので残る。
        var visited = new Uint8Array(w * h);
        var stack = [];
        var x, y;
        for (x = 0; x < w; x++) { stack.push(x, 0, x, h - 1); }
        for (y = 0; y < h; y++) { stack.push(0, y, w - 1, y); }

        while (stack.length) {
          var yy = stack.pop(), xx = stack.pop();
          if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
          var idx = yy * w + xx;
          if (visited[idx]) continue;
          visited[idx] = 1;
          var i = idx * 4;
          if (!matchesBg(i)) continue;
          data[i + 3] = 0;
          stack.push(xx + 1, yy, xx - 1, yy, xx, yy + 1, xx, yy - 1);
        }

        ctx.putImageData(imgData, 0, 0);
        resolve(cv.toDataURL("image/png"));
      };
      img.onerror = function () { resolve(dataUrl); };
      img.src = dataUrl;
    });
  }

  // sel.bgRemoved の現在値に合わせて sel.dataUrl を作り直し、画面に反映する。
  function applyBgSetting(id) {
    var sel = state.selections[id];
    if (!sel || !sel.rawDataUrl) return;

    var checkbox = els.activeList.querySelector('[data-bgremove="' + id + '"]');
    var statusEl = els.activeList.querySelector('[data-bgstatus="' + id + '"]');

    if (!sel.bgRemoved) {
      sel.dataUrl = sel.rawDataUrl;
      renderStage();
      return;
    }

    if (checkbox) checkbox.disabled = true;
    if (statusEl) statusEl.textContent = "背景を削除しています…(初回は10秒前後かかることがあります)";
    removeBackgroundDataUrl(sel.rawDataUrl).then(function (result) {
      // 処理中に画像が差し替えられていたら無視する
      if (state.selections[id] !== sel) return;
      sel.dataUrl = result;
      renderStage();
      var freshCheckbox = els.activeList.querySelector('[data-bgremove="' + id + '"]');
      if (freshCheckbox) freshCheckbox.disabled = false;
      var freshStatus = els.activeList.querySelector('[data-bgstatus="' + id + '"]');
      if (freshStatus) freshStatus.textContent = "";
    });
  }

  function renderStage() {
    var c = color();
    var photo = c.img && c.img[state.viewId];
    els.img.src = photo || "";
    els.note.hidden = true;

    els.overlay.innerHTML = "";
    presetsForView(state.viewId).forEach(function (pos) {
      var sel = state.selections[pos.id];
      var active = !!sel;
      if (!active) return; // 未選択の位置はガイド表示を出さない(重なって見づらくなるため)

      if (!sel.dataUrl) {
        // 画像を置くまでは目安の枠を表示。画像を置いたら枠は消してデザインだけを見せる。
        var box = document.createElement("div");
        box.className = "pz-box is-on";
        box.dataset.positionId = pos.id;
        box.style.left = pos.box.xPct + "%";
        box.style.top = pos.box.yPct + "%";
        box.style.width = pos.box.wPct + "%";
        box.style.height = pos.box.hPct + "%";
        box.innerHTML = '<span class="pz-box__label">' + pos.label + '</span>';
        els.overlay.appendChild(box);
      }

      if (sel.dataUrl) {
        if (sel.xPct == null) sel.xPct = pos.box.xPct + pos.box.wPct / 2;
        if (sel.yPct == null) sel.yPct = pos.box.yPct + pos.box.hPct / 2;

        var img = document.createElement("img");
        img.className = "pz-drag";
        img.src = sel.dataUrl;
        img.dataset.positionId = pos.id;
        img.style.setProperty("--w", pos.box.wPct * (sel.scale || 1) + "%");
        img.style.setProperty("--h", pos.box.hPct * (sel.scale || 1) + "%");
        img.style.left = sel.xPct + "%";
        img.style.top = sel.yPct + "%";
        els.overlay.appendChild(img);
        // NOFロゴもドラッグで位置調整できる(サイズだけ固定)。
        bindDrag(img, pos.id);
      }
    });

    els.save.disabled = !photo;
    els.saveStatus.textContent = "";
  }

  /* --------------------------------------------------------- ドラッグ移動 -- */
  function bindDrag(img, posId) {
    img.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      try { img.setPointerCapture(e.pointerId); } catch (err) { /* キャプチャ失敗時もドラッグ自体は続行する */ }
      img.classList.add("is-dragging");
      var stageRect = els.stage.getBoundingClientRect();

      function move(ev) {
        var xPct = ((ev.clientX - stageRect.left) / stageRect.width) * 100;
        var yPct = ((ev.clientY - stageRect.top) / stageRect.height) * 100;
        xPct = Math.max(0, Math.min(100, xPct));
        yPct = Math.max(0, Math.min(100, yPct));
        img.style.left = xPct + "%";
        img.style.top = yPct + "%";
        state.selections[posId].xPct = xPct;
        state.selections[posId].yPct = yPct;
      }
      function up() {
        img.classList.remove("is-dragging");
        img.removeEventListener("pointermove", move);
        img.removeEventListener("pointerup", up);
        img.removeEventListener("pointercancel", up);
      }
      img.addEventListener("pointermove", move);
      img.addEventListener("pointerup", up);
      img.addEventListener("pointercancel", up);
    });
  }

  /* ------------------------------------------------------------ NOFロゴ -- */
  function nofBaseScale(pid) { return pid === NOF_BACK_POSITION ? NOF_SCALE.back : NOF_SCALE.chest; }

  function makeNofSelection(pid) {
    var pos = byId(presets(), pid);
    return {
      colorOption: pos.colorOptions[0],
      dataUrl: NOF_LOGO[color().tone],
      rawDataUrl: null,
      bgRemoved: false,
      isNofLogo: true,
      scale: nofBaseScale(pid),
      xPct: pos.box.xPct + pos.box.wPct / 2,
      yPct: pos.box.yPct + pos.box.hPct / 2
    };
  }

  // カラーを変えたとき、既に置いてあるNOFロゴの白黒をその生地に合わせて差し替える。
  function refreshNofLogos() {
    Object.keys(state.selections).forEach(function (pid) {
      var sel = state.selections[pid];
      if (sel && sel.isNofLogo) sel.dataUrl = NOF_LOGO[color().tone];
    });
  }

  function setNofFront(choice) {
    NOF_FRONT_POSITIONS.forEach(function (pid) {
      if (state.selections[pid] && state.selections[pid].isNofLogo) delete state.selections[pid];
    });
    state.nof.front = choice;
    if (choice) {
      state.selections[choice] = makeNofSelection(choice);
      if (state.viewId !== "front") state.viewId = "front";
    }
  }

  function setNofBack(on) {
    if (state.selections[NOF_BACK_POSITION] && state.selections[NOF_BACK_POSITION].isNofLogo) {
      delete state.selections[NOF_BACK_POSITION];
    }
    state.nof.back = on;
    if (on) {
      state.selections[NOF_BACK_POSITION] = makeNofSelection(NOF_BACK_POSITION);
      state.viewId = "back";
    }
  }

  function nofScaleRowHtml(group, pid) {
    var base = nofBaseScale(pid);
    var min = (base * (1 - NOF_SCALE_RANGE)).toFixed(2);
    var max = (base * (1 + NOF_SCALE_RANGE)).toFixed(2);
    var current = state.selections[pid] ? state.selections[pid].scale : base;
    return '<div class="pscale"><span>サイズ</span>' +
      '<input type="range" min="' + min + '" max="' + max + '" step="0.01" value="' + current + '" data-nof-scale="' + group + '">' +
      '<button type="button" class="preset-reset" data-nof-reset="' + group + '">位置をリセット</button></div>';
  }

  function renderNofPicker() {
    if (els.nofFront) {
      var frontChoices = [{ id: null, label: "入れない" }].concat(
        NOF_FRONT_POSITIONS.map(function (pid) { return { id: pid, label: byId(presets(), pid).label }; })
      );
      els.nofFront.innerHTML = frontChoices.map(function (c) {
        var on = state.nof.front === c.id;
        return '<button type="button" class="ds-chip' + (on ? " is-on" : "") + '" data-nof-front="' + (c.id || "") + '">' + c.label + '</button>';
      }).join("");
      els.nofFrontScale.innerHTML = state.nof.front ? nofScaleRowHtml("front", state.nof.front) : "";
    }
    if (els.nofBack) {
      var backPos = byId(presets(), NOF_BACK_POSITION);
      var backChoices = [{ id: "", label: "入れない" }, { id: "1", label: backPos.label + "に入れる" }];
      els.nofBack.innerHTML = backChoices.map(function (c) {
        var on = (c.id === "1") === state.nof.back;
        return '<button type="button" class="ds-chip' + (on ? " is-on" : "") + '" data-nof-back="' + c.id + '">' + c.label + '</button>';
      }).join("");
      els.nofBackScale.innerHTML = state.nof.back ? nofScaleRowHtml("back", NOF_BACK_POSITION) : "";
    }
  }

  function renderPresetPicker() {
    els.presetPicker.innerHTML = presets().map(function (pos) {
      var sel = state.selections[pos.id];
      var on = !!sel;
      var lockedByNof = on && sel.isNofLogo;
      var cls = "preset-btn" + (on ? " is-on" : "") + (lockedByNof ? " is-locked" : "");
      return '<button type="button" class="' + cls + '"' + (lockedByNof ? " disabled" : "") + ' data-preset="' + pos.id + '">' +
        presetIconSVG(pos.box, pos.view === "back") +
        '<span class="preset-btn__label">' + pos.label + (lockedByNof ? "(NOFロゴ使用中)" : "") + '</span>' +
        '<span class="preset-btn__size">' + pos.sizeLabel + '</span>' +
        '</button>';
    }).join("");
  }

  function renderActiveList() {
    // NOFロゴは③のUIで管理するので、ここ(カスタムデザイン一覧)には出さない。
    var active = presets().filter(function (pos) {
      var sel = state.selections[pos.id];
      return sel && !sel.isNofLogo;
    });
    if (!active.length) {
      els.activeList.innerHTML = '<p class="psum__empty">上のボタンからプリントする位置を選んでください(複数選択可)。</p>';
      return;
    }
    els.activeList.innerHTML = "";
    active.forEach(function (pos) {
      var sel = state.selections[pos.id];
      var card = document.createElement("div");
      card.className = "pcard is-on";
      card.dataset.positionId = pos.id;

      var head = document.createElement("div");
      head.className = "pcard__head";
      head.innerHTML = '<span>' + pos.label + '<em>' + pos.sizeLabel + '</em></span>' +
        '<button type="button" class="pcard__remove" data-remove="' + pos.id + '" aria-label="' + pos.label + 'を削除">×</button>';
      card.appendChild(head);

      var body = document.createElement("div");
      body.className = "pcard__body";

      if (pos.colorOptions.length > 1) {
        var row = document.createElement("div");
        row.className = "ds-group ds-group--sm";
        row.innerHTML = pos.colorOptions.map(function (opt) {
          var on = sel.colorOption === opt;
          return '<button type="button" class="ds-chip' + (on ? " is-on" : "") +
            '" data-coloropt="' + pos.id + ':' + opt + '">' + (opt === "1c" ? "単色" : "2色以上") + '</button>';
        }).join("");
        body.appendChild(row);
      }

      var upload = document.createElement("label");
      upload.className = "pfile";
      upload.innerHTML = (sel.dataUrl ? '<span>デザイン画像(変更する)</span>' : '<span>デザイン画像をアップロード</span>') +
        '<input type="file" accept="image/png,image/jpeg,image/webp" data-upload="' + pos.id + '">';
      body.appendChild(upload);

      var bgRow = document.createElement("label");
      bgRow.className = "pbgcheck";
      bgRow.innerHTML = '<input type="checkbox" data-bgremove="' + pos.id + '"' + (sel.bgRemoved !== false ? " checked" : "") + '>' +
        '<span>背景を自動で削除(AI・数秒かかります)</span>';
      body.appendChild(bgRow);
      var bgStatus = document.createElement("span");
      bgStatus.className = "pbg-status";
      bgStatus.dataset.bgstatus = pos.id;
      body.appendChild(bgStatus);

      if (sel.dataUrl) {
        var scaleRow = document.createElement("div");
        scaleRow.className = "pscale";
        scaleRow.innerHTML = '<span>サイズ</span><input type="range" min="0.3" max="1" step="0.05" value="' +
          (sel.scale || 1) + '" data-scale="' + pos.id + '">' +
          '<button type="button" class="preset-reset" data-reset-pos="' + pos.id + '">位置をリセット</button>';
        body.appendChild(scaleRow);

        var dragHint = document.createElement("p");
        dragHint.className = "pcard__hint";
        dragHint.textContent = "※プレビュー上の画像をドラッグすると位置を動かせます";
        body.appendChild(dragHint);
      }

      if (pos.view !== state.viewId) {
        var hint = document.createElement("p");
        hint.className = "pcard__hint";
        hint.textContent = "※プレビュー上部の「" + (pos.view === "front" ? "表" : "裏") + "」タブで配置を確認できます";
        body.appendChild(hint);
      }

      card.appendChild(body);
      els.activeList.appendChild(card);
    });
  }

  function renderSummary() {
    var q = computeQuote();
    if (!q) {
      els.summary.innerHTML = '<p class="psum__empty">プリント位置を選ぶと概算金額が表示されます。</p>';
      els.tier.textContent = "";
      els.stickybar.hidden = true;
      document.body.classList.remove("has-pstickybar");
      return;
    }
    els.tier.textContent = "数量帯 " + q.tier.label;

    if (!q.ok) {
      els.summary.innerHTML = '<p class="psum__empty">この組み合わせは概算対象外です。お問い合わせください。</p>';
      els.stickybar.hidden = true;
      document.body.classList.remove("has-pstickybar");
      return;
    }

    var discountRow = q.discountRate > 0
      ? '<div class="psum__row psum__row--acc"><span>複数箇所割引</span><span>-' + Math.round(q.discountRate * 100) + '%</span></div>'
      : "";
    var baseNote = product().baseSource === "estimate" ? "(本体価格は概算) " : "";

    els.summary.innerHTML =
      '<div class="psum__row"><span>本体(' + product().name + ' / ' + color().name + ')</span><span>' + NOF.yen(q.base) + '</span></div>' +
      '<div class="psum__row"><span>プリント代</span><span>' + NOF.yen(q.printSubtotal) + '</span></div>' +
      discountRow +
      '<div class="psum__row psum__row--unit"><span>1着あたり(税抜)</span><span>' + NOF.yen(q.perUnitEx) + '</span></div>' +
      '<div class="psum__row psum__row--sub"><span>1着あたり(税込目安)</span><span>' + NOF.yen(q.perUnitIn) + '</span></div>' +
      '<div class="psum__row psum__row--total"><span>合計 × ' + q.quantity + '着</span><strong>' + NOF.yen(q.totalIn) + '</strong></div>' +
      '<p class="note" style="margin-top:10px">※' + baseNote + 'これは概算です。実際の金額はお見積もり時に確定します。</p>';

    els.stickyValue.textContent = NOF.yen(q.totalIn);
    els.stickybar.hidden = false;
    document.body.classList.add("has-pstickybar");
  }

  function renderAll() {
    renderTabs(); renderColors(); renderViews(); renderStage(); renderNofPicker(); renderPresetPicker(); renderActiveList(); renderSummary();
  }

  /* ------------------------------------------------------------ PNG保存 -- */
  function saveImage() {
    var p = product(), c = color();
    var src = c.img && c.img[state.viewId];
    if (!src) return;

    els.saveStatus.textContent = "画像を作成中…";
    els.save.disabled = true;

    var img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = function () {
      var S = 1400;
      var cv = document.createElement("canvas");
      cv.width = S; cv.height = S;
      var ctx = cv.getContext("2d");
      ctx.fillStyle = "#F5F5F2";
      ctx.fillRect(0, 0, S, S);

      var scale = Math.min(S / img.naturalWidth, S / img.naturalHeight);
      var dw = img.naturalWidth * scale, dh = img.naturalHeight * scale;
      var dx = (S - dw) / 2, dy = (S - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);

      var loaders = presetsForView(state.viewId)
        .filter(function (pos) { return state.selections[pos.id] && state.selections[pos.id].dataUrl; })
        .map(function (pos) {
          return new Promise(function (resolve) {
            var di = new Image();
            di.onload = function () {
              var sel = state.selections[pos.id];
              var box = pos.box;
              var cx = S * (sel.xPct != null ? sel.xPct : box.xPct + box.wPct / 2) / 100;
              var cy = S * (sel.yPct != null ? sel.yPct : box.yPct + box.hPct / 2) / 100;
              var s = sel.scale || 1;
              var boxW = S * box.wPct / 100 * s, boxH = S * box.hPct / 100 * s;
              var fit = Math.min(boxW / di.naturalWidth, boxH / di.naturalHeight);
              var iw = di.naturalWidth * fit, ih = di.naturalHeight * fit;
              var ix = cx - iw / 2, iy = cy - ih / 2;
              ctx.drawImage(di, ix, iy, iw, ih);
              resolve();
            };
            di.onerror = resolve;
            di.src = state.selections[pos.id].dataUrl;
          });
        });

      Promise.all(loaders).then(function () {
        cv.toBlob(function (blob) {
          var url = URL.createObjectURL(blob);
          var a = document.createElement("a");
          a.href = url;
          a.download = "NOF_design_" + p.id + "_" + c.id + "_" + state.viewId + ".png";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
          els.saveStatus.textContent = "画像を保存しました。お問い合わせの際に添付してください。";
          els.save.disabled = false;
        }, "image/png");
      });
    };
    img.onerror = function () {
      els.saveStatus.textContent = "画像の作成に失敗しました。";
      els.save.disabled = false;
    };
    img.src = src;
  }

  /* ------------------------------------------------------------ 送信 --- */
  // 公開設定(assets/js/site-config.js)。送信先が未設定なら「送信しました」と偽らず、
  // メールでの相談を案内する。core.js のデモモード(localStorage保存)はここでは使わない。
  var SITE = window.NOF_SITE || {};

  function looksLikeEmail(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s); }

  /** 見積もり内容を人が読める行にまとめる(メール本文・フォーム送信の両方で使う) */
  function inquiryLines(q, name, contact, memo, orderNumber) {
    var p = product(), c = color();
    var positions = Object.keys(state.selections).map(function (id) {
      var pos = byId(presets(), id), s = state.selections[id];
      return pos.label + (s.isNofLogo ? "(NOFロゴ)" : "") + " / " + (s.colorOption === "2c" ? "2色" : "1色");
    });
    return {
      "受付番号": orderNumber,
      "お名前": name,
      "連絡先": contact,
      "商品": p.name + "（" + p.fabricNote + "）",
      "カラー": c.name + "（" + c.id + "）",
      "数量": state.quantity + "枚（" + q.tier.label + "）",
      "プリント位置": positions.join("、"),
      "概算": "1着 " + NOF.yen(q.perUnitIn) + "（税込目安）／ 合計 " + NOF.yen(q.totalIn),
      "ご要望・チーム名": memo || "（なし）"
    };
  }

  function mailtoHref(lines, subject) {
    var body = Object.keys(lines).map(function (k) { return k + ": " + lines[k]; }).join("\n");
    body += "\n\n※シミュレーターで保存した画像を添付してください。";
    return "mailto:" + SITE.contactEmail + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  }

  /** 「メールで相談する」ボタンとフッターの連絡先。contactEmail が無ければ出さない。 */
  function renderContact() {
    var footer = document.getElementById("pFooterContact");
    if (!SITE.contactEmail) {
      if (els.mailFallback) els.mailFallback.hidden = true;
      if (footer) footer.textContent = "";
      return;
    }
    var mail = NOF.escapeHtml(SITE.contactEmail);
    if (footer) footer.innerHTML = 'お問い合わせ: <a href="mailto:' + mail + '">' + mail + '</a>';
    if (els.mailFallback) {
      els.mailFallback.hidden = false;
      els.mailFallback.innerHTML =
        '<a class="btn btn--ghost btn--full" href="mailto:' + mail + '" data-mail>メールで相談する<span class="btn__arrow">→</span></a>' +
        '<p class="note">メールソフトが開きます。入力中の見積もり内容が本文に入るので、保存した画像を添付して送ってください。</p>';
    }
  }

  /** メールボタンを押した瞬間に、いま選んでいる内容を本文へ入れる */
  function fillMailLink(a) {
    var fd = new FormData(els.form);
    var q = computeQuote();
    var orderNumber = NOF.orderNumber();
    var lines = q && q.ok
      ? inquiryLines(q, (fd.get("name") || "").trim(), (fd.get("contact") || "").trim(), (fd.get("memo") || "").trim(), orderNumber)
      : { "受付番号": orderNumber, "お名前": (fd.get("name") || "").trim(), "連絡先": (fd.get("contact") || "").trim(), "ご要望・チーム名": (fd.get("memo") || "").trim() || "（なし）" };
    a.href = mailtoHref(lines, "[NOF ORIGINAL PRINT] 見積もり相談 " + orderNumber);
  }

  function postInquiry(fields) {
    var ctrl = ("AbortController" in window) ? new AbortController() : null;
    var timer = ctrl && setTimeout(function () { ctrl.abort(); }, 15000);
    return fetch(SITE.printInquiryEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(fields),
      signal: ctrl ? ctrl.signal : undefined
    }).then(function (res) {
      if (timer) clearTimeout(timer);
      if (!res.ok) throw new Error("inquiry failed: " + res.status);
      return res;
    }, function (err) {
      if (timer) clearTimeout(timer);
      throw err;
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    var q = computeQuote();
    if (!q || !q.ok) {
      els.formStatus.textContent = "プリント位置を選んでから送信してください。";
      els.formStatus.className = "form-status is-error";
      return;
    }
    var fd = new FormData(els.form);
    var name = (fd.get("name") || "").trim();
    var contact = (fd.get("contact") || "").trim();
    var memo = (fd.get("memo") || "").trim();
    if (!name || !contact) {
      els.formStatus.textContent = "お名前と連絡先を入力してください。";
      els.formStatus.className = "form-status is-error";
      return;
    }

    if (!SITE.printInquiryEndpoint) {
      els.formStatus.textContent = SITE.contactEmail
        ? "フォームからの送信は現在準備中です。お手数ですが、下の「メールで相談する」からご連絡ください。"
        : "フォームからの送信は現在準備中です。お手数ですが、保存した画像を添えて直接お問い合わせください。";
      els.formStatus.className = "form-status is-error";
      return;
    }

    var btn = els.form.querySelector(".submit-btn");
    btn.disabled = true;
    els.formStatus.textContent = "送信中です…";
    els.formStatus.className = "form-status is-pending";

    var orderNumber = NOF.orderNumber();
    var fields = inquiryLines(q, name, contact, memo, orderNumber);
    fields._subject = "[NOF ORIGINAL PRINT] 見積もり依頼 " + orderNumber;
    if (looksLikeEmail(contact)) fields._replyto = contact;
    fields["送信元"] = location.href;

    postInquiry(fields).then(function () {
      els.formStatus.textContent = "送信しました。担当者よりご連絡いたします。(受付番号 " + orderNumber + ")";
      els.formStatus.className = "form-status is-ok";
      btn.disabled = false;
      els.form.reset();
    }).catch(function () {
      els.formStatus.textContent = SITE.contactEmail
        ? "送信に失敗しました。お手数ですが、下の「メールで相談する」からご連絡ください。"
        : "送信に失敗しました。お手数ですが直接お問い合わせください。";
      els.formStatus.className = "form-status is-error";
      btn.disabled = false;
    });
  }

  /* ------------------------------------------------------------- 入力 --- */
  function bind() {
    root.addEventListener("click", function (e) {
      var t;
      if ((t = e.target.closest("[data-product]"))) {
        state.productId = t.dataset.product;
        state.colorId = product().colors[0].id;
        state.viewId = "front";
        state.selections = {};
        state.nof = { front: null, back: false };
        renderAll();
      } else if ((t = e.target.closest("[data-color]"))) {
        state.colorId = t.dataset.color;
        refreshNofLogos();
        renderStage(); renderColors(); renderSummary();
      } else if ((t = e.target.closest("[data-view]"))) {
        state.viewId = t.dataset.view;
        renderViews(); renderStage(); renderActiveList();
      } else if ((t = e.target.closest("[data-nof-front]"))) {
        setNofFront(t.dataset.nofFront || null);
        renderViews(); renderStage(); renderNofPicker(); renderPresetPicker(); renderActiveList(); renderSummary();
      } else if ((t = e.target.closest("[data-nof-back]"))) {
        setNofBack(t.dataset.nofBack === "1");
        renderViews(); renderStage(); renderNofPicker(); renderPresetPicker(); renderActiveList(); renderSummary();
      } else if ((t = e.target.closest("[data-nof-reset]"))) {
        var whichPid = t.dataset.nofReset === "back" ? NOF_BACK_POSITION : state.nof.front;
        if (whichPid && state.selections[whichPid]) {
          var nofPos = byId(presets(), whichPid);
          state.selections[whichPid].xPct = nofPos.box.xPct + nofPos.box.wPct / 2;
          state.selections[whichPid].yPct = nofPos.box.yPct + nofPos.box.hPct / 2;
        }
        renderStage();
      } else if ((t = e.target.closest("[data-preset]"))) {
        var pid = t.dataset.preset;
        if (state.selections[pid] && state.selections[pid].isNofLogo) {
          return; // NOFロゴ使用中の位置はカスタムデザインを置けない(③で解除してから)
        }
        if (state.selections[pid]) {
          // 既に選択済みの位置をもう一度押しても、デザインは消さない。
          // 削除は下の「×」ボタンだけで行う(誤操作でやり直しになるのを防ぐ)。
          var existingCard = els.activeList.querySelector('.pcard[data-position-id="' + pid + '"]');
          if (existingCard) existingCard.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          var pos = byId(presets(), pid);
          state.selections[pid] = { colorOption: pos.colorOptions[0], dataUrl: null, rawDataUrl: null, bgRemoved: true, scale: 1 };
          if (pos.view !== state.viewId) state.viewId = pos.view;
          renderViews(); renderStage(); renderPresetPicker(); renderActiveList(); renderSummary();
        }
      } else if ((t = e.target.closest("[data-remove]"))) {
        delete state.selections[t.dataset.remove];
        renderStage(); renderPresetPicker(); renderActiveList(); renderSummary();
      } else if ((t = e.target.closest("[data-coloropt]"))) {
        var parts = t.dataset.coloropt.split(":");
        state.selections[parts[0]].colorOption = parts[1];
        renderActiveList(); renderSummary();
      } else if ((t = e.target.closest("[data-pqty]"))) {
        state.quantity = Math.max(1, state.quantity + Number(t.dataset.pqty));
        els.qtyVal.value = state.quantity;
        renderSummary();
      } else if ((t = e.target.closest("[data-reset-pos]"))) {
        var rid = t.dataset.resetPos;
        var rpos = byId(presets(), rid);
        state.selections[rid].xPct = rpos.box.xPct + rpos.box.wPct / 2;
        state.selections[rid].yPct = rpos.box.yPct + rpos.box.hPct / 2;
        state.selections[rid].scale = 1;
        renderStage(); renderActiveList();
      }
    });

    root.addEventListener("change", function (e) {
      var t = e.target;
      if (t.matches("[data-upload]")) {
        var id = t.dataset.upload;
        var file = t.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
          alert("画像は5MB以下にしてください。");
          t.value = "";
          return;
        }
        var reader = new FileReader();
        reader.onload = function () {
          var sel = state.selections[id];
          sel.rawDataUrl = reader.result;
          sel.dataUrl = reader.result;
          renderStage(); renderActiveList();
          applyBgSetting(id);
        };
        reader.readAsDataURL(file);
      } else if (t.matches("[data-bgremove]")) {
        var bgId = t.dataset.bgremove;
        state.selections[bgId].bgRemoved = t.checked;
        applyBgSetting(bgId);
      } else if (t.id === "pQtyVal") {
        state.quantity = Math.max(1, parseInt(t.value, 10) || 1);
        renderSummary();
      }
    });

    root.addEventListener("input", function (e) {
      var t = e.target;
      if (t.matches("[data-scale]")) {
        var id = t.dataset.scale;
        state.selections[id].scale = Number(t.value);
        var pos = byId(presets(), id);
        var imgEl = els.overlay.querySelector('.pz-drag[data-position-id="' + id + '"]');
        if (imgEl) {
          imgEl.style.setProperty("--w", pos.box.wPct * state.selections[id].scale + "%");
          imgEl.style.setProperty("--h", pos.box.hPct * state.selections[id].scale + "%");
        }
      } else if (t.matches("[data-nof-scale]")) {
        var nofPid = t.dataset.nofScale === "back" ? NOF_BACK_POSITION : state.nof.front;
        if (!nofPid || !state.selections[nofPid]) return;
        state.selections[nofPid].scale = Number(t.value);
        var nPos = byId(presets(), nofPid);
        var nImg = els.overlay.querySelector('.pz-drag[data-position-id="' + nofPid + '"]');
        if (nImg) {
          nImg.style.setProperty("--w", nPos.box.wPct * state.selections[nofPid].scale + "%");
          nImg.style.setProperty("--h", nPos.box.hPct * state.selections[nofPid].scale + "%");
        }
      }
    });

    els.save.addEventListener("click", saveImage);
    els.form.addEventListener("submit", handleSubmit);
    if (els.mailFallback) {
      els.mailFallback.addEventListener("click", function (e) {
        var a = e.target.closest("[data-mail]");
        if (a) fillMailLink(a);
      });
    }
    els.stickyBtn.addEventListener("click", function () {
      $("#pSummary").scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  els.qtyVal.value = state.quantity;
  bind();
  renderContact();
  renderAll();
})();
