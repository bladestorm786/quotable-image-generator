const { google } = require('googleapis');
const path = require('path');

const quotesFilePath = path.join(__dirname, 'quotes.json'); // Not used for Google Drive operations
const drive = google.drive({ version: 'v3' });
const googleAuth = new google.auth.GoogleAuth({
    keyFile: 'path/to/your/credentials.json', // Path to your Google credentials file
    scopes: ['https://www.googleapis.com/auth/drive']
});

async function authenticateDrive() {
    const authClient = await googleAuth.getClient();
    google.options({ auth: authClient });
}

async function loadQuotes() {
    await authenticateDrive();
    try {
        const response = await drive.files.get({
            fileId: 'your_google_drive_file_id_for_quotes_json', // Replace with your file ID
            alt: 'media'
        });
        return JSON.parse(response.data);
    } catch (error) {
        console.error('Could not load quotes:', error);
        return [];
    }
}

async function saveQuotes(quotes) {
    await authenticateDrive();
    try {
        await drive.files.update({
            fileId: 'your_google_drive_file_id_for_quotes_json', // Replace with your file ID
            media: {
                mimeType: 'application/json',
                body: JSON.stringify(quotes, null, 2)
            }
        });
    } catch (error) {
        console.error('Could not save quotes:', error);
    }
}

async function saveImageToGoogleDrive(imageBuffer, imageName) {
    await authenticateDrive();
    try {
        const response = await drive.files.create({
            requestBody: {
                name: imageName,
                mimeType: 'image/png'
            },
            media: {
                mimeType: 'image/png',
                body: Buffer.from(imageBuffer)
            }
        });
        return `https://drive.google.com/uc?id=${response.data.id}`;
    } catch (error) {
        console.error('Error saving image to Google Drive:', error);
        return null; // Return null if there's an error
    }
}

module.exports = { loadQuotes, saveQuotes, saveImageToGoogle Drive };


