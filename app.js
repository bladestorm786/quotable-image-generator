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
const quotesFilePath = 'quotes.json'; // Path to your quotes.json in the repository

// Hugging Face API setup
const HUGGING_FACE_API_KEY = "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";
const MODEL_ENDPOINT = "https://api-inference.huggingface.co/models/goofyai/3d_render_style_xl";

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

async function updateQuotesOnGithub(newQuote) {
    // This function should now correctly update quotes.json in your GitHub repository
    // Include the logic to fetch the existing file, update it, and then push the changes
}

async function fetchQuoteAndGenerateImage() {
    try {
        // Fetch a random quote from quotable.io
        const quoteResponse = await axios.get('https://api.quotable.io/random');
        const quoteData = quoteResponse.data;

        // Use the quote to generate an image using the Hugging Face model
        const imageResponse = await axios.post(
            huggingFaceEndpoint,
            { inputs: quoteData.content },
            {
                headers: { Authorization: `Bearer ${huggingFaceAPIKey}` },
                responseType: 'arraybuffer'
            }
        );

        // Assume image generation is successful and log the result
        console.log('Image generated from Hugging Face model');

        // Here, you would typically store the image in a publicly accessible place
        // and then prepare the URL to the image to be stored alongside the quote in quotes.json

        // Update the GitHub quotes.json file with the new quote and image URL
        // This requires the updateQuotesOnGithub function to be implemented correctly
        await updateQuotesOnGithub({
            _id: quoteData._id,
            content: quoteData.content,
            author: quoteData.author,
            tags: quoteData.tags || []
            // Add the image URL here after storing the image
        });
    } catch (error) {
        console.error('Error in fetchQuoteAndGenerateImage:', error.message);
    }
}

// Setting up the routes and server as previously described
// ... (rest of the server setup and route handlers)

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));



