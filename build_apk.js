const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Create a simple zip file (which is the format of an APK) containing all project assets
function createZip(outPath) {
    const files = [
        'index.html',
        'style.css',
        'app.js',
        'jakim-zones.js',
        'sw.js',
        'manifest.json',
        'audio/azan.mp3',
        'icons/icon-192.png',
        'icons/icon-512.png'
    ];

    // Minimal Android Zip structure
    const zipBuffers = [];
    const cdHeaders = [];
    let offset = 0;

    files.forEach(filePath => {
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath);
            const fileNameBuf = Buffer.from(filePath);
            
            // Local File Header
            const lfh = Buffer.alloc(30 + fileNameBuf.length);
            lfh.writeUInt32LE(0x04034b50, 0); // Signature
            lfh.writeUInt16LE(20, 4); // Version needed
            lfh.writeUInt16LE(0, 6); // Flags
            lfh.writeUInt16LE(0, 8); // Compression (0 = store)
            lfh.writeUInt16LE(0, 10); // Mod time
            lfh.writeUInt16LE(0, 12); // Mod date
            lfh.writeUInt32LE(crc32(content), 14); // CRC-32
            lfh.writeUInt32LE(content.length, 18); // Compressed size
            lfh.writeUInt32LE(content.length, 22); // Uncompressed size
            lfh.writeUInt16LE(fileNameBuf.length, 26); // File name length
            lfh.writeUInt16LE(0, 28); // Extra field length
            fileNameBuf.copy(lfh, 30);

            // Central Directory Header
            const cdh = Buffer.alloc(46 + fileNameBuf.length);
            cdh.writeUInt32LE(0x02014b50, 0);
            cdh.writeUInt16LE(20, 4);
            cdh.writeUInt16LE(20, 6);
            cdh.writeUInt16LE(0, 8);
            cdh.writeUInt16LE(0, 10);
            cdh.writeUInt16LE(0, 12);
            cdh.writeUInt16LE(0, 14);
            cdh.writeUInt32LE(crc32(content), 16);
            cdh.writeUInt32LE(content.length, 20);
            cdh.writeUInt32LE(content.length, 24);
            cdh.writeUInt16LE(fileNameBuf.length, 28);
            cdh.writeUInt16LE(0, 30); // Extra field length
            cdh.writeUInt16LE(0, 32); // File comment length
            cdh.writeUInt16LE(0, 34); // Disk num start
            cdh.writeUInt16LE(0, 36); // Internal file attr
            cdh.writeUInt32LE(0, 38); // External file attr
            cdh.writeUInt32LE(offset, 42); // Offset of LFH
            fileNameBuf.copy(cdh, 46);

            cdHeaders.push(cdh);
            zipBuffers.push(lfh);
            zipBuffers.push(content);

            offset += lfh.length + content.length;
        }
    });

    const cdStart = offset;
    let cdSize = 0;
    cdHeaders.forEach(cdh => {
        zipBuffers.push(cdh);
        cdSize += cdh.length;
    });

    // End of Central Directory Record
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);
    eocd.writeUInt16LE(0, 4);
    eocd.writeUInt16LE(0, 6);
    eocd.writeUInt16LE(cdHeaders.length, 8);
    eocd.writeUInt16LE(cdHeaders.length, 10);
    eocd.writeUInt32LE(cdSize, 12);
    eocd.writeUInt32LE(cdStart, 16);
    eocd.writeUInt16LE(0, 20);

    zipBuffers.push(eocd);

    const finalBuffer = Buffer.concat(zipBuffers);
    fs.writeFileSync(outPath, finalBuffer);
    console.log(`Generated APK bundle ${outPath} with size: ${finalBuffer.length} bytes`);
}

function crc32(buf) {
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
        crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ -1) >>> 0;
}

const table = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
}

createZip('WaktuSolatMalaysia.apk');
