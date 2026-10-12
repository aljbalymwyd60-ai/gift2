/* =========================================================
   Whisper of Light — app.js
   Pitch black by default. A flashlight mask follows the
   pointer; the hidden Magic Star lights up when found, and
   brushing it with the beam switches the lights on to reveal
   a bilingual (AR/EN) question card. "Yes" moves on to a
   blank Page 2; "No" runs away. No dragging, no popups.
   ========================================================= */

(function () {
  "use strict";

  /* =========================================================
     SMALL HELPERS
     ========================================================= */
  const $ = (id) => document.getElementById(id);
  const rand  = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dist  = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

  /* =========================================================
     ELEMENT REFERENCES
     ========================================================= */
  const htmlEl      = document.documentElement;
  const darkness    = $("darkness");
  const star        = $("star");
  const langBtn     = $("langBtn");
  const soundBtn    = $("soundBtn");

  const gift        = $("gift");
  const viewQuestion = $("viewFeedback");
  const viewPage2   = $("viewPage2");
  const yesBtn      = $("yesBtn");
  const noBtn       = $("noBtn");
  const backBtn     = $("backBtn");
  const feedbackActions = $("feedbackActions");
  const giftHub     = $("giftHub");
  const gameFlower  = $("gameFlower");
  const cardFlower  = $("cardFlower");
  const flowerBack  = $("flowerBack");
  const flowerCanvas   = $("flowerCanvas");
  const flowerClear    = $("flowerClear");
  const flowerStyleBtn = $("flowerStyle");
  const flowerSave     = $("flowerSave");
  const flowerStyleName = $("flowerStyleName");
  const dctx        = flowerCanvas.getContext("2d");

  // Gift #2 — Special Letters
  const cardLetters  = $("cardLetters");
  const giftLetters  = $("giftLetters");
  const tabFai       = $("tabFai");
  const tabMoaid     = $("tabMoaid");
  const letterFai    = $("letterFai");
  const letterMoaid  = $("letterMoaid");
  const lettersBack  = $("lettersBack");

  // Gift #3 — The Enchanted Rose
  const cardRose     = $("cardRose");
  const giftRose     = $("giftRose");
  const roseDome     = $("roseDome");
  const roseMsg      = $("roseMsg");
  const roseBack     = $("roseBack");

  // Gift #4 — Constellation of Wishes
  const cardSky      = $("cardSky");
  const giftSky      = $("giftSky");
  const skyCanvas    = $("skyCanvas");
  const skyAuto      = $("skyAuto");
  const skyReset     = $("skyReset");
  const skyBack      = $("skyBack");
  const skyStatus    = $("skyStatus");
  const sctx         = skyCanvas.getContext("2d");

  const fx          = $("fx");
  const ctx         = fx.getContext("2d");
  const flash       = $("flash");

  const musicWidget = $("musicWidget");
  const mwPlay      = $("mwPlay");
  const mwNext      = $("mwNext");
  const mwPrev      = $("mwPrev");
  const mwTitle     = $("mwTitle");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* =========================================================
     STATE
     ========================================================= */
  let W = 0, H = 0, DPR = 1;
  let mx = 0, my = 0;       // target beam position
  let bx = 0, by = 0;       // smoothed beam position
  let starX = 0, starY = 0; // cached Magic Star centre
  let starRadius = 38;      // cached Magic Star radius
  let nearDist = 200;       // start glowing when the beam gets this close
  let trigDist = 100;       // switch the lights on within this distance
  let moved = false;        // has the player moved the light yet?
  let revealed = false;
  let feedbackShown = false;
  let darkTimeout = 0;      // timeout id for hiding the darkness mask
  const particles = [];

  // flashlight geometry (kept in sync with the CSS gradient)
  const BEAM_DESKTOP = 150;
  const BEAM_MOBILE  = 110;
  const HOLE_FRACTION = 0.42; // transparent core of the gradient
  const beamRadius = () => (W < 640 ? BEAM_MOBILE : BEAM_DESKTOP);

  // safe on-screen spots for the hidden star (kept clear of dead centre)
  const STAR_SPOTS = [
    { x: .20, y: .28 }, { x: .78, y: .24 }, { x: .16, y: .72 }, { x: .82, y: .70 },
    { x: .60, y: .17 }, { x: .34, y: .82 }, { x: .87, y: .46 }, { x: .13, y: .46 }
  ];

  // runaway "No" button state
  let noRoaming = false;
  let noDodges = 0;
  let lastDodge = 0;
  let lastNoPos = { x: 0, y: 0 };
  const NO_MARGIN = 24;
  const DODGE_RADIUS = 130;
  const DODGE_COOLDOWN = 220;

  /* =========================================================
     I18N  (AR / EN)
     ========================================================= */
  const I18N = {
    en: {
      brand: "Whisper of Light",
      star: "Hidden magic star",
      soundOn: "Mute sounds",
      soundOff: "Unmute sounds",
      musicAria: "Music player",
      musicPlay: "Play music",
      musicPause: "Pause music",
      musicPrev: "Previous track",
      musicNext: "Next track",
      langAria: "\u0627\u0644\u062a\u0628\u062f\u064a\u0644 \u0625\u0644\u0649 \u0627\u0644\u0639\u0631\u0628\u064a\u0629", // التبديل إلى العربية
      langLabel: "\u0639", // ع
      catAlt: "A cute cat",
      question: "You like it dot you",
      yes: "Yes! \uD83D\uDC96",
      no: "No",
      back: "Back",
      backAria: "Go back",
      hubTitle: "Little Gifts & Games \u2728",
      hubSub: "Go on have funn",
      giftFlower: "Flower Painting",
      giftFlowerDesc: "Paint glowing blooms",
      soonName: "A little surprise\u2026",
      soonLine: "Coming soon",
      giftsBack: "Gifts",
      clear: "\uD83E\uDDFD Clear",
      changeFlower: "\uD83C\uDF38 Change Flower",
      save: "\uD83D\uDCBE Save Artwork",
      flowerAria: "Glowing flower drawing canvas",
      giftLetters: "Special Letters",
      giftLettersDesc: "Notes from Fai & Moaid",
      lettersTitle: "Special Letters \u2728",
      lettersSub: "Two little notes, sealed just for you",
      faiTab: "Fai (\u0641\u0627\u064A)",
      moaidTab: "Moaid (\u0645\u0624\u064A\u062F)",
      lettersBack: "Back to Gift Menu",
      giftRose: "The Enchanted Rose",
      giftRoseDesc: "Lift the glass dome",
      roseTitle: "Rose \uD83C\uDF39",
      roseSub: "\uD83C\uDF39",
      roseHint: "Tap to lift",
      roseMessage: "I hope you accept this rose \uD83C\uDF39",
      roseBack: "Back to Gifts",
      roseOpenAria: "Lift the glass dome on the rose",
      giftSky: "Constellation of Wishes",
      giftSkyDesc: "Connect the stars",
      skyTitle: "Constellation of Wishes \u2728",
      skyHint: "Drag from star to star",
      skyReset: "\u21BB Reset Constellation",
      skyAuto: "\u2726 Auto Draw Heart",
      skyBack: "Back to Gift Menu",
      skyAria: "Interactive night sky \u2014 connect the stars to form a constellation",
      skyDone: "Constellation complete",
      styleDaisy: "Daisy sunshine",
      styleSakura: "Cherry blossom",
      styleRose: "Rose velvet",
      styleTulip: "Tulip dots",
      styleMix: "Pastel surprise"
    },
    ar: {
      brand: "همسة ضوء",
      star: "النجمة السحرية المخفية",
      soundOn: "كتم الصوت",
      soundOff: "تشغيل الصوت",
      musicAria: "مشغل الموسيقى",
      musicPlay: "تشغيل الموسيقى",
      musicPause: "إيقاف الموسيقى مؤقتاً",
      musicPrev: "الأغنية السابقة",
      musicNext: "الأغنية التالية",
      langAria: "Switch to English",
      langLabel: "EN",
      catAlt: "قطة لطيفة",
      question: "عجبتك ولا",
      yes: "نعم! 💖",
      no: "لا",
      back: "رجوع",
      backAria: "العودة للخلف",
      hubTitle: "هدايا وألعاب صغيرة ✨",
      hubSub: "يلا انجويي",
      giftFlower: "رسم الزهور",
      giftFlowerDesc: "ارسمي زهوراً متألقة",
      soonName: "مفاجأة صغيرة…",
      soonLine: "قريباً",
      giftsBack: "الهدايا",
      clear: "🧽 مسح",
      changeFlower: "🌸 غيّر الزهرة",
      save: "💾 حفظ الرسمة",
      flowerAria: "لوحة رسم الزهور المتألقة",
      giftLetters: "رسائل خاصة",
      giftLettersDesc: "رسائل من فاي ومؤيد",
      lettersTitle: "رسائل خاصة ✨",
      lettersSub: "ملاحظتان صغيرتان، مختومتان لك فقط",
      faiTab: "فاي (Fai)",
      moaidTab: "مؤيد (Moaid)",
      lettersBack: "العودة إلى قائمة الهدايا",
      giftRose: "الوردة المسحورة",
      giftRoseDesc: "ارفع القبة الزجاجية",
      roseTitle: "وردة ✨",
      roseSub: "🌹",
      roseHint: "المسي لتُرفع",
      roseMessage: "اتمنى تقبلي هذي الورده 🌹",
      roseBack: "العودة إلى الهدايا",
      roseOpenAria: "ارفع القبة الزجاجية عن الوردة",
      giftSky: "كوكبة الأمنيات",
      giftSkyDesc: "صِلي النجوم ببعضها",
      skyTitle: "كوكبة الأمنيات ✨",
      skyHint: "اسحبي من نجمة إلى نجمة",
      skyReset: "↻ إعادة رسم الكوكبة",
      skyAuto: "✦ رسم تلقائي",
      skyBack: "العودة إلى قائمة الهدايا",
      skyAria: "سماء ليلية تفاعلية — صِلي النجوم لتشكيل كوكبة",
      skyDone: "اكتملت الكوكبة",
      styleDaisy: "أقحوان الشمس",
      styleSakura: "زهر الكرز",
      styleRose: "وردة مخملية",
      styleTulip: "زهور توليب",
      styleMix: "مفاجأة باستيل"
    }
  };

  let lang = "en";

  function applyLang(next) {
    lang = I18N[next] ? next : "en";
    const t = I18N[lang];

    htmlEl.lang = lang;
    htmlEl.dir = lang === "ar" ? "rtl" : "ltr";
    htmlEl.setAttribute("data-lang", lang);

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const k = el.getAttribute("data-i18n");
      if (t[k] != null) el.textContent = t[k];
    });
    document.querySelectorAll("[data-i18n-html]").forEach((el) => {
      const k = el.getAttribute("data-i18n-html");
      if (t[k] != null) el.innerHTML = t[k];
    });
    document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
      const k = el.getAttribute("data-i18n-aria");
      if (t[k] != null) el.setAttribute("aria-label", t[k]);
    });
    document.querySelectorAll("[data-i18n-alt]").forEach((el) => {
      const k = el.getAttribute("data-i18n-alt");
      if (t[k] != null) el.setAttribute("alt", t[k]);
    });

    langBtn.textContent = t.langLabel;
    langBtn.setAttribute("aria-label", t.langAria);
    updateSoundBtn();
    updateMusicUi();

    // No is never catchable, so its label never changes
    noBtn.textContent = t.no;
    updateStylePill();

    try { localStorage.setItem("wl-lang", lang); } catch (e) {}
  }

  function detectLang() {
    try {
      const saved = localStorage.getItem("wl-lang");
      if (saved && I18N[saved]) return saved;
    } catch (e) {}
    const nav = (navigator.language || navigator.userLanguage || "").toLowerCase();
    return nav.indexOf("ar") === 0 ? "ar" : "en";
  }

  langBtn.addEventListener("click", () => {
    audio();
    applyLang(lang === "ar" ? "en" : "ar");
  });

  /* =========================================================
     1. FLASHLIGHT MASK + MAIN LOOP
     ========================================================= */
  function resizeCanvas() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    fx.width = Math.round(W * DPR);
    fx.height = Math.round(H * DPR);
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function updateBeam() {
    const k = reduceMotion ? 1 : 0.28;
    bx += (mx - bx) * k;
    by += (my - by) * k;
    darkness.style.setProperty("--mx", bx.toFixed(1) + "px");
    darkness.style.setProperty("--my", by.toFixed(1) + "px");
  }

  function loop() {
    updateBeam();
    if (!revealed && moved) checkStar();
    if (skyOpen) {
      // self-heal if the canvas size changed (e.g. first paint / resize)
      if (skyCanvas.clientWidth && skyCanvas.clientHeight &&
          (skyCanvas.clientWidth !== sw || skyCanvas.clientHeight !== sh)) {
        resizeSky();
      }
      if (!reduceMotion) skyT += 0.016;
      if (skyAutoOn) stepAutoDraw();
      drawSky();
    }
    updateParticles();
    requestAnimationFrame(loop);
  }

  /* =========================================================
     2. THE MAGIC STAR + LIGHT SWITCH
     ========================================================= */
  function pickStarSpot() {
    const s = STAR_SPOTS[(Math.random() * STAR_SPOTS.length) | 0];
    star.style.setProperty("--star-x", (s.x * 100).toFixed(1) + "%");
    star.style.setProperty("--star-y", (s.y * 100).toFixed(1) + "%");
  }

  function cacheStar() {
    const r = star.getBoundingClientRect();
    starX = r.left + r.width / 2;
    starY = r.top + r.height / 2;
    starRadius = Math.min(r.width, r.height) / 2 || 38;
    nearDist = beamRadius() + starRadius + 20;
    trigDist = beamRadius() * HOLE_FRACTION + starRadius;
  }

  function checkStar() {
    const d = dist(bx, by, starX, starY);
    if (d <= trigDist) { reveal(); return; }
    star.classList.toggle("near", d <= nearDist);
  }

  function reveal() {
    if (revealed) return;
    revealed = true;

    // the star flares and is consumed by the light
    star.classList.remove("near");
    star.classList.add("lit");
    star.setAttribute("aria-hidden", "true");

    // bright, seamless "lights on": the hole floods the screen,
    // then the whole overlay fades out
    darkness.style.setProperty("--beam", Math.round(Math.hypot(W, H) * 1.6) + "px");
    darkness.classList.add("revealed");
    darkTimeout = setTimeout(() => { darkness.style.display = "none"; }, 1100);

    // flash + particles bursting from the star
    flash.style.setProperty("--fx", starX + "px");
    flash.style.setProperty("--fy", starY + "px");
    flash.classList.remove("go");
    void flash.offsetWidth;
    flash.classList.add("go");

    burst(starX, starY, ["#ffffff", "#ffe1bb", "#ffc9a0", "#ffa7c4", "#e9c9e2"], 70, 1.9);
    burst(starX, starY, ["#ffffff", "#ffe9cd"], 30, 2.6);
    sparkleRain(900);

    audioArpeggio();
    audioChime(2);
    vibrate([12, 30, 12]);

    // illuminate the question card beneath the light
    gift.inert = false;
    gift.setAttribute("aria-hidden", "false");
    document.body.classList.add("revealed");
    feedbackShown = true; // "No" starts running immediately
    setTimeout(() => yesBtn.focus({ preventScroll: true }), 800);
  }

  // keyboard accessibility: the star is not clickable with a pointer,
  // but pressing Enter while it is focused still turns the lights on
  star.addEventListener("click", () => {
    audio();
    startMusic();
    reveal();
  });

  /* =========================================================
     3. PAGE FLOW  (question → blank Page 2)
     ========================================================= */
  let currentView = viewQuestion;

  function showView(next, focusEl) {
    if (!next || next === currentView) return;
    const prev = currentView;
    currentView = next;

    prev.classList.remove("active");
    prev.classList.add("leave");
    prev.setAttribute("aria-hidden", "true");
    prev.inert = true;
    setTimeout(() => prev.classList.remove("leave"), 660);

    next.classList.remove("leave");
    next.setAttribute("aria-hidden", "false");
    next.inert = false;
    next.classList.add("active");

    if (focusEl) setTimeout(() => focusEl.focus({ preventScroll: true }), 140);
  }

  yesBtn.addEventListener("click", () => {
    // clear the runner (it may have been reparented to <body>), then slide on
    noBtn.style.display = "none";
    feedbackShown = false;
    audioChime(2);
    showView(viewPage2, null);
  });

  /* =========================================================
     3b. BACK NAVIGATION  (light → previous steps → the dark)
     ========================================================= */
  function restoreNoBtn() {
    // put the runaway "No" back inside the card, clean and untracked
    noBtn.style.display = "";
    if (noRoaming) {
      feedbackActions.appendChild(noBtn);
      noBtn.classList.remove("roaming", "dodge");
      noBtn.style.left = "";
      noBtn.style.top = "";
      noBtn.style.transform = "";
      noBtn.style.transition = "";
    }
    noRoaming = false;
    noDodges = 0;
    lastDodge = 0;
  }

  function resetToDark() {
    if (!revealed) return;
    revealed = false;
    moved = false;          // the light must sweep the dark again to re-find it
    feedbackShown = false;

    restoreNoBtn();

    // make sure the question card is the active illuminated view
    if (currentView !== viewQuestion) showView(viewQuestion, null);

    // hide the gift away again
    gift.inert = true;
    gift.setAttribute("aria-hidden", "true");

    // HUD + bokeh + vignette fade out
    document.body.classList.remove("revealed");

    // the dark returns: mask back up, spotlight hole shrinks to torch size
    clearTimeout(darkTimeout);
    darkness.style.display = "";
    darkness.classList.remove("revealed");
    darkness.style.setProperty("--beam", beamRadius() + "px");

    // the star reverts to its tiny hidden state
    star.classList.remove("lit", "near");
    star.setAttribute("aria-hidden", "false");
  }

  backBtn.addEventListener("click", () => {
    audio();
    // back to the gift hub first: letters pane, rose pane, then a game
    if (lettersOpen && currentView === viewPage2) { closeLetters(); return; }
    if (roseOpen && currentView === viewPage2) { closeRosePane(); return; }
    if (skyOpen && currentView === viewPage2) { closeSkyPane(); return; }
    if (flowerGameOpen && currentView === viewPage2) { closeGame(); return; }
    if (currentView === viewPage2 && revealed) {
      // one step back: Page 2 → the question card (runner restored)
      restoreNoBtn();
      audioChime(2);
      showView(viewQuestion, null);
    } else if (revealed) {
      // further back: question card → the dark spotlight screen
      resetToDark();
    }
  });

  /* =========================================================
     5b. GIFT HUB + FLOWER GAME  (Page 2)
     ========================================================= */
  let flowerGameOpen = false;
  let styleIdx = 0;
  let stampSize = 20;
  let drawing = false;
  let lastPt = null;
  let idleTimer = 0;       // auto-hide timer for the floating controls
  const ctxDPR = Math.min(window.devicePixelRatio || 1, 2);
  let dw = 0, dh = 0;

  // cute glowing flower styles (pastel rose-gold family)
  const FLOWER_STYLES = [
    { key: "styleDaisy",  petals: 9,  shape: "petal",     center: "#eda44e",
      palette: ["#ffe9c9", "#ffd9a6", "#fff6e2", "#ffc98f"], glow: "rgba(255,208,150,.9)" },
    { key: "styleSakura", petals: 5,  shape: "petalNotch", center: "#ff8fa8",
      palette: ["#ffb9cc", "#ffd3e2", "#ffe9f1", "#f79fbe"], glow: "rgba(255,164,199,.9)" },
    { key: "styleRose",   petals: 12, shape: "petalRose", center: "#d94f77",
      palette: ["#ff9fb2", "#f77f9f", "#ffc1cd", "#e86a8a"], glow: "rgba(255,128,150,.9)" },
    { key: "styleTulip",  petals: 3,  shape: "petalTulip", center: "#e8743f",
      palette: ["#ffb088", "#ff8f7a", "#ffcf9e", "#ffa582"], glow: "rgba(255,168,120,.9)" },
    { key: "styleMix",    petals: 0,  shape: "mix",        center: "#fff1dc",
      palette: [], glow: "rgba(255,222,190,.9)" }
  ];
  const currentStyle = () => FLOWER_STYLES[styleIdx];

  function updateStylePill() {
    if (!flowerStyleName) return;
    flowerStyleName.textContent = "\u2726 " + I18N[lang][currentStyle().key] + " \u2726";
    flowerStyleName.classList.remove("pop");
    void flowerStyleName.offsetWidth;
    flowerStyleName.classList.add("pop");
    setTimeout(() => flowerStyleName.classList.remove("pop"), 520);
  }

  function paintBackdrop() {
    const g = dctx.createRadialGradient(dw / 2, dh / 2, 0, dw / 2, dh / 2, Math.hypot(dw, dh) / 1.5);
    g.addColorStop(0, "rgba(64,42,62,.92)");
    g.addColorStop(0.55, "rgba(34,22,42,.95)");
    g.addColorStop(1, "rgba(12,8,16,.97)");
    dctx.fillStyle = g;
    dctx.fillRect(0, 0, dw, dh);
    // a sprinkle of faint cozy stars
    const n = Math.round(clamp(dw * dh / 26000, 26, 90));
    dctx.shadowBlur = 0;
    for (let i = 0; i < n; i++) {
      dctx.globalAlpha = rand(0.12, 0.4);
      dctx.fillStyle = "#ffe9cf";
      dctx.beginPath();
      dctx.arc(Math.random() * dw, Math.random() * dh, rand(0.6, 1.9), 0, Math.PI * 2);
      dctx.fill();
    }
    dctx.globalAlpha = 1;
  }

  function resizeDraw() {
    const w = flowerCanvas.clientWidth || Math.max(240, Math.round(Math.min(W * 0.92, 640)));
    const h = flowerCanvas.clientHeight || clamp(Math.round(H * 0.45), 260, 480);
    dw = w; dh = h;
    flowerCanvas.width = Math.round(w * ctxDPR);
    flowerCanvas.height = Math.round(h * ctxDPR);
    dctx.setTransform(ctxDPR, 0, 0, ctxDPR, 0, 0);
    stampSize = Math.round(clamp(w / 26, 13, 26));
    paintBackdrop();
  }

  function fillShape(shape, s) {
    dctx.beginPath();
    if (shape === "petal") {
      dctx.ellipse(0, -s * 0.34, s * 0.32, s * 0.44, 0, 0, Math.PI * 2);
    } else if (shape === "petalNotch") {
      const r = s * 0.44;
      dctx.moveTo(0, -r);
      dctx.bezierCurveTo(r * 0.55, -r * 0.5, r * 0.62, -r * 0.05, 0, r * 0.3);
      dctx.bezierCurveTo(-r * 0.62, -r * 0.05, -r * 0.55, -r * 0.5, 0, -r);
    } else if (shape === "petalRose") {
      dctx.ellipse(0, -s * 0.26, s * 0.36, s * 0.34, 0, 0, Math.PI * 2);
    } else { // petalTulip
      dctx.moveTo(0, -s * 0.52);
      dctx.bezierCurveTo(s * 0.42, -s * 0.2, s * 0.34, s * 0.32, 0, s * 0.42);
      dctx.bezierCurveTo(-s * 0.34, s * 0.32, -s * 0.42, -s * 0.2, 0, -s * 0.52);
    }
    dctx.closePath();
    dctx.fill();
  }

  function drawFlower(x, y) {
    let st = currentStyle();
    if (st.shape === "mix") st = FLOWER_STYLES[(Math.random() * 4) | 0];
    const size = stampSize * rand(0.85, 1.18);
    dctx.save();
    dctx.translate(x, y);
    dctx.rotate(st.shape === "petalTulip" ? 0 : rand(-0.25, 0.25));
    dctx.shadowColor = st.glow;
    dctx.shadowBlur = 15;
    for (let i = 0; i < st.petals; i++) {
      dctx.rotate((Math.PI * 2) / st.petals);
      dctx.fillStyle = st.palette[i % st.palette.length];
      fillShape(st.shape, size);
    }
    dctx.shadowBlur = 8;
    dctx.fillStyle = st.center;
    dctx.beginPath();
    dctx.arc(0, 0, Math.max(size * 0.16, 2.4), 0, Math.PI * 2);
    dctx.fill();
    dctx.restore();
  }

  function localPt(e) {
    const r = flowerCanvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  flowerCanvas.addEventListener("pointerdown", (e) => {
    if (!flowerGameOpen) return;
    e.preventDefault();
    drawing = true;
    const p = localPt(e);
    lastPt = p;
    drawFlower(p.x, p.y);
    if (flowerCanvas.setPointerCapture) {
      try { flowerCanvas.setPointerCapture(e.pointerId); } catch (err) {}
    }
  });
  flowerCanvas.addEventListener("pointermove", (e) => {
    if (!drawing || !flowerGameOpen) return;
    const p = localPt(e);
    if (!lastPt) { lastPt = p; return; }
    const d = dist(lastPt.x, lastPt.y, p.x, p.y);
    const step = Math.max(13, stampSize * 0.5);
    if (d >= step) {
      const n = Math.min(Math.floor(d / step), 40);
      for (let i = 1; i <= n; i++) {
        drawFlower(lastPt.x + (p.x - lastPt.x) * (i / n),
                   lastPt.y + (p.y - lastPt.y) * (i / n));
      }
      lastPt = p;
    }
  });
  const endDraw = () => { drawing = false; lastPt = null; };
  flowerCanvas.addEventListener("pointerup", endDraw);
  flowerCanvas.addEventListener("pointercancel", endDraw);

  // floating chrome auto-hides after a quiet pause, returns on any touch/move
  const pokeIdle = () => {
    clearTimeout(idleTimer);
    gameFlower.classList.remove("idle");
    idleTimer = setTimeout(() => gameFlower.classList.add("idle"), 3500);
  };
  gameFlower.addEventListener("pointerdown", pokeIdle);
  gameFlower.addEventListener("pointermove", pokeIdle);

  function openGame() {
    if (flowerGameOpen || !cardFlower) return;
    flowerGameOpen = true;
    giftHub.classList.remove("active");
    giftHub.inert = true;
    giftHub.setAttribute("aria-hidden", "true");
    gameFlower.classList.add("active");
    gameFlower.inert = false;
    gameFlower.setAttribute("aria-hidden", "false");
    updateStylePill();
    resizeDraw();
    pokeIdle();
    setTimeout(() => flowerClear.focus({ preventScroll: true }), 140);
    audioChime(2);
    vibrate([8, 20, 8]);
  }

  function closeGame() {
    if (!flowerGameOpen) return;
    flowerGameOpen = false;
    clearTimeout(idleTimer);
    gameFlower.classList.remove("idle");
    gameFlower.classList.remove("active");
    gameFlower.inert = true;
    gameFlower.setAttribute("aria-hidden", "true");
    giftHub.classList.add("active");
    giftHub.inert = false;
    giftHub.setAttribute("aria-hidden", "false");
    setTimeout(() => cardFlower.focus({ preventScroll: true }), 120);
    audioChime(1);
  }

  cardFlower.addEventListener("click", openGame);
  flowerBack.addEventListener("click", closeGame);

  /* =========================================================
     5c. GIFT #2 — SPECIAL LETTERS  (Fai + Moaid)
     ========================================================= */
  let lettersOpen = false;

  function openLetters() {
    if (lettersOpen || !cardLetters) return;
    lettersOpen = true;
    giftHub.classList.remove("active");
    giftHub.inert = true;
    giftHub.setAttribute("aria-hidden", "true");
    giftLetters.classList.add("active");
    giftLetters.inert = false;
    giftLetters.setAttribute("aria-hidden", "false");
    setTimeout(() => tabFai.focus({ preventScroll: true }), 140);
    audioChime(2);
    vibrate([8, 20, 8]);
  }

  function closeLetters() {
    if (!lettersOpen) return;
    lettersOpen = false;
    giftLetters.classList.remove("active");
    giftLetters.inert = true;
    giftLetters.setAttribute("aria-hidden", "true");
    giftHub.classList.add("active");
    giftHub.inert = false;
    giftHub.setAttribute("aria-hidden", "false");
    setTimeout(() => cardLetters.focus({ preventScroll: true }), 120);
    audioChime(1);
  }

  function switchLetter(toFai) {
    if (!lettersOpen) return;
    const from = toFai ? letterMoaid : letterFai;
    const to   = toFai ? letterFai   : letterMoaid;
    if (to.classList.contains("active")) return;
    from.classList.remove("active");
    from.setAttribute("aria-hidden", "true");
    to.classList.add("active");
    to.setAttribute("aria-hidden", "false");
    tabFai.classList.toggle("active", toFai);
    tabMoaid.classList.toggle("active", !toFai);
    tabFai.setAttribute("aria-selected", String(toFai));
    tabMoaid.setAttribute("aria-selected", String(!toFai));
    audioChime(1);
    vibrate(6);
  }

  // arrow-key tab support (logical order flips in RTL)
  function onTabKey(e) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    e.preventDefault();
    const fwd  = htmlEl.dir === "rtl" ? "ArrowLeft" : "ArrowRight";
    const isFai = tabFai.classList.contains("active");
    switchLetter(e.key === fwd ? !isFai : isFai);
  }

  cardLetters.addEventListener("click", openLetters);
  lettersBack.addEventListener("click", closeLetters);
  tabFai.addEventListener("click", () => switchLetter(true));
  tabMoaid.addEventListener("click", () => switchLetter(false));
  tabFai.addEventListener("keydown", onTabKey);
  tabMoaid.addEventListener("keydown", onTabKey);

  /* =========================================================
     5d. GIFT #3 — THE ENCHANTED ROSE  (glass dome)
     ========================================================= */
  let roseOpen = false;     // the rose pane is the visible Page-2 pane
  let roseBloomed = false;  // the glass dome is currently lifted

  function openRosePane() {
    if (roseOpen || !cardRose) return;
    roseOpen = true;
    giftHub.classList.remove("active");
    giftHub.inert = true;
    giftHub.setAttribute("aria-hidden", "true");
    giftRose.classList.add("active");
    giftRose.inert = false;
    giftRose.setAttribute("aria-hidden", "false");
    setTimeout(() => roseDome.focus({ preventScroll: true }), 140);
    audioChime(2);
    vibrate([8, 20, 8]);
  }

  function sealRose() {
    if (!roseBloomed) return;
    roseBloomed = false;
    roseDome.classList.remove("open");
    roseDome.setAttribute("aria-expanded", "false");
    roseMsg.classList.remove("show");
    roseMsg.inert = true;
    roseMsg.setAttribute("aria-hidden", "true");
  }

  function closeRosePane() {
    if (!roseOpen) return;
    sealRose();
    roseOpen = false;
    giftRose.classList.remove("active");
    giftRose.inert = true;
    giftRose.setAttribute("aria-hidden", "true");
    giftHub.classList.add("active");
    giftHub.inert = false;
    giftHub.setAttribute("aria-hidden", "false");
    setTimeout(() => cardRose.focus({ preventScroll: true }), 120);
    audioChime(1);
  }

  function bloomRose() {
    if (roseBloomed) return;
    roseBloomed = true;
    roseDome.classList.add("open");
    roseDome.setAttribute("aria-expanded", "true");
    roseMsg.inert = false;
    roseMsg.setAttribute("aria-hidden", "false");
    roseMsg.classList.add("show");

    // satisfying feedback: warm sparkles bursting from the rose
    const r = roseDome.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height * 0.42;
    burst(cx, cy, ["#ffffff", "#ffd9e6", "#ff9fc4", "#ffcf9a", "#ffb070"], reduceMotion ? 10 : 46, 1.5);
    burst(cx, cy, ["#ffffff", "#ffe9cd"], reduceMotion ? 6 : 22, 2.3);
    if (!reduceMotion) sparkleRain(650);
    audioChime(2);
    vibrate([10, 24, 10]);
  }

  function toggleRose() {
    if (roseBloomed) sealRose();
    else bloomRose();
  }

  cardRose.addEventListener("click", openRosePane);
  roseBack.addEventListener("click", closeRosePane);
  roseDome.addEventListener("click", toggleRose);

  /* =========================================================
     5e. GIFT #4 — CONSTELLATION OF WISHES  (interactive sky)
     ========================================================= */
  let skyOpen = false;         // the sky pane is the visible Page-2 pane
  let skyDone = false;         // the whole constellation is connected
  let skyNext = 0;             // links completed so far (0..SKY_LINKS)
  let skyDrag = false;         // a connect-drag is in progress
  let skyAutoOn = false;       // auto-draw is running
  let skyAutoT = 0;            // progress along the link being auto-drawn (0..1)
  let skyPtr = { x: 0, y: 0 }; // current pointer position (canvas px)
  let skyT = 0;                // animation clock
  let skyBloomT = 0;           // one-shot bloom timer (1 -> 0)
  let sw = 0, sh = 0;          // live sky-canvas size (CSS px)
  let skyBg = null;            // cached night-sky gradient
  let skyStars = [];           // twinkling background stars
  let skyDust = [];            // drifting glowing motes
  let skyTrail = [];           // sparkle trail of the current drag
  let skyPulses = [];          // one-shot node pulses
  let skyPts = [];             // node pixel positions
  let skyDoneAt = 0;           // performance.now() when the heart completed (drives the morph)
  let skyHeartSparks = [];     // rising sparkles around the finished heart

  // a heart outline, traced in order (the last link closes back to node 0)
  const SKY_SHAPE = [
    [0.50, 0.30], [0.63, 0.16], [0.78, 0.20], [0.85, 0.38], [0.72, 0.60],
    [0.50, 0.88], [0.28, 0.60], [0.15, 0.38], [0.22, 0.20], [0.37, 0.16]
  ];
  const SKY_LINKS = SKY_SHAPE.length;
  const SKY_MORPH_MS = 1700;   // straight polygon -> curved heart morph duration
  const SKY_SMOOTH   = 0.18;   // how far node points slide toward their neighbours
  const SKY_SPARK_MAX = 26;    // cap on rising sparkles around the finished heart
  const SKY_HUES = ["#ffd9a6", "#ffc9a0", "#ffa7c4", "#e9c9e2", "#bfe3ff",
                    "#c9f0d8", "#ffb3d1", "#ffe1bb", "#ffd0e0", "#cfd8ff"];

  function buildSky() {
    skyPts = [];
    if (!sw || !sh) return;
    const size = Math.min(sw * 0.66, sh * 0.60, 560);
    const cx = sw / 2, cy = sh / 2;
    for (let i = 0; i < SKY_SHAPE.length; i++) {
      skyPts.push({
        x: cx + (SKY_SHAPE[i][0] - 0.5) * size,
        y: cy + (SKY_SHAPE[i][1] - 0.5) * size
      });
    }

    // night-sky gradient
    const g = sctx.createLinearGradient(0, 0, 0, sh);
    g.addColorStop(0, "#0b0817");
    g.addColorStop(0.55, "#0e0a1e");
    g.addColorStop(1, "#171029");
    skyBg = g;

    // twinkling background stars
    const n = reduceMotion ? 46 : clamp(Math.round((sw * sh) / 9000), 70, 190);
    skyStars = [];
    for (let i = 0; i < n; i++) {
      skyStars.push({
        x: Math.random() * sw,
        y: Math.random() * sh,
        r: rand(0.5, 1.6),
        base: rand(0.18, 0.55),
        amp: rand(0.1, 0.4),
        spd: rand(0.6, 2.2),
        ph: Math.random() * Math.PI * 2,
        c: Math.random() < 0.24 ? "#ffd9c0" : "#ffffff"
      });
    }

    // softly glowing dust
    const dn = reduceMotion ? 0 : clamp(Math.round((sw * sh) / 42000), 8, 26);
    skyDust = [];
    for (let i = 0; i < dn; i++) {
      skyDust.push({
        x: Math.random() * sw,
        y: Math.random() * sh,
        r: rand(0.8, 2.2),
        vx: rand(-0.18, 0.18),
        vy: rand(-0.22, -0.04),
        a: rand(0.06, 0.2),
        c: Math.random() < 0.5 ? "#ffd9b0" : "#cfe0ff"
      });
    }
  }

  function resizeSky() {
    sw = skyCanvas.clientWidth || W;
    sh = skyCanvas.clientHeight || H;
    const d = Math.min(window.devicePixelRatio || 1, 2);
    skyCanvas.width = Math.round(sw * d);
    skyCanvas.height = Math.round(sh * d);
    sctx.setTransform(d, 0, 0, d, 0, 0);
    buildSky();
  }

  const skyHitR = () => Math.max(26, Math.min(sw, sh) * 0.05);

  function skyLocal(e) {
    const r = skyCanvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function skyNear(p, i) {
    const n = skyPts[i];
    return !!n && dist(p.x, p.y, n.x, n.y) <= skyHitR();
  }

  function skyLink(a, b, alpha) {
    sctx.save();
    sctx.globalAlpha = alpha;
    const g = sctx.createLinearGradient(a.x, a.y, b.x, b.y);
    g.addColorStop(0, "#ffd9a6");
    g.addColorStop(0.5, "#ffb3d1");
    g.addColorStop(1, "#bfe3ff");
    sctx.strokeStyle = g;
    sctx.lineWidth = 2.4;
    sctx.lineCap = "round";
    sctx.shadowColor = "rgba(255,170,200,.9)";
    sctx.shadowBlur = reduceMotion ? 6 : 16;
    sctx.beginPath();
    sctx.moveTo(a.x, a.y);
    sctx.lineTo(b.x, b.y);
    sctx.stroke();
    sctx.restore();
  }

  function skyNode(p, opts) {
    const hue = SKY_HUES[opts.i % SKY_HUES.length];
    const pulse = (opts.from || opts.to) && !reduceMotion
      ? 1 + 0.28 * Math.sin(skyT * 4.5) : 1;
    const R = opts.done ? 5.2 : 3.6;

    // soft coloured halo
    const halo = sctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, R * 6 * pulse);
    halo.addColorStop(0, hue);
    halo.addColorStop(1, "rgba(0,0,0,0)");
    sctx.save();
    sctx.globalAlpha = opts.done ? 0.5 : 0.32;
    sctx.fillStyle = halo;
    sctx.beginPath();
    sctx.arc(p.x, p.y, R * 6 * pulse, 0, Math.PI * 2);
    sctx.fill();
    sctx.restore();

    // bright core
    sctx.save();
    sctx.fillStyle = opts.done ? "#ffffff" : "rgba(255,255,255,.72)";
    sctx.shadowColor = hue;
    sctx.shadowBlur = reduceMotion ? 8 : 18;
    sctx.beginPath();
    sctx.arc(p.x, p.y, R, 0, Math.PI * 2);
    sctx.fill();
    sctx.restore();

    // hint ring on the next target
    if (opts.to) {
      sctx.save();
      sctx.strokeStyle = "rgba(255,211,168,.85)";
      sctx.lineWidth = 1.4;
      sctx.beginPath();
      sctx.arc(p.x, p.y, R + 6 + 2 * Math.sin(skyT * 4), 0, Math.PI * 2);
      sctx.stroke();
      sctx.restore();
    }
  }

  function skyCentroid() {
    let x = 0, y = 0;
    for (const p of skyPts) { x += p.x; y += p.y; }
    const k = skyPts.length || 1;
    return { x: x / k, y: y / k };
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  // nodes eased toward the midpoint of their neighbours — rounds the sharp
  // angles into a softer silhouette as m goes 0 -> 1
  function skyMorphPoints(m) {
    const n = skyPts.length;
    const out = [];
    for (let i = 0; i < n; i++) {
      const prev = skyPts[(i - 1 + n) % n];
      const cur  = skyPts[i];
      const next = skyPts[(i + 1) % n];
      const mx = (prev.x + next.x) / 2;
      const my = (prev.y + next.y) / 2;
      out.push({
        x: cur.x + (mx - cur.x) * SKY_SMOOTH * m,
        y: cur.y + (my - cur.y) * SKY_SMOOTH * m
      });
    }
    return out;
  }

  // closed cubic path through pts. At m=0 the control points sit on the
  // segment endpoints (draws exactly the straight polygon); at m=1 they
  // follow a Catmull-Rom spline (a fluid organic heart).
  function skyHeartPath(pts, m) {
    const n = pts.length;
    sctx.beginPath();
    sctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n];
      const p1 = pts[i];
      const p2 = pts[(i + 1) % n];
      const p3 = pts[(i + 2) % n];
      sctx.bezierCurveTo(
        p1.x + (p2.x - p0.x) / 6 * m, p1.y + (p2.y - p0.y) / 6 * m,
        p2.x - (p3.x - p1.x) / 6 * m, p2.y - (p3.y - p1.y) / 6 * m,
        p2.x, p2.y
      );
    }
    sctx.closePath();
  }

  function skySpawnHeartSpark(pts) {
    const n = pts.length;
    const i = (Math.random() * n) | 0;
    const a = pts[i];
    const b = pts[(i + 1) % n];
    const t = Math.random();
    skyHeartSparks.push({
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      vx: rand(-0.18, 0.18),
      vy: rand(-0.55, -0.22),
      life: 1,
      decay: rand(0.006, 0.016),
      size: rand(1.2, 2.6),
      sway: Math.random() * Math.PI * 2,
      c: Math.random() < 0.5 ? "#ffd9c0" : "#ffffff"
    });
  }

  function drawSky() {
    if (!skyPts.length) return;
    sctx.clearRect(0, 0, sw, sh);
    sctx.fillStyle = skyBg || "#0e0a1e";
    sctx.fillRect(0, 0, sw, sh);

    // twinkling background stars
    for (const st of skyStars) {
      const tw = reduceMotion ? st.base
        : clamp(st.base + Math.sin(skyT * st.spd + st.ph) * st.amp, 0, 1);
      sctx.globalAlpha = tw;
      sctx.fillStyle = st.c;
      sctx.beginPath();
      sctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
      sctx.fill();
    }
    sctx.globalAlpha = 1;

    // drifting dust
    for (const d of skyDust) {
      d.x += d.vx;
      d.y += d.vy;
      if (d.y < -20) { d.y = sh + 20; d.x = Math.random() * sw; }
      if (d.x < -20) d.x = sw + 20;
      else if (d.x > sw + 20) d.x = -20;
      sctx.globalAlpha = d.a;
      sctx.fillStyle = d.c;
      sctx.beginPath();
      sctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      sctx.fill();
    }
    sctx.globalAlpha = 1;

    // morph progress (straight -> curved) + working node points
    const morph = skyDone
      ? (reduceMotion ? 1 : easeInOutCubic(clamp((performance.now() - skyDoneAt) / SKY_MORPH_MS, 0, 1)))
      : 0;
    const hpts = skyDone ? skyMorphPoints(morph) : skyPts;

    // ---------- the heart is complete: morph, fill, breathe, sparkle ----------
    if (skyDone) {
      const c = skyCentroid();
      const beat = reduceMotion ? 0 : (0.5 - 0.5 * Math.cos(skyT * 3.1));
      const pulse = 1 + 0.06 * morph * beat;

      sctx.save();
      sctx.translate(c.x, c.y);
      sctx.scale(pulse, pulse);
      sctx.translate(-c.x, -c.y);

      // fluid rose-gold fill
      skyHeartPath(hpts, morph);
      const fillR = Math.min(sw, sh) * 0.38;
      const fill = sctx.createRadialGradient(c.x, c.y - fillR * 0.35, 0, c.x, c.y, fillR);
      fill.addColorStop(0,    "rgba(255,216,180," + (0.36 * morph).toFixed(3) + ")");
      fill.addColorStop(0.55, "rgba(255,166,205," + (0.22 * morph).toFixed(3) + ")");
      fill.addColorStop(1,    "rgba(214,120,170," + (0.10 * morph).toFixed(3) + ")");
      sctx.fillStyle = fill;
      sctx.fill();

      // soft glowing border
      sctx.lineWidth = 2.6;
      sctx.lineJoin = "round";
      sctx.strokeStyle = "rgba(255,211,168," + (0.95 * morph).toFixed(3) + ")";
      sctx.shadowColor = "rgba(255,150,195,.9)";
      sctx.shadowBlur = (15 + 10 * beat) * morph;
      sctx.stroke();

      // the settled constellation pearls along the rounded heart
      for (let i = 0; i < hpts.length; i++) {
        skyNode(hpts[i], { i, done: true, from: false, to: false });
      }
      sctx.restore();

      // floating sparkles rising gently around the heart
      if (!reduceMotion && morph > 0.35) {
        if (skyHeartSparks.length < SKY_SPARK_MAX && Math.random() < 0.6) {
          skySpawnHeartSpark(hpts);
        }
        for (let i = skyHeartSparks.length - 1; i >= 0; i--) {
          const s = skyHeartSparks[i];
          s.sway += 0.05;
          s.x += s.vx + Math.sin(s.sway) * 0.25;
          s.y += s.vy;
          s.life -= s.decay;
          if (s.life <= 0) { skyHeartSparks.splice(i, 1); continue; }
          sctx.save();
          sctx.globalAlpha = s.life;
          sctx.fillStyle = s.c;
          sctx.shadowColor = "rgba(255,180,210,.9)";
          sctx.shadowBlur = 10;
          sctx.beginPath();
          sctx.arc(s.x, s.y, s.size * s.life + 0.4, 0, Math.PI * 2);
          sctx.fill();
          sctx.restore();
        }
        sctx.globalAlpha = 1;
        sctx.shadowBlur = 0;
      }
    } else {
      // completed links (straight polygon while drawing)
      for (let i = 0; i < skyNext && i < SKY_LINKS; i++) {
        skyLink(skyPts[i], skyPts[(i + 1) % SKY_LINKS], 1);
      }

      // the link currently being auto-drawn — a growing glowing line + head
      if (skyAutoOn) {
        const a = skyPts[skyNext % SKY_LINKS];
        const b = skyPts[(skyNext + 1) % SKY_LINKS];
        if (a && b) {
          const t = clamp(skyAutoT, 0, 1);
          const tip = { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
          skyLink(a, tip, 0.95);
          sctx.save();
          sctx.fillStyle = "#ffffff";
          sctx.shadowColor = "rgba(255,170,200,.95)";
          sctx.shadowBlur = reduceMotion ? 8 : 20;
          sctx.beginPath();
          sctx.arc(tip.x, tip.y, 3.4, 0, Math.PI * 2);
          sctx.fill();
          sctx.restore();
        }
      }

      // the link currently being pulled
      if (skyDrag) {
        skyLink(skyPts[skyNext % SKY_LINKS], skyPtr, 0.72);
        for (const t of skyTrail) {
          t.life -= 0.06;
          if (t.life > 0) {
            sctx.globalAlpha = t.life * 0.9;
            sctx.fillStyle = "#ffffff";
            sctx.shadowColor = "rgba(255,180,210,.9)";
            sctx.shadowBlur = 12;
            sctx.beginPath();
            sctx.arc(t.x, t.y, 1.6 * t.life + 0.6, 0, Math.PI * 2);
            sctx.fill();
          }
        }
        sctx.globalAlpha = 1;
        sctx.shadowBlur = 0;
        skyTrail = skyTrail.filter((t) => t.life > 0);
      }

      // star nodes
      for (let i = 0; i < skyPts.length; i++) {
        skyNode(skyPts[i], {
          i,
          done: i <= skyNext,
          from: i === skyNext % SKY_LINKS,
          to: i === (skyNext + 1) % SKY_LINKS
        });
      }
    }

    // one-shot node pulses
    for (let i = skyPulses.length - 1; i >= 0; i--) {
      const p = skyPulses[i];
      p.t += reduceMotion ? 1 : 0.05;
      if (p.t >= 1) { skyPulses.splice(i, 1); continue; }
      sctx.save();
      sctx.globalAlpha = (1 - p.t) * 0.7;
      sctx.strokeStyle = "rgba(255,211,168,.9)";
      sctx.lineWidth = 2;
      sctx.beginPath();
      sctx.arc(p.x, p.y, 6 + p.t * 34, 0, Math.PI * 2);
      sctx.stroke();
      sctx.restore();
    }

    // completed: warm bloom + expanding ring
    if (skyDone) {
      const c = skyCentroid();
      const bloom = sctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, Math.min(sw, sh) * 0.55);
      bloom.addColorStop(0, "rgba(255,190,215,.20)");
      bloom.addColorStop(1, "rgba(255,190,215,0)");
      sctx.fillStyle = bloom;
      sctx.fillRect(0, 0, sw, sh);
      if (!reduceMotion && skyBloomT > 0) {
        sctx.save();
        sctx.globalAlpha = skyBloomT * 0.8;
        sctx.strokeStyle = "rgba(255,211,168,.8)";
        sctx.lineWidth = 2;
        sctx.beginPath();
        sctx.arc(c.x, c.y, Math.min(sw, sh) * (0.12 + (1 - skyBloomT) * 0.5), 0, Math.PI * 2);
        sctx.stroke();
        sctx.restore();
        skyBloomT = Math.max(0, skyBloomT - 0.02);
      }
    }
  }

  function skyConnect(toI) {
    if (skyDone || skyNext >= SKY_LINKS || !skyPts[toI]) return;
    skyNext++;
    const n = skyPts[toI];
    burst(n.x, n.y, ["#ffffff", "#ffd9a6", "#ffc9a0", "#ffa7c4", "#e9c9e2"],
      reduceMotion ? 6 : 24, 1.4);
    skyPulses.push({ x: n.x, y: n.y, t: 0 });
    audioChime(clamp(1 + (skyNext % 3), 1, 3));
    vibrate(8);
    skyTrail = [{ x: n.x, y: n.y, life: 1 }];
    if (skyNext >= SKY_LINKS) { skyDrag = false; skyComplete(); }
  }

  function skyComplete() {
    if (skyDone) return;
    skyDone = true;
    skyDoneAt = performance.now();
    skyHeartSparks = [];
    skyBloomT = 1;
    const c = skyCentroid();
    burst(c.x, c.y, ["#ffffff", "#ffd9e6", "#ff9fc4", "#ffcf9a", "#ffb070", "#bfe3ff"],
      reduceMotion ? 10 : 48, 1.6);
    if (!reduceMotion) sparkleRain(850);
    audioArpeggio();
    vibrate([10, 24, 10]);
    skyAutoOn = false;
    skyStatus.textContent = I18N[lang].skyDone;
  }

  function resetSky() {
    skyDone = false;
    skyDoneAt = 0;
    skyHeartSparks = [];
    skyNext = 0;
    skyDrag = false;
    skyAutoOn = false;
    skyAutoT = 0;
    skyTrail = [];
    skyPulses = [];
    skyBloomT = 0;
    skyStatus.textContent = "";
  }

  // ---------------------------------------------
  // Auto-draw: connects every star in order with a
  // smooth glowing line, forming the heart by itself.
  // ---------------------------------------------
  function skyAutoDraw() {
    if (!skyOpen || skyDone || skyAutoOn || !skyPts.length) return;
    skyAutoOn = true;
    skyAutoT = 0;
    skyDrag = false;
    skyTrail = [];
    audioChime(2);
    vibrate([8, 20, 8]);
  }

  function stepAutoDraw() {
    if (skyDone || !skyPts.length) { skyAutoOn = false; return; }
    const a = skyPts[skyNext % SKY_LINKS];
    const b = skyPts[(skyNext + 1) % SKY_LINKS];

    // sparkles trailing along the growing line
    if (a && b && !reduceMotion) {
      const t = clamp(skyAutoT, 0, 1);
      burst(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t,
        ["#ffffff", "#ffd9a6", "#ffa7c4"], 2, 0.7);
    }

    skyAutoT += reduceMotion ? 1 : 0.028;

    if (skyAutoT >= 1) {
      skyAutoT = 0;
      skyConnect((skyNext + 1) % SKY_LINKS);
      if (skyDone || skyNext >= SKY_LINKS) { skyAutoOn = false; skyAutoT = 0; }
    }
  }

  function openSkyPane() {
    if (skyOpen || !cardSky) return;
    skyOpen = true;
    giftHub.classList.remove("active");
    giftHub.inert = true;
    giftHub.setAttribute("aria-hidden", "true");
    giftSky.classList.add("active");
    giftSky.inert = false;
    giftSky.setAttribute("aria-hidden", "false");
    resetSky();
    skyT = 0;
    resizeSky();
    audioChime(2);
    vibrate([8, 20, 8]);
  }

  function closeSkyPane() {
    if (!skyOpen) return;
    skyOpen = false;
    resetSky();
    giftSky.classList.remove("active");
    giftSky.inert = true;
    giftSky.setAttribute("aria-hidden", "true");
    giftHub.classList.add("active");
    giftHub.inert = false;
    giftHub.setAttribute("aria-hidden", "false");
    setTimeout(() => cardSky.focus({ preventScroll: true }), 120);
    audioChime(1);
  }

  function onSkyDown(e) {
    if (!skyOpen || skyDone || skyAutoOn || !skyPts.length) return;
    if (e.preventDefault) e.preventDefault();
    const p = skyLocal(e);
    skyPtr = p;
    const fromI = skyNext % SKY_LINKS;
    const toI = (skyNext + 1) % SKY_LINKS;
    if (skyNear(p, fromI)) {
      skyDrag = true;
      skyTrail = [{ x: p.x, y: p.y, life: 1 }];
      if (skyCanvas.setPointerCapture) {
        try { skyCanvas.setPointerCapture(e.pointerId); } catch (err) {}
      }
    } else if (skyNear(p, toI)) {
      skyConnect(toI);
    }
  }

  function onSkyMove(e) {
    if (!skyOpen || skyDone || skyAutoOn || !skyDrag) return;
    const p = skyLocal(e);
    skyPtr = p;
    skyTrail.push({ x: p.x, y: p.y, life: 1 });
    if (skyTrail.length > 26) skyTrail.shift();
    if (Math.random() < 0.5) {
      burst(p.x, p.y, ["#ffffff", "#ffe9cd", "#ffc9a0", "#ffa7c4"],
        reduceMotion ? 2 : 5, 1.1);
    }
    const toI = (skyNext + 1) % SKY_LINKS;
    if (skyNear(p, toI)) skyConnect(toI);
  }

  function onSkyUp() {
    skyDrag = false;
    skyTrail = [];
  }

  cardSky.addEventListener("click", openSkyPane);
  skyBack.addEventListener("click", closeSkyPane);
  skyReset.addEventListener("click", () => { resetSky(); audioChime(1); vibrate(8); });
  skyAuto.addEventListener("click", skyAutoDraw);
  skyCanvas.addEventListener("pointerdown", onSkyDown);
  skyCanvas.addEventListener("pointermove", onSkyMove);
  skyCanvas.addEventListener("pointerup", onSkyUp);
  skyCanvas.addEventListener("pointercancel", onSkyUp);
  skyCanvas.addEventListener("pointerleave", onSkyUp);

  flowerClear.addEventListener("click", () => {
    resizeDraw();
    audioChime(1);
    vibrate(8);
  });
  flowerStyleBtn.addEventListener("click", () => {
    styleIdx = (styleIdx + 1) % FLOWER_STYLES.length;
    updateStylePill();
    audioChime(1);
    vibrate(8);
  });

  function saveArtwork() {
    const ship = (url) => {
      const a = document.createElement("a");
      a.href = url;
      a.download = "whisper-of-light-flowers.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      audioChime(2);
      vibrate([12, 25, 12]);
    };
    if (flowerCanvas.toBlob) {
      try {
        flowerCanvas.toBlob((blob) => {
          if (!blob) { ship(flowerCanvas.toDataURL("image/png")); return; }
          const url = URL.createObjectURL(blob);
          ship(url);
          setTimeout(() => URL.revokeObjectURL(url), 4000);
        }, "image/png");
        return;
      } catch (err) {}
    }
    try { ship(flowerCanvas.toDataURL("image/png")); } catch (err) {}
  }
  flowerSave.addEventListener("click", saveArtwork);

  /* =========================================================
     4. RUNAWAY "No" BUTTON  (never catchable)
     ========================================================= */
  // detach from the gift card (it uses transforms) and go viewport-fixed
  function startRoaming() {
    if (noRoaming) return;
    const r = noBtn.getBoundingClientRect();
    noRoaming = true;
    document.body.appendChild(noBtn);
    noBtn.classList.add("roaming");
    noBtn.style.transition = "none";
    noBtn.style.transform = "translate(" + r.left + "px," + r.top + "px)";
    lastNoPos = { x: r.left, y: r.top };
    void noBtn.offsetWidth;
    noBtn.style.transition = "";
  }

  function moveNo(px, py, animate) {
    const r = noBtn.getBoundingClientRect();
    const w = r.width || 96;
    const h = r.height || 48;
    const maxX = Math.max(NO_MARGIN, W - w - NO_MARGIN);
    const maxY = Math.max(NO_MARGIN, H - h - NO_MARGIN);

    let nx = clamp(px, NO_MARGIN, maxX);
    let ny = clamp(py, NO_MARGIN, maxY);

    // never land on top of the Yes button
    const y = yesBtn.getBoundingClientRect();
    const ycx = y.left + y.width / 2;
    const ycy = y.top + y.height / 2;
    for (let i = 0; i < 8 && dist(nx + w / 2, ny + h / 2, ycx, ycy) < 190; i++) {
      nx = rand(NO_MARGIN, maxX);
      ny = rand(NO_MARGIN, maxY);
    }

    lastNoPos = { x: nx, y: ny };
    noBtn.style.left = "0px";
    noBtn.style.top = "0px";
    noBtn.style.transform = "translate(" + nx.toFixed(1) + "px," + ny.toFixed(1) + "px)";

    if (animate) {
      noBtn.classList.remove("dodge");
      void noBtn.offsetWidth;
      noBtn.classList.add("dodge");
      setTimeout(() => noBtn.classList.remove("dodge"), 460);
    }
  }

  function dodgeNo() {
    if (!noRoaming) startRoaming();
    noDodges++;
    const r = noBtn.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    moveNo(cx + rand(-W / 2, W / 2), cy + rand(-H / 2, H / 2), true);
    audioNear();
    vibrate(10);
  }

  function checkNoDodge(px, py) {
    if (!feedbackShown || noBtn.style.display === "none") return;
    if (performance.now() - lastDodge < DODGE_COOLDOWN) return;
    const r = noBtn.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const withinX = Math.abs(px - cx) < r.width / 2 + DODGE_RADIUS;
    const withinY = Math.abs(py - cy) < r.height / 2 + DODGE_RADIUS;
    if (withinX && withinY) {
      lastDodge = performance.now();
      dodgeNo();
    }
  }

  // dodge before the pointer can ever land a click
  noBtn.addEventListener("pointerenter", (e) => {
    if (e.pointerType === "touch") return;
    if (performance.now() - lastDodge < DODGE_COOLDOWN) return;
    lastDodge = performance.now();
    dodgeNo();
  });
  noBtn.addEventListener("pointerdown", () => {
    lastDodge = performance.now();
    dodgeNo();
  });
  // a tap can still land — it simply flees again, never concedes
  noBtn.addEventListener("click", (e) => {
    e.preventDefault();
    dodgeNo();
  });

  /* =========================================================
     5. PARTICLES  (Canvas)
     ========================================================= */
  function burst(px, py, colors, n, spread) {
    n = n || 26;
    spread = spread || 1;
    const count = reduceMotion ? Math.min(n, 12) : n;
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = rand(1.4, 5) * spread;
      particles.push({
        x: px, y: py,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 1,
        life: 1,
        decay: rand(0.011, 0.03),
        size: rand(2, 4.5),
        color: colors[(Math.random() * colors.length) | 0],
        grav: 0.06
      });
    }
  }

  function drawSpark(x, y, s, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -s); ctx.lineTo(s * 0.32, 0); ctx.lineTo(0, s); ctx.lineTo(-s * 0.32, 0);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-s, 0); ctx.lineTo(0, s * 0.32); ctx.lineTo(s, 0); ctx.lineTo(0, -s * 0.32);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }

  function sparkleRain(duration) {
    const start = performance.now();
    (function spawn() {
      for (let i = 0; i < 3; i++) {
        particles.push({
          x: rand(0, W),
          y: rand(0, H),
          vx: rand(-0.4, 0.4),
          vy: rand(-0.6, 0.2),
          life: 1,
          decay: rand(0.02, 0.05),
          size: rand(2, 4.5),
          color: "#ffffff",
          grav: 0,
          shape: "spark"
        });
      }
      if (performance.now() - start < duration) setTimeout(spawn, 70);
    })();
  }

  function updateParticles() {
    if (!particles.length) {
      if (ctx.__dirty) { ctx.clearRect(0, 0, W, H); ctx.__dirty = false; }
      return;
    }
    ctx.__dirty = true;
    ctx.clearRect(0, 0, W, H);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vy += p.grav;
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.99;
      p.life -= p.decay;
      if (p.life <= 0) { particles.splice(i, 1); continue; }

      ctx.globalAlpha = Math.max(p.life, 0);
      ctx.shadowBlur = 12;
      ctx.shadowColor = p.color;
      if (p.shape === "spark") {
        drawSpark(p.x, p.y, Math.max(p.size * p.life * 1.6, 0.8), p.color);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(p.size * p.life, 0.4), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }

  /* =========================================================
     6. AUDIO (Web Audio API — no external files)
     ========================================================= */
  let actx = null;
  let muted = false;
  try { muted = localStorage.getItem("wl-muted") === "1"; } catch (e) {}

  function audio() {
    if (!actx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) actx = new Ctx();
    }
    if (actx && actx.state === "suspended") actx.resume();
    return actx;
  }

  function tone(freq, at, dur, type, vol) {
    const c = audio();
    if (!c || muted) return;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type || "sine";
    o.frequency.setValueAtTime(freq, at);
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol || 0.16, at + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g).connect(c.destination);
    o.start(at);
    o.stop(at + dur + 0.04);
  }

  function audioNear() {
    const c = audio();
    if (!c) return;
    tone(880, c.currentTime, 0.1, "triangle", 0.08);
  }

  function audioChime(n) {
    const c = audio();
    if (!c) return;
    const base = 440 * Math.pow(2, (n * 3) / 12);
    const t = c.currentTime;
    tone(base, t, 0.55, "sine", 0.18);
    tone(base * 2, t + 0.02, 0.4, "triangle", 0.06);
  }

  function audioArpeggio() {
    const c = audio();
    if (!c) return;
    const t = c.currentTime;
    [0, 4, 7, 12, 16].forEach((semi, i) => {
      tone(523.25 * Math.pow(2, semi / 12), t + i * 0.12, 0.6, "triangle", 0.14);
    });
  }

  function updateSoundBtn() {
    const t = I18N[lang];
    soundBtn.textContent = muted ? "\uD83D\uDD07" : "\uD83D\uDD0A";
    soundBtn.setAttribute("aria-pressed", String(!muted));
    soundBtn.setAttribute("aria-label", muted ? t.soundOff : t.soundOn);
  }

  soundBtn.addEventListener("click", () => {
    muted = !muted;
    try { localStorage.setItem("wl-muted", muted ? "1" : "0"); } catch (e) {}
    if (muted) {
      // master silence: pause the music too, remembering what it was doing
      if (music && musicPlaying) { musicWasPlaying = true; music.pause(); }
    } else {
      audio();
      if (music && musicWasPlaying) {
        musicWasPlaying = false;
        const p = music.play();
        if (p && p.catch) p.catch(function () {});
      }
    }
    updateSoundBtn();
  });

  /* =========================================================
     6b. FLOATING MUSIC PLAYER  (persistent playlist)
     ========================================================= */
  const TRACKS = [
    { src: "Ethereal_spotdown.org.mp3",   name: "Ethereal" },
    { src: "Experience_spotdown.org.mp3", name: "Experience" },
    { src: "Solas_spotdown.org.mp3",      name: "Solas" }
  ];
  let trackIdx = 0;
  let musicPlaying = false;
  let musicWasPlaying = false;  // remembered across a master-mute pause
  let musicLaunch = false;      // first-gesture autostart already attempted

  // one shared element — view toggling never touches it, so the music
  // carries over from the dark screen to Page 2 and into every game
  const music = typeof Audio !== "undefined" ? new Audio() : null;

  function setTrack(i, autoplay) {
    if (!music) return;
    trackIdx = ((i % TRACKS.length) + TRACKS.length) % TRACKS.length;
    music.src = TRACKS[trackIdx].src;
    mwTitle.textContent = TRACKS[trackIdx].name;
    if (autoplay) {
      const p = music.play();
      if (p && p.catch) p.catch(function () {});
    }
  }

  function updateMusicUi() {
    if (!musicWidget) return;
    musicWidget.classList.toggle("playing", musicPlaying);
    if (mwPlay) {
      mwPlay.textContent = musicPlaying ? "\u275A\u275A" : "\u25B6";
      mwPlay.setAttribute("aria-label", I18N[lang][musicPlaying ? "musicPause" : "musicPlay"]);
    }
  }

  function startMusic() {
    if (muted || !music || musicLaunch) return;
    musicLaunch = true;
    setTrack(trackIdx, true);
  }

  if (music) {
    music.preload = "auto";
    music.addEventListener("ended", () => setTrack(trackIdx + 1, true));
    music.addEventListener("play",  () => { musicPlaying = true; updateMusicUi(); });
    music.addEventListener("pause", () => { musicPlaying = false; updateMusicUi(); });
    music.addEventListener("error", () => { musicPlaying = false; updateMusicUi(); });
  }
  mwPlay.addEventListener("click", () => {
    if (!music) return;
    if (music.paused) { const p = music.play(); if (p && p.catch) p.catch(function () {}); }
    else music.pause();
  });
  mwNext.addEventListener("click", () => setTrack(trackIdx + 1, musicPlaying));
  mwPrev.addEventListener("click", () => setTrack(trackIdx - 1, musicPlaying));

  function vibrate(pattern) {
    if (navigator.vibrate) { try { navigator.vibrate(pattern); } catch (e) {} }
  }

  /* =========================================================
     7. POINTER / TOUCH
     ========================================================= */
  window.addEventListener("pointermove", (e) => {
    mx = e.clientX;
    my = e.clientY;
    moved = true;
    if (feedbackShown) checkNoDodge(e.clientX, e.clientY);
  }, { passive: true });

  window.addEventListener("pointerdown", (e) => {
    mx = e.clientX;
    my = e.clientY;
    moved = true;
    audio();
    startMusic();
  }, { passive: true });

  /* =========================================================
     8. RESIZE / INIT
     ========================================================= */
  function onResize() {
    W = window.innerWidth;
    H = window.innerHeight;
    resizeCanvas();
    if (!revealed) darkness.style.setProperty("--beam", beamRadius() + "px");
    cacheStar();
    if (noRoaming) moveNo(lastNoPos.x, lastNoPos.y, false);
    if (flowerGameOpen) resizeDraw();
    if (skyOpen) resizeSky();
  }

  function init() {
    W = window.innerWidth;
    H = window.innerHeight;
    mx = bx = W / 2;
    my = by = H / 2;
    darkness.style.setProperty("--mx", bx + "px");
    darkness.style.setProperty("--my", by + "px");
    darkness.style.setProperty("--beam", beamRadius() + "px");

    resizeCanvas();
    pickStarSpot();
    applyLang(detectLang());
    updateSoundBtn();
    cacheStar();

    window.addEventListener("resize", onResize, { passive: true });
    requestAnimationFrame(loop);
  }

  init();
})();
