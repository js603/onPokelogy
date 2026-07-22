const sqlite3 = require('better-sqlite3');
const db = sqlite3('data/poke.db');
const { translateLocationName } = require('./dist/translations.cjs') || {}; // wait, how to load the translation logic?
