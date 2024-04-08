const express = require('express');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const app = express();
const port = 3001;

// GitHub API setup
const githubToken = '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';
const githubRepoOwner = 'bladestorm786';
const githubRepo = 'quotable-image-generator';
const quotesFilePath = 'path/to/quotes.json'; // Path to your quotes.json in the repository

// Hugging Face API setup
const HUGGING_FACE_API_KEY = "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";
const MODEL_ENDPOINT = "https://api-inference.huggingface.co/models/goofyai/3d_render_style_xl";

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

async function updateQuotesOnGithub(newQuotes) {
    const quotesJson = JSON.stringify(newQuotes, null, 2);
    const contentBase64 = Buffer.from(quotesJson).toString('base64');

    try {
        const getFileResponse = await axios.get(`https://api.github.com/repos/${githubRepoOwner}/${githubRepo}/contents/${quotesFilePath}`, {
            headers: { Authorization: `token ${githubToken}` }
        });

        await axios.put(
            `https://api.github.com/repos/${githubRepoOwner}/${githubRepo}/contents/${quotesFilePath}`,
            {
                message: "Update quotes.json",
                content: contentBase64,
                sha: getFileResponse.data.sha
            },
            { headers: { Authorization: `token ${githubToken}` } }
        );

        console.log('Quotes updated successfully on GitHub');
    } catch (error) {
        console.error('Failed to update quotes on GitHub:', error.response ? error.response.data : error.message);
    }
}

async function fetchQuoteAndGenerateImage() {
    try {
        const quoteResponse = await axios.get('https://api.quotable.io/random');
        const quoteData = quoteResponse.data;

        const imageResponse = await axios.post(
            huggingFaceEndpoint,
            { inputs: quoteData.content },
            {
                headers: { Authorization: `Bearer ${huggingFaceAPIKey}` },
                responseType: 'arraybuffer'
            }
        );

        // For demonstration purposes, image data is not saved but logged. You should store the image where needed.
        console.log('Image generated from Hugging Face model');

        // Here we'll update the GitHub quotes.json
        await updateQuotesOnGithub({
            _id: quoteData._id,
            content: quoteData.content,
            author: quoteData.author,
            tags: quoteData.tags || []
            // Add image data or reference as needed
        });

    } catch (error) {
        console.error('Error in fetchQuoteAndGenerateImage:', error.message);
    }
}

// Simulate the quote and image generation process every 10 seconds
setInterval(fetchQuoteAndGenerateImage, 10000);

app.get('/', async (req, res) => {
    // Since we're now using GitHub to store quotes, you should fetch them from GitHub
    // This is a placeholder response; replace with actual GitHub fetching logic if needed
    res.render('index', { images: [], baseUrl: req.protocol + '://' + req.get('host') + '/' });
});

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));



