require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');
const { loadQuotes, saveQuotes, saveImageToGoogleDrive } = require('./datastore');

const app = express();
const port = process.env.PORT || 3001;

const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY;
const HUGGING_FACE_MODEL_ENDPOINT = "https://api-inference.huggingface.co/models/goofyai/3d_render_style_xl";
const QUOTABLE_API_URL = 'https://api.quotable.io/random';

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

async function fetchQuoteAndGenerateImage() {
    try {
        const quoteResponse = await axios.get(QUOTABLE_API_URL);
        const imageResponse = await axios.post(
            HUGGING_FACE_MODEL_ENDPOINT,
            { inputs: quoteResponse.data.content },
            { headers: { Authorization: `Bearer ${HUGGING_FACE_API_KEY}` }, responseType: 'arraybuffer' }
        );

        const imageName = `image_${Date.now()}.png`;
        const imageUrl = await saveImageToGoogleDrive(imageResponse.data, imageName);

        const newQuote = {
            _id: quoteResponse.data._id,
            content: quoteResponse.data.content,
            author: quoteResponse.data.author,
            tags: quoteResponse.data.tags,
            imageFilename: imageName,
            fullUrl: imageUrl,
            dateGenerated: new Date().toISOString(),
        };

        const quotes = await loadQuotes();
        quotes.push(newQuote);
        await saveQuotes(quotes);

    } catch (error) {
        console.error('Error in fetchQuoteAndGenerateImage:', error);
    }
}

setInterval(fetchQuoteAndGenerateImage, 3600000); // Adjust frequency to avoid API rate limits

app.get('/', async (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const quotes = await loadQuotes();
    const quotesWithImages = quotes.map(quote => ({ ...quote, fullUrl: baseUrl + quote.fullUrl }));

    res.render('index', { images: quotesWithImages, baseUrl });
});

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));






