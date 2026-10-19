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

// Point in polygon test using ray-casting
function isPointInPolygon(px, py, vertices) {
  let inside = false;
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i][0], yi = vertices[i][1];
    const xj = vertices[j][0], yj = vertices[j][1];

    const intersect = ((yi > py) !== (yj > py)) &&
      (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Sample points along curved left edge from (0.316, 0.895) to (0.208, 0.105) through (0.295, 0.420)
function getLeftCurvePoints(steps = 20) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const inv = 1 - t;
    const x = inv * inv * 0.316 + 2 * inv * t * 0.280 + t * t * 0.208;
    const y = inv * inv * 0.895 + 2 * inv * t * 0.450 + t * t * 0.105;
    pts.push([x, y]);
  }
  return pts;
}

const leftCurve = getLeftCurvePoints(25);

// Polygon 1: Main left green wing / bookmark
const polyLeft = [
  [0.208, 0.105],
  [0.492, 0.120],
  [0.512, 0.465],
  [0.665, 0.635],
  [0.790, 0.825],
  [0.530, 0.670],
  ...leftCurve.reverse()
];

// Polygon 2: Center green book flap / door
const polyCenter = [
  [0.512, 0.131],
  [0.643, 0.150],
  [0.663, 0.615],
  [0.528, 0.470]
];

// Polygon 3: Right spine section
const polyRight = [
  [0.568, 0.129],
  [0.728, 0.129],
  [0.714, 0.634],
  [0.675, 0.634],
  [0.662, 0.150]
];

// Spine accent slot: thin rounded cutout bar
function isInsideSpineSlot(x, y) {
  return (x >= 0.690 && x <= 0.704 && y >= 0.160 && y <= 0.570);
}

// Generates a PNG with transparent background
function generateLiimeLogoPng(size) {
  const width = size;
  const height = size;
  const rawData = Buffer.alloc(height * (1 + width * 4));

  const greenR = 14, greenG = 168, greenB = 40;
  const spineR = 215, spineG = 225, spineB = 220;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4);
    rawData[rowOffset] = 0;

    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;

      let greenCover = 0;
      let spineCover = 0;

      for (let sy = 0; sy < 2; sy++) {
        for (let sx = 0; sx < 2; sx++) {
          const nx = (x + (sx + 0.5) / 2) / width;
          const ny = (y + (sy + 0.5) / 2) / height;

          if (isInsideSpineSlot(nx, ny)) {
            spineCover += 0.25;
          } else if (
            isPointInPolygon(nx, ny, polyLeft) ||
            isPointInPolygon(nx, ny, polyCenter) ||
            isPointInPolygon(nx, ny, polyRight)
          ) {
            greenCover += 0.25;
          }
        }
      }

      if (greenCover === 0 && spineCover === 0) {
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
      } else if (spineCover > 0) {
        rawData[pxOffset] = spineR;
        rawData[pxOffset + 1] = spineG;
        rawData[pxOffset + 2] = spineB;
        rawData[pxOffset + 3] = Math.round(spineCover * 255);
      } else {
        rawData[pxOffset] = greenR;
        rawData[pxOffset + 1] = greenG;
        rawData[pxOffset + 2] = greenB;
        rawData[pxOffset + 3] = Math.round(greenCover * 255);
      }
    }
  }

  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  const compressed = zlib.deflateSync(rawData, { level: 9 });
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Multi-resolution ICO builder
function createIco(images) {
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
    entry.writeUInt8(img.size >= 256 ? 0 : img.size, 0);
    entry.writeUInt8(img.size >= 256 ? 0 : img.size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(img.pngBuffer.length, 8);
    entry.writeUInt32LE(currentOffset, 12);
    dirEntries.push(entry);
    imageBuffers.push(img.pngBuffer);
    currentOffset += img.pngBuffer.length;
  }

  return Buffer.concat([header, ...dirEntries, ...imageBuffers]);
}

// Standard 24-bit Windows DIB Bitmap generator (.bmp) for NSIS installer wizard
function createBmp24(width, height, getPixelRGB) {
  const rowSize = Math.floor((width * 3 + 3) / 4) * 4;
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;

  const buf = Buffer.alloc(fileSize);

  // Bitmap File Header (14 bytes)
  buf.write('BM', 0, 2, 'ascii');
  buf.writeUInt32LE(fileSize, 2);
  buf.writeUInt32LE(0, 6);
  buf.writeUInt32LE(54, 10);

  // DIB Header (BITMAPINFOHEADER - 40 bytes)
  buf.writeUInt32LE(40, 14);
  buf.writeInt32LE(width, 18);
  buf.writeInt32LE(height, 22); // positive = bottom-up
  buf.writeUInt16LE(1, 26);
  buf.writeUInt16LE(24, 28);
  buf.writeUInt32LE(0, 30);
  buf.writeUInt32LE(pixelArraySize, 34);
  buf.writeInt32LE(2835, 38);
  buf.writeInt32LE(2835, 42);
  buf.writeUInt32LE(0, 46);
  buf.writeUInt32LE(0, 50);

  for (let y = 0; y < height; y++) {
    // py = 0 is top of image, py = height-1 is bottom
    const py = (height - 1) - y;
    const rowOffset = 54 + y * rowSize;
    for (let x = 0; x < width; x++) {
      const [r, g, b] = getPixelRGB(x, py);
      const px = rowOffset + x * 3;
      buf[px] = Math.min(255, Math.max(0, Math.round(b)));
      buf[px + 1] = Math.min(255, Math.max(0, Math.round(g)));
      buf[px + 2] = Math.min(255, Math.max(0, Math.round(r)));
    }
  }

  return buf;
}

// 5x7 Pixel Font Table for Clean Bitmap Text Rendering in NSIS Wizard
const font5x7 = {
  'L': [0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b11111],
  'I': [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b11111],
  'M': [0b10001, 0b11011, 0b10101, 0b10001, 0b10001, 0b10001, 0b10001],
  'E': [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b11111],
  'W': [0b10001, 0b10001, 0b10001, 0b10101, 0b10101, 0b11011, 0b10001],
  'O': [0b01110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  'R': [0b11110, 0b10001, 0b10001, 0b11110, 0b10100, 0b10010, 0b10001],
  'D': [0b11110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b11110],
  'S': [0b01111, 0b10000, 0b10000, 0b01110, 0b00001, 0b00001, 0b11110],
  'T': [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100],
  'U': [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  'B': [0b11110, 0b10001, 0b10001, 0b11110, 0b10001, 0b10001, 0b11110],
  'Y': [0b10001, 0b10001, 0b01010, 0b00100, 0b00100, 0b00100, 0b00100],
  ' ': [0, 0, 0, 0, 0, 0, 0],
};

function renderTextToGrid(text, startX, startY, scale, grid) {
  let cx = startX;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i].toUpperCase();
    const rows = font5x7[ch] || font5x7[' '];
    for (let r = 0; r < 7; r++) {
      const bitRow = rows[r];
      for (let c = 0; c < 5; c++) {
        if ((bitRow >> (4 - c)) & 1) {
          for (let dy = 0; dy < scale; dy++) {
            for (let dx = 0; dx < scale; dx++) {
              grid.set(`${cx + c * scale + dx},${startY + r * scale + dy}`, true);
            }
          }
        }
      }
    }
    cx += 6 * scale; // 5 + 1 spacing
  }
}

// Generate NSIS Installer Sidebar (164 x 314 BMP) with LIIME Studio branding
function generateInstallerSidebarBmp(isUninstaller = false) {
  const width = 164;
  const height = 314;
  const textGrid = new Map();

  // Draw "LIIME WORDS" centered at y = 184 (scale 2 => 11 chars * 12 = 132px, left = 16)
  renderTextToGrid('LIIME WORDS', 16, 184, 2, textGrid);
  // Draw "STUDIO WRITER" centered at y = 208 (scale 1 => 13 chars * 6 = 78px, left = 43)
  renderTextToGrid(isUninstaller ? 'UNINSTALL' : 'STUDIO WRITER', isUninstaller ? 55 : 43, 208, 1, textGrid);
  // Draw "BY LIIME" at y = 224
  renderTextToGrid('BY LIIME', 58, 224, 1, textGrid);

  // Logo Bounding Box: 90x90 centered horizontally at left 37, top 68
  const logoLeft = 37;
  const logoTop = 68;
  const logoSize = 90;

  return createBmp24(width, height, (x, y) => {
    // 1. Check if on text pixel
    if (textGrid.has(`${x},${y}`)) {
      if (y >= 184 && y < 200) {
        return [255, 255, 255]; // Crisp white for "LIIME WORDS"
      } else {
        return [134, 239, 172]; // Mint accent for subtext
      }
    }

    // 2. Check if inside logo box
    if (x >= logoLeft && x < logoLeft + logoSize && y >= logoTop && y < logoTop + logoSize) {
      const nx = (x - logoLeft) / logoSize;
      const ny = (y - logoTop) / logoSize;

      if (isInsideSpineSlot(nx, ny)) {
        return [225, 235, 230];
      }
      if (
        isPointInPolygon(nx, ny, polyLeft) ||
        isPointInPolygon(nx, ny, polyCenter) ||
        isPointInPolygon(nx, ny, polyRight)
      ) {
        return [14, 168, 40]; // LIIME Emerald Green
      }
    }

    // 3. Green decorative divider line under logo
    if (y === 168 && x >= 32 && x <= 132) {
      return [16, 185, 129];
    }
    if ((y === 167 || y === 169) && x >= 36 && x <= 128) {
      return [6, 78, 59];
    }

    // 4. Studio Dark Gradient Background (#0a160f to #030805)
    const factor = y / height;
    const r = Math.round(10 * (1 - factor) + 3 * factor);
    const g = Math.round(24 * (1 - factor) + 7 * factor);
    const b = Math.round(15 * (1 - factor) + 5 * factor);

    // Subtle radial green glow behind logo
    const dx = x - (logoLeft + logoSize / 2);
    const dy = y - (logoTop + logoSize / 2);
    const distSq = dx * dx + dy * dy;
    if (distSq < 55 * 55) {
      const glow = Math.max(0, 1 - Math.sqrt(distSq) / 55) * 0.22;
      return [
        Math.round(r * (1 - glow) + 14 * glow),
        Math.round(g * (1 - glow) + 168 * glow),
        Math.round(b * (1 - glow) + 40 * glow),
      ];
    }

    // Right 1px subtle divider
    if (x === width - 1) {
      return [24, 45, 32];
    }

    return [r, g, b];
  });
}

// Generate NSIS Installer Header Bitmap (150 x 57 BMP) on Pure White Background
function generateInstallerHeaderBmp() {
  const width = 150;
  const height = 57;

  // Header has white background. LIIME logo placed at right side: left=98, top=6, size=45
  const logoLeft = 98;
  const logoTop = 6;
  const logoSize = 45;

  return createBmp24(width, height, (x, y) => {
    if (x >= logoLeft && x < logoLeft + logoSize && y >= logoTop && y < logoTop + logoSize) {
      const nx = (x - logoLeft) / logoSize;
      const ny = (y - logoTop) / logoSize;

      if (isInsideSpineSlot(nx, ny)) {
        return [190, 205, 198];
      }
      if (
        isPointInPolygon(nx, ny, polyLeft) ||
        isPointInPolygon(nx, ny, polyCenter) ||
        isPointInPolygon(nx, ny, polyRight)
      ) {
        return [14, 168, 40]; // LIIME Emerald Green
      }
    }
    // Seamless white for NSIS modern header
    return [255, 255, 255];
  });
}

// Generate crisp SVG
function generateSvg() {
  const pathLeftD = polyLeft.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt[0] * 1000} ${pt[1] * 1000}`).join(' ') + ' Z';
  const pathCenterD = polyCenter.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt[0] * 1000} ${pt[1] * 1000}`).join(' ') + ' Z';
  const pathRightD = polyRight.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt[0] * 1000} ${pt[1] * 1000}`).join(' ') + ' Z';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" fill="none">
  <!-- Left Wing / Book Shape -->
  <path d="${pathLeftD}" fill="#0ea828" />
  <!-- Center Flap / Page -->
  <path d="${pathCenterD}" fill="#0ea828" />
  <!-- Right Spine Back Cover -->
  <path d="${pathRightD}" fill="#0ea828" />
  <!-- Spine Cutout Slot Accent -->
  <rect x="690" y="160" width="14" height="410" rx="4" fill="#d7deda" />
</svg>`;
}

const publicDir = path.resolve('public');
const buildDir = path.resolve('build');

if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });

// 1. Generate 64x64 PNG with NO BACKGROUND (transparent) as requested
const png64 = generateLiimeLogoPng(64);
fs.writeFileSync(path.join(publicDir, 'logo-64.png'), png64);
fs.writeFileSync(path.join(buildDir, 'logo-64.png'), png64);
fs.writeFileSync(path.join(buildDir, 'icon-64.png'), png64);

// 2. Generate other resolutions for desktop icon and web
const png512 = generateLiimeLogoPng(512);
const png256 = generateLiimeLogoPng(256);
const png192 = generateLiimeLogoPng(192);
const png128 = generateLiimeLogoPng(128);
const png48 = generateLiimeLogoPng(48);
const png32 = generateLiimeLogoPng(32);
const png16 = generateLiimeLogoPng(16);

// Multi-resolution ICO (256, 128, 64, 48, 32, 16) with transparent background
const ico = createIco([
  { size: 256, pngBuffer: png256 },
  { size: 128, pngBuffer: png128 },
  { size: 64, pngBuffer: png64 },
  { size: 48, pngBuffer: png48 },
  { size: 32, pngBuffer: png32 },
  { size: 16, pngBuffer: png16 }
]);

// Write Windows icon files
fs.writeFileSync(path.join(buildDir, 'icon.ico'), ico);
fs.writeFileSync(path.join(buildDir, 'icon.png'), png512);
fs.writeFileSync(path.join(buildDir, 'installerIcon.ico'), ico);
fs.writeFileSync(path.join(buildDir, 'uninstallerIcon.ico'), ico);
fs.writeFileSync(path.join(buildDir, 'installerHeaderIcon.ico'), ico);

// Write NSIS installer wizard bitmaps with LIIME App Logo (replaces Electron logo completely)
const installerSidebarBmp = generateInstallerSidebarBmp(false);
const uninstallerSidebarBmp = generateInstallerSidebarBmp(true);
const installerHeaderBmp = generateInstallerHeaderBmp();

fs.writeFileSync(path.join(buildDir, 'installerSidebar.bmp'), installerSidebarBmp);
fs.writeFileSync(path.join(buildDir, 'uninstallerSidebar.bmp'), uninstallerSidebarBmp);
fs.writeFileSync(path.join(buildDir, 'installerHeader.bmp'), installerHeaderBmp);

// Web & PWA assets
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), ico);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), png192);
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), png512);

// SVG version
fs.writeFileSync(path.join(publicDir, 'icon.svg'), generateSvg());
fs.writeFileSync(path.join(buildDir, 'icon.svg'), generateSvg());

console.log('✓ Successfully generated LIIME transparent logo, Windows setup BMPs, and desktop icon suite!');
