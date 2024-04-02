const express = require('express');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { loadQuotes, saveQuotes } = require('./datastore');
const app = express();
const port = process.env.PORT || 3001; // Dynamic port for Vercel

// Set the directory for the view templates
app.set('views', path.join(__dirname, 'views'));

// Set the view engine to ejs
app.set('view engine', 'ejs');

// Use express.static middleware to serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Replace with your actual Hugging Face API key and model endpoint
const HUGGING_FACE_API_KEY = "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";
const MODEL_ENDPOINT = "https://api-inference.huggingface.co/models/goofyai/3d_render_style_xl";

// Your existing function and route definitions remain unchanged

// ... rest of your code

app.listen(port, () => console.log(`Server running at http://localhost:${port}/`));


app.listen(port, () => console.log(`Server running at http://localhost:${port}/`));



