/* ==========================================================================
   NOF — Team store (商品 → 注文フォーム → 確認 → 完了)
   ========================================================================== */
(function () {
  "use strict";

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var team = NOF.getTeam(NOF.resolveSlug());
  var SIZES = NOF.config.product.sizes;
  var DELIVERY = NOF.config.deliveryMethods;

  /* ------------------------------------------------------------- state --- */
  var uid = 0;
  function newPlayer() {
    return { id: ++uid, name: "", number: "", size: "M", qty: 1 };
  }

  var state = {
    players: [newPlayer()],
    customer: { customerName: "", email: "", tel: "", delivery: DELIVERY[0].id, address: "", note: "" },
    activePlayer: 1,
    order: null
  };

  /* --------------------------------------------------------- not found --- */
  if (!team) {
    $("#viewNotFound").hidden = false;
    $("#nfTeamLinks").innerHTML = NOF.listTeams().map(function (t) {
      return '<li><a href="' + NOF.teamUrl(t.slug) + '">' + NOF.escapeHtml(t.teamName) +
             '<i>/team/' + t.slug + '</i></a></li>';
    }).join("");
    return;
  }

  document.title = team.teamName + " ｜ " + team.productName + " ｜ NO FOOTBALL";

  /* ----------------------------------------------------------- helpers --- */
  var PRINT_LABEL = {
    "logo-number": "チームロゴ ＋ 背番号",
    "name-number": "チーム名 ＋ 背番号",
    "name": "チーム名",
    "logo": "チームロゴ"
  };

  function formatDeadline(iso) {
    if (!iso) return "—";
    var p = iso.split("-");
    if (p.length !== 3) return iso;
    return Number(p[1]) + "月" + Number(p[2]) + "日 まで";
  }

  function totalQty() {
    return state.players.reduce(function (s, p) { return s + (Number(p.qty) || 0); }, 0);
  }

  /* -------------------------------------------------------- team hero --- */
  function renderTeam() {
    $("#hdTeamName").textContent = team.teamName;
    $("#teamName").textContent = team.teamName;
    $("#teamProduct").textContent = team.productName;
    if (team.teamNote) {
      $("#teamClubRow").hidden = false;
      $("#teamClub").textContent = team.teamNote;
    }
    $("#teamPrice").textContent = NOF.yen(team.price);
    $("#teamDesc").textContent = team.description || "";
    $("#teamPrint").textContent = PRINT_LABEL[team.printType] || "チーム名 ／ ロゴ ／ 背番号";
    $("#teamDeadline").textContent = formatDeadline(team.deadline);

    if (team.logo) {
      var box = $("#teamLogo");
      box.hidden = false;
      box.classList.add("fig", "team-logo--" + (team.logo.shape || "rect"));
      if (team.logo.ratio) box.style.aspectRatio = team.logo.ratio;
      box.innerHTML = '<img src="' + team.logo.src + '" alt="' + NOF.escapeHtml(team.teamName) + ' ロゴ">';
      NOF.applyFocal(box, team.logo);
    }

    var gallery = (team.gallery && team.gallery.length) ? team.gallery : [team.hero];
    setHeroShot(gallery[0]);
    $("#heroThumbs").innerHTML = gallery.map(function (g, i) {
      return '<li><button type="button" class="thumb fig' + (i === 0 ? " is-on" : "") + '" data-shot="' + i + '"' +
             ' style="--px:' + g.px + '%; --py:' + g.py + '%; --z:' + g.z + '"' +
             ' aria-label="商品画像 ' + (i + 1) + '"><img src="' + g.src + '" alt=""></button></li>';
    }).join("");

    $("#heroThumbs").addEventListener("click", function (e) {
      var b = e.target.closest("[data-shot]");
      if (!b) return;
      $$(".thumb", $("#heroThumbs")).forEach(function (t) { t.classList.remove("is-on"); });
      b.classList.add("is-on");
      setHeroShot(gallery[Number(b.dataset.shot)]);
    });
  }

  function setHeroShot(spec) {
    var fig = $("#heroFig"), img = $("#heroImg");
    img.src = spec.src;
    img.alt = spec.alt || (team.teamName + " " + team.productName);
    NOF.applyFocal(fig, spec);
  }

  /* --------------------------------------------------------- preview --- */
  function renderPreviewStatic() {
    var name = $("#pvName"), logo = $("#pvLogo");
    var usesLogo = !!team.logo && team.printType.indexOf("logo") === 0;
    if (usesLogo) {
      logo.hidden = false;
      logo.classList.add("team-logo--" + (team.logo.shape || "rect"));
      if (team.logo.ratio) logo.style.aspectRatio = team.logo.ratio;
      $("img", logo).src = team.logo.src;
      NOF.applyFocal(logo, team.logo);
      name.hidden = true;
    } else {
      logo.hidden = true;
      name.hidden = false;
      name.textContent = team.teamName;
      // 長いチーム名は小さく組む
      name.style.fontSize = team.teamName.length > 10 ? "clamp(11px, 3.2vw, 15px)"
                          : team.teamName.length > 6  ? "clamp(13px, 4vw, 19px)"
                          : "clamp(16px, 5vw, 24px)";
    }
    $("#pvNum").hidden = team.printType.indexOf("number") === -1;
  }

  function updatePreview() {
    var p = state.players.filter(function (x) { return x.id === state.activePlayer; })[0] || state.players[0];
    if (!p) return;
    var num = $("#pvNum");
    var next = p.number === "" ? "—" : p.number;
    if (num.textContent !== next) {
      num.textContent = next;
      num.classList.remove("is-bump");
      void num.offsetWidth;               // reflow でアニメーションを再生
      num.classList.add("is-bump");
      setTimeout(function () { num.classList.remove("is-bump"); }, 180);
    }
    $("#pvBadge").textContent = "PLAYER " + String(state.players.indexOf(p) + 1).padStart(2, "0") +
                                " / " + p.size;
  }

  /* ---------------------------------------------------------- players --- */
  function playerMarkup(p, i) {
    var no = String(i + 1).padStart(2, "0");
    return '' +
    '<article class="player" data-id="' + p.id + '">' +
      '<header class="player__head">' +
        '<span class="player__no">PLAYER ' + no + '</span>' +
        (i > 0 ? '<button type="button" class="player__remove" data-remove="' + p.id + '">削除</button>' : '') +
      '</header>' +

      '<div class="fields fields--2">' +
        '<label class="field">' +
          '<span class="field__label">選手名 <i>必須</i></span>' +
          '<input type="text" data-f="name" value="' + NOF.escapeHtml(p.name) + '" placeholder="山田 太郎" autocomplete="off">' +
          '<span class="field__error" data-error></span>' +
        '</label>' +
        '<label class="field">' +
          '<span class="field__label">背番号 <i>必須</i></span>' +
          '<input type="text" data-f="number" value="' + NOF.escapeHtml(p.number) + '" placeholder="10" inputmode="numeric" pattern="[0-9]*" maxlength="3" autocomplete="off">' +
          '<span class="field__error" data-error></span>' +
        '</label>' +
      '</div>' +

      '<div class="picker">' +
        '<div class="picker__head">' +
          '<span class="field__label">サイズ <i>必須</i></span>' +
          '<button type="button" class="link-btn" data-size-guide>サイズを見る</button>' +
        '</div>' +
        '<div class="sizebtns" role="group" aria-label="サイズ">' +
          SIZES.map(function (s) {
            return '<button type="button" class="sizebtn' + (p.size === s.id ? " is-on" : "") + '" data-size="' + s.id + '">' +
                     '<span class="sizebtn__id">' + s.label + '</span>' +
                     '<span class="sizebtn__dim">' + s.height + '×' + s.width + 'cm</span>' +
                   '</button>';
          }).join("") +
        '</div>' +
      '</div>' +

      '<div class="picker picker--row">' +
        '<span class="field__label">数量</span>' +
        '<div class="qty">' +
          '<button type="button" class="qty__btn" data-qty="-1" aria-label="数量を減らす">−</button>' +
          '<input class="qty__val" type="text" data-f="qty" value="' + p.qty + '" inputmode="numeric" pattern="[0-9]*" aria-label="数量">' +
          '<button type="button" class="qty__btn" data-qty="1" aria-label="数量を増やす">＋</button>' +
        '</div>' +
        '<span class="player__sub" data-sub></span>' +
      '</div>' +
    '</article>';
  }

  function renderPlayers() {
    $("#players").innerHTML = state.players.map(playerMarkup).join("");
    updateSubtotals();
  }

  function updateSubtotals() {
    $$("[data-id]", $("#players")).forEach(function (el) {
      var p = getPlayer(Number(el.dataset.id));
      if (!p) return;
      var sub = $("[data-sub]", el);
      if (sub) sub.textContent = NOF.yen(team.price) + " × " + p.qty + " = " + NOF.yen(team.price * p.qty);
    });
  }

  function getPlayer(id) {
    return state.players.filter(function (p) { return p.id === id; })[0];
  }

  /* ---------------------------------------------------------- summary --- */
  function renderSummary() {
    var calc = NOF.calcOrder(team, state.players);
    $("#summary").innerHTML = '' +
      '<div class="summary__row">' +
        '<span>' + NOF.yen(calc.unitPrice) + ' × ' + calc.quantity + '双</span>' +
        '<span>' + NOF.yen(calc.subtotal) + '</span>' +
      '</div>' +
      '<div class="summary__row summary__row--total">' +
        '<span>合計</span>' +
        '<strong>' + NOF.yen(calc.subtotal) + '</strong>' +
      '</div>';
    $("#stickyTotal").textContent = NOF.yen(calc.subtotal);
    $("#stickyBtn").disabled = calc.quantity < 1;
    return calc;
  }

  /* ---------------------------------------------------------- deliver --- */
  function renderDelivery() {
    $("#deliveryChoice").innerHTML = DELIVERY.map(function (d) {
      return '<button type="button" class="choice__btn' + (state.customer.delivery === d.id ? " is-on" : "") + '" data-delivery="' + d.id + '">' +
             d.label + '</button>';
    }).join("");
    var cur = DELIVERY.filter(function (d) { return d.id === state.customer.delivery; })[0];
    $("#deliveryNote").textContent = cur ? cur.note : "";
    $("#addressField").classList.toggle("field--hidden", state.customer.delivery !== "individual");
  }

  /* ------------------------------------------------------- validation --- */
  function clearErrors(root) {
    $$("[data-error]", root).forEach(function (e) { e.textContent = ""; });
    $$(".is-invalid", root).forEach(function (e) { e.classList.remove("is-invalid"); });
  }

  function setError(input, msg) {
    input.classList.add("is-invalid");
    var box = input.parentElement.querySelector("[data-error]");
    if (box) box.textContent = msg;
  }

  function validate() {
    var form = $("#orderForm");
    clearErrors(form);
    var firstBad = null;

    $$("[data-id]", $("#players")).forEach(function (el) {
      var p = getPlayer(Number(el.dataset.id));
      var nameEl = $('[data-f="name"]', el);
      var numEl  = $('[data-f="number"]', el);
      if (!p.name.trim()) { setError(nameEl, "選手名を入力してください"); firstBad = firstBad || nameEl; }
      if (!/^\d{1,3}$/.test(String(p.number))) { setError(numEl, "背番号を数字で入力してください"); firstBad = firstBad || numEl; }
      if (!(Number(p.qty) >= 1)) { firstBad = firstBad || $('[data-f="qty"]', el); }
    });

    var c = state.customer;
    var nameI = form.customerName, mailI = form.email, telI = form.tel;
    if (!c.customerName.trim()) { setError(nameI, "注文者名を入力してください"); firstBad = firstBad || nameI; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email.trim())) { setError(mailI, "メールアドレスをご確認ください"); firstBad = firstBad || mailI; }
    if (!/^[\d\-+() ]{9,}$/.test(c.tel.trim())) { setError(telI, "電話番号をご確認ください"); firstBad = firstBad || telI; }

    var err = $("#formError");
    if (firstBad) {
      err.hidden = false;
      err.textContent = "入力内容をご確認ください。";
      firstBad.scrollIntoView({ block: "center", behavior: "smooth" });
      firstBad.focus({ preventScroll: true });
      return false;
    }
    err.hidden = true;
    return true;
  }

  /* ------------------------------------------------------------ views --- */
  var VIEWS = { store: "#viewStore", confirm: "#viewConfirm", done: "#viewDone" };

  function showView(name, push) {
    Object.keys(VIEWS).forEach(function (k) { $(VIEWS[k]).hidden = k !== name; });
    $("#stickybar").hidden = name !== "store";
    document.body.classList.toggle("has-stickybar", name === "store");
    window.scrollTo({ top: 0, behavior: "auto" });
    if (push) history.pushState({ view: name }, "", location.pathname + location.search + (name === "store" ? "" : "#" + name));
  }

  window.addEventListener("popstate", function (e) {
    var v = (e.state && e.state.view) || "store";
    if (v === "done") v = "store"; // 完了後に戻ったら注文画面へ
    showView(v, false);
  });

  /* ---------------------------------------------------- confirm/done --- */
  function orderLinesMarkup() {
    return '<ul class="lines">' + state.players.map(function (p, i) {
      return '<li class="line">' +
        '<span class="line__no">PLAYER ' + String(i + 1).padStart(2, "0") + '</span>' +
        '<span class="line__name">' + NOF.escapeHtml(p.name) + '</span>' +
        '<span class="line__spec">No.' + NOF.escapeHtml(p.number) + '</span>' +
        '<span class="line__spec">' + p.size + '</span>' +
        '<span class="line__spec">' + p.qty + '双</span>' +
        '<span class="line__price">' + NOF.yen(team.price * p.qty) + '</span>' +
      '</li>';
    }).join("") + '</ul>';
  }

  function customerMarkup() {
    var c = state.customer;
    var d = DELIVERY.filter(function (x) { return x.id === c.delivery; })[0];
    return '<dl class="kv">' +
      '<div><dt>注文者名</dt><dd>' + NOF.escapeHtml(c.customerName) + '</dd></div>' +
      '<div><dt>メール</dt><dd>' + NOF.escapeHtml(c.email) + '</dd></div>' +
      '<div><dt>電話番号</dt><dd>' + NOF.escapeHtml(c.tel) + '</dd></div>' +
      '<div><dt>お受け取り</dt><dd>' + (d ? d.label : "—") + '</dd></div>' +
      (c.delivery === "individual" && c.address.trim()
        ? '<div><dt>お届け先</dt><dd>' + NOF.escapeHtml(c.address) + '</dd></div>' : '') +
      (c.note.trim() ? '<div><dt>備考</dt><dd>' + NOF.escapeHtml(c.note) + '</dd></div>' : '') +
    '</dl>';
  }

  function renderConfirm() {
    var calc = NOF.calcOrder(team, state.players);
    $("#cfTeam").textContent = team.teamName + " — " + team.productName;
    $("#cfBody").innerHTML =
      '<section class="cf-sec"><p class="kicker kicker--plain">ITEMS</p>' + orderLinesMarkup() + '</section>' +
      '<section class="cf-sec"><p class="kicker kicker--plain">TOTAL</p>' +
        '<div class="summary">' +
          '<div class="summary__row"><span>' + NOF.yen(calc.unitPrice) + ' × ' + calc.quantity + '双</span><span>' + NOF.yen(calc.subtotal) + '</span></div>' +
          '<div class="summary__row summary__row--total"><span>商品合計</span><strong>' + NOF.yen(calc.subtotal) + '</strong></div>' +
        '</div>' +
      '</section>' +
      '<section class="cf-sec"><p class="kicker kicker--plain">CONTACT</p>' + customerMarkup() + '</section>';
  }

  function buildPayload() {
    var calc = NOF.calcOrder(team, state.players);
    return {
      orderNumber: NOF.orderNumber(),
      createdAt: new Date().toISOString(),
      team: { slug: team.slug, teamName: team.teamName, productName: team.productName },
      items: state.players.map(function (p) {
        return {
          playerName: p.name.trim(),
          number: String(p.number),
          size: p.size,
          quantity: Number(p.qty),
          unitPrice: team.price,
          lineTotal: team.price * Number(p.qty)
        };
      }),
      customer: {
        name: state.customer.customerName.trim(),
        email: state.customer.email.trim(),
        tel: state.customer.tel.trim(),
        delivery: state.customer.delivery,
        address: state.customer.address.trim(),
        note: state.customer.note.trim()
      },
      totals: {
        quantity: calc.quantity,
        unitPrice: calc.unitPrice,
        subtotal: calc.subtotal
      },
      /* ---- 内部管理用（購入者画面には表示しない） ---- */
      internal: {
        wholesaleUnitPrice: calc.wholesaleUnitPrice,
        wholesaleTotal: calc.wholesaleTotal,
        teamMarginUnit: calc.teamMarginUnit,
        teamMarginTotal: calc.teamMarginTotal
      }
    };
  }

  function renderDone(payload) {
    $("#doneMeta").innerHTML =
      '<div><dt>注文番号</dt><dd class="done__code">' + payload.orderNumber + '</dd></div>' +
      '<div><dt>チーム</dt><dd>' + NOF.escapeHtml(payload.team.teamName) + '</dd></div>' +
      '<div><dt>数量</dt><dd>' + payload.totals.quantity + '双</dd></div>' +
      '<div><dt>商品合計</dt><dd>' + NOF.yen(payload.totals.subtotal) + '</dd></div>';
    $("#doneBody").innerHTML =
      '<section class="cf-sec"><p class="kicker kicker--plain">ITEMS</p>' + orderLinesMarkup() + '</section>';
  }

  /* ------------------------------------------------------------ events -- */
  function bind() {
    var players = $("#players");

    // 入力（選手）
    players.addEventListener("input", function (e) {
      var el = e.target.closest("[data-f]");
      if (!el) return;
      var card = el.closest("[data-id]");
      var p = getPlayer(Number(card.dataset.id));
      var f = el.dataset.f;

      if (f === "number") {
        el.value = el.value.replace(/[^\d]/g, "").slice(0, 3);
        p.number = el.value;
      } else if (f === "qty") {
        el.value = el.value.replace(/[^\d]/g, "").slice(0, 2);
        p.qty = el.value === "" ? "" : Math.max(1, Number(el.value));
      } else {
        p[f] = el.value;
      }

      state.activePlayer = p.id;
      updateSubtotals();
      renderSummary();
      updatePreview();
    });

    players.addEventListener("focusin", function (e) {
      var card = e.target.closest("[data-id]");
      if (!card) return;
      state.activePlayer = Number(card.dataset.id);
      updatePreview();
    });

    players.addEventListener("blur", function (e) {
      var el = e.target.closest('[data-f="qty"]');
      if (!el) return;
      var p = getPlayer(Number(el.closest("[data-id]").dataset.id));
      if (!(Number(p.qty) >= 1)) { p.qty = 1; el.value = 1; updateSubtotals(); renderSummary(); }
    }, true);

    // サイズ / 数量 / 削除
    players.addEventListener("click", function (e) {
      var card = e.target.closest("[data-id]");
      if (!card) return;
      var p = getPlayer(Number(card.dataset.id));

      var sizeBtn = e.target.closest("[data-size]");
      if (sizeBtn) {
        p.size = sizeBtn.dataset.size;
        $$(".sizebtn", card).forEach(function (b) { b.classList.toggle("is-on", b === sizeBtn); });
        state.activePlayer = p.id;
        updatePreview();
        return;
      }

      var qtyBtn = e.target.closest("[data-qty]");
      if (qtyBtn) {
        p.qty = Math.min(99, Math.max(1, (Number(p.qty) || 1) + Number(qtyBtn.dataset.qty)));
        $('[data-f="qty"]', card).value = p.qty;
        state.activePlayer = p.id;
        updateSubtotals();
        renderSummary();
        updatePreview();
        return;
      }

      var rm = e.target.closest("[data-remove]");
      if (rm) {
        state.players = state.players.filter(function (x) { return x.id !== p.id; });
        if (state.activePlayer === p.id) state.activePlayer = state.players[0].id;
        renderPlayers();
        renderSummary();
        updatePreview();
      }
    });

    // 選手を追加
    $("#addPlayer").addEventListener("click", function () {
      if (state.players.length >= 30) return;
      var p = newPlayer();
      state.players.push(p);
      state.activePlayer = p.id;
      renderPlayers();
      renderSummary();
      updatePreview();
      var cards = $$("[data-id]", $("#players"));
      var last = cards[cards.length - 1];
      last.scrollIntoView({ block: "center", behavior: "smooth" });
      $('[data-f="name"]', last).focus({ preventScroll: true });
    });

    // 注文者情報
    var form = $("#orderForm");
    form.addEventListener("input", function (e) {
      var n = e.target.name;
      if (n && Object.prototype.hasOwnProperty.call(state.customer, n)) {
        state.customer[n] = e.target.value;
      }
    });

    $("#deliveryChoice").addEventListener("click", function (e) {
      var b = e.target.closest("[data-delivery]");
      if (!b) return;
      state.customer.delivery = b.dataset.delivery;
      renderDelivery();
    });

    // 確認へ
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validate()) return;
      renderConfirm();
      showView("confirm", true);
    });

    $("#stickyBtn").addEventListener("click", function () {
      form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit", { cancelable: true }));
    });

    $$("[data-goto-order]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        e.preventDefault();
        $("#order").scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    // 確認画面
    $("#backToForm").addEventListener("click", function () { showView("store", true); });

    $("#placeOrder").addEventListener("click", function () {
      var btn = this;
      btn.disabled = true;
      btn.textContent = "送信中…";
      var payload = buildPayload();
      NOF.submitOrder(payload).then(function () {
        state.order = payload;
        renderDone(payload);
        showView("done", true);
      }).catch(function () {
        btn.disabled = false;
        btn.textContent = "この内容で注文する";
        alert("送信に失敗しました。時間をおいて再度お試しください。");
      });
    });
  }

  /* -------------------------------------------------------------- init -- */
  $("#viewStore").hidden = false;
  renderTeam();
  renderPreviewStatic();
  renderPlayers();
  renderDelivery();
  renderSummary();
  updatePreview();
  bind();
  showView("store", false);
  history.replaceState({ view: "store" }, "");
  NOF.initReveal(document);
})();
