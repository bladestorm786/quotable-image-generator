require('dotenv').config();
const express = require('express');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { loadQuotes, saveQuotes } = require('./datastore');
const simpleGit = require('simple-git');
const git = simpleGit({
    baseDir: path.join(__dirname, './')
});

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

        const imagesDir = path.join(__dirname, 'public', 'images');
        await fs.mkdir(imagesDir, { recursive: true });

        const timestamp = Date.now();
        const imageName = `image_${timestamp}.png`;
        const imagePath = path.join(imagesDir, imageName);
        await fs.writeFile(imagePath, imageResponse.data);

        console.log(`Image saved at: ${imagePath}`);

        const quotes = await loadQuotes();
        const newQuote = {
            _id: quoteResponse.data._id,
            content: quoteResponse.data.content,
            author: quoteResponse.data.author,
            tags: quoteResponse.data.tags,
            imageFilename: imageName,
            fullUrl: `/images/${imageName}`,
            dateGenerated: new Date().toISOString(),
        };

        quotes.push(newQuote);
        await saveQuotes(quotes);

        // Git commit and push
        await git.add('./*');
        await git.commit('Auto-update quotes and images');
        await git.push('origin', 'main');
    } catch (error) {
        console.error('Error in fetchQuoteAndGenerateImage:', error);
    }
}

setInterval(fetchQuoteAndGenerateImage, 60000); // Adjust frequency to once per minute

app.get('/', async (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const quotes = await loadQuotes();
    const quotesWithImages = quotes.map(quote => ({ ...quote, fullUrl: `${baseUrl}${quote.fullUrl}` }));

    res.render('index', { images: quotesWithImages, baseUrl });
});

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));









