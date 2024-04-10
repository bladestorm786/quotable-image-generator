const express = require('express');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const port = process.env.PORT || 3001;

// Configuration
const GITHUB_TOKEN = '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';
const HUGGING_FACE_API_KEY = "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";
const HUGGING_FACE_MODEL_ENDPOINT = "https://api-inference.huggingface.co/models/goofyai/3d_render_style_xl";
const QUOTABLE_API_URL = 'https://api.quotable.io/random';
const GITHUB_USERNAME = 'bladestorm786';
const REPO_NAME = 'quotable-image-generator';
const QUOTES_JSON_PATH = 'quotes.json'; // Assuming the file is at the root of the repo

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

        const timestamp = Date.now();
        const imageName = `image_${timestamp}.png`;
        const imagePath = path.join(__dirname, 'public', 'images', imageName);
        await fs.writeFile(imagePath, imageResponse.data);

        const newQuote = {
            _id: quoteData._id,
            content: quoteData.content,
            author: quoteData.author,
            tags: quoteData.tags,
            imageFilename: imageName,
            fullUrl: `/images/${imageName}`,
            dateGenerated: new Date().toISOString(),
        };

        await updateQuotesJsonOnGitHub(newQuote);
    } catch (error) {
        console.error('Error in fetchQuoteAndGenerateImage:', error.message);
    }
}

setInterval(fetchQuoteAndGenerateImage, 10000);

async function updateQuotesJsonOnGitHub(newQuote) {
    const githubApiUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${QUOTES_JSON_PATH}`;
    try {
        // Fetch existing quotes.json for SHA
        const res = await axios.get(githubApiUrl, {
            headers: {
                Authorization: `Bearer ${GITHUB_TOKEN}`,
                Accept: 'application/vnd.github.v3+json',
            },
        });

        const existingQuotes = JSON.parse(Buffer.from(res.data.content, 'base64').toString('utf-8'));
        existingQuotes.push(newQuote);

        // Update quotes.json with the new quote and the fetched SHA
        await axios.put(
            githubApiUrl,
            {
                message: 'Update quotes.json',
                content: Buffer.from(JSON.stringify(existingQuotes)).toString('base64'),
                sha: res.data.sha,
            },
            {
                headers: {
                    Authorization: `Bearer ${GITHUB_TOKEN}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            }
        );

        console.log('quotes.json updated successfully on GitHub.');
    } catch (error) {
        console.error('Error updating quotes.json on GitHub:', error.response?.data || error.message);
    }
}

app.get('/', async (req, res) => {
    try {
        // Correct URL construction for fetching the raw content of quotes.json from GitHub
        const quotesUrl = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${REPO_NAME}/main/${QUOTES_JSON_PATH}`;
        const response = await axios.get(quotesUrl, {
            headers: {
                Authorization: `Bearer ${GITHUB_TOKEN}`,
            },
        });
        const quotes = response.data;

        const quotesWithImageUrl = quotes.map(quote => ({ ...quote, fullUrl: `/images/${quote.imageFilename}` }));

        res.render('index', { images: quotesWithImageUrl });
    } catch (error) {
        console.error('Error fetching and rendering quotes:', error.response?.data || error.message);
        res.render('index', { images: [] });
    }
});

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));


