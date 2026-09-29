import sharp from 'sharp';

async function testSegmentation() {
  const image = sharp('public/brand/dorice-logo-badge-on-orange.jpg');
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  function isBackgroundOrange(r, g, b) {
    // Background is orange cloth:
    // Low blue: b < 90
    // High red: r > 130
    // Moderate green: g between 40 and 150
    // Hue roughly between 10 and 38 degrees
    // Crucially, cream has b > 180, teal has b > 120, navy has r < 50
    // The only things with low blue are:
    // 1. Red letters "SMART": r ~ 220, g ~ 40, b ~ 45 -> notice g is very low (g < 65, r - g > 150)
    // 2. Navy: r < 40
    // 3. Orange cloth: r between 140 and 255, g between 55 and 140, b < 85, and (r - g) between 45 and 130!
    // Also dark vignette around image border has r < 70.
    if (r < 75 && g < 75 && b < 75) {
      // Vignette / black border outside
      return true;
    }
    if (b < 95 && r > 130 && g >= 50 && g <= 150 && (r - g) >= 40 && (r - g) <= 145) {
      return true;
    }
    return false;
  }

  // Let's create an alpha mask by doing connected component analysis / BFS from corners
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height * 2);
  let qStart = 0;
  let qEnd = 0;

  function push(x, y) {
    const idx = y * width + x;
    if (!visited[idx]) {
      visited[idx] = 1;
      queue[qEnd++] = x;
      queue[qEnd++] = y;
    }
  }

  // Seed with outer border
  for (let x = 0; x < width; x++) {
    push(x, 0);
    push(x, 1);
    push(x, height - 2);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    push(0, y);
    push(1, y);
    push(width - 2, y);
    push(width - 1, y);
  }

  while (qStart < qEnd) {
    const cx = queue[qStart++];
    const cy = queue[qStart++];
    const cIdx = cy * width + cx;
    const srcIdx = cIdx * channels;

    const r = data[srcIdx];
    const g = data[srcIdx + 1];
    const b = data[srcIdx + 2];

    if (isBackgroundOrange(r, g, b)) {
      // Check 4 neighbors
      if (cx > 0) push(cx - 1, cy);
      if (cx < width - 1) push(cx + 1, cy);
      if (cy > 0) push(cx, cy - 1);
      if (cy < height - 1) push(cx, cy + 1);
    }
  }

  // Now visited pixels that are background become transparent (alpha = 0)
  // Non-visited pixels remain opaque (alpha = 255)
  const out = Buffer.alloc(width * height * 4);
  let minX = width, maxX = 0, minY = height, maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const srcIdx = idx * channels;
      const dstIdx = idx * 4;

      const r = data[srcIdx];
      const g = data[srcIdx + 1];
      const b = data[srcIdx + 2];

      const isBg = visited[idx] && isBackgroundOrange(r, g, b);

      if (isBg) {
        out[dstIdx] = 0;
        out[dstIdx + 1] = 0;
        out[dstIdx + 2] = 0;
        out[dstIdx + 3] = 0;
      } else {
        out[dstIdx] = r;
        out[dstIdx + 1] = g;
        out[dstIdx + 2] = b;
        out[dstIdx + 3] = 255;

        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  console.log('Resulting bounds:', { minX, maxX, minY, maxY, w: maxX - minX + 1, h: maxY - minY + 1 });

  // Crop to bounding box
  const pad = 8;
  const cropX = Math.max(0, minX - pad);
  const cropY = Math.max(0, minY - pad);
  const cropW = Math.min(width - cropX, (maxX - minX + 1) + pad * 2);
  const cropH = Math.min(height - cropY, (maxY - minY + 1) + pad * 2);

  await sharp(out, { raw: { width, height, channels: 4 } })
    .extract({ left: cropX, top: cropY, width: cropW, height: cropH })
    .png()
    .toFile('public/brand/dorice-logo-badge.png');

  console.log('Saved transparent cropped badge to public/brand/dorice-logo-badge.png');
}

testSegmentation();
