const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  chunk.writeUInt32BE(crc32(typeAndData), 8 + len);
  return chunk;
}

function createPng(width, height, renderPixel) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // compression (deflate)
  ihdrData[11] = 0; // filter (standard)
  ihdrData[12] = 0; // interlace (none)
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Scanlines with filter byte 0
  const scanlines = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;

  for (let y = 0; y < height; y++) {
    scanlines[offset++] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = renderPixel(x, y, width, height);
      scanlines[offset++] = r;
      scanlines[offset++] = g;
      scanlines[offset++] = b;
      scanlines[offset++] = a;
    }
  }

  const idatData = zlib.deflateSync(scanlines, { level: 9 });
  const idatChunk = makeChunk('IDAT', idatData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function renderIcon(x, y, w, h) {
  // Normalized coords [0, 1]
  const nx = (x + 0.5) / w;
  const ny = (y + 0.5) / h;

  // Squircle background with rounded corners
  const cx = 0.5;
  const cy = 0.5;
  const radius = 0.44;
  const cornerR = 0.22;
  
  // Box distance
  const dx = Math.max(0, Math.abs(nx - cx) - (radius - cornerR));
  const dy = Math.max(0, Math.abs(ny - cy) - (radius - cornerR));
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > cornerR) {
    return [0, 0, 0, 0]; // Transparent outside squircle
  }

  // Smooth anti-aliased edge
  const edgeAlpha = Math.min(1, Math.max(0, (cornerR - dist) * w));

  // Background gradient: Vibrant Royal Blue to Deep Indigo (#2563eb to #1e40af)
  const gradT = ny;
  let bgR = Math.round(37 + (30 - 37) * gradT);
  let bgG = Math.round(99 + (64 - 99) * gradT);
  let bgB = Math.round(235 + (175 - 235) * gradT);

  // Folder & Arrow glyph drawing
  let glyphAlpha = 0;

  // Folder shape:
  // Folder tab: nx: 0.24 to 0.48, ny: 0.26 to 0.34
  // Folder body: nx: 0.22 to 0.78, ny: 0.32 to 0.76
  const inTab = (nx >= 0.25 && nx <= 0.48 && ny >= 0.24 && ny <= 0.34);
  const inBody = (nx >= 0.22 && nx <= 0.78 && ny >= 0.32 && ny <= 0.74);

  // Downward arrow in center:
  // Arrow stem: nx: 0.46 to 0.54, ny: 0.38 to 0.58
  const inStem = (nx >= 0.46 && nx <= 0.54 && ny >= 0.38 && ny <= 0.56);
  // Arrow head (triangle pointing down):
  // tip at (0.50, 0.68), base at ny: 0.56, nx from 0.36 to 0.64
  const inArrowHead = (ny >= 0.54 && ny <= 0.68 && Math.abs(nx - 0.5) <= (0.68 - ny) * 1.0);

  // Folder outline or highlight
  const folderBorder = (
    ((nx >= 0.22 && nx <= 0.78) && (Math.abs(ny - 0.74) <= 0.04 || Math.abs(ny - 0.32) <= 0.03)) ||
    ((ny >= 0.32 && ny <= 0.74) && (Math.abs(nx - 0.22) <= 0.035 || Math.abs(nx - 0.78) <= 0.035))
  );

  if (inStem || inArrowHead) {
    glyphAlpha = 1.0; // Crisp white arrow
  } else if (folderBorder || inTab) {
    glyphAlpha = 0.55; // Semi-transparent folder contour
  }

  // Blend glyph over background
  const finalR = Math.round(bgR * (1 - glyphAlpha) + 255 * glyphAlpha);
  const finalG = Math.round(bgG * (1 - glyphAlpha) + 255 * glyphAlpha);
  const finalB = Math.round(bgB * (1 - glyphAlpha) + 255 * glyphAlpha);
  const finalA = Math.round(edgeAlpha * 255);

  return [finalR, finalG, finalB, finalA];
}

const sizes = [16, 32, 48, 128];
const iconsDir = path.join(__dirname, 'icons');

for (const size of sizes) {
  const buf = createPng(size, size, renderIcon);
  const filePath = path.join(iconsDir, `icon-${size}.png`);
  fs.writeFileSync(filePath, buf);
  console.log(`Generated ${filePath} (${buf.length} bytes)`);
}
