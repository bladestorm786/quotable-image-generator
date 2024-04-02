const express = require('express');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { loadQuotes, saveQuotes } = require('./datastore'); // Ensure these functions are properly implemented to load and save quotes

const app = express();
const port = process.env.PORT || 3001;

app.use(express.static('public')); // Serve static files from the 'public' directory
app.set('view engine', 'ejs'); // Use EJS as the template engine
app.set('views', path.join(__dirname, 'views')); // Define the directory for EJS templates

// Replace these placeholders with your actual API key and model endpoint
const HUGGING_FACE_API_KEY = "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";
const MODEL_ENDPOINT = "https://api-inference.huggingface.co/models/goofyai/3d_render_style_xl";

// Function to fetch a quote and generate an image
async function fetchQuoteAndGenerateImage() {
    try {
        // Fetching a random quote
        const quoteResponse = await axios.get('https://api.quotable.io/random');
        const quoteData = quoteResponse.data;

        // Generating an image for the quote
        const imageResponse = await axios.post(
            MODEL_ENDPOINT,
            { inputs: quoteData.content },
            {
                headers: { 'Authorization': `Bearer ${HUGGING_FACE_API_KEY}` },
                responseType: 'arraybuffer', // The image is expected to be a binary buffer
            }
        );

        // Saving the generated image to the 'public/images' directory
        const timestamp = Date.now();
        const imageName = `image_${timestamp}.png`;
        const imagePath = path.join(__dirname, 'public', 'images', imageName);
        await fs.writeFile(imagePath, imageResponse.data);

        // Loading existing quotes, adding the new one, and saving
        const quotes = await loadQuotes();
        quotes.push({
            _id: quoteData._id,
            content: quoteData.content,
            author: quoteData.author,
            tags: quoteData.tags || [],
            imageFilename: imageName,
            fullUrl: `/images/${imageName}`,
            dateGenerated: new Date().toISOString(),
        });

        await saveQuotes(quotes);
    } catch (error) {
        console.error('Error fetching quote or generating image:', error);
    }
}

// Fetch and generate a new quote and image every 10 seconds
setInterval(fetchQuoteAndGenerateImage, 10000);

// Route for the home page
app.get('/', async (req, res) => {
    const quotes = await loadQuotes();
    res.render('index', { images: quotes, baseUrl: req.protocol + '://' + req.get('host') });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});




