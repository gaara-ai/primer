// v0 prototype data — mirrors data/stories/*.json (source of truth).
// Embedded here so the demo works from file:// without a server.
// Ordered by skill difficulty (see data/skill_graph.json).
const STORIES = [
  {
    id: "dig_dog_dig",
    title: "Dig, Dog, Dig! 🐶",
    level: "Level 1 — g, o, c, k",
    targetSkill: "s3_gock",
    sentences: [
      "The dog got a map.",
      "The dog can dig.",
      "Dig, dog, dig!",
      "The map is in a pot.",
      "The dog got it. Top dog!"
    ]
  },
  {
    id: "the_duck_in_the_mud",
    title: "The Duck in the Mud 🦆",
    level: "Level 2 — e, u, r",
    targetSkill: "s4_ckeur",
    sentences: [
      "The duck is in the mud.",
      "He can run and dip.",
      "The sun is up.",
      "The duck can sit in the sun.",
      "A rat ran to the duck.",
      "The duck and the rat nap in the sun."
    ]
  },
  {
    id: "the_sad_cat",
    title: "The Sad Cat 🐱",
    level: "Level 3 — h, b, f, l",
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
    id: "the_fox_in_the_box",
    title: "The Fox in the Box 🦊",
    level: "Level 4 — j, v, w, x",
    targetSkill: "s6_jvwx",
    sentences: [
      "A fox is in a box.",
      "The fox has a wig. It is fun.",
      "A bug is on the web.",
      "The fox can fix the box.",
      "The bug can sit on top.",
      "The fox and the bug win!"
    ]
  },
  {
    id: "the_fish_wish",
    title: "The Fish Wish 🐟",
    level: "Level 5 — sh sounds",
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
    id: "the_chick_can_chat",
    title: "The Chick Can Chat 🐥",
    level: "Level 6 — ch sounds",
    targetSkill: "s9_ch",
    sentences: [
      "A chick is in the shed.",
      "The chick can chat. Chat, chat, chat!",
      "She has a chip in a dish.",
      "The chick is rich. Such fun!",
      "Hush, chick, hush. Shut the shed.",
      "The chick has a nap in the shed."
    ]
  },
  {
    id: "the_king_can_sing",
    title: "The King Can Sing 👑",
    level: "Level 7 — ng sounds",
    targetSkill: "s11_ng",
    sentences: [
      "The king can sing a song.",
      "The song is long.",
      "I like this song, said the king.",
      "A moth sat on his ring.",
      "The moth can sing with him.",
      "They sing the long song."
    ]
  },
  {
    id: "rain_in_the_week",
    title: "Rain in the Week 🌧️",
    level: "Level 8 — ai and ee",
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
  },
  {
    id: "the_goat_on_the_boat",
    title: "The Goat on the Boat 🐐",
    level: "Level 9 — oa and oo",
    targetSkill: "s13_oa_oo",
    sentences: [
      "A goat got on a boat.",
      "The goat can see the moon.",
      "The moon is good. The food is good too.",
      "I like this boat, said the goat.",
      "The goat took a look at a book.",
      "Soon the goat will sleep.",
      "Sleep, goat, sleep."
    ]
  },
  {
    id: "jump_in_the_pond",
    title: "Jump in the Pond 🐸",
    level: "Level 10 — blends",
    targetSkill: "s15_cvcc",
    sentences: [
      "A frog sat on the sand.",
      "Jump, frog, jump!",
      "The frog went in the pond.",
      "The wind is soft.",
      "A crab can swim fast.",
      "The frog and the crab jump and swim.",
      "Best fun in the pond!"
    ]
  }
];
