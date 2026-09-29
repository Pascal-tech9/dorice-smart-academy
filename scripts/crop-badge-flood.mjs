import sharp from 'sharp';

async function cropWithBoundary() {
  const image = sharp('public/brand/dorice-logo-badge-on-orange.jpg');
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // Outer navy ring check
  const isNavyBorder = (r, g, b) => {
    return (r <= 45 && b >= 55 && b > r + 15);
  };

  const isOuterBg = (r, g, b) => {
    if (isNavyBorder(r, g, b)) return false;
    // Dark border/vignette
    if (r < 75 && g < 75 && b < 75) return true;
    // Orange cloth
    if (r > 100 && (r - b) > 40) return true;
    return false;
  };

  const isBg = new Uint8Array(width * height);
  const queue = new Int32Array(width * height * 2);
  let qStart = 0;
  let qEnd = 0;

  function push(x, y) {
    const idx = y * width + x;
    if (!isBg[idx]) {
      const srcIdx = idx * channels;
      const r = data[srcIdx];
      const g = data[srcIdx + 1];
      const b = data[srcIdx + 2];
      if (isOuterBg(r, g, b)) {
        isBg[idx] = 1;
        queue[qEnd++] = x;
        queue[qEnd++] = y;
      }
    }
  }

  // Push all border pixels
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

    const neighbors = [
      [cx - 1, cy],
      [cx + 1, cy],
      [cx, cy - 1],
      [cx, cy + 1]
    ];

    for (let i = 0; i < 4; i++) {
      const nx = neighbors[i][0];
      const ny = neighbors[i][1];
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nIdx = ny * width + nx;
        if (!isBg[nIdx]) {
          const srcIdx = nIdx * channels;
          const r = data[srcIdx];
          const g = data[srcIdx + 1];
          const b = data[srcIdx + 2];
          if (isOuterBg(r, g, b)) {
            isBg[nIdx] = 1;
            queue[qEnd++] = nx;
            queue[qEnd++] = ny;
          }
        }
      }
    }
  }

  // Any pixel outside [270, 1230] or below 805 is background
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (x < 270 || x > 1230 || y > 805) {
        isBg[idx] = 1;
      }
      // Below horizontal line y=764, only the bottom circle protrusion between x=360 and 1140 is valid
      if (y > 764 && (x < 360 || x > 1140)) {
        isBg[idx] = 1;
      }
    }
  }

  // Find tight bounding box of badge
  let minX = width, maxX = 0, minY = height, maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (!isBg[idx]) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  console.log('Badge bounds:', { minX, maxX, minY, maxY, w: maxX - minX + 1, h: maxY - minY + 1 });

  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  const out = Buffer.alloc(cropW * cropH * 4);

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const srcIdx = (y * width + x) * channels;
      const dstIdx = ((y - minY) * cropW + (x - minX)) * 4;
      const idx = y * width + x;

      if (isBg[idx]) {
        out[dstIdx] = 0;
        out[dstIdx + 1] = 0;
        out[dstIdx + 2] = 0;
        out[dstIdx + 3] = 0;
      } else {
        out[dstIdx] = data[srcIdx];
        out[dstIdx + 1] = data[srcIdx + 1];
        out[dstIdx + 2] = data[srcIdx + 2];
        out[dstIdx + 3] = 255;
      }
    }
  }

  await sharp(out, { raw: { width: cropW, height: cropH, channels: 4 } })
    .png()
    .toFile('public/brand/dorice-logo-badge.png');

  console.log('Successfully saved clean transparent badge.');
}

cropWithBoundary();
