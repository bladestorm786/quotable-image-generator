const express = require('express');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { loadQuotes, saveQuotes } = require('./datastore');
const app = express();
const port = process.env.PORT || 3001; // Use the environment variable if available

// Make sure to replace with your actual Hugging Face API key
const HUGGING_FACE_API_KEY = "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";
const MODEL_ENDPOINT = "https://api-inference.huggingface.co/models/goofyai/3d_render_style_xl";

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Set the directory for EJS templates

async function fetchQuoteAndGenerateImage() {
    // ... Your existing function code
}

// ... Any additional middlewares or functions you may have

app.get('/', async (req, res) => {
    const quotes = await loadQuotes();
    const protocol = req.secure ? 'https' : 'http';
    const baseUrl = `${protocol}://${req.get('host')}/`; // Construct the base URL dynamically
    res.render('index', { images: quotes, baseUrl });
});

app.get('/filter/author/:author', async (req, res) => {
    // ... Your existing route handling code, ensure you use baseUrl
});

app.get('/filter/tag/:tag', async (req, res) => {
    // ... Your existing route handling code, ensure you use baseUrl
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});


app.listen(port, () => console.log(`Server running at http://localhost:${port}`));




