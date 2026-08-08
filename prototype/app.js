// Primer v0 — browser reading loop.
// Uses the Web Speech API (Chrome/Edge). Adult-trained ASR, so scoring is
// lenient: we're testing engagement and the loop, not accuracy (Phase 2).

const $ = (id) => document.getElementById(id);

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const state = {
  story: null,
  sentenceIdx: 0,
  stars: Number(localStorage.getItem("primer_stars") || 0),
  results: [], // per-sentence: fraction of words matched
  listening: false,
  recognition: null,
};

// ---------- setup ----------

function init() {
  $("star-count").textContent = state.stars;

  const list = $("story-list");
  for (const story of STORIES) {
    const btn = document.createElement("button");
    btn.className = "story-btn";
    btn.innerHTML = `${story.title}<span class="level">${story.level}</span>`;
    btn.onclick = () => startStory(story);
    list.appendChild(btn);
  }

  if (!SpeechRecognition) {
    $("support-warning").hidden = false;
    $("mic").disabled = true;
  }

  $("mic").onclick = toggleListening;
  $("hear").onclick = speakSentence;
  $("next").onclick = nextSentence;
  $("quit").onclick = showPicker;
  $("again").onclick = showPicker;
}

function show(screenId) {
  for (const id of ["picker", "reader", "done"]) $(id).hidden = id !== screenId;
}

function showPicker() {
  stopListening();
  show("picker");
}

// ---------- story flow ----------

function startStory(story) {
  state.story = story;
  state.sentenceIdx = 0;
  state.results = [];
  show("reader");
  renderSentence();
}

function tokenize(sentence) {
  return sentence.toLowerCase().match(/[a-z']+/g) || [];
}

function renderSentence() {
  const { story, sentenceIdx } = state;
  const sentence = story.sentences[sentenceIdx];

  $("progress-dots").textContent = story.sentences
    .map((_, i) => (i < sentenceIdx ? "🟢" : i === sentenceIdx ? "🔵" : "⚪"))
    .join(" ");

  const box = $("sentence");
  box.innerHTML = "";
  // Render word-by-word so we can color each one after scoring.
  for (const part of sentence.split(/\s+/)) {
    const span = document.createElement("span");
    span.className = "word";
    span.textContent = part;
    box.appendChild(span);
  }

  $("next").disabled = true;
  $("status").textContent = "Tap the mic and read the sentence.";
}

function nextSentence() {
  stopListening();
  state.sentenceIdx++;
  if (state.sentenceIdx >= state.story.sentences.length) {
    finishStory();
  } else {
    renderSentence();
  }
}

function finishStory() {
  const avg = state.results.length
    ? state.results.reduce((a, b) => a + b, 0) / state.results.length
    : 0;
  const earned = avg >= 0.8 ? 3 : avg >= 0.5 ? 2 : 1;
  state.stars += earned;
  localStorage.setItem("primer_stars", state.stars);
  $("star-count").textContent = state.stars;

  // Log attempt for later analysis (per-story history in localStorage).
  const log = JSON.parse(localStorage.getItem("primer_log") || "[]");
  log.push({
    story: state.story.id,
    skill: state.story.targetSkill,
    when: new Date().toISOString(),
    sentenceScores: state.results,
  });
  localStorage.setItem("primer_log", JSON.stringify(log));

  $("done-summary").textContent =
    `You read "${state.story.title}" and earned ${"⭐".repeat(earned)}!`;
  show("done");
}

// ---------- speech ----------

function toggleListening() {
  state.listening ? stopListening() : startListening();
}

function startListening() {
  const rec = new SpeechRecognition();
  rec.lang = "en-IN";
  rec.continuous = true;
  rec.interimResults = true;
  rec.maxAlternatives = 3;

  let heard = [];

  rec.onresult = (event) => {
    heard = [];
    for (const result of event.results) {
      for (const alt of result) heard.push(...tokenize(alt.transcript));
    }
    scoreSentence(heard);
  };
  rec.onend = () => {
    state.listening = false;
    $("mic").classList.remove("listening");
    $("mic").textContent = "🎤 Tap, then read aloud";
  };
  rec.onerror = (e) => {
    $("status").textContent =
      e.error === "not-allowed"
        ? "Please allow the microphone!"
        : "Hmm, I didn't hear that. Try again!";
  };

  rec.start();
  state.recognition = rec;
  state.listening = true;
  $("mic").classList.add("listening");
  $("mic").textContent = "👂 Listening… tap when done";
  $("status").textContent = "Read the sentence out loud!";
}

function stopListening() {
  if (state.recognition) {
    state.recognition.onend = null;
    state.recognition.stop();
    state.recognition = null;
  }
  state.listening = false;
  $("mic").classList.remove("listening");
  $("mic").textContent = "🎤 Tap, then read aloud";
}

function scoreSentence(heardWords) {
  const sentence = state.story.sentences[state.sentenceIdx];
  const targetWords = tokenize(sentence);
  const spans = $("sentence").querySelectorAll(".word");
  const heardSet = new Set(heardWords);

  let matched = 0;
  let spanIdx = 0;
  for (const target of targetWords) {
    // spans include punctuation; align by stripping
    while (spanIdx < spans.length && !tokenize(spans[spanIdx].textContent).length) {
      spanIdx++;
    }
    const span = spans[spanIdx++];
    const ok = heardSet.has(target);
    if (span) span.className = "word " + (ok ? "good" : "bad");
    if (ok) matched++;
  }

  const score = targetWords.length ? matched / targetWords.length : 0;
  state.results[state.sentenceIdx] = score;

  if (score >= 0.7) {
    $("status").textContent = score === 1 ? "Perfect! 🌟" : "Great reading! 👏";
    $("next").disabled = false;
    stopListening();
  } else {
    $("status").textContent = "Good try! Read it once more. 💪";
    $("next").disabled = false; // never trap a child — allow moving on
  }
}

// ---------- text to speech ----------

function speakSentence() {
  const sentence = state.story.sentences[state.sentenceIdx];
  const utter = new SpeechSynthesisUtterance(sentence);
  utter.rate = 0.7;
  utter.pitch = 1.1;
  const voices = speechSynthesis.getVoices();
  const preferred =
    voices.find((v) => v.lang === "en-IN") ||
    voices.find((v) => v.lang.startsWith("en-GB")) ||
    voices.find((v) => v.lang.startsWith("en"));
  if (preferred) utter.voice = preferred;
  speechSynthesis.speak(utter);
}

init();
