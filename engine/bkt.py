"""Bayesian Knowledge Tracing (lite) — per-skill mastery estimation.

Classic 4-parameter BKT (Corbett & Anderson, 1995):
    p_init  P(child already knows the skill before practice)
    p_learn P(skill transitions from unknown -> known after one attempt)
    p_slip  P(wrong answer despite knowing the skill)
    p_guess P(right answer without knowing the skill)

After each observed attempt we do a Bayesian update of P(known), then apply
the learning transition. A skill counts as mastered when P(known) crosses
MASTERY_THRESHOLD. Interpretable, tunable per skill later from real data.
"""

from dataclasses import dataclass, field

MASTERY_THRESHOLD = 0.95


@dataclass
class SkillState:
    skill_id: str
    p_known: float = 0.1   # p_init
    p_learn: float = 0.2
    p_slip: float = 0.1
    p_guess: float = 0.2
    attempts: int = 0
    correct: int = 0

    def update(self, is_correct: bool) -> float:
        """Update P(known) from one attempt; returns the new estimate."""
        pk = self.p_known
        if is_correct:
            evidence = pk * (1 - self.p_slip)
            marginal = evidence + (1 - pk) * self.p_guess
        else:
            evidence = pk * self.p_slip
            marginal = evidence + (1 - pk) * (1 - self.p_guess)
        posterior = evidence / marginal if marginal > 0 else pk
        # learning transition: even a wrong attempt is practice
        self.p_known = posterior + (1 - posterior) * self.p_learn
        self.attempts += 1
        self.correct += int(is_correct)
        return self.p_known

    @property
    def mastered(self) -> bool:
        return self.p_known >= MASTERY_THRESHOLD


@dataclass
class ChildModel:
    """All skill states for one child + a simple session scheduler."""
    skills: dict = field(default_factory=dict)  # skill_id -> SkillState

    def state(self, skill_id: str) -> SkillState:
        if skill_id not in self.skills:
            self.skills[skill_id] = SkillState(skill_id)
        return self.skills[skill_id]

    def record(self, skill_id: str, is_correct: bool) -> float:
        return self.state(skill_id).update(is_correct)

    def frontier(self, skill_order: list[str]) -> str | None:
        """First unmastered skill in curriculum order = what to teach next."""
        for sid in skill_order:
            if not self.state(sid).mastered:
                return sid
        return None

    def session_plan(self, skill_order: list[str], review_count: int = 2) -> dict:
        """~70/20/10 mix: frontier skill + a couple of weakest mastered skills."""
        target = self.frontier(skill_order)
        mastered = [s for s in self.skills.values() if s.mastered]
        review = sorted(mastered, key=lambda s: s.p_known)[:review_count]
        return {
            "target_skill": target,
            "review_skills": [s.skill_id for s in review],
        }


if __name__ == "__main__":
    # tiny demo: child practices s1, gets 1 wrong then 4 right
    child = ChildModel()
    outcomes = [False, True, True, True, True]
    for outcome in outcomes:
        p = child.record("s1_satp", outcome)
        print(f"attempt correct={outcome}: P(known)={p:.3f}")
    print("mastered:", child.state("s1_satp").mastered)
