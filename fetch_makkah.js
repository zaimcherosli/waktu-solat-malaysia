const fs = require('fs');
const http = require('http');
const https = require('https');

const candidateUrls = [
    "https://raw.githubusercontent.com/zubir2k/HomeAssistantAdzan/master/media/azan.mp3",
    "https://raw.githubusercontent.com/zubir2k/HomeAssistantAdzan/master/media/subuh.mp3",
    "https://raw.githubusercontent.com/AalianKhan/adhans/main/makkah.mp3",
    "https://raw.githubusercontent.com/AalianKhan/adhans/master/makkah.mp3",
    "https://raw.githubusercontent.com/msanaullahsahar/adhan/master/azan.mp3"
];

function download(urlIndex) {
    if (urlIndex >= candidateUrls.length) {
        console.log("All URLs exhausted");
        return;
    }

    const targetUrl = candidateUrls[urlIndex];
    console.log("Fetching URL:", targetUrl);
    const client = targetUrl.startsWith('https') ? https : http;

    const req = client.get(targetUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
    }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
            console.log("Redirected to:", res.headers.location);
            return downloadUrlDirect(res.headers.location, urlIndex);
        }

        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => {
            const buffer = Buffer.concat(chunks);
            console.log("Status:", res.statusCode, "Size:", buffer.length);
            const strHead = buffer.slice(0, 50).toString('utf8');
            if (buffer.length > 50000 && !strHead.includes('<html') && !strHead.includes('<!DOCTYPE')) {
                fs.writeFileSync('audio/azan.mp3', buffer);
                console.log("SUCCESSFULLY SAVED AUTHENTIC AZAN MP3! Buffer size:", buffer.length);
            } else {
                console.log("Not a valid MP3 file or too small.");
                download(urlIndex + 1);
            }
        });
    });

    req.on('error', (err) => {
        console.log("Request error:", err.message);
        download(urlIndex + 1);
    });
}

function downloadUrlDirect(redirectUrl, urlIndex) {
    const client = redirectUrl.startsWith('https') ? https : http;
    client.get(redirectUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
    }, (res) => {
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => {
            const buffer = Buffer.concat(chunks);
            console.log("Redirect Status:", res.statusCode, "Size:", buffer.length);
            const strHead = buffer.slice(0, 50).toString('utf8');
            if (buffer.length > 50000 && !strHead.includes('<html') && !strHead.includes('<!DOCTYPE')) {
                fs.writeFileSync('audio/azan.mp3', buffer);
                console.log("SUCCESSFULLY SAVED AUTHENTIC AZAN MP3 AFTER REDIRECT! Buffer size:", buffer.length);
            } else {
                download(urlIndex + 1);
            }
        });
    });
}

download(0);
