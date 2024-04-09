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
        const { _id, content, author } = quoteResponse.data;

        const imageResponse = await axios.post(
            HUGGING_FACE_MODEL_ENDPOINT,
            { inputs: content },
            {
                headers: { Authorization: `Bearer ${HUGGING_FACE_API_KEY}` },
                responseType: 'arraybuffer',
            }
        );

        const timestamp = Date.now();
        const imageName = `image_${timestamp}.png`;
        const imagePath = path.join(__dirname, 'public', 'images', imageName);
        await fs.writeFile(imagePath, imageResponse.data);

        const quoteInfo = {
            _id,
            content,
            author,
            image: imageName,
        };

        await updateQuotesJsonOnGitHub(quoteInfo);
    } catch (error) {
        console.error('Error in processing quote and image:', error);
    }
}

setInterval(fetchQuoteAndGenerateImage, 10000);

async function updateQuotesJsonOnGitHub(newQuote) {
    const githubApiUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/${QUOTES_JSON_PATH}`;
    try {
        // Fetch existing quotes.json for SHA
        const res = await axios.get(githubApiUrl, {
            headers: {
                Authorization: `token ${GITHUB_TOKEN}`,
                Accept: 'application/vnd.github.v3+json',
            },
        });

        const decodedContent = Buffer.from(res.data.content, 'base64').toString('utf-8');
        let existingQuotes = JSON.parse(decodedContent);
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
                    Authorization: `token ${GITHUB_TOKEN}`,
                    Accept: 'application/vnd.github.v3+json',
                },
            }
        );
        console.log('quotes.json updated successfully on GitHub.');
    } catch (error) {
        console.error('Error updating quotes.json on GitHub:', error.response ? error.response.data : error.message);
    }
}

app.get('/', async (req, res) => {
    try {
        const quotesUrl = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${REPO_NAME}/main/${QUOTES_JSON_PATH}`;
        const response = await axios.get(quotesUrl);
        const quotes = response.data;

        const quotesWithImageUrl = quotes.map(quote => ({
            ...quote,
            fullUrl: `/images/${quote.image}`
        }));

        res.render('index', { images: quotesWithImageUrl });
    } catch (error) {
        console.error('Error fetching and rendering quotes:', error);
        res.render('index', { images: [] }); // In case of error, render with an empty array
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
