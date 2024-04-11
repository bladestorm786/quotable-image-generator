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
        const quoteResponse = await axios.get(QUOTABLE_API_URL);
        const quoteData = quoteResponse.data;

        const imageResponse = await axios.post(
            HUGGING_FACE_MODEL_ENDPOINT,
            { inputs: quoteData.content },
            { headers: { Authorization: `Bearer ${HUGGING_FACE_API_KEY}` }, responseType: 'arraybuffer' }
        );

        const imagesDir = path.join(__dirname, 'public', 'images');
        await fs.mkdir(imagesDir, { recursive: true });

        const timestamp = Date.now();
        const imageName = `image_${timestamp}.png`;
        const imagePath = path.join(imagesDir, imageName);
        await fs.writeFile(imagePath, imageResponse.data);

        const newQuote = {
            _id: quoteData._id,
            content: quoteData.content,
            author: quoteData.author,
            tags: quoteData.tags || [],
            imageFilename: imageName,
            fullUrl: `/images/${imageName}`,
            dateGenerated: new Date().toISOString(),
        };

        await updateQuotesJsonOnGitHub(newQuote);
    } catch (error) {
        console.error('Error in fetchQuoteAndGenerateImage:', error.response?.data || error.message);
    }
}

setInterval(fetchQuoteAndGenerateImage, 3600000); // Adjust frequency to avoid rate limits

async function updateQuotesJsonOnGitHub(newQuote) {
    try {
        const githubApiUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${QUOTES_JSON_PATH}`;
        const res = await axios.get(githubApiUrl, {
            headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' },
        });

        const existingQuotes = JSON.parse(Buffer.from(res.data.content, 'base64').toString('utf-8'));
        existingQuotes.push(newQuote);

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

        console.log('quotes.json updated successfully on GitHub.');
    } catch (error) {
        console.error('Error updating quotes.json on GitHub:', error.response?.data || error.message);
    }
}

app.get('/', async (req, res) => {
    try {
        // Define the base URL based on request properties
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        
        const quotesUrl = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${REPO_NAME}/main/${QUOTES_JSON_PATH}`;
        const response = await axios.get(quotesUrl);
        const quotes = response.data;

        // Append baseUrl to the fullUrl property for each quote
        const quotesWithImages = quotes.map(quote => ({
            ...quote,
            fullUrl: `${baseUrl}${quote.fullUrl}`
        }));

        res.render('index', { images: quotesWithImages, baseUrl });
    } catch (error) {
        console.error('Error fetching and rendering quotes:', error.response?.data || error.message);
        res.render('index', { images: [] });
    }
});

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));


