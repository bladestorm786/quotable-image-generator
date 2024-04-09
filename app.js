const express = require('express');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const app = express();
const port = process.env.PORT || 3001;

// Replace these with your actual configuration values
const GITHUB_USERNAME = 'bladestorm786';
const REPO_NAME = 'quotable-image-generator';
const GITHUB_TOKEN = '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';
const HUGGING_FACE_API_KEY = "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";
const MODEL_ENDPOINT = "https://api-inference.huggingface.co/models/goofyai/3d_render_style_xl";


app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Fetch quote from Quotable.io
async function fetchQuote() {
    const response = await axios.get('https://api.quotable.io/random');
    return response.data; // Returns the quote object
}

// Generate image from quote using Hugging Face model
async function generateImageFromQuote(quote) {
    const response = await axios.post(
        HUGGING_FACE_MODEL_ENDPOINT,
        { inputs: quote.content },
        {
            headers: { Authorization: `Bearer ${HUGGING_FACE_API_KEY}` },
            responseType: 'arraybuffer',
        }
    );
    const timestamp = Date.now();
    const filename = `image_${timestamp}.png`;
    const filepath = path.join(__dirname, 'public/images', filename);
    await fs.writeFile(filepath, response.data);
    return filename; // Returns the filename of the generated image
}

// Update quotes.json in GitHub repository
async function updateGitHubQuotes(newQuote) {
    const quotesUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${REPO_NAME}/contents/quotes.json`;
    const getFileResponse = await axios.get(quotesUrl, {
        headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            Accept: 'application/vnd.github.v3+json',
        },
    });

    const existingQuotes = JSON.parse(Buffer.from(getFileResponse.data.content, 'base64').toString());
    existingQuotes.push(newQuote);

    await axios.put(
        quotesUrl,
        {
            message: 'Update quotes.json',
            content: Buffer.from(JSON.stringify(existingQuotes)).toString('base64'),
            sha: getFileResponse.data.sha,
        },
        {
            headers: {
                Authorization: `token ${GITHUB_TOKEN}`,
                Accept: 'application/vnd.github.v3+json',
            },
        }
    );
}

// Combined function to fetch a quote, generate an image, and update GitHub
async function fetchQuoteAndGenerateImage() {
    try {
        const quote = await fetchQuote();
        const imageFilename = await generateImageFromQuote(quote);
        const newQuote = {
            ...quote,
            imagePath: `images/${imageFilename}`,
        };
        await updateGitHubQuotes(newQuote);
        console.log('New quote and image processed successfully.');
    } catch (error) {
        console.error('Error in processing quote and image:', error);
    }
}

setInterval(fetchQuoteAndGenerateImage, 60000); // Run every 60 seconds

app.get('/', async (req, res) => {
    const quotesJsonUrl = `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${REPO_NAME}/main/quotes.json`;
    try {
        const response = await axios.get(quotesJsonUrl);
        res.render('index', { images: response.data });
    } catch (error) {
        console.error('Failed to load quotes:', error);
        res.render('index', { images: [] });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

  // Placeholder for rendering your quotes and images. You'll need to fetch and pass the updated quotes data to your template.
  res.render('index');
});

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
