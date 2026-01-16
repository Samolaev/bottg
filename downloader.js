const axios = require('axios');
const ytdl = require('ytdl-core');
const cheerio = require('cheerio');

async function downloadVideo(url) {
    // Попытка через Cobalt
    try {
        const response = await axios.post('https://api.cobalt.tools/api/json', { url });
        if (response.data.status === 'success') {
            const downloadUrl = response.data.url;
            const videoResponse = await axios.get(downloadUrl, { responseType: 'arraybuffer' });
            return videoResponse.data;
        }
    } catch (error) {
        console.log('Cobalt failed:', error.message);
    }

    // Если Cobalt не сработал, yt-dlp (ytdl-core)
    try {
        const info = await ytdl.getInfo(url);
        const format = ytdl.chooseFormat(info.formats, { quality: 'highest', filter: 'audioandvideo' });
        if (format) {
            const videoResponse = await axios.get(format.url, { responseType: 'arraybuffer' });
            return videoResponse.data;
        }
    } catch (error) {
        console.log('ytdl-core failed:', error.message);
    }

    // Для TikTok, ssstik.io
    if (url.includes('tiktok.com')) {
        try {
            const response = await axios.post('https://ssstik.io/abc', `url=${encodeURIComponent(url)}`, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            const $ = cheerio.load(response.data);
            const downloadLink = $('a[href*="https://"][href*=".mp4"]').attr('href');
            if (downloadLink) {
                const videoResponse = await axios.get(downloadLink, { responseType: 'arraybuffer' });
                return videoResponse.data;
            }
        } catch (error) {
            console.log('ssstik.io failed:', error.message);
        }

        // snaptik.app
        try {
            const response = await axios.post('https://snaptik.app/abc', `url=${encodeURIComponent(url)}`, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            const $ = cheerio.load(response.data);
            const downloadLink = $('a[href*="https://"][href*=".mp4"]').attr('href');
            if (downloadLink) {
                const videoResponse = await axios.get(downloadLink, { responseType: 'arraybuffer' });
                return videoResponse.data;
            }
        } catch (error) {
            console.log('snaptik.app failed:', error.message);
        }
    }

    throw new Error('Failed to download video');
}

module.exports = { downloadVideo };