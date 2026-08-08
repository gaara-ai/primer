"""Decodability validator.

Every word in a story must be readable by a child who has only been taught
up to the story's target skill: the union of word banks of all skills up to
and including the target (in scope-and-sequence order), plus sight words
introduced at or before that skill, plus the story's own proper nouns.

Usage:
    python tools/validate_story.py data/stories/the_sad_cat.json [more.json ...]

Exit code 0 = all stories valid, 1 = violations found. This gate must run on
every story (hand-written or LLM-generated) before it reaches a child.
"""

import json
import re
import sys
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"

WORD_RE = re.compile(r"[a-zA-Z']+")


def load_curriculum():
    graph = json.loads((DATA_DIR / "skill_graph.json").read_text())
    sight = json.loads((DATA_DIR / "sight_words.json").read_text())
    skill_order = [s["id"] for s in graph["skills"]]
    banks = {s["id"]: {w.lower() for w in s["word_bank"]} for s in graph["skills"]}
    sight_groups = [
        (g["introduced_at"], {w.lower() for w in g["words"]}) for g in sight["groups"]
    ]
    return skill_order, banks, sight_groups


def allowed_words(target_skill, skill_order, banks, sight_groups):
    if target_skill not in skill_order:
        raise ValueError(f"Unknown target skill: {target_skill}")
    cutoff = skill_order.index(target_skill)
    allowed = set()
    for sid in skill_order[: cutoff + 1]:
        allowed |= banks[sid]
    for introduced_at, words in sight_groups:
        if skill_order.index(introduced_at) <= cutoff:
            allowed |= words
    return allowed


def first_skill_with_word(word, skill_order, banks, sight_groups):
    """For error messages: where (if anywhere) does this word become legal?"""
    for sid in skill_order:
        if word in banks[sid]:
            return sid
    for introduced_at, words in sight_groups:
        if word in words:
            return f"{introduced_at} (sight word)"
    return None


def validate(story_path, skill_order, banks, sight_groups):
    story = json.loads(Path(story_path).read_text())
    allowed = allowed_words(story["target_skill"], skill_order, banks, sight_groups)
    proper = {p.lower() for p in story.get("proper_nouns", [])}

    violations = []
    for i, sentence in enumerate(story["sentences"], start=1):
        for word in WORD_RE.findall(sentence):
            w = word.lower()
            if w in allowed or w in proper:
                continue
            later = first_skill_with_word(w, skill_order, banks, sight_groups)
            where = f"first legal at {later}" if later else "not in curriculum at all"
            violations.append((i, word, where))
    return story, violations


def main(paths):
    skill_order, banks, sight_groups = load_curriculum()
    any_bad = False
    for path in paths:
        story, violations = validate(path, skill_order, banks, sight_groups)
        label = f"{story['title']} (target {story['target_skill']})"
        if not violations:
            print(f"OK    {label}")
        else:
            any_bad = True
            print(f"FAIL  {label}")
            for sentence_no, word, where in violations:
                print(f"      sentence {sentence_no}: '{word}' — {where}")
    return 1 if any_bad else 0


if __name__ == "__main__":
    if len(sys.argv) < 2:
        targets = sorted((DATA_DIR / "stories").glob("*.json"))
        print("No files given; validating all stories in data/stories/\n")
    else:
        targets = sys.argv[1:]
    sys.exit(main(targets))
