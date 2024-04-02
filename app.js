const express = require('express');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { loadQuotes, saveQuotes } = require('./datastore');

const app = express();
const port = process.env.PORT || 3001;

// Make sure to replace with your actual Hugging Face API key and adjust the model endpoint as needed
const HUGGING_FACE_API_KEY = "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";
const MODEL_ENDPOINT = "https://api-inference.huggingface.co/models/goofyai/3d_render_style_xl";


// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

// Set 'view engine' to 'ejs' for rendering
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

async function fetchQuoteAndGenerateImage() {
    try {
        // Fetching a random quote
        const quoteResponse = await axios.get('https://api.quotable.io/random');
        const quoteData = quoteResponse.data;

        console.log(`Fetched quote: ${quoteData.content} - ${quoteData.author}`);

        // Generating an image with the quote
        const imageResponse = await axios.post(
            MODEL_ENDPOINT,
            { inputs: quoteData.content },
            {
                headers: { 'Authorization': `Bearer ${HUGGING_FACE_API_KEY}` },
                responseType: 'arraybuffer',
            }
        );

        // Saving the generated image
        const timestamp = Date.now();
        const imageName = `images/image_${timestamp}.png`;
        const imagePath = path.join(__dirname, 'public', imageName);
        await fs.writeFile(imagePath, imageResponse.data);

        console.log(`Generated image saved to ${imagePath}`);

        // Saving quote and image info
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
        console.error('Error in fetchQuoteAndGenerateImage:', error);
    }
}

// Fetch and generate images every 10 seconds
setInterval(fetchQuoteAndGenerateImage, 10000);

// Routes
app.get('/', async (req, res) => {
    const quotes = await loadQuotes();
    res.render('index', { images: quotes, baseUrl: req.protocol + '://' + req.get('host') + '/' });
});

app.get('/filter/author/:author', async (req, res) => {
    const author = req.params.author;
    const quotes = await loadQuotes();
    const filteredQuotes = quotes.filter(quote => quote.author === author);
    res.render('index', { images: filteredQuotes, baseUrl: req.protocol + '://' + req.get('host') + '/' });
});

app.get('/filter/tag/:tag', async (req, res) => {
    const tag = req.params.tag;
    const quotes = await loadQuotes();
    const filteredQuotes = quotes.filter(quote => quote.tags && quote.tags.includes(tag));
    res.render('index', { images: filteredQuotes, baseUrl: req.protocol + '://' + req.get('host') + '/' });
});

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));


