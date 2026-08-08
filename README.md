# Primer — AI Reading Tutor for Indian Kids (MVP)

An adaptive phonics-based reading tutor for children aged 4–7, inspired by
YC's "The Primer" RFS. The child reads decodable stories aloud; the app
listens, scores each word, and adapts what it teaches next.

## Architecture (v0)

```
prototype/          Browser demo — reading loop using Web Speech API (no backend)
data/
  skill_graph.json  Phonics skills DAG: ordering, word banks, prerequisites
  sight_words.json  Taught-as-whole words allowed in any story
  stories/          Decodable stories, one JSON file each
engine/
  bkt.py            Bayesian Knowledge Tracing (lite) mastery model
tools/
  validate_story.py Decodability checker — every story word must be legal
                    for its target skill (union of prior word banks + sight words)
```

Design principle: **the LLM never decides what to teach.** The skill graph
and mastery model (deterministic) decide *what*; generation only decides
*how it's dressed up* — and every generated story must pass
`tools/validate_story.py` before a child ever sees it.

## Run the prototype

Open `prototype/index.html` in Chrome (Web Speech API needs Chrome/Edge).
Click a story, press and hold the mic button, and read the sentence aloud.
Words turn green/red based on what the recognizer heard. Progress is stored
in `localStorage`.

Note: browser speech recognition is adult-trained and unforgiving with child
speech — it's good enough to test the *loop and engagement*, not accuracy.
The real ASR layer (forced alignment + phoneme scoring, fine-tuned on Indian
child speech) is Phase 2.

## Validate a story

```bash
python tools/validate_story.py data/stories/sam_the_cat.json
```

## 8-week roadmap

- **W1–2** Skill graph (first 30 skills), 20 hand-written decodable stories,
  validator, this prototype loop.
- **W3–4** Proper app shell (Flutter/React Native), TTS narration,
  push-to-talk UX.
- **W5–6** BKT scheduler wired into sessions, child profile persistence,
  parent dashboard (streak + skills mastered).
- **W7–8** Test with 5–10 campus kids, instrument everything, pre/post
  reading assessment.

## Phase 2 (post-Nirmaan)

- Forced-alignment pronunciation scoring (wav2vec2/torchaudio) instead of
  transcription matching.
- Fine-tune AI4Bharat IndicConformer on collected (consented) Indian child
  speech — the data moat.
- LLM story generation constrained by skill word banks + interest profile,
  gated by the decodability validator.
