const fs = require('fs').promises;
const path = require('path');

const quotesFilePath = path.join(__dirname, 'quotes.json');

async function loadQuotes() {
  try {
    const data = await fs.readFile(quotesFilePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Could not load quotes:', error);
    return [];
  }
}

async function saveQuotes(quotes) {
  try {
    await fs.writeFile(quotesFilePath, JSON.stringify(quotes, null, 2), 'utf8');
  } catch (error) {
    console.error('Could not save quotes:', error);
  }
}

module.exports = { loadQuotes, saveQuotes };


