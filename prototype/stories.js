// v0 prototype data — mirrors data/stories/*.json (source of truth).
// Embedded here so the demo works from file:// without a server.
const STORIES = [
  {
    id: "the_sad_cat",
    title: "The Sad Cat 🐱",
    level: "Level 1 — first letters",
    targetSkill: "s5_hbfl",
    sentences: [
      "The cat sat on the mat.",
      "The cat is sad.",
      "He did not get up.",
      "I pat the cat on the leg.",
      "The cat got a big hug.",
      "The cat is not sad. He is up!"
    ]
  },
  {
    id: "the_fish_wish",
    title: "The Fish Wish 🐟",
    level: "Level 2 — sh sounds",
    targetSkill: "s8_sh",
    sentences: [
      "A fish is in a net.",
      "The fish has a wish.",
      "Let me go! Let me go!",
      "I rush to the net.",
      "I rip it. The net is off.",
      "The fish did a zip and a zag.",
      "The fish is not sad. Yes!"
    ]
  },
  {
    id: "rain_in_the_week",
    title: "Rain in the Week 🌧️",
    level: "Level 3 — ai and ee",
    targetSkill: "s12_ai_ee",
    sentences: [
      "It is a wet week.",
      "The rain hit the shed.",
      "We sit in the shed.",
      "When will the sun come out? said Meena.",
      "Then no rain! The sun is up.",
      "We see a green tree and a bee.",
      "We run and sing in the sun."
    ]
  }
];
