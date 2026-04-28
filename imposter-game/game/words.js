// words.js - Word + hint category system
const WORD_PACKS = [
  { word: "School", hint: "Education" },
  { word: "Pizza", hint: "Food" },
  { word: "Hospital", hint: "Healthcare" },
  { word: "Guitar", hint: "Music" },
  { word: "Submarine", hint: "Vehicle" },
  { word: "Library", hint: "Building" },
  { word: "Volcano", hint: "Nature" },
  { word: "Casino", hint: "Entertainment" },
  { word: "Jungle", hint: "Nature" },
  { word: "Spaceship", hint: "Vehicle" },
  { word: "Wedding", hint: "Celebration" },
  { word: "Prison", hint: "Building" },
  { word: "Circus", hint: "Entertainment" },
  { word: "Market", hint: "Commerce" },
  { word: "Lighthouse", hint: "Structure" },
  { word: "Olympics", hint: "Sports" },
  { word: "Diamond", hint: "Gemstone" },
  { word: "Tornado", hint: "Weather" },
  { word: "Sushi", hint: "Food" },
  { word: "Telescope", hint: "Instrument" },
  { word: "Avalanche", hint: "Nature" },
  { word: "Carnival", hint: "Entertainment" },
  { word: "Skyscraper", hint: "Building" },
  { word: "Pirate", hint: "Historical Figure" },
  { word: "Quicksand", hint: "Nature" },
];
 
function getRandomWord() {
  return WORD_PACKS[Math.floor(Math.random() * WORD_PACKS.length)];
}
 
module.exports = { getRandomWord, WORD_PACKS };
 
