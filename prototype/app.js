// Primer v0 — browser reading loop with Gaara the talking buddy.
// Uses the Web Speech API (Chrome/Edge). Adult-trained ASR, so scoring is
// lenient: we're testing engagement and the loop, not accuracy (Phase 2).

const $ = (id) => document.getElementById(id);

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

const state = {
  story: null,
  sentenceIdx: 0,
  stars: Number(localStorage.getItem("primer_stars") || 0),
  results: [],        // per-sentence: fraction of words matched
  tries: 0,           // attempts on the current sentence
  listening: false,
  recognition: null,
  letterIdx: 0,
  lettersSeen: new Set(JSON.parse(localStorage.getItem("primer_abc") || "[]")),
};

// ---------- alphabet data ----------

const ALPHABET = [
  { letter: "A", word: "Apple", emoji: "🍎" },
  { letter: "B", word: "Ball", emoji: "⚽" },
  { letter: "C", word: "Cat", emoji: "🐱" },
  { letter: "D", word: "Dog", emoji: "🐶" },
  { letter: "E", word: "Elephant", emoji: "🐘" },
  { letter: "F", word: "Fish", emoji: "🐟" },
  { letter: "G", word: "Goat", emoji: "🐐" },
  { letter: "H", word: "Hen", emoji: "🐔" },
  { letter: "I", word: "Ice cream", emoji: "🍦" },
  { letter: "J", word: "Juice", emoji: "🧃" },
  { letter: "K", word: "Kite", emoji: "🪁" },
  { letter: "L", word: "Lion", emoji: "🦁" },
  { letter: "M", word: "Mango", emoji: "🥭" },
  { letter: "N", word: "Nest", emoji: "🪺" },
  { letter: "O", word: "Orange", emoji: "🍊" },
  { letter: "P", word: "Parrot", emoji: "🦜" },
  { letter: "Q", word: "Queen", emoji: "👑" },
  { letter: "R", word: "Rabbit", emoji: "🐰" },
  { letter: "S", word: "Sun", emoji: "☀️" },
  { letter: "T", word: "Tiger", emoji: "🐯" },
  { letter: "U", word: "Umbrella", emoji: "☂️" },
  { letter: "V", word: "Van", emoji: "🚐" },
  { letter: "W", word: "Watch", emoji: "⌚" },
  { letter: "X", word: "X-ray", emoji: "🩻" },
  { letter: "Y", word: "Yo-yo", emoji: "🪀" },
  { letter: "Z", word: "Zebra", emoji: "🦓" },
];

// ---------- Gaara's voice lines ----------

const LINES = {
  greet: [
    "Hi! I'm Gaara! Let's read {title} together!",
    "Yay, you picked {title}! I love this one!",
    "Hello my friend! Ready for {title}?",
  ],
  listen: [
    "Your turn! Read it nice and loud!",
    "Go on, you can do it!",
    "I'm listening with my big ears!",
  ],
  perfect: [
    "Wow! Perfect reading!",
    "Amazing! Every single word!",
    "You are a reading star!",
  ],
  good: [
    "Great job! That was lovely!",
    "Super reading! Keep going!",
    "You're getting so good at this!",
  ],
  tryAgain: [
    "Good try! Let's read it one more time!",
    "Almost! Try once more, nice and slow.",
    "So close! Have another go!",
  ],
  together: [
    "Let's read it together! Listen first, then you try.",
    "I'll help you! Listen to me, then it's your turn.",
  ],
  wordHelp: [
    "This word is {word}. {word}!",
  ],
  done: [
    "Hooray! You finished the whole story!",
    "You did it! I'm so proud of you!",
    "What a super reader you are!",
  ],
};

function pick(lines) {
  return lines[Math.floor(Math.random() * lines.length)];
}

// ---------- speech synthesis ----------

let voicesReady = [];
function loadVoices() {
  voicesReady = speechSynthesis.getVoices();
}
loadVoices();
if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = loadVoices;
}

function bestVoice() {
  // Rank by quality, not just language: Edge's neural "Natural" voices are
  // near-human, Chrome's "Google" voices are decent, Windows legacy voices
  // (Heera/Ravi/David/Zira) are robotic and come last.
  const score = (v) => {
    if (!v.lang.startsWith("en")) return -1;
    let s = 0;
    if (/natural|neural/i.test(v.name)) s += 100;
    if (/google/i.test(v.name)) s += 50;
    if (/aria|sonia|libby|jenny|swara|neerja|female/i.test(v.name)) s += 10;
    if (v.lang === "en-IN") s += 5;
    else if (v.lang === "en-GB") s += 3;
    return s;
  };
  const ranked = voicesReady
    .filter((v) => score(v) >= 0)
    .sort((a, b) => score(b) - score(a));
  return ranked[0] || null;
}

function speak(text, { rate = 0.85, pitch = 1.25, onend = null } = {}) {
  speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = rate;
  utter.pitch = pitch;
  const voice = bestVoice();
  if (voice) utter.voice = voice;

  const face = $("buddy-face");
  face.classList.add("talking");
  utter.onend = () => {
    face.classList.remove("talking");
    if (onend) onend();
  };
  speechSynthesis.speak(utter);
}

function buddySay(kind, vars = {}, opts = {}) {
  let text = pick(LINES[kind]);
  for (const [key, val] of Object.entries(vars)) {
    text = text.replaceAll(`{${key}}`, val);
  }
  const bubble = $("buddy-bubble");
  bubble.textContent = text;
  bubble.hidden = false;
  speak(text, opts);
  return text;
}

function buddyHappy() {
  const face = $("buddy-face");
  face.classList.remove("happy");
  void face.offsetWidth; // restart animation
  face.classList.add("happy");
}

// ---------- setup ----------

function init() {
  $("star-count").textContent = state.stars;

  const list = $("story-list");
  STORIES.forEach((story, i) => {
    const btn = document.createElement("button");
    btn.className = `story-btn c${i % 4}`;
    btn.innerHTML = `${story.title}<span class="level">${story.level}</span>`;
    btn.onclick = () => startStory(story);
    list.appendChild(btn);
  });

  if (!SpeechRecognition) {
    $("support-warning").hidden = false;
    $("mic").disabled = true;
  }

  $("mic").onclick = toggleListening;
  $("hear").onclick = readTogether;
  $("next").onclick = nextSentence;
  $("quit").onclick = showPicker;
  $("again").onclick = showPicker;

  $("abc-btn").onclick = showAbcGrid;
  $("abc-back").onclick = showPicker;
  $("letter-grid-btn").onclick = showAbcGrid;
  $("letter-hear").onclick = () => sayLetter(state.letterIdx);
  $("letter-prev").onclick = () => openLetter((state.letterIdx + 25) % 26);
  $("letter-next").onclick = () => openLetter((state.letterIdx + 1) % 26);
  $("letter-mic").onclick = letterListen;
  if (!SpeechRecognition) $("letter-mic").disabled = true;
}

function show(screenId) {
  for (const id of ["picker", "reader", "done", "abc", "letter"]) {
    $(id).hidden = id !== screenId;
  }
}

// ---------- alphabet flow ----------

function showAbcGrid() {
  stopListening();
  stopLetterListening();
  speechSynthesis.cancel();
  const grid = $("abc-grid");
  grid.innerHTML = "";
  ALPHABET.forEach((entry, i) => {
    const tile = document.createElement("button");
    tile.className = "abc-tile" + (state.lettersSeen.has(entry.letter) ? " done" : "");
    tile.innerHTML = `${entry.letter} ${entry.letter.toLowerCase()}<span class="tile-emoji">${entry.emoji}</span>`;
    tile.onclick = () => openLetter(i);
    grid.appendChild(tile);
  });
  $("abc-progress").textContent =
    state.lettersSeen.size < 26
      ? `${state.lettersSeen.size} of 26 letters explored`
      : "All 26 letters explored! ⭐";
  show("abc");
}

function openLetter(i) {
  stopLetterListening();
  $("letter-status").textContent = "";
  state.letterIdx = i;
  const { letter, word, emoji } = ALPHABET[i];
  $("letter-big").textContent = `${letter} ${letter.toLowerCase()}`;
  $("letter-emoji").textContent = emoji;
  $("letter-word").textContent = `${letter} for ${word}`;
  show("letter");
  sayLetter(i);

  if (!state.lettersSeen.has(letter)) {
    state.lettersSeen.add(letter);
    localStorage.setItem("primer_abc", JSON.stringify([...state.lettersSeen]));
    if (state.lettersSeen.size === 26) {
      state.stars += 3;
      localStorage.setItem("primer_stars", state.stars);
      $("star-count").textContent = state.stars;
      throwConfetti();
      setTimeout(() => speak("Wow! You know all your letters, A to Z! Three stars for you!"), 1200);
    }
  }
}

function sayLetter(i) {
  const { letter, word } = ALPHABET[i];
  speak(`${letter}! ${letter} for ${word}!`, { rate: 0.75 });
}

// ---------- letter "say it" listening ----------

let letterRec = null;

function stopLetterListening() {
  if (letterRec) {
    letterRec.onend = null;
    letterRec.stop();
    letterRec = null;
  }
  $("letter-mic").classList.remove("listening");
  $("letter-mic").textContent = "🎤 Your turn — say it!";
}

function letterListen() {
  if (letterRec) { stopLetterListening(); return; }
  speechSynthesis.cancel();

  const { letter, word } = ALPHABET[state.letterIdx];
  // accept the letter name or (any part of) the word
  const accepted = new Set([
    letter.toLowerCase(),
    ...word.toLowerCase().split(/[\s-]+/),
    word.toLowerCase().replace(/[\s-]+/g, ""),
  ]);

  const rec = new SpeechRecognition();
  rec.lang = "en-IN";
  rec.continuous = false;
  rec.interimResults = true;
  rec.maxAlternatives = 5;

  let matched = false;

  rec.onresult = (event) => {
    for (const result of event.results) {
      for (const alt of result) {
        for (const heard of tokenize(alt.transcript)) {
          if (accepted.has(heard)) matched = true;
        }
      }
    }
    if (matched) {
      stopLetterListening();
      buddyHappy();
      $("letter-status").textContent = "🌟 Yes! Wonderful!";
      speak(`Yes! ${word}! Great job!`, { rate: 0.85 });
    }
  };
  rec.onend = () => {
    letterRec = null;
    $("letter-mic").classList.remove("listening");
    $("letter-mic").textContent = "🎤 Your turn — say it!";
    if (!matched) {
      $("letter-status").textContent = `Good try! Say "${word}"!`;
      speak(`Good try! Say, ${word}!`, { rate: 0.8 });
    }
  };
  rec.onerror = () => {
    $("letter-status").textContent = "I couldn't hear you — try again!";
  };

  rec.start();
  letterRec = rec;
  $("letter-mic").classList.add("listening");
  $("letter-mic").textContent = "👂 I'm listening…";
  $("letter-status").textContent = `Say "${word}" or "${letter}"!`;
}

function showPicker() {
  stopListening();
  speechSynthesis.cancel();
  show("picker");
}

// ---------- story flow ----------

function startStory(story) {
  state.story = story;
  state.sentenceIdx = 0;
  state.results = [];
  show("reader");
  renderSentence();
  buddySay("greet", { title: story.title.replace(/[^\w\s',!.-]/g, "").trim() });
}

function tokenize(sentence) {
  return sentence.toLowerCase().match(/[a-z']+/g) || [];
}

function renderSentence() {
  const { story, sentenceIdx } = state;
  const sentence = story.sentences[sentenceIdx];
  state.tries = 0;

  $("progress-dots").textContent = story.sentences
    .map((_, i) => (i < sentenceIdx ? "🟢" : i === sentenceIdx ? "🔵" : "⚪"))
    .join(" ");

  const box = $("sentence");
  box.innerHTML = "";
  for (const part of sentence.split(/\s+/)) {
    const span = document.createElement("span");
    span.className = "word";
    span.textContent = part;
    span.onclick = () => helpWithWord(span);
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
  buddySay("done");
  throwConfetti();
}

function throwConfetti() {
  const box = $("confetti");
  const emojis = ["⭐", "🎉", "✨", "🎈", "🌟", "💛"];
  for (let i = 0; i < 36; i++) {
    const piece = document.createElement("span");
    piece.className = "confetto";
    piece.textContent = emojis[i % emojis.length];
    piece.style.left = Math.random() * 100 + "vw";
    piece.style.animationDuration = 2.2 + Math.random() * 2.2 + "s";
    piece.style.animationDelay = Math.random() * 0.8 + "s";
    piece.style.fontSize = 1.2 + Math.random() * 1.4 + "rem";
    box.appendChild(piece);
    setTimeout(() => piece.remove(), 5500);
  }
}

// ---------- word-level help ----------

function helpWithWord(span) {
  const word = tokenize(span.textContent)[0];
  if (!word) return;
  span.classList.add("helped");
  // slow first, then normal speed
  speak(word, {
    rate: 0.45,
    onend: () => speak(word, { rate: 0.85 }),
  });
}

function readTogether() {
  stopListening();
  const sentence = state.story.sentences[state.sentenceIdx];
  buddySay("together", {}, {
    onend: () => speak(sentence, { rate: 0.6, pitch: 1.1 }),
  });
}

// ---------- speech recognition ----------

function toggleListening() {
  state.listening ? stopListening() : startListening();
}

function startListening() {
  speechSynthesis.cancel(); // buddy stops talking when child starts
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
  if (state.tries === 0) {
    $("buddy-bubble").textContent = pick(LINES.listen);
    $("buddy-bubble").hidden = false;
  }
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
    while (spanIdx < spans.length && !tokenize(spans[spanIdx].textContent).length) {
      spanIdx++;
    }
    const span = spans[spanIdx++];
    const ok = heardSet.has(target);
    if (span) span.classList.toggle("good", ok), span.classList.toggle("bad", !ok);
    if (ok) matched++;
  }

  const score = targetWords.length ? matched / targetWords.length : 0;
  state.results[state.sentenceIdx] = score;

  if (score >= 0.7) {
    stopListening();
    buddyHappy();
    buddySay(score === 1 ? "perfect" : "good");
    $("status").textContent = score === 1 ? "Perfect! 🌟" : "Great reading! 👏";
    $("next").disabled = false;
  } else {
    state.tries++;
    $("next").disabled = false; // never trap a child — allow moving on
    if (state.tries >= 2) {
      // after two misses, Gaara reads the sentence with the child
      stopListening();
      $("status").textContent = "Listen to Gaara, then try again! 💪";
      readTogether();
    } else {
      $("status").textContent = "Good try! Read it once more. 💪";
      buddySay("tryAgain");
    }
  }
}

init();
