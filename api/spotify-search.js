let cachedToken = null;
let cachedTokenExpiresAt = 0;

async function getAccessToken() {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        throw new Error('Missing Spotify client credentials');
    }

    const now = Date.now();
    if (cachedToken && cachedTokenExpiresAt > now + 5000) {
        return cachedToken;
    }

    const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    });

    if (!tokenResponse.ok) {
        throw new Error('Failed to fetch Spotify token');
    }

    const tokenData = await tokenResponse.json();
    cachedToken = tokenData.access_token;
    cachedTokenExpiresAt = now + tokenData.expires_in * 1000;

    return cachedToken;
}

module.exports = async (req, res) => {
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const query = (req.query.q || '').trim();
    if (query.length < 2) {
        res.status(400).json({ error: 'Query too short' });
        return;
    }

    try {
        const token = await getAccessToken();
        const searchUrl = new URL('https://api.spotify.com/v1/search');
        searchUrl.searchParams.set('type', 'track');
        searchUrl.searchParams.set('limit', '6');
        searchUrl.searchParams.set('q', query);

        const searchResponse = await fetch(searchUrl.toString(), {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!searchResponse.ok) {
            throw new Error('Spotify search request failed');
        }

        const searchData = await searchResponse.json();
        const tracks = (searchData.tracks?.items || []).map((item) => ({
            id: item.id,
            name: item.name,
            artist: item.artists?.map((artist) => artist.name).join(', ') || 'unknown',
            album: item.album?.name || '',
            coverUrl: item.album?.images?.[2]?.url || item.album?.images?.[0]?.url || '',
            spotifyUrl: item.external_urls?.spotify || ''
        }));

        res.setHeader('Cache-Control', 'no-store');
        res.status(200).json({ tracks });
    } catch (error) {
        res.status(500).json({ error: 'Spotify search failed' });
    }
};
