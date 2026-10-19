import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createCRC32Table() {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  return table;
}

const crcTable = createCRC32Table();
function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(12 + len);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const typeAndData = buf.subarray(4, 8 + len);
  const crc = crc32(typeAndData);
  buf.writeUInt32BE(crc, 8 + len);
  return buf;
}

function generatePng(size, isMaskable = false) {
  const width = size;
  const height = size;
  const rawData = Buffer.alloc(height * (1 + width * 4));

  // Deep dark emerald-obsidian tile background
  const bgTopR = 12, bgTopG = 22, bgTopB = 16;     // #0c1610
  const bgBotR = 7,  bgBotG = 14, bgBotB = 10;     // #070e0a

  // Lime stroke / border
  const limeR = 132, limeG = 204, limeB = 22;      // #84cc16
  const limeLightR = 163, limeLightG = 230, limeLightB = 53; // #a3e635

  const cornerRadius = isMaskable ? 0 : Math.floor(size * 0.22);
  const borderWidth = Math.max(1, Math.floor(size * 0.025));

  const padX = isMaskable ? Math.floor(size * 0.16) : Math.floor(size * 0.10);
  const padY = isMaskable ? Math.floor(size * 0.16) : Math.floor(size * 0.10);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4);
    rawData[rowOffset] = 0; // Filter byte: 0 (None)

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      // Rounded rectangle distance check
      let inBox = true;
      let distToEdge = 9999;
      if (cornerRadius > 0) {
        const dx = Math.max(0, cornerRadius - x, x - (width - 1 - cornerRadius));
        const dy = Math.max(0, cornerRadius - y, y - (height - 1 - cornerRadius));
        const distSq = dx * dx + dy * dy;
        if (distSq > cornerRadius * cornerRadius) {
          inBox = false;
        } else {
          distToEdge = cornerRadius - Math.sqrt(distSq);
        }
      } else {
        distToEdge = Math.min(x, width - 1 - x, y, height - 1 - y);
      }

      if (!inBox) {
        // Transparent outside
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
        continue;
      }

      // Base background gradient
      const factor = y / height;
      let r = Math.round(bgTopR + (bgBotR - bgTopR) * factor);
      let g = Math.round(bgTopG + (bgBotG - bgTopG) * factor);
      let b = Math.round(bgTopB + (bgBotB - bgTopB) * factor);
      let a = 255;

      // Subtle lime inner border highlight
      if (distToEdge <= borderWidth) {
        const alpha = Math.min(1, distToEdge / borderWidth);
        r = Math.round(r * (1 - alpha * 0.6) + limeR * (alpha * 0.6));
        g = Math.round(g * (1 - alpha * 0.6) + limeG * (alpha * 0.6));
        b = Math.round(b * (1 - alpha * 0.6) + limeB * (alpha * 0.6));
      }

      // Safe area for "LW" monogram
      const safeLeft = padX + (size - padX * 2) * 0.10;
      const safeRight = size - safeLeft;
      const safeTop = padY + (size - padY * 2) * 0.16;
      const safeBottom = size - (padY + (size - padY * 2) * 0.16);
      const safeW = safeRight - safeLeft;
      const safeH = safeBottom - safeTop;

      if (x >= safeLeft && x <= safeRight && y >= safeTop && y <= safeBottom) {
        const nx = (x - safeLeft) / safeW;
        const ny = (y - safeTop) / safeH;

        let isLW = false;

        // 1. Draw "L" (Left character, nx approx 0.04 to 0.38)
        // Vertical stem of L
        if (nx >= 0.04 && nx <= 0.18 && ny >= 0.02 && ny <= 0.98) {
          isLW = true;
        }
        // Horizontal base of L
        if (nx >= 0.04 && nx <= 0.38 && ny >= 0.80 && ny <= 0.98) {
          isLW = true;
        }

        // 2. Draw "W" (Right character, nx approx 0.42 to 0.96)
        if (nx >= 0.40 && nx <= 0.98 && ny >= 0.02 && ny <= 0.98) {
          const wThick = 0.065;
          // Stroke 1: (0.43, 0.04) -> (0.56, 0.98)
          const x1 = 0.43 + ny * 0.13;
          if (Math.abs(nx - x1) < wThick) isLW = true;

          // Stroke 2: (0.56, 0.98) -> (0.69, 0.18)
          if (ny >= 0.16) {
            const x2 = 0.69 - (1 - ny) * (0.13 / 0.82);
            if (Math.abs(nx - x2) < wThick) isLW = true;
          }

          // Stroke 3: (0.69, 0.18) -> (0.82, 0.98)
          if (ny >= 0.16) {
            const x3 = 0.69 + (ny - 0.18) * (0.13 / 0.82);
            if (Math.abs(nx - x3) < wThick) isLW = true;
          }

          // Stroke 4: (0.82, 0.98) -> (0.95, 0.04)
          const x4 = 0.95 - ny * 0.13;
          if (Math.abs(nx - x4) < wThick) isLW = true;
        }

        if (isLW) {
          // Vibrant Lime gradient for the monogram
          r = Math.round(limeLightR + (limeR - limeLightR) * ny);
          g = Math.round(limeLightG + (limeG - limeLightG) * ny);
          b = Math.round(limeLightB + (limeB - limeLightB) * ny);
        }
      }

      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  // PNG Signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // IDAT
  const compressed = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Helper to build a multi-resolution Windows .ico file containing PNG buffers
function createIco(images) {
  // images is array of { size, pngBuffer }
  const count = images.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: 1 for icon
  header.writeUInt16LE(count, 4); // count

  let currentOffset = 6 + count * 16;
  const dirEntries = [];
  const imageBuffers = [];

  for (const img of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(img.size >= 256 ? 0 : img.size, 0); // width (0 = 256)
    entry.writeUInt8(img.size >= 256 ? 0 : img.size, 1); // height (0 = 256)
    entry.writeUInt8(0, 2); // palette
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(img.pngBuffer.length, 8); // size
    entry.writeUInt32LE(currentOffset, 12); // offset
    dirEntries.push(entry);
    imageBuffers.push(img.pngBuffer);
    currentOffset += img.pngBuffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...imageBuffers]);
}

const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

const buildDir = path.resolve('build');
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

const png512 = generatePng(512, false);
const png256 = generatePng(256, false);
const png192 = generatePng(192, false);
const png180 = generatePng(180, false);
const png128 = generatePng(128, false);
const png64 = generatePng(64, false);
const png48 = generatePng(48, false);
const png32 = generatePng(32, false);
const png16 = generatePng(16, false);
const maskable512 = generatePng(512, true);

// Generate all standard PWA and browser icons with LW Lime branding
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), maskable512);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), png180);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), createIco([
  { size: 64, pngBuffer: png64 },
  { size: 32, pngBuffer: png32 },
  { size: 16, pngBuffer: png16 }
]));

// Generate desktop Electron icons in build/
fs.writeFileSync(path.join(buildDir, 'icon.png'), png512);
fs.writeFileSync(path.join(buildDir, 'icon.ico'), createIco([
  { size: 256, pngBuffer: png256 },
  { size: 128, pngBuffer: png128 },
  { size: 64, pngBuffer: png64 },
  { size: 48, pngBuffer: png48 },
  { size: 32, pngBuffer: png32 },
  { size: 16, pngBuffer: png16 }
]));

console.log('Successfully generated all LW Lime PWA, Favicon, and Windows Desktop ICO/PNG icons!');
