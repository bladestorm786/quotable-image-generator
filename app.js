const express = require('express');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { loadQuotes, saveQuotes } = require('./datastore');
const app = express();
const port = process.env.PORT || 3001; // Dynamic port for Vercel

// Make sure to replace with your actual Hugging Face API key and adjust the model endpoint as needed
const HUGGING_FACE_API_KEY = "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";
const MODEL_ENDPOINT = "https://api-inference.huggingface.co/models/your_model_here";



app.set('views', path.join(__dirname, 'views')); // Make sure the views directory is correct
app.set('view engine', 'ejs'); // Set ejs as the view engine

async function fetchQuoteAndGenerateImage() {
    try {
        const quoteResponse = await axios.get('https://api.quotable.io/random');
        const quoteData = quoteResponse.data;

        const imageResponse = await axios.post(
            MODEL_ENDPOINT,
            { inputs: quoteData.content },
            {
                headers: { 'Authorization': `Bearer ${HUGGING_FACE_API_KEY}` },
                responseType: 'arraybuffer',
            }
        );

        const timestamp = Date.now();
        const imageName = `images/image_${timestamp}.png`;
        const imagePath = path.join(__dirname, 'public', imageName);
        await fs.writeFile(imagePath, imageResponse.data);

        const quotes = await loadQuotes();
        quotes.push({
            _id: quoteData._id,
            content: quoteData.content,
            author: quoteData.author,
            tags: quoteData.tags || [],
            imageFilename: imageName,
            fullUrl: `/${imageName}`,
            dateGenerated: new Date().toISOString(),
        });

        await saveQuotes(quotes);
    } catch (error) {
        console.error('Error:', error);
    }
}

setInterval(fetchQuoteAndGenerateImage, 10000);

app.get('/', async (req, res) => {
    const quotes = await loadQuotes();
    const baseUrl = req.protocol + '://' + req.get('host') + '/';
    res.render('index', { images: quotes, baseUrl });
});

app.get('/filter/author/:author', async (req, res) => {
    const author = req.params.author;
    const quotes = await loadQuotes();
    const filteredQuotes = quotes.filter(quote => quote.author === author);
    const baseUrl = req.protocol + '://' + req.get('host') + '/';
    res.render('index', { images: filteredQuotes, baseUrl });
});

app.get('/filter/tag/:tag', async (req, res) => {
    const tag = req.params.tag;
    const quotes = await loadQuotes();
    const filteredQuotes = quotes.filter(quote => quote.tags && quote.tags.includes(tag));
    const baseUrl = req.protocol + '://' + req.get('host') + '/';
    res.render('index', { images: filteredQuotes, baseUrl });
});

app.listen(port, () => console.log(`Server running at http://localhost:${port}/`));


