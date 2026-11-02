// =====================================================================
//  DUNGEON BREAK — scripts/generate_sanctum_assets.js
//  Generates Master Pixel-Art PNG Textures for Developer Sanctum
//  Outputs to assets/ui/sanctum/
// =====================================================================

import zlib from 'zlib';
import fs from 'fs';
import path from 'path';

function createPNG(w, h, rgbaBuffer) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type);
    const body = Buffer.concat([typeBuf, data]);
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < body.length; i++) {
      crc = (crc >>> 8) ^ crcTable[(crc ^ body[i]) & 0xFF];
    }
    crc = (crc ^ 0xFFFFFFFF) >>> 0;
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc, 0);
    return Buffer.concat([len, body, crcBuf]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const scanlineLen = w * 4 + 1;
  const rawData = Buffer.alloc(h * scanlineLen);
  for (let y = 0; y < h; y++) {
    rawData[y * scanlineLen] = 0;
    rgbaBuffer.copy(rawData, y * scanlineLen + 1, y * w * 4, (y + 1) * w * 4);
  }

  const idat = zlib.deflateSync(rawData, { level: 9 });
  const iend = Buffer.alloc(0);

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', iend)
  ]);
}

class PixelCanvas {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.buf = Buffer.alloc(w * h * 4, 0);
  }

  setPixel(x, y, r, g, b, a = 255) {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || x >= this.w || y < 0 || y >= this.h) return;
    const idx = (y * this.w + x) * 4;
    if (a >= 255) {
      this.buf[idx] = r;
      this.buf[idx + 1] = g;
      this.buf[idx + 2] = b;
      this.buf[idx + 3] = 255;
    } else {
      const alpha = a / 255;
      const invAlpha = 1 - alpha;
      this.buf[idx] = Math.round(r * alpha + this.buf[idx] * invAlpha);
      this.buf[idx + 1] = Math.round(g * alpha + this.buf[idx + 1] * invAlpha);
      this.buf[idx + 2] = Math.round(b * alpha + this.buf[idx + 2] * invAlpha);
      this.buf[idx + 3] = Math.min(255, Math.round(this.buf[idx + 3] + a));
    }
  }

  fillRect(rx, ry, rw, rh, r, g, b, a = 255) {
    rx = Math.max(0, Math.round(rx));
    ry = Math.max(0, Math.round(ry));
    const ex = Math.min(this.w, rx + Math.round(rw));
    const ey = Math.min(this.h, ry + Math.round(rh));
    for (let y = ry; y < ey; y++) {
      for (let x = rx; x < ex; x++) {
        this.setPixel(x, y, r, g, b, a);
      }
    }
  }

  drawChamferBox(rx, ry, rw, rh, c, fill, stroke) {
    for (let y = ry; y < ry + rh; y++) {
      for (let x = rx; x < rx + rw; x++) {
        const dxL = x - rx, dxR = (rx + rw - 1) - x;
        const dyT = y - ry, dyB = (ry + rh - 1) - y;
        // Check 4 chamfers
        if ((dxL < c && dyT < c && (dxL + dyT) < c) ||
            (dxR < c && dyT < c && (dxR + dyT) < c) ||
            (dxL < c && dyB < c && (dxL + dyB) < c) ||
            (dxR < c && dyB < c && (dxR + dyB) < c)) {
          continue;
        }
        if (fill) this.setPixel(x, y, fill[0], fill[1], fill[2], fill[3] ?? 255);
      }
    }
    if (stroke) {
      // Stroke outer boundary
      for (let y = ry; y < ry + rh; y++) {
        for (let x = rx; x < rx + rw; x++) {
          const dxL = x - rx, dxR = (rx + rw - 1) - x;
          const dyT = y - ry, dyB = (ry + rh - 1) - y;
          const isCornerCut = (dxL < c && dyT < c && (dxL + dyT) < c) ||
                              (dxR < c && dyT < c && (dxR + dyT) < c) ||
                              (dxL < c && dyB < c && (dxL + dyB) < c) ||
                              (dxR < c && dyB < c && (dxR + dyB) < c);
          if (isCornerCut) continue;

          // Check if on boundary
          const isEdge = (x === rx || x === rx + rw - 1 || y === ry || y === ry + rh - 1 ||
                         (dxL < c && dyT < c && (dxL + dyT) === c) ||
                         (dxR < c && dyT < c && (dxR + dyT) === c) ||
                         (dxL < c && dyB < c && (dxL + dyB) === c) ||
                         (dxR < c && dyB < c && (dxR + dyB) === c));
          if (isEdge) {
            this.setPixel(x, y, stroke[0], stroke[1], stroke[2], stroke[3] ?? 255);
          }
        }
      }
    }
  }

  toPNG() {
    return createPNG(this.w, this.h, this.buf);
  }
}

// ─────────────────────────────────────────────────────────────────────
// 1. BASALT WALL PATTERN (256x256 Seamless)
// ─────────────────────────────────────────────────────────────────────
function generateBasaltWall() {
  const pc = new PixelCanvas(256, 256);
  pc.fillRect(0, 0, 256, 256, 13, 10, 24, 255);

  const courses = [
    { y: 0, h: 52, blocks: [68, 116, 72] },
    { y: 52, h: 48, blocks: [128, 80, 48] },
    { y: 100, h: 60, blocks: [56, 140, 60] },
    { y: 160, h: 50, blocks: [100, 96, 60] },
    { y: 210, h: 46, blocks: [84, 116, 56] }
  ];

  const shades = [
    [24, 18, 42],
    [18, 14, 34],
    [30, 22, 52],
    [16, 12, 30],
    [26, 20, 46]
  ];

  let shadeIdx = 0;
  for (const c of courses) {
    let curX = 0;
    for (const bw of c.blocks) {
      const s = shades[shadeIdx % shades.length];
      shadeIdx++;
      pc.fillRect(curX, c.y, bw, c.h, s[0], s[1], s[2], 255);

      for (let sy = c.y + 6; sy < c.y + c.h - 6; sy += 8) {
        const lineLen = Math.floor(bw * 0.6);
        const startX = curX + 4 + ((sy * 17) % Math.max(1, bw - lineLen - 8));
        pc.fillRect(startX, sy, lineLen, 1, 168, 85, 247, 24);
      }

      const gx = curX + ((c.y * 31) % (bw - 6)) + 3;
      const gy = c.y + ((curX * 47) % (c.h - 6)) + 3;
      pc.fillRect(gx, gy, 2, 1, 253, 230, 138, 70);

      if (curX > 0) {
        pc.fillRect(curX - 1, c.y, 2, c.h, 4, 2, 8, 255);
        pc.fillRect(curX + 1, c.y, 1, c.h, 168, 85, 247, 26);
      }

      curX += bw;
    }

    if (c.y > 0) {
      pc.fillRect(0, c.y - 1, 256, 2, 4, 2, 8, 255);
      pc.fillRect(0, c.y + 1, 256, 1, 168, 85, 247, 34);
    }
  }

  pc.fillRect(0, 0, 1, 256, 4, 2, 8, 180);
  pc.fillRect(255, 0, 1, 256, 168, 85, 247, 20);

  return pc.toPNG();
}

// ─────────────────────────────────────────────────────────────────────
// 2. CARTOGRAPHER SURVEY TABLE PATTERN (256x256 Seamless)
// ─────────────────────────────────────────────────────────────────────
function generateCartographerTable() {
  const pc = new PixelCanvas(256, 256);
  pc.fillRect(0, 0, 256, 256, 15, 10, 28, 255);

  for (let py = 0; py < 256; py += 32) {
    for (let px = 0; px < 256; px += 32) {
      const tint = ((px ^ py) % 3 === 0) ? 22 : 16;
      pc.fillRect(px, py, 32, 32, tint, 12, 38, 60);
    }
  }

  for (let r = 20; r <= 80; r += 18) {
    for (let a = 0; a < 360; a += 2) {
      const rad = a * Math.PI / 180;
      const x = Math.round(64 + Math.cos(rad) * (r + Math.sin(a * 4) * 6));
      const y = Math.round(64 + Math.sin(rad) * (r * 0.8 + Math.cos(a * 3) * 5));
      pc.setPixel((x + 256) % 256, (y + 256) % 256, 168, 85, 247, 32);
    }
  }

  for (let r = 24; r <= 90; r += 20) {
    for (let a = 0; a < 360; a += 2) {
      const rad = a * Math.PI / 180;
      const x = Math.round(192 + Math.cos(rad) * (r + Math.sin(a * 3) * 7));
      const y = Math.round(192 + Math.sin(rad) * (r * 0.75 + Math.cos(a * 5) * 6));
      pc.setPixel((x + 256) % 256, (y + 256) % 256, 217, 119, 6, 28);
    }
  }

  pc.fillRect(127, 0, 2, 256, 168, 85, 247, 24);
  pc.fillRect(0, 127, 256, 2, 168, 85, 247, 24);

  return pc.toPNG();
}

// ─────────────────────────────────────────────────────────────────────
// 3. ANCIENT FORGE IRON PATTERN (256x256 Seamless)
// ─────────────────────────────────────────────────────────────────────
function generateForgeIron() {
  const pc = new PixelCanvas(256, 256);
  pc.fillRect(0, 0, 256, 256, 20, 14, 31, 255);

  for (let i = 0; i < 300; i++) {
    const rx = (i * 37) % 256;
    const ry = (i * 59) % 256;
    const s = (i % 2 === 0) ? 3 : 2;
    pc.fillRect(rx, ry, s, 2, 38, 26, 56, 120);
  }

  const fissures = [
    [[20, 40], [50, 60], [90, 55], [130, 75]],
    [[140, 160], [180, 185], [210, 175], [245, 190]],
    [[10, 200], [45, 215], [80, 205], [115, 230]]
  ];
  for (const f of fissures) {
    for (let i = 0; i < f.length - 1; i++) {
      const p1 = f[i], p2 = f[i + 1];
      const dx = p2[0] - p1[0], dy = p2[1] - p1[1];
      const steps = Math.max(Math.abs(dx), Math.abs(dy));
      for (let s = 0; s <= steps; s++) {
        const x = Math.round(p1[0] + (dx * s) / steps);
        const y = Math.round(p1[1] + (dy * s) / steps);
        pc.setPixel(x, y, 234, 88, 12, 45);
        pc.setPixel(x, y - 1, 251, 146, 60, 25);
      }
    }
  }

  return pc.toPNG();
}

// ─────────────────────────────────────────────────────────────────────
// 4. COVENANT WAX/BLOOD SEAL (64x64 RGBA)
// ─────────────────────────────────────────────────────────────────────
function generateCovenantSeal(isConsecrated = false) {
  const pc = new PixelCanvas(64, 64);
  const cx = 32, cy = 32;

  const baseCol = isConsecrated ? [140, 80, 15] : [105, 15, 20];
  const rimCol = isConsecrated ? [217, 119, 6] : [140, 20, 25];
  const shadowCol = isConsecrated ? [65, 35, 5] : [70, 10, 15];
  const sigilCol = isConsecrated ? [254, 240, 138] : [253, 230, 138];

  for (let y = 0; y < 64; y++) {
    for (let x = 0; x < 64; x++) {
      const dx = x - cx, dy = y - cy;
      const d = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      const waxR = 26 + Math.sin(angle * 7) * 2.2 + Math.cos(angle * 3) * 1.5;

      if (d <= waxR + 1) {
        if (d > waxR) {
          pc.setPixel(x, y, 10, 2, 3, 140);
        } else if (d > waxR - 3) {
          pc.setPixel(x, y, rimCol[0], rimCol[1], rimCol[2], 255);
        } else if (d > waxR - 6) {
          pc.setPixel(x, y, shadowCol[0], shadowCol[1], shadowCol[2], 255);
        } else {
          pc.setPixel(x, y, baseCol[0], baseCol[1], baseCol[2], 255);
        }
      }
    }
  }

  for (let a = 0; a < 360; a += 3) {
    const rad = a * Math.PI / 180;
    const x = Math.round(cx + Math.cos(rad) * 14);
    const y = Math.round(cy + Math.sin(rad) * 14);
    pc.setPixel(x, y, sigilCol[0], sigilCol[1], sigilCol[2], 200);
  }

  if (isConsecrated) {
    // Consecrated Star of Ascension
    pc.fillRect(cx - 1, cy - 9, 3, 19, 254, 240, 138, 230);
    pc.fillRect(cx - 9, cy - 1, 19, 3, 254, 240, 138, 230);
    pc.fillRect(cx - 4, cy - 4, 9, 9, 253, 224, 71, 240);
    pc.fillRect(cx - 2, cy - 2, 5, 5, 255, 255, 255, 255);
  } else {
    // Sealed Skull / Void Eye
    pc.fillRect(cx - 5, cy - 6, 11, 8, 248, 113, 113, 230);
    pc.fillRect(cx - 3, cy + 2, 7, 5, 248, 113, 113, 230);
    // Eye sockets
    pc.fillRect(cx - 3, cy - 4, 2, 3, 20, 4, 6, 255);
    pc.fillRect(cx + 2, cy - 4, 2, 3, 20, 4, 6, 255);
  }

  return pc.toPNG();
}

// ─────────────────────────────────────────────────────────────────────
// 5. SCULPTED MASTER HEADER CREST (440x44 RGBA)
// ─────────────────────────────────────────────────────────────────────
function generateHeaderCrest() {
  const pc = new PixelCanvas(440, 44);
  const w = 440, h = 44;

  // Drop shadow
  pc.drawChamferBox(4, 4, w - 8, h - 6, 6, [2, 1, 5, 200], null);

  // Outer Weathered Bronze Rim
  pc.drawChamferBox(2, 2, w - 4, h - 6, 6, [32, 22, 50, 255], [217, 119, 6, 255]);

  // Center crest peak arch
  const cx = w / 2;
  pc.fillRect(cx - 36, 0, 72, 4, 217, 119, 6, 255);
  pc.fillRect(cx - 28, 1, 56, 2, 253, 230, 138, 255);

  // Inner carved basalt stone plate
  pc.drawChamferBox(6, 6, w - 12, h - 14, 4, [18, 13, 30, 255], [201, 168, 76, 90]);

  // Specular top line
  pc.fillRect(10, 6, w - 20, 1, 253, 230, 138, 110);

  // Flanking Amethyst Gemstones
  const gems = [18, w - 26];
  for (const gx of gems) {
    // Bronze socket
    pc.fillRect(gx - 1, 13, 10, 14, 217, 119, 6, 255);
    // Gem core
    pc.fillRect(gx, 14, 8, 12, 168, 85, 247, 255);
    pc.fillRect(gx + 2, 16, 4, 8, 216, 180, 254, 255);
    pc.fillRect(gx + 3, 17, 2, 3, 255, 255, 255, 255); // Specular
  }

  // Corner Gold Rivets
  pc.fillRect(8, 8, 2, 2, 253, 230, 138, 255);
  pc.fillRect(w - 10, 8, 2, 2, 253, 230, 138, 255);
  pc.fillRect(8, h - 11, 2, 2, 253, 230, 138, 255);
  pc.fillRect(w - 10, h - 11, 2, 2, 253, 230, 138, 255);

  return pc.toPNG();
}

// ─────────────────────────────────────────────────────────────────────
// 6. BOSS ICONS (32x32 RGBA)
// ─────────────────────────────────────────────────────────────────────
function generateBossIcon(type) {
  const pc = new PixelCanvas(32, 32);
  const cx = 16, cy = 16;

  if (type === 'gorgaroth') {
    // Chained Iron Skull (Floor 3)
    // Skull dome
    pc.fillRect(cx - 7, cy - 8, 15, 10, 239, 68, 68, 240);
    pc.fillRect(cx - 5, cy + 2, 11, 6, 185, 28, 28, 240);
    // Eyes
    pc.fillRect(cx - 4, cy - 4, 3, 3, 10, 2, 4, 255);
    pc.fillRect(cx + 2, cy - 4, 3, 3, 10, 2, 4, 255);
    // Glowing red pupils
    pc.fillRect(cx - 3, cy - 3, 1, 1, 254, 202, 202, 255);
    pc.fillRect(cx + 3, cy - 3, 1, 1, 254, 202, 202, 255);
    // Iron Chains across
    pc.fillRect(cx - 10, cy - 1, 21, 2, 148, 163, 184, 240);
    pc.fillRect(cx - 8, cy - 1, 2, 2, 254, 240, 138, 255);
    pc.fillRect(cx + 7, cy - 1, 2, 2, 254, 240, 138, 255);
  } else if (type === 'malakor') {
    // Arch-Lich Void Horns & Crown (Floor 6)
    // Void horns
    pc.fillRect(cx - 9, cy - 10, 3, 8, 168, 85, 247, 240);
    pc.fillRect(cx + 7, cy - 10, 3, 8, 168, 85, 247, 240);
    // Lich skull
    pc.fillRect(cx - 6, cy - 6, 13, 12, 192, 132, 252, 255);
    // Ethereal eye flames
    pc.fillRect(cx - 4, cy - 3, 3, 3, 56, 189, 248, 255);
    pc.fillRect(cx + 2, cy - 3, 3, 3, 56, 189, 248, 255);
    pc.fillRect(cx - 3, cy - 2, 1, 1, 255, 255, 255, 255);
    pc.fillRect(cx + 3, cy - 2, 1, 1, 255, 255, 255, 255);
  } else {
    // The Abyss Warden (Floor 10)
    // Titan Crown with Molten Gold Trim
    pc.fillRect(cx - 8, cy - 9, 17, 4, 253, 230, 138, 255);
    pc.fillRect(cx - 10, cy - 12, 4, 4, 217, 119, 6, 255);
    pc.fillRect(cx + 7, cy - 12, 4, 4, 217, 119, 6, 255);
    pc.fillRect(cx - 2, cy - 14, 5, 5, 254, 240, 138, 255);
    // Warden Mask
    pc.fillRect(cx - 7, cy - 5, 15, 13, 30, 20, 48, 255);
    // Monolithic Visor Slit
    pc.fillRect(cx - 5, cy - 1, 11, 2, 239, 68, 68, 255);
    pc.fillRect(cx - 2, cy - 1, 5, 2, 254, 240, 138, 255);
  }

  return pc.toPNG();
}

// ─────────────────────────────────────────────────────────────────────
// WRITE ALL ASSETS
// ─────────────────────────────────────────────────────────────────────
const outDir = path.resolve('assets/ui/sanctum');
fs.writeFileSync(path.join(outDir, 'sanctum_basalt_wall.png'), generateBasaltWall());
fs.writeFileSync(path.join(outDir, 'sanctum_cartographer_table.png'), generateCartographerTable());
fs.writeFileSync(path.join(outDir, 'sanctum_forge_iron.png'), generateForgeIron());
fs.writeFileSync(path.join(outDir, 'sanctum_covenant_seal_crimson.png'), generateCovenantSeal(false));
fs.writeFileSync(path.join(outDir, 'sanctum_covenant_seal_gold.png'), generateCovenantSeal(true));
fs.writeFileSync(path.join(outDir, 'sanctum_header_crest.png'), generateHeaderCrest());
fs.writeFileSync(path.join(outDir, 'sanctum_boss_gorgaroth.png'), generateBossIcon('gorgaroth'));
fs.writeFileSync(path.join(outDir, 'sanctum_boss_malakor.png'), generateBossIcon('malakor'));
fs.writeFileSync(path.join(outDir, 'sanctum_boss_warden.png'), generateBossIcon('warden'));

console.log('Master Sanctum Assets generated successfully in', outDir);
