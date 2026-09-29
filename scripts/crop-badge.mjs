import sharp from 'sharp';

async function cropBadge() {
  const image = sharp('public/brand/dorice-logo-badge-on-orange.jpg');
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // We want to create an RGBA buffer
  const out = Buffer.alloc(width * height * 4);

  // Helper to check if pixel is orange backdrop
  // Orange backdrop has strong red, medium green, low blue: hue is ~15-25 deg
  const isOrange = (r, g, b) => {
    // Check if orange background (ribbed orange cloth)
    // Red is highest, Green is moderate, Blue is very low
    // In our samples: [194, 64, 6], [232, 104, 41]
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max === 0 ? 0 : (max - min) / max;
    // Orange cloth has r > g, g > b, b < 90, r > 130, sat > 0.45
    if (r > g && g >= b && b < 100 && r > 120 && sat > 0.45 && (r - b) > 75) {
      return true;
    }
    return false;
  };

  // Perform flood fill from borders to only remove external orange background
  // (so any warm tones inside the badge like the hands are not accidentally cleared)
  const visited = new Uint8Array(width * height);
  const queue = [];

  // Seed with all boundary pixels
  for (let x = 0; x < width; x++) {
    queue.push(x, 0);
    queue.push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    queue.push(0, y);
    queue.push(width - 1, y);
  }

  let head = 0;
  while (head < queue.length) {
    const x = queue[head++];
    const y = queue[head++];
    const idx = y * width + x;
    if (visited[idx]) continue;
    visited[idx] = 1;

    const srcIdx = idx * channels;
    const r = data[srcIdx];
    const g = data[srcIdx + 1];
    const b = data[srcIdx + 2];

    if (isOrange(r, g, b)) {
      // 4-neighborhood
      if (x > 0 && !visited[idx - 1]) queue.push(x - 1, y);
      if (x < width - 1 && !visited[idx + 1]) queue.push(x + 1, y);
      if (y > 0 && !visited[idx - width]) queue.push(x, y - 1);
      if (y < height - 1 && !visited[idx + width]) queue.push(x, y + 1);
    }
  }

  // Find bounding box of remaining content
  let minX = width, maxX = 0, minY = height, maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const srcIdx = idx * channels;
      const dstIdx = idx * 4;

      const r = data[srcIdx];
      const g = data[srcIdx + 1];
      const b = data[srcIdx + 2];

      if (visited[idx] && isOrange(r, g, b)) {
        // Transparent
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

  console.log('Badge tight bbox:', { minX, maxX, minY, maxY, w: maxX - minX + 1, h: maxY - minY + 1 });

  // Add small padding (e.g. 10px) around bbox
  const pad = 12;
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

cropBadge();
