const express = require('express');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Replace the following placeholders with your actual details
const githubToken = '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';
const githubRepoOwner = 'bladestorm786';
const githubRepo = 'quotable-image-generator';
const quotesFilePath = 'quotes.json'; // Path to your quotes.json in the repository

// Hugging Face API setup
const HUGGING_FACE_API_KEY = "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";
const MODEL_ENDPOINT = "https://api-inference.huggingface.co/models/goofyai/3d_render_style_xl";

const app = express();
const port = process.env.PORT || 3001;

app.use(express.static('public'));
app.set('view engine', 'ejs');

// Utility function to update quotes.json in GitHub
async function updateQuotesOnGitHub(newQuote) {
  const url = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`;

  try {
    const getFileResponse = await axios.get(url, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    const content = Buffer.from(getFileResponse.data.content, 'base64').toString('utf8');
    const quotes = JSON.parse(content);
    quotes.push(newQuote);

    await axios.put(url, {
      message: 'Update quotes.json',
      content: Buffer.from(JSON.stringify(quotes)).toString('base64'),
      sha: getFileResponse.data.sha
    }, {
      headers: {
        'Authorization': `token ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    console.log('Successfully updated quotes.json on GitHub');
  } catch (error) {
    console.error('Failed to update quotes.json on GitHub:', error.message);
  }
}

// Function to fetch a quote and generate an image using Hugging Face
async function fetchQuoteAndGenerateImage() {
  try {
    const quoteResponse = await axios.get('https://api.quotable.io/random');
    const quoteData = quoteResponse.data;

    const imageResponse = await axios.post(HUGGING_FACE_MODEL_ENDPOINT, {
      inputs: quoteData.content
    }, {
      headers: {
        'Authorization': `Bearer ${HUGGING_FACE_API_KEY}`
      },
      responseType: 'arraybuffer'
    });

    const timestamp = Date.now();
    const imageName = `image_${timestamp}.png`;
    const imagePath = path.join(__dirname, 'public', 'images', imageName);
    await fs.writeFile(imagePath, imageResponse.data);

    const newQuote = { ...quoteData, image: imageName };
    await updateQuotesOnGitHub(newQuote);

    console.log('Quote fetched and image generated:', quoteData.content);
  } catch (error) {
    console.error('Error in fetchQuoteAndGenerateImage:', error.message);
  }
}

// Initiate fetching quotes and generating images every 10 seconds as an example
setInterval(fetchQuoteAndGenerateImage, 10000);

app.get('/', async (req, res) => {
  // Placeholder for rendering your quotes and images. You'll need to fetch and pass the updated quotes data to your template.
  res.render('index');
});

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));



