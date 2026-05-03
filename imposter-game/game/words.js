// game/words.js — AI-powered word + hint system with rich categories
const Groq = require('groq-sdk');

// ── Static word packs (organized by category) ─────────────────────────────────
const WORD_PACKS = [
  // HISTORY
  { word: 'Gladiator',       hint: 'History' },
  { word: 'Pharaoh',         hint: 'History' },
  { word: 'Viking',          hint: 'History' },
  { word: 'Colosseum',       hint: 'History' },
  { word: 'Samurai',         hint: 'History' },
  { word: 'Cleopatra',       hint: 'History' },
  { word: 'Trojan Horse',    hint: 'History' },
  { word: 'Silk Road',       hint: 'History' },
  { word: 'Guillotine',      hint: 'History' },
  { word: 'Alchemist',       hint: 'History' },
  // FOOD
  { word: 'Sushi',           hint: 'Food' },
  { word: 'Taco',            hint: 'Food' },
  { word: 'Croissant',       hint: 'Food' },
  { word: 'Barbecue',        hint: 'Food' },
  { word: 'Spaghetti',       hint: 'Food' },
  { word: 'Dumplings',       hint: 'Food' },
  { word: 'Fondue',          hint: 'Food' },
  { word: 'Curry',           hint: 'Food' },
  { word: 'Gelato',          hint: 'Food' },
  { word: 'Ramen',           hint: 'Food' },
  // GAMES
  { word: 'Chess',           hint: 'Game' },
  { word: 'Casino',          hint: 'Game' },
  { word: 'Carnival',        hint: 'Entertainment' },
  { word: 'Olympics',        hint: 'Sports Event' },
  { word: 'Circus',          hint: 'Entertainment' },
  { word: 'Arcade',          hint: 'Game' },
  { word: 'Escape Room',     hint: 'Game' },
  { word: 'Poker',           hint: 'Game' },
  { word: 'Bowling',         hint: 'Game' },
  { word: 'Billiards',       hint: 'Game' },
  // TECHNOLOGY
  { word: 'Satellite',       hint: 'Technology' },
  { word: 'Telescope',       hint: 'Technology' },
  { word: 'Submarine',       hint: 'Technology' },
  { word: 'Robot',           hint: 'Technology' },
  { word: 'Spaceship',       hint: 'Technology' },
  { word: 'Internet',        hint: 'Technology' },
  { word: 'Supercomputer',   hint: 'Technology' },
  { word: 'Drone',           hint: 'Technology' },
  { word: 'Nuclear Reactor', hint: 'Technology' },
  { word: 'Microscope',      hint: 'Technology' },
  // PLANTS
  { word: 'Cactus',          hint: 'Plant' },
  { word: 'Sequoia',         hint: 'Plant' },
  { word: 'Bamboo',          hint: 'Plant' },
  { word: 'Venus Flytrap',   hint: 'Plant' },
  { word: 'Mushroom',        hint: 'Plant' },
  { word: 'Orchid',          hint: 'Plant' },
  { word: 'Seaweed',         hint: 'Plant' },
  { word: 'Mangrove',        hint: 'Plant' },
  // ANIMALS
  { word: 'Platypus',        hint: 'Animal' },
  { word: 'Chameleon',       hint: 'Animal' },
  { word: 'Narwhal',         hint: 'Animal' },
  { word: 'Tarantula',       hint: 'Animal' },
  { word: 'Komodo Dragon',   hint: 'Animal' },
  { word: 'Axolotl',         hint: 'Animal' },
  { word: 'Pangolin',        hint: 'Animal' },
  { word: 'Flamingo',        hint: 'Animal' },
  { word: 'Manta Ray',       hint: 'Animal' },
  { word: 'Snow Leopard',    hint: 'Animal' },
  // PLACES & BUILDINGS
  { word: 'School',          hint: 'Building' },
  { word: 'Hospital',        hint: 'Building' },
  { word: 'Library',         hint: 'Building' },
  { word: 'Prison',          hint: 'Building' },
  { word: 'Skyscraper',      hint: 'Building' },
  { word: 'Observatory',     hint: 'Building' },
  { word: 'Lighthouse',      hint: 'Building' },
  { word: 'Aquarium',        hint: 'Attraction' },
  { word: 'Temple',          hint: 'Building' },
  { word: 'Courtroom',       hint: 'Building' },
  // NATURE & WEATHER
  { word: 'Tornado',         hint: 'Weather' },
  { word: 'Avalanche',       hint: 'Nature' },
  { word: 'Glacier',         hint: 'Nature' },
  { word: 'Aurora Borealis', hint: 'Nature' },
  { word: 'Thunderstorm',    hint: 'Weather' },
  { word: 'Earthquake',      hint: 'Nature' },
  { word: 'Coral Reef',      hint: 'Nature' },
  { word: 'Volcano',         hint: 'Nature' },
  { word: 'Hot Spring',      hint: 'Nature' },
  { word: 'Quicksand',       hint: 'Nature' },
  // PROFESSIONS & PEOPLE
  { word: 'Blacksmith',      hint: 'Profession' },
  { word: 'Astronaut',       hint: 'Profession' },
  { word: 'Pirate',          hint: 'Historical Figure' },
  { word: 'Bounty Hunter',   hint: 'Profession' },
  { word: 'Witch Doctor',    hint: 'Historical Figure' },
  // OBJECTS
  { word: 'Diamond',         hint: 'Gemstone' },
  { word: 'Guitar',          hint: 'Instrument' },
  { word: 'Hourglass',       hint: 'Object' },
  { word: 'Compass',         hint: 'Object' },
  { word: 'Boomerang',       hint: 'Object' },
  { word: 'Trampoline',      hint: 'Object' },
  // SPORTS
  { word: 'Sumo',            hint: 'Sport' },
  { word: 'Fencing',         hint: 'Sport' },
  { word: 'Archery',         hint: 'Sport' },
  { word: 'Surfing',         hint: 'Sport' },
  { word: 'Curling',         hint: 'Sport' },
  { word: 'Kabaddi',         hint: 'Sport' },
  // EVENTS
  { word: 'Wedding',         hint: 'Celebration' },
  { word: 'Masquerade',      hint: 'Event' },
  { word: 'Auction',         hint: 'Event' },
  { word: 'Funeral',         hint: 'Event' },
  { word: 'Parade',          hint: 'Event' },
  { word: 'Graduation',      hint: 'Event' },
];

// ── AI-generated word pool (populated at runtime) ────────────────────────────
let AI_WORD_POOL = [];
let aiPoolLastGenerated = null;
const AI_POOL_REFRESH_MS = 1000 * 60 * 30;

const AI_CATEGORIES = [
  'History','Food','Game','Technology','Plant','Animal',
  'Building','Nature','Profession','Sport','Event',
  'Mythology','Science','Music','Space',
];

async function generateAIWords(count = 20) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return [];

  const groq = new Groq({ apiKey });
  const categories = [...AI_CATEGORIES]
    .sort(() => Math.random() - 0.5)
    .slice(0, 5)
    .join(', ');

  const prompt = `Generate ${count} unique word-hint pairs for a social deduction game called "Imposter".
Rules:
- Each word is a single noun or short phrase (max 3 words) players can describe without saying the word.
- Hint is the category label (1-2 words).
- Categories: ${categories}
- Make words interesting and varied. Not too obscure, not too common.
Return ONLY a valid JSON array. Example: [{"word":"Lava Lamp","hint":"Object"}]`;

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.9,
      max_tokens: 1000,
    });
    const text = response.choices[0]?.message?.content?.trim() || '[]';
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];
    const parsed = JSON.parse(jsonMatch[0]);
    return parsed.filter(p => p.word && p.hint && typeof p.word === 'string');
  } catch (err) {
    console.error('[words] AI generation failed:', err.message);
    return [];
  }
}

async function ensureAIPool() {
  const now = Date.now();
  if (AI_WORD_POOL.length < 10 || !aiPoolLastGenerated || now - aiPoolLastGenerated > AI_POOL_REFRESH_MS) {
    console.log('[words] Generating AI word pool...');
    const fresh = await generateAIWords(30);
    if (fresh.length > 0) {
      AI_WORD_POOL = fresh;
      aiPoolLastGenerated = now;
      console.log('[words] AI pool ready:', AI_WORD_POOL.length, 'words');
    }
  }
}

function getRandomWord() {
  const useAI = AI_WORD_POOL.length > 0 && Math.random() < 0.5;
  const pool = useAI ? AI_WORD_POOL : WORD_PACKS;
  return pool[Math.floor(Math.random() * pool.length)];
}

function addCustomWords(newWords) {
  const valid = newWords.filter(w => w.word && w.hint);
  WORD_PACKS.push(...valid);
  return valid.length;
}

function getAllWords() {
  return { static: WORD_PACKS, ai: AI_WORD_POOL, total: WORD_PACKS.length + AI_WORD_POOL.length };
}

ensureAIPool().catch(() => {});

module.exports = { getRandomWord, addCustomWords, getAllWords, generateAIWords, ensureAIPool, WORD_PACKS };
