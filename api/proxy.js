// api/proxy.js
const fetch = require('node-fetch');

module.exports = async (req, res) => {
    const { searchParams } = new URL(req.url, `http://${req.headers.host}`);
    const endpoint = searchParams.get('endpoint');
    const query = searchParams.get('q');
    const videoId = searchParams.get('videoId');

    const API_BASE_URL = 'https://yewtu.be';

    let targetUrl;

    if (endpoint === 'search' && query) {
        targetUrl = `${API_BASE_URL}/api/v1/search?q=${encodeURIComponent(query)}&type=video`;
    } else if (endpoint === 'video' && videoId) {
        targetUrl = `${API_BASE_URL}/api/v1/videos/${videoId}`;
    } else {
        return res.status(400).json({ error: 'Invalid request. Provide "endpoint" and relevant parameters.' });
    }

    try {
        const apiResponse = await fetch(targetUrl, {
            headers: { 'Accept': 'application/json' }
        });

        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            console.error(`API Error: ${apiResponse.status} ${errorText}`);
            return res.status(apiResponse.status).send(errorText);
        }

        const contentType = apiResponse.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const textData = await apiResponse.text();
            console.error("API returned non-JSON response:", textData);
            return res.status(502).json({ error: 'Bad Gateway: API returned an invalid response format.' });
        }
        
        const data = await apiResponse.json();

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