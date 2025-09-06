// =========================
// Preguntas
// =========================
const questions = [
    { q: "¿Dónde fue nuestra primera cita?", options: ["Skal","Kick Off","Baum"], correct: 1 },
    { q: "¿Cómo le decimos a Sircito Tom 🐶?", options: ["Toni","Bobi","Cachavacha"], correct: 2 },
    { q: "¿Cuál es mi comida favorita?", options: ["Pastas","Hamburguesas","Asado"], correct: 1 },
    { q: "¿Cuál fue el primer jueguito que jugamos juntos?", options: ["Minecraft","Apex","Fortnite"], correct: 0 },
    { q: "¿Me amás?", options: ["Sí","Obvio que sí","Te amo mucho"], correct: "any", msg: "Más te valía, hdp" },
    { q: "¿Cuál fue la primer comidita que cocinamos juntos?", options: ["Fideos","Capeletinis","Tacos"], correct: 2 },
    { q: "¿Qué me convidó tu abuela la primera vez que la vi?", options: ["Agua","Mate","Café"], correct: 1, msg: "Los mejores matecitos, tibios y dulzones ☕" },
    { q: "¿De quién era la canción que te dediqué en una historia de insta?", options: ["Twenty one pilots","Arctic Monkeys","50cent"], correct: 2, msg:"If I was your best friend, I want you around all the time 🎵" },
    { q: "¿Cuál fue la frase que tiró tu papá en el asadito?", options: ["Que pinta tiene esto","A ver si se deja comer","Dale Paula veni que tengo hambre"], correct: 1 },
    { q: "Cuando compartimos polea por primera vez, ¿qué te dije?", options: ["Estás haciendo mal el ejercicio","Si querés descansá tranqui, yo no tengo apuro","Qué lindo ese outfit"], correct: 1 },
  ];
  
  let gameEnded = false;
  let currentQ = 0;
  let capibaras = 0;
  
  // =========================
  // Elementos
  // =========================
  const introScreen     = document.getElementById("screen-intro");
  const gameScreen      = document.getElementById("screen-game");
  const finalScreen     = document.getElementById("screen-final");       // ¿Me amás?
  const pauseScreen     = document.getElementById("screen-pause");       // Pausa 10s
  const proposalScreen  = document.getElementById("screen-proposal");    // ¿Querés ser mi novia?
  const noviosScreen    = document.getElementById("screen-novios");      // Final
  const questionBox     = document.getElementById("question-box");
  const capibarasEl     = document.getElementById("capibaras");
  
  // ===== Sonido (toggle + WebAudio) =====
  let soundEnabled = true;
  try {
    const saved = localStorage.getItem('soundEnabled');
    if (saved !== null) soundEnabled = saved === 'true';
  } catch(e) {}
  
  const Sound = (() => {
    let ctx = null;
    function ensureCtx() {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      return ctx;
    }
    function beep({freq=800, dur=0.12, type='sine', gain=0.08, when=0}={}) {
      if (!soundEnabled) return;
      const actx = ensureCtx();
      const t = actx.currentTime + when;
      const osc = actx.createOscillator();
      const g = actx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(gain, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g).connect(actx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    }
    function ding() {
      beep({freq: 740,  dur: 0.10, type:'sine',     when:0});
      beep({freq: 1100, dur: 0.12, type:'triangle', when:0.06});
    }
    function thud() {
      beep({freq: 180,  dur: 0.08, type:'sawtooth', gain:0.05});
    }
    return { ding, thud };
  })();
  
  // Botón toggle de sonido
  (function initSoundToggle(){
    const btn = document.getElementById('sound-toggle');
    if (!btn) return;
    btn.setAttribute('aria-pressed', soundEnabled ? 'true' : 'false');
    btn.addEventListener('click', ()=>{
      soundEnabled = !soundEnabled;
      btn.setAttribute('aria-pressed', soundEnabled ? 'true' : 'false');
      try { localStorage.setItem('soundEnabled', String(soundEnabled)); } catch(e){}
      if (soundEnabled) Sound.ding();
    });
  })();
  
  // ===== Barra de progreso =====
  function updateProgress(){
    const fill = document.getElementById('capi-progress-fill');
    const total = questions.length;
    const pct = Math.min(100, Math.round((capibaras / total) * 100));
    if (fill) fill.style.width = pct + '%';
    // latido en el número
    capibarasEl.classList.remove('capipulse');
    void capibarasEl.offsetWidth;
    capibarasEl.classList.add('capipulse');
  }
  
  // =========================
  // Helpers de pantallas
  // =========================
  function showOnly(screenEl) {
    [introScreen, gameScreen, finalScreen, pauseScreen, proposalScreen, noviosScreen]
      .filter(Boolean)
      .forEach(s => s.classList.add("hidden"));
    if (screenEl) screenEl.classList.remove("hidden");
  }
  
  // =========================
  /* Intro (fecha) */
  // =========================
  let attempts = 3;
  const btnCheckDate = document.getElementById("btn-check-date");
  if (btnCheckDate) {
    btnCheckDate.addEventListener("click", () => {
      const day = parseInt(document.getElementById("day").value);
      const month = parseInt(document.getElementById("month").value);
      const msg = document.getElementById("intro-msg");
  
      if (attempts <= 0) {
        msg.textContent = "Se acabaron los intentos 😅";
        return;
      }
  
      if (day === 1 && month === 7) {
        showOnly(gameScreen);
        updateProgress(); // inicializa barra en 0%
        showQuestion();
      } else {
        attempts--;
        if (attempts > 0) {
          msg.textContent = `No sos Pau, y si sos, hacé memoria 😏. Te quedan ${attempts} intentos`;
        } else {
          msg.textContent = "Se acabaron los intentos 😅";
        }
      }
    });
  }
  
  // =========================
  /* Mostrar preguntas */
  // =========================
  function showQuestion() {
    if (gameEnded) return;
  
    if (currentQ >= questions.length) {
      gameEnded = true;
      showOnly(finalScreen); // ¿Me amás?
      return;
    }
  
    const q = questions[currentQ];
  
    // Render con contenedor animable
    questionBox.innerHTML = `
      <div class="q-card q-enter">
        <h2 class="question-anim">${q.q}</h2>
        <p id="msg" class="msg" aria-live="polite"></p>
        <div class="options">
        ${q.options.map((opt,i)=>`<button class="opt" data-i="${i}" type="button">${decorateOptionLabel(opt)}</button>`).join("")}
        </div>
      </div>
    `;
  
    void questionBox.offsetWidth;
  
    const card = questionBox.querySelector('.q-card');
    const msg  = questionBox.querySelector('#msg');
    const btns = Array.from(questionBox.querySelectorAll('.opt'));
  
    // evitar múltiples clicks
    let locked = false;
  
    btns.forEach(btn=>{
      btn.addEventListener("click", ()=>{
        if (locked) return;
        const i = parseInt(btn.dataset.i);
        const isCorrect = (q.correct === "any" || i === q.correct);
        locked = true;
  
        if (isCorrect) {
            btn.classList.add("correct");
            capibaras++;
            capibarasEl.textContent = capibaras;
            Sound.ding();
            updateProgress();
          
            // Mensaje de éxito en píldora
            msg.className = "msg msg-success";
            msg.textContent = q.msg || "¡Correcto!";
          } else {
            btn.classList.add("wrong");
            Sound.thud();
          
            // Mensaje de error en píldora
            msg.className = "msg msg-error";
            msg.textContent = "Casi casi… probá otra 😅";
          
            locked = false; // permite reintentar
            return;
          }
  
        // deshabilitamos SOLO los otros; el correcto queda visible y bloqueado con pointer-events
        btns.forEach(b => { if (b !== btn) b.disabled = true; });
        btn.style.pointerEvents = 'none';
  
        // salida animada y luego avanzar (4s para leer el mensajito)
        setTimeout(()=>{
          card.classList.remove('q-enter');
          card.classList.add('q-leave');
          const afterLeave = () => {
            card.removeEventListener('animationend', afterLeave);
            currentQ++;
            showQuestion();
          };
          card.addEventListener('animationend', afterLeave);
        }, 3000);
      });
    });
  }
  
  // =========================
  /* ¿Me amás? -> PAUSA -> propuesta */
  // =========================
  const btnLoveYes = document.getElementById("btn-love-yes");
  const btnLoveNo  = document.getElementById("btn-love-no");
  
  if (btnLoveYes) {
    btnLoveYes.addEventListener("click", ()=>{
      startPauseSequence(10000).then(()=>{
        showOnly(proposalScreen);
        enterProposalMode();   // <<< nuevo
      });
    });
  }
  
  // Botones "No" que escapan (mouse + touch)
  function makeEscapist(btn) {
    if (!btn) return;
    const move = (e) => {
      const parent = btn.parentElement || document.body;
      const rect = parent.getBoundingClientRect();
      const bw = btn.offsetWidth;
      const bh = btn.offsetHeight;
  
      const pad = 10;
      const maxX = Math.max(0, rect.width - bw - pad);
      const maxY = Math.max(0, rect.height - bh - pad);
  
      const x = Math.random() * maxX;
      const y = Math.random() * maxY;
  
      btn.style.position = "absolute";
      btn.style.left = x + "px";
      btn.style.top  = y + "px";
    };
    btn.addEventListener("mouseenter", move);
    btn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      move(e);
    }, {passive:false});
  }
  makeEscapist(btnLoveNo);
  
  // Activa tema especial y anima la frase "¿Querés ser mi novia?"
  function enterProposalMode(){
    // tema romántico
    document.body.classList.add('proposal-mode');
  
    // el <p> con la pregunta
    const phraseP = proposalScreen.querySelector('p');
    if (!phraseP) return;
  
    const words = ["¿Querés","ser","mi","novia?"];
    phraseP.classList.add('proposal-phrase');
    phraseP.innerHTML = '';
  
    const spans = words.map((w, i) => {
      const s = document.createElement('span');
      s.className = 'proposal-word';
      s.textContent = w;
      phraseP.appendChild(s);
      // espacio real entre spans (por si el navegador ignora márgenes)
      if (i < words.length - 1) {
        phraseP.appendChild(document.createTextNode(' '));
      }
      return s;
    });
  
    const step = 900; // ms entre palabras
    spans.forEach((s, idx)=>{
      setTimeout(()=> s.classList.add('show'), idx * step);
    });
  
    const totalDelay = (words.length - 1) * step + 300;
    setTimeout(()=>{
      const opts = proposalScreen.querySelectorAll('.options .opt');
      opts.forEach(btn=>{
        btn.style.animation = 'none';
        // reflow para reiniciar anim
        // eslint-disable-next-line no-unused-expressions
        btn.offsetWidth;
        btn.style.removeProperty('animation');
      });
    }, totalDelay);
  }
  

  
  // =========================
  /* Propuesta formal */
  // =========================
  const btnProposalYes = document.getElementById("btn-proposal-yes");
  const btnProposalNo  = document.getElementById("btn-proposal-no");
  
  if (btnProposalYes) {
    btnProposalYes.addEventListener("click", ()=>{
      showOnly(noviosScreen);
      startHeartsRain();  // Lluvia de corazones celebración
      const d = new Date();
      document.getElementById("date").textContent = "Fecha: " + d.toLocaleDateString();
    });
  }
  makeEscapist(btnProposalNo);
  
 // ---- Guardar momento ----
document.getElementById("btn-save").addEventListener("click", ()=>{
  const capture = document.getElementById("capture-area");

  // Mostrar temporalmente
  capture.classList.remove("hidden");

  html2canvas(capture, {backgroundColor: "#fff"}).then(canvas=>{
    // Descargar imagen
    const link = document.createElement("a");
    link.download = "recuerdo-novios.png";
    link.href = canvas.toDataURL("image/png");
    link.click();

    // Ocultar de nuevo para que no quede en pantalla
    capture.classList.add("hidden");
  });
});
  
// =========================
/* Video sorpresa (mejorado) */
// =========================
const btnSurprise = document.getElementById("btn-surprise");
const v = document.getElementById("video-surprise");

if (v) {
  // Detectar relación de aspecto para aplicar clases CSS
  v.addEventListener("loadedmetadata", () => {
    const ratio = v.videoWidth / v.videoHeight;
    v.classList.toggle("is-vertical", ratio < 1);
    v.classList.toggle("is-horizontal", ratio >= 1);
  });
}

if (btnSurprise) {
  btnSurprise.addEventListener("click", () => {
    v.classList.remove("hidden");
    // desplazamos para que quede bien centrado en pantalla
    setTimeout(() => {
      window.scrollTo({ top: v.offsetTop - 16, behavior: "smooth" });
    }, 80);
    v.play().catch(() => {}); // por si el navegador bloquea autoplay
  });
}

  
  // ===================================================
  // Animación: Pausa con estrellas/corazones (10s)
  // ===================================================
  let pauseRAF = null;
  function startPauseSequence(durationMs = 10000) {
    return new Promise((resolve)=>{
      if (!pauseScreen) { resolve(); return; }
      showOnly(pauseScreen);
  
      const container = document.getElementById("pause-anim");
      let c = container.querySelector("canvas");
      if (!c) {
        c = document.createElement("canvas");
        c.width = container.clientWidth || 320;
        c.height = Math.max(container.clientHeight, 140) || 180;
        container.appendChild(c);
      }
      const ctx = c.getContext("2d");
  
      const particles = [];
      const count = 36;
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * c.width,
          y: Math.random() * c.height,
          r: Math.random() * 8 + 6,
          vy: (Math.random() * 0.4 + 0.2),
          vx: (Math.random() * 0.6 - 0.3),
          type: Math.random() < 0.6 ? "heart" : "star",
          rot: Math.random() * Math.PI,
          vr: (Math.random() * 0.02 - 0.01)
        });
      }
  
      let start = null;
      const animate = (ts) => {
        if (!start) start = ts;
        const elapsed = ts - start;
  
        const w = container.clientWidth || 320;
        const h = Math.max(container.clientHeight, 140) || 180;
        if (c.width !== w || c.height !== h) {
          c.width = w; c.height = h;
        }
  
        ctx.clearRect(0,0,c.width,c.height);
  
        particles.forEach(p=>{
          p.x += p.vx; p.y += p.vy; p.rot += p.vr;
  
          if (p.y > c.height + 12) { p.y = -12; p.x = Math.random() * c.width; }
          if (p.x < -12) p.x = c.width + 12;
          if (p.x > c.width + 12) p.x = -12;
  
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rot);
          if (p.type === "heart") drawHeartPath(ctx, p.r);
          else drawStarPath(ctx, p.r);
          ctx.globalAlpha = 0.9;
          ctx.fillStyle = (p.type === "star") ? "#ffd166" : "#e63946";
          ctx.fill();
          ctx.restore();
        });
  
        if (elapsed < durationMs) {
          pauseRAF = requestAnimationFrame(animate);
        } else {
          cancelAnimationFrame(pauseRAF);
          ctx.clearRect(0,0,c.width,c.height);
          resolve();
        }
      };
      pauseRAF = requestAnimationFrame(animate);
    });
  }
  
  // ===================================================
  // Lluvia de corazones (celebración final)
  // ===================================================
  let heartsRAF = null;
  function startHeartsRain() {
    const canvas = document.getElementById("hearts");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
  
    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);
  
    const hearts = [];
    const COUNT = Math.min(80, Math.floor((canvas.width * canvas.height) / 18000) + 30);
    for (let i = 0; i < COUNT; i++) {
      const size = Math.random() * 16 + 10;
      hearts.push({
        x: Math.random() * canvas.width,
        y: -Math.random() * canvas.height,
        r: size,
        vy: Math.random() * 1.5 + 0.8,
        vx: Math.random() * 0.6 - 0.3,
        rot: Math.random() * Math.PI,
        vr: Math.random() * 0.02 - 0.01
      });
    }
  
    const animate = () => {
      ctx.clearRect(0,0,canvas.width,canvas.height);
  
      hearts.forEach(h=>{
        ctx.save();
        ctx.translate(h.x, h.y);
        ctx.rotate(h.rot);
        drawHeartPath(ctx, h.r);
        ctx.fillStyle = "#e63946";
        ctx.globalAlpha = 0.9;
        ctx.fill();
        ctx.restore();
  
        h.y += h.vy; h.x += h.vx; h.rot += h.vr;
  
        if (h.y > canvas.height + h.r) { h.y = -h.r; h.x = Math.random() * canvas.width; }
        if (h.x < -h.r) h.x = canvas.width + h.r;
        if (h.x > canvas.width + h.r) h.x = -h.r;
      });
  
      heartsRAF = requestAnimationFrame(animate);
    };
  
    if (heartsRAF) cancelAnimationFrame(heartsRAF);
    heartsRAF = requestAnimationFrame(animate);
  }
  
  // Dibuja un corazón vectorial centrado
  function drawHeartPath(ctx, size) {
    const s = size;
    ctx.beginPath();
    ctx.moveTo(0, s * 0.35);
    ctx.bezierCurveTo(-s, -s*0.4, -s*0.6, -s*1.1, 0, -s*0.6);
    ctx.bezierCurveTo(s*0.6, -s*1.1, s, -s*0.4, 0, s*0.35);
    ctx.closePath();
  }
  // Estrella simple 5 puntas
  function drawStarPath(ctx, size) {
    const spikes = 5, outer = size, inner = size * 0.5;
    let rot = Math.PI / 2 * 3, x = 0, y = 0, step = Math.PI / spikes;
    ctx.beginPath(); ctx.moveTo(0, -outer);
    for (let i = 0; i < spikes; i++) {
      x = Math.cos(rot) * outer; y = Math.sin(rot) * outer; ctx.lineTo(x, y); rot += step;
      x = Math.cos(rot) * inner; y = Math.sin(rot) * inner; ctx.lineTo(x, y); rot += step;
    }
    ctx.lineTo(0, -outer); ctx.closePath();
  }
  
  // =========================
  // Inicio
  // =========================
  showOnly(introScreen);
  

  // ===== Emojis por opción (case-insensitive) =====
const emojiByOption = {
    "skal":"📍", "kick off":"📍", "baum":"📍",
  
    "toni":"🐶", "bobi":"🐶", "cachavacha":"🐶",
  
    "pastas":"🍝", "hamburguesas":"🍔", "asado":"🥩",
  
    "minecraft":"🎮", "apex":"🎮", "fortnite":"🎮",
  
    "sí":"❤️", "obvio que sí":"❤️", "te amo mucho":"❤️",
  
    "fideos":"🍝", "capeletinis":"🥟", "tacos":"🌮",
  
    "agua":"💧", "mate":"🧉", "café":"☕",
  
    "twenty one pilots":"🎵", "arctic monkeys":"🎵", "50cent":"🎵",
  
    "que pinta tiene esto":"💬",
    "a ver si se deja comer":"💬",
    "dale paula veni que tengo hambre":"💬",
  
    "estás haciendo mal el ejercicio":"💪",
    "si querés descansá tranqui, yo no tengo apuro":"💪",
    "qué lindo ese outfit":"💪"
  };
  
  function decorateOptionLabel(text){
    const key = String(text).trim().toLowerCase();
    const emoji = emojiByOption[key];
    return emoji ? `${text} ${emoji}` : text;
  }
  