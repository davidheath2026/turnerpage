/* ============================================================
   TURNER PAGE LESSON KIT — SHARED ENGINE
   ============================================================
   Loaded by every lesson, after footer-config.js. A lesson file
   itself should contain almost no logic — just a config object
   describing the lesson (title, storage key, next URL) and a
   `blocks` array describing each screen, then a single call:

     TPKit.mount(document.getElementById('tpRoot'), LESSON_CONFIG);

   See AUTHORING-GUIDE.md for the full block-type catalogue and
   copy-paste examples. Section index below.

     1. Small helpers (icons, fromField, promiseCard, mic wiring)
     2. Block-type renderers
     3. mount() — builds chrome and drives the render loop
============================================================ */
(function(){

/* ---------- 1. Small helpers --------------------------------------- */

// A small starter set of reusable line icons (stroke = currentColor).
// Add more here as new lessons need them — keep the same stroke-width
// and style so every icon in the course feels like part of one set.
const icons = {
  database:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg>`,
  refresh:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 0 0-14.9-4"/><path d="M4 4v5h5"/><path d="M4 13a8 8 0 0 0 14.9 4"/><path d="M20 20v-5h-5"/></svg>`,
  shieldCheck:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z"/><path d="M9 12l2 2 4-4"/></svg>`,
  people:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3"/><path d="M2 20c0-3.3 3.1-6 7-6s7 2.7 7 6"/><circle cx="17" cy="8" r="2.5"/><path d="M16 14.2c2.9.5 5 2.6 5 5.8"/></svg>`,
  server:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="6" rx="1.5"/><rect x="3" y="14" width="18" height="6" rx="1.5"/><circle cx="7" cy="7" r=".6" fill="currentColor" stroke="none"/><circle cx="7" cy="17" r=".6" fill="currentColor" stroke="none"/></svg>`,
  checkCircle:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 4.5-5"/></svg>`,
  clock:`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>`
};

// Renders a standard "🎧 From the Field" audio card. Call this from
// inside a block's `html` template wherever you want the clip to sit:
//   html:`<p>...</p>${TPKit.fromField({...})}<p>...</p>`
function fromField(cfg){
  return `<div class="from-field">
    <div class="callout-label">🎧 FROM THE FIELD</div>
    <h4>${cfg.title}</h4>
    <div class="meta"><strong>${cfg.name}</strong> · ${cfg.role} · ${cfg.project}</div>
    <audio controls preload="metadata"><source src="${cfg.src}" type="audio/mpeg"></audio>
    ${cfg.reflection?`<div class="reflection"><strong>Turner Page Reflection</strong><br>${cfg.reflection}</div>`:""}
  </div>`;
}

// Renders the inline "Turner Page Promise" callout card using the
// site-wide wording from footer-config.js, so it never drifts out of
// sync with the footer strip. Use inside any block's html:
//   html:`...${TPKit.promiseCard()}...`
// Optional overrides: TPKit.promiseCard({title:"...", body:"..."})
function promiseCard(overrides){
  const f = window.TP_FOOTER || {label:"The Turner Page Promise", text:""};
  const title = (overrides && overrides.title) || "Learning that improves professional judgement";
  const body = (overrides && overrides.body) || f.text;
  return `<div class="promise">
    <div class="kicker">${f.label}</div>
    <h3>${title}</h3>
    <p>${body}</p>
  </div>`;
}

// Wires a "use microphone" button + status span to fill a textarea
// via the Web Speech API, if the browser supports it. Shared by both
// the reflection and valuable block types so behaviour never drifts
// between them.
function wireMic({button, status, textarea, onChange}){
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SpeechRecognition){
    button.disabled = true;
    status.textContent = "Microphone input is not supported in this browser.";
    return;
  }
  const recognition = new SpeechRecognition();
  recognition.lang = "en-GB";
  recognition.continuous = true;
  recognition.interimResults = true;
  let listening = false;
  let baseText = textarea.value;

  recognition.onstart = () => {
    listening = true;
    baseText = textarea.value;
    button.textContent = "Stop microphone";
    status.textContent = "Listening...";
  };
  recognition.onresult = (event) => {
    let transcript = "";
    for(let i = event.resultIndex; i < event.results.length; i++){
      transcript += event.results[i][0].transcript;
    }
    textarea.value = (baseText + " " + transcript).trim();
    onChange();
  };
  recognition.onend = () => {
    listening = false;
    baseText = textarea.value;
    button.textContent = "Use microphone";
    status.textContent = "";
  };
  recognition.onerror = () => {
    status.textContent = "Microphone input was not available.";
  };
  button.onclick = () => { listening ? recognition.stop() : recognition.start(); };
}

/* ---------- 2. Block-type renderers ---------------------------------
   Each renderer receives {b, i, dynamic, next, lesson, state, save,
   renderCurrent} and returns whether the block is "ready" (Continue
   enabled). Types that manage next.disabled live themselves
   (tradeoffTriangle, reflection, valuable) return false up front and
   correct it as the learner interacts.
----------------------------------------------------------------------- */
const renderers = {};

// Supports two shapes of b.options:
//  - graded:   [{label, correct, feedback}, ...]  → feedback coloured good/warn
//  - ungraded: ["label", "label", ...] + a parallel b.feedback array
//              → every choice is a legitimate answer, feedback is neutral
//              (use this when there's no single "right" response, only
//              stronger and weaker ones — e.g. an opening judgement call).
renderers.mcq = ({ b, dynamic, state, save, renderCurrent }) => {
  const graded = typeof b.options[0] === "object";
  const selected = state.answers[b.id];
  const wrap = document.createElement("div"); wrap.className = "options";
  b.options.forEach((opt, j) => {
    const label = graded ? opt.label : opt;
    const btn = document.createElement("button");
    btn.className = "option" + (selected === j ? " selected" : "");
    btn.type = "button";
    btn.innerHTML = `<span class="badge">${String.fromCharCode(65+j)}</span><span>${label}</span>`;
    btn.onclick = () => { state.answers[b.id] = j; save(); renderCurrent(); };
    wrap.appendChild(btn);
  });
  dynamic.appendChild(wrap);
  if(selected !== undefined){
    if(graded){
      const opt = b.options[selected];
      dynamic.insertAdjacentHTML("beforeend", `<div class="feedback ${opt.correct?"good":opt.correct===false?"warn":""}">${opt.feedback}</div>`);
    } else {
      dynamic.insertAdjacentHTML("beforeend", `<div class="feedback">${b.feedback[selected]}</div>`);
    }
    return true;
  }
  return false;
};

// Select EVERY option (not a capped N) before continuing — each choice
// reveals its own coaching note immediately. Use for "explore every
// piece of evidence" style exercises. For "pick your top N", use
// selectN instead.
renderers.selectAll = ({ b, dynamic, state, save, renderCurrent }) => {
  const selected = state.answers[b.id] || [];
  const wrap = document.createElement("div"); wrap.className = "options";
  b.options.forEach((option, j) => {
    const chosen = selected.includes(j);
    const holder = document.createElement("div");
    const btn = document.createElement("button");
    btn.className = "option" + (chosen ? " selected" : "");
    btn.type = "button";
    btn.innerHTML = `<span class="badge">${chosen?"✓":"+"}</span><span>${option}</span>`;
    btn.onclick = () => { const s = new Set(selected); s.has(j)?s.delete(j):s.add(j); state.answers[b.id] = [...s]; save(); renderCurrent(); };
    holder.appendChild(btn);
    if(chosen) holder.insertAdjacentHTML("beforeend", `<div class="feedback">${b.coaching[j]}</div>`);
    wrap.appendChild(holder);
  });
  dynamic.appendChild(wrap);
  const ready = selected.length === b.options.length;
  if(ready && b.closingHtml) dynamic.insertAdjacentHTML("beforeend", b.closingHtml);
  else dynamic.insertAdjacentHTML("beforeend", `<p class="small">${b.hint || "Explore every option before continuing."}</p>`);
  return ready;
};

renderers.situations = ({ b, dynamic, state, save, renderCurrent }) => {
  const answers = state.answers[b.id] || {};
  b.items.forEach((s, j) => {
    const box = document.createElement("div"); box.className = "framework-detail";
    box.innerHTML = `<div class="kicker">${s.title}</div><h3>${s.question}</h3>`;
    const optWrap = document.createElement("div"); optWrap.className = "options";
    s.options.forEach((opt, k) => {
      const btn = document.createElement("button");
      btn.className = "option" + (answers[j] === k ? " selected" : "");
      btn.type = "button";
      btn.innerHTML = `<span class="badge">${String.fromCharCode(65+k)}</span><span>${opt.label}</span>`;
      btn.onclick = () => { answers[j] = k; state.answers[b.id] = answers; save(); renderCurrent(); };
      optWrap.appendChild(btn);
    });
    box.appendChild(optWrap);
    if(answers[j] !== undefined){
      const opt = s.options[answers[j]];
      box.insertAdjacentHTML("beforeend", `<div class="feedback ${opt.correct?"good":"warn"}">${opt.feedback}</div>`);
    }
    dynamic.appendChild(box);
  });
  const ready = Object.keys(answers).length === b.items.length;
  if(ready && b.takeawayHtml) dynamic.insertAdjacentHTML("beforeend", b.takeawayHtml);
  return ready;
};

renderers.expandableList = ({ b, dynamic, state, save, renderCurrent }) => {
  const st = state.answers[b.id] || { open: [] };
  st.open = st.open || [];
  const layout = b.layout || "loop";

  if(layout === "grid"){
    const grid = document.createElement("div"); grid.className = "framework-grid";
    b.items.forEach((q, j) => {
      const open = st.open.includes(j);
      const card = document.createElement("article"); card.className = "framework-node";
      card.innerHTML = `<div class="framework-head"><div class="framework-icon">${q.icon||(j+1)}</div><span class="num">0${j+1}</span></div>
        <h4>${q.title}</h4>${q.short?`<p class="small">${q.short}</p>`:""}
        ${open?`<div class="dq-detail">${q.detail}${q.ask?`<div class="dq-ask">${q.ask}</div>`:""}</div>`:""}
        <button class="btn secondary" type="button">${open?"Hide detail":"Explore"}</button>`;
      card.querySelector("button").onclick = () => {
        const s = new Set(st.open); s.has(j) ? s.delete(j) : s.add(j); st.open = [...s]; state.answers[b.id] = st; save(); renderCurrent();
      };
      grid.appendChild(card);
    });
    dynamic.appendChild(grid);
  } else {
    const loop = document.createElement("div"); loop.className = "dq-loop";
    b.items.forEach((q, j) => {
      const open = st.open.includes(j);
      const item = document.createElement("div"); item.className = "dq-item";
      item.innerHTML = `<div class="dq-num">${j+1}</div><div class="dq-body"><h4>${q.title}</h4>${q.short?`<p class="small">${q.short}</p>`:""}${open?`<div class="dq-detail">${q.detail}${q.ask?`<div class="dq-ask">${q.ask}</div>`:""}</div>`:""}<button class="btn secondary" type="button">${open?"Hide detail":"Explore"}</button></div>`;
      item.querySelector("button").onclick = () => {
        const s = new Set(st.open); s.has(j) ? s.delete(j) : s.add(j); st.open = [...s]; state.answers[b.id] = st; save(); renderCurrent();
      };
      loop.appendChild(item);
    });
    dynamic.appendChild(loop);
  }

  const allOpen = st.open.length === b.items.length;
  let checkpointDone = !b.checkpoint;
  if(allOpen && b.checkpoint){
    const cp = b.checkpoint;
    const cpWrap = document.createElement("div"); cpWrap.className = "checkpoint-card";
    cpWrap.innerHTML = `<div class="kicker">Interactive checkpoint</div><h4>${cp.question}</h4>
      <div class="mini-options">${cp.options.map((o,k)=>`<button class="mini-option${st.checkpoint===k?" selected":""}" type="button" data-k="${k}">${o}</button>`).join("")}</div>
      ${st.checkpoint!==undefined?`<div class="feedback">${cp.feedback}</div>`:""}`;
    dynamic.appendChild(cpWrap);
    cpWrap.querySelectorAll(".mini-option").forEach(btn => {
      btn.onclick = () => { st.checkpoint = parseInt(btn.dataset.k,10); state.answers[b.id] = st; save(); renderCurrent(); };
    });
    checkpointDone = st.checkpoint !== undefined;
  }

  state.answers[b.id] = st;
  const ready = allOpen && checkpointDone;
  if(ready && b.takeawayHtml) dynamic.insertAdjacentHTML("beforeend", b.takeawayHtml);
  return ready;
};

renderers.tradeoffTriangle = ({ b, lesson, state, save, next }) => {
  // Static SVG + challenge markup lives in b.html (see AUTHORING-GUIDE).
  // This renderer only wires interactivity — no re-render on every
  // click, which keeps the SVG's own CSS transitions smooth.
  const nodes = [...lesson.querySelectorAll(".tri-node")];
  const detail = lesson.querySelector(".tri-detail");
  const hint = lesson.querySelector(".tri-hint");
  const dots = [...lesson.querySelectorAll(".tri-progress span")];
  const mcqWrap = lesson.querySelector(".tri-challenge-options");
  const mcqFeedback = lesson.querySelector(".tri-challenge-feedback");
  const closingWrap = lesson.querySelector(".tri-closing");
  if(!nodes.length) return false;

  const st = state.answers[b.id] || { corners: [] };
  st.corners = st.corners || [];
  state.answers[b.id] = st;

  function paintTriangle(){
    nodes.forEach(n => n.classList.toggle("active", n.dataset.node === st.lastNode));
    dots.forEach(d => d.classList.toggle("done", st.corners.includes(d.dataset.node)));
    if(st.lastNode){
      const data = b.corners.find(x => x.id === st.lastNode);
      if(data) detail.innerHTML = data.detailHtml;
    }
    hint.textContent = st.corners.length >= b.corners.length ? (b.hintDone || "You've explored every corner.") : (b.hint || "Click a corner to see what happens when it changes.");
  }
  nodes.forEach(n => {
    n.addEventListener("click", () => {
      const id = n.dataset.node;
      const s = new Set(st.corners); s.add(id); st.corners = [...s]; st.lastNode = id;
      state.answers[b.id] = st; save(); paintTriangle(); checkReady();
    });
    n.addEventListener("keydown", (e) => { if(e.key === "Enter" || e.key === " "){ e.preventDefault(); n.click(); } });
  });
  paintTriangle();

  let mcqButtons = [];
  if(mcqWrap && b.challenge){
    mcqButtons = [...mcqWrap.children];
    function paintMcq(){
      mcqButtons.forEach((btn, j) => btn.classList.toggle("selected", st.mcq === j));
      if(st.mcq !== undefined){
        const opt = b.challenge.options[st.mcq];
        mcqFeedback.innerHTML = `<div class="feedback ${opt.correct?"good":"warn"}">${opt.feedback}</div>`;
      }
    }
    mcqButtons.forEach((btn, j) => {
      btn.onclick = () => { st.mcq = j; state.answers[b.id] = st; save(); paintMcq(); checkReady(); };
    });
    paintMcq();
  }

  function checkReady(){
    const cornersReady = st.corners.length >= b.corners.length;
    const mcqReady = !b.challenge || st.mcq !== undefined;
    const ready = cornersReady && mcqReady;
    next.disabled = !ready;
    if(ready && closingWrap && b.insightHtml && !closingWrap.dataset.filled){
      closingWrap.innerHTML = b.insightHtml;
      closingWrap.dataset.filled = "1";
    }
  }
  checkReady();
  return false; // readiness is managed live above, not via return value
};

renderers.guidedSteps = ({ b, dynamic, state, save, renderCurrent }) => {
  const revealed = state.answers[b.id] || 0;
  const wrap = document.createElement("div"); wrap.className = "guided-steps";
  b.steps.forEach((step, j) => {
    if(j < revealed){
      const el = document.createElement("div"); el.className = "guided-step";
      el.innerHTML = `<div class="kicker">Step ${j+1}</div>${step.html}`;
      wrap.appendChild(el);
    }
  });
  dynamic.appendChild(wrap);
  if(revealed < b.steps.length){
    const btn = document.createElement("button");
    btn.className = "btn primary guided-reveal-btn"; btn.type = "button";
    btn.textContent = revealed === 0 ? (b.firstLabel || "Walk through Step 1") : `Reveal Step ${revealed+1}`;
    btn.onclick = () => { state.answers[b.id] = revealed + 1; save(); renderCurrent(); };
    dynamic.appendChild(btn);
  } else if(b.closingHtml){
    dynamic.insertAdjacentHTML("beforeend", b.closingHtml);
  }
  return revealed >= b.steps.length;
};

renderers.selectN = ({ b, dynamic, state, save, renderCurrent }) => {
  const n = b.n || 3;
  const selected = state.answers[b.id] || [];
  const wrap = document.createElement("div"); wrap.className = "options";
  b.options.forEach((opt, j) => {
    const chosen = selected.includes(j);
    const disabled = !chosen && selected.length >= n;
    const holder = document.createElement("div");
    const btn = document.createElement("button");
    btn.className = "option" + (chosen?" selected":"") + (disabled?" disabled":"");
    btn.type = "button";
    btn.innerHTML = `<span class="badge">${chosen?"✓":j+1}</span><span>${opt.title}</span>`;
    btn.onclick = () => {
      if(disabled) return;
      const s = new Set(selected); s.has(j) ? s.delete(j) : s.add(j); state.answers[b.id] = [...s]; save(); renderCurrent();
    };
    holder.appendChild(btn);
    if(chosen) holder.insertAdjacentHTML("beforeend", `<div class="feedback ${opt.strength==="good"?"good":opt.strength==="warn"?"warn":""}"><span class="view-tag ${opt.strength}">${opt.verdict}</span><p>${opt.view}</p></div>`);
    wrap.appendChild(holder);
  });
  dynamic.appendChild(wrap);
  dynamic.insertAdjacentHTML("beforeend", `<p class="select-progress">${selected.length} of ${n} selected</p>`);
  const ready = selected.length === n;
  if(ready){
    if(b.mentorFeedbackHtml) dynamic.insertAdjacentHTML("beforeend", b.mentorFeedbackHtml);
    if(b.closingHtml) dynamic.insertAdjacentHTML("beforeend", b.closingHtml);
  }
  return ready;
};

renderers.reflection = ({ b, lesson, state, save, next }) => {
  const qqRoot = lesson.querySelector("#quickQuestions");
  const qState = state.answers[b.id + "_quick"] || {};
  if(qqRoot && b.quickQuestions){
    qqRoot.innerHTML = b.quickQuestions.map((q, qi) => `
      <div class="mini-question"><h4>${q.title}</h4>
        <div class="mini-options" data-qi="${qi}">
          ${q.options.map((o,oi)=>`<button class="mini-option${qState[qi]===oi?" selected":""}" type="button" data-oi="${oi}">${o}</button>`).join("")}
        </div>
      </div>`).join("");
    qqRoot.querySelectorAll(".mini-options").forEach(group => {
      const qi = group.dataset.qi;
      group.querySelectorAll(".mini-option").forEach(btn => {
        btn.onclick = () => {
          qState[qi] = parseInt(btn.dataset.oi, 10);
          state.answers[b.id + "_quick"] = qState; save();
          group.querySelectorAll(".mini-option").forEach(o=>o.classList.remove("selected"));
          btn.classList.add("selected");
        };
      });
    });
  }

  const area = lesson.querySelector("#reflection");
  const feedback = lesson.querySelector("#reflectionFeedback");
  const analyseButton = lesson.querySelector("#analyseButton");
  const micButton = lesson.querySelector("#micButton");
  const micStatus = lesson.querySelector("#micStatus");
  const minLength = b.minLength || 40;
  area.value = state.answers[b.id + "_text"] || "";

  const onChange = () => {
    state.answers[b.id + "_text"] = area.value; save();
    feedback.innerHTML = "";
    analyseButton.disabled = area.value.trim().length < minLength;
  };
  area.oninput = onChange;
  analyseButton.disabled = area.value.trim().length < minLength;

  const analyseResponse = () => {
    const t = area.value.toLowerCase();
    const strengths = [], gaps = [];
    (b.checks || []).forEach(check => {
      if(check.test.test(t)) strengths.push(check.strength);
      else gaps.push(check.gap);
    });
    const denom = (b.checks || []).length || 1;
    const score = Math.max(4, Math.min(10, Math.round((strengths.length/denom)*10*10)/10));
    // mentorFeedbackHtml can be a fixed string, or a function(score) => html
    // if the coaching tone should vary with how complete the answer was.
    const mentorHtml = typeof b.mentorFeedbackHtml === "function" ? b.mentorFeedbackHtml(score) : (b.mentorFeedbackHtml || "");
    feedback.innerHTML = `
      <div class="score-card"><div class="score">${score.toFixed(1)}/10</div>
        <div><strong>Indicative assessment</strong><br><span class="small">Based on the breadth and quality of the reasoning in this response.</span></div></div>
      <div class="feedback good"><strong>Strong points</strong>
        <ul>${(strengths.length?strengths:["You gave a direct, honest answer and engaged with the question."]).map(x=>`<li>${x}</li>`).join("")}</ul></div>
      <div class="feedback"><strong>You could strengthen your answer by discussing</strong>
        <ul>${(gaps.length?gaps:["No major gaps detected."]).map(x=>`<li>${x}</li>`).join("")}</ul></div>
      ${b.modelAnswerHtml || ""}
      ${mentorHtml}`;
    next.disabled = false;
  };

  analyseButton.onclick = () => {
    if(area.value.trim().length < minLength) return;
    feedback.innerHTML = `<div class="analysis-state"><div class="spinner"></div><div><strong>Analysing your response</strong><br><span class="small">Reviewing your reasoning against the Turner Page framework.</span></div></div>`;
    analyseButton.disabled = true;
    setTimeout(() => { analyseResponse(); analyseButton.disabled = false; analyseButton.textContent = "Analyse revised answer"; }, 2200);
  };

  wireMic({ button: micButton, status: micStatus, textarea: area, onChange });
  return false;
};

renderers.valuable = ({ b, lesson, state, save, next }) => {
  const area = lesson.querySelector("#valuableReflection");
  const feedback = lesson.querySelector("#valuableFeedback");
  const micButton = lesson.querySelector("#valuableMicButton");
  const micStatus = lesson.querySelector("#valuableMicStatus");
  const minLength = b.minLength || 15;
  area.value = state.answers[b.id + "_text"] || "";

  const update = () => {
    state.answers[b.id + "_text"] = area.value; save();
    const ok = area.value.trim().length >= minLength;
    next.disabled = !ok;
    feedback.innerHTML = ok ? (b.savedHtml || `<div class="feedback"><strong>Your response has been saved.</strong></div>`) : "";
  };
  area.oninput = update;
  update();

  wireMic({ button: micButton, status: micStatus, textarea: area, onChange: update });
  return area.value.trim().length >= minLength;
};

/* ---------- 3. mount() ------------------------------------------------
   Builds the page chrome (topbar, sidebar, progress) inside `root`,
   then drives the block-by-block render loop using `config.blocks`.
------------------------------------------------------------------------ */
function mount(root, config){
  const STORAGE_KEY = config.storageKey;
  let state = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"index":0,"completed":[],"answers":{}}');

  root.innerHTML = `
    <header class="topbar">
      <div class="topbar-inner">
        <a href="${config.homeUrl || 'index.html'}" aria-label="Return to home"><img class="brand-logo" src="${config.logoSrc || 'assets/turner-page-logo.png'}" alt="Turner Page"></a>
        <div class="brand-copy">
          <strong>${config.programmeName || 'Data Migration Lead Programme'}</strong>
          <span>${config.programmeTagline || 'Professional training and certification'}</span>
        </div>
        <strong id="progressText">0%</strong>
      </div>
      <div class="progress-shell"><div id="topProgress" class="progress-bar"></div></div>
    </header>
    <div class="layout">
      <aside class="sidebar">
        <div class="panel course-panel">
          <div class="kicker">${config.moduleKicker}</div>
          <h2>${config.moduleTitle}</h2>
          <p class="meta">${config.lessonLabel}<br><span class="small">${config.lessonTagline || ''}</span></p>
          <div class="progress-row"><span>Lesson progress</span><strong id="sideProgress">0%</strong></div>
          <div class="lesson-nav" id="lessonNav"></div>
        </div>
      </aside>
      <main class="panel lesson" id="lesson"></main>
    </div>`;

  const lesson = root.querySelector("#lesson");
  const nav = root.querySelector("#lessonNav");
  const blocks = config.blocks;

  function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  function complete(id){ if(!state.completed.includes(id)) state.completed.push(id); }
  function percentage(){ return Math.round(state.completed.length / blocks.length * 100); }

  function updateChrome(){
    const p = percentage();
    root.querySelector("#topProgress").style.width = p + "%";
    root.querySelector("#progressText").textContent = p + "%";
    root.querySelector("#sideProgress").textContent = p + "%";
    [...nav.children].forEach((el, i) => {
      el.classList.toggle("active", i === state.index);
      el.classList.toggle("done", state.completed.includes(blocks[i].id));
    });
  }

  function renderNav(){
    nav.innerHTML = "";
    blocks.forEach((b, i) => {
      const btn = document.createElement("button");
      btn.textContent = (i + 1) + ". " + b.nav;
      btn.onclick = () => { if(i <= state.index || state.completed.includes(b.id)){ state.index = i; save(); render(); } };
      nav.appendChild(btn);
    });
  }

  function shell(b, i){
    const f = window.TP_FOOTER || {label:"The Turner Page Promise", text:""};
    const stepLabel = config.lessonShortLabel || config.lessonLabel;
    return `<div class="step">${stepLabel} · Section ${i+1} of ${blocks.length}</div>
      <h2>${b.title}</h2>${b.html||""}<div id="dynamic"></div>
      <div class="actions"><button id="back" class="btn secondary">Back</button><button id="next" class="btn primary">Continue</button></div>
      <div class="footer-promise"><strong>${f.label}</strong><br>${f.text}</div>`;
  }

  function render(){
    const b = blocks[state.index], i = state.index;
    lesson.innerHTML = shell(b, i);
    const dynamic = lesson.querySelector("#dynamic");
    const next = lesson.querySelector("#next");
    const isLast = i === blocks.length - 1;
    next.textContent = isLast ? (config.finalButtonLabel || "Continue") : "Continue";
    let ready = b.type === "content";

    const renderer = renderers[b.type];
    if(renderer){
      const result = renderer({ b, i, dynamic, next, lesson, state, save, renderCurrent: render });
      if(typeof result === "boolean") ready = result;
    }

    // Escape hatch for a genuinely one-off visual a generic block type
    // doesn't cover (e.g. a bespoke diagram used in a single lesson).
    // Define b.onMount(ctx) in the lesson file itself — no kit changes
    // needed. Runs after the block's own renderer, so any DOM it needs
    // already exists.
    if(typeof b.onMount === "function"){
      b.onMount({ b, i, lesson, state, save, next, root });
    }

    lesson.querySelector("#back").disabled = i === 0;
    lesson.querySelector("#back").onclick = () => { if(i > 0){ state.index--; save(); render(); scrollTo({top:0, behaviour:"smooth"}); } };
    next.disabled = !ready;
    next.onclick = () => {
      if(next.disabled) return;
      complete(b.id);
      if(!isLast){
        state.index++; save(); render(); scrollTo({top:0, behaviour:"smooth"});
      } else {
        save(); updateChrome();
        window.location.href = config.nextUrl;
      }
    };
    updateChrome();
  }

  renderNav();
  render();
}

window.TPKit = { mount, icons, fromField, promiseCard };

})();
