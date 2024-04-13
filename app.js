require('dotenv').config();
const express = require('express');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { loadQuotes, saveQuotes } = require('./datastore');

const app = express();
const port = process.env.PORT || 3001;

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY;
const HUGGING_FACE_MODEL_ENDPOINT = "https://api-inference.huggingface.co/models/goofyai/3d_render_style_xl";
const QUOTABLE_API_URL = 'https://api.quotable.io/random';

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

async function fetchQuoteAndGenerateImage() {
    try {
        const quoteResponse = await axios.get(QUOTABLE_API_URL);
        const quoteData = quoteResponse.data;
        const imageResponse = await axios.post(HUGGING_FACE_MODEL_ENDPOINT, { inputs: quoteData.content }, { headers: { Authorization: `Bearer ${HUGGING_FACE_API_KEY}` }, responseType: 'arraybuffer' });

        const imagesDir = path.join(__dirname, 'public', 'images');
        await fs.mkdir(imagesDir, { recursive: true });

        const timestamp = Date.now();
        const imageName = `image_${timestamp}.png`;
        const imagePath = path.join(imagesDir, imageName);
        await fs.writeFile(imagePath, imageResponse.data);

        const quotes = await loadQuotes();
        const newQuote = {
            _id: quoteData._id,
            content: quoteData.content,
            author: quoteData.author,
            tags: quoteData.tags || [],
            imageFilename: imageName,
            fullUrl: `/images/${imageName}`,
            dateGenerated: new Date().toISOString(),
        };

        quotes.push(newQuote);
        await saveQuotes(quotes);
        await updateQuotesJsonOnGitHub(quotes);
    } catch (error) {
        console.error('Error in processing quote and image:', error);
    }
}

setInterval(fetchQuoteAndGenerateImage, 60000);

async function updateQuotesJsonOnGitHub(quotes) {
    const githubApiUrl = `https://api.github.com/repos/${process.env.GITHUB_USERNAME}/${process.env.REPO_NAME}/contents/quotes.json`;
    const content = Buffer.from(JSON.stringify(quotes, null, 2)).toString('base64');
    const shaResponse = await axios.get(githubApiUrl, { headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' } });
    const sha = shaResponse.data.sha;

    await axios.put(githubApiUrl, { message: "Update quotes.json", content: content, sha: sha }, { headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' } });
}

app.get('/', async (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const quotes = await loadQuotes();
    const quotesWithImages = quotes.map(quote => ({ ...quote, fullUrl: `${baseUrl}${quote.fullUrl}` }));

    res.render('index', { images: quotesWithImages, baseUrl });
});

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));


