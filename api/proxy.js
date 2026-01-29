// api/proxy.js

// Using require for node-fetch as Vercel's Node.js environment might not have fetch globally
const fetch = require('node-fetch');

module.exports = async (req, res) => {
    const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
    const endpoint = searchParams.get('endpoint');
    const query = searchParams.get('q');
    const videoId = searchParams.get('videoId');

    // Use a more reliable piped instance
    const API_BASE_URL = 'https://pipedapi.in.projectsegfau.lt';

    let targetUrl;

    if (endpoint === 'search' && query) {
        targetUrl = `${API_BASE_URL}/search?q=${encodeURIComponent(query)}&filter=music`;
    } else if (endpoint === 'stream' && videoId) {
        targetUrl = `${API_BASE_URL}/streams/${videoId}`;
    } else {
        return res.status(400).json({ error: 'Invalid request. Provide "endpoint" and relevant parameters (q or videoId).' });
    }

    try {
        const apiResponse = await fetch(targetUrl, {
             headers: {
                'Origin': 'https://piped.video', // Act like a known client
                'Accept': 'application/json'
            }
        });

        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            console.error(`Piped API Error: ${apiResponse.status} ${errorText}`);
            return res.status(apiResponse.status).send(errorText);
        }

        const data = await apiResponse.json();

        // Set CORS headers for the response to the client
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        res.status(200).json(data);

    } catch (error) {
        console.error('Proxy internal error:', error);
        res.status(500).json({ error: 'Proxy failed to fetch from API.' });
    }
};
// Made with ❤️ from 4SP