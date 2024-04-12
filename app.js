require('dotenv').config();
const express = require('express');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const HUGGING_FACE_API_KEY = process.env.HUGGING_FACE_API_KEY;
const HUGGING_FACE_MODEL_ENDPOINT = "https://api-inference.huggingface.co/models/goofyai/3d_render_style_xl";
const QUOTABLE_API_URL = 'https://api.quotable.io/random';
const GITHUB_USERNAME = process.env.GITHUB_USERNAME;
const REPO_NAME = process.env.REPO_NAME;
const QUOTES_JSON_PATH = 'quotes.json';

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

async function fetchQuoteAndGenerateImage() {
    try {
        console.log("Attempting to fetch a quote...");
        const quoteResponse = await axios.get(QUOTABLE_API_URL);
        console.log("Quote fetched:", quoteResponse.data);

        console.log("Attempting to generate an image...");
        const imageResponse = await axios.post(
            HUGGING_FACE_MODEL_ENDPOINT,
            { inputs: quoteResponse.data.content },
            { headers: { Authorization: `Bearer ${HUGGING_FACE_API_KEY}` }, responseType: 'arraybuffer' }
        );
        console.log("Image generated successfully.");

        const imagesDir = path.join(__dirname, 'public', 'images');
        await fs.mkdir(imagesDir, { recursive: true });

        const timestamp = Date.now();
        const imageName = `image_${timestamp}.png`;
        const imagePath = path.join(imagesDir, imageName);
        await fs.writeFile(imagePath, imageResponse.data);
        console.log("Image saved at:", imagePath);

        const newQuote = {
            _id: quoteResponse.data._id,
            content: quoteResponse.data.content,
            author: quoteResponse.data.author,
            tags: quoteResponse.data.tags || [],
            imageFilename: imageName,
            fullUrl: `/images/${imageName}`,
            dateGenerated: new Date().toISOString(),
        };

        await updateQuotesJsonOnGitHub(newQuote);
    } catch (error) {
        console.error('Error in processing quote and image:', error.response ? error.response.data : error.message);
    }
}

setInterval(fetchQuoteAndGenerateImage, 60000); // 60,000 milliseconds = 1 minute

async function updateQuotesJsonOnGitHub(newQuote) {
    try {
        const githubApiUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${QUOTES_JSON_PATH}`;
        console.log("Fetching current quotes.json from GitHub...");
        const res = await axios.get(githubApiUrl, {
            headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' },
        });

        const existingQuotes = JSON.parse(Buffer.from(res.data.content, 'base64').toString('utf-8'));
        existingQuotes.push(newQuote);

        console.log("Updating quotes.json on GitHub...");
        await axios.put(
            githubApiUrl,
            {
                message: 'Update quotes.json',
                content: Buffer.from(JSON.stringify(existingQuotes, null, 2)).toString('base64'),
                sha: res.data.sha,
            },
            {
                headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' },
            }
        );
        console.log("quotes.json successfully updated.");
    } catch (error) {
        console.error('Error updating quotes.json on GitHub:', error.response ? error.response.data : error.message);
    }
}

app.get('/', async (req, res) => {
    try {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const quotesUrl = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${REPO_NAME}/main/${QUOTES_JSON_PATH}`;
        console.log("Fetching quotes for display...");
        const response = await axios.get(quotesUrl);
        const quotes = response.data;

        const quotesWithImages = quotes.map(quote => ({
            ...quote,
            fullUrl: `${baseUrl}${quote.fullUrl}`
        }));

        res.render('index', { images: quotesWithImages, baseUrl });
        console.log("Quotes and images rendered successfully.");
    } catch (error) {
        console.error('Error fetching and rendering quotes:', error.response ? error.response.data : error.message);
        res.render('index', { images: [] });
    }
});

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));





