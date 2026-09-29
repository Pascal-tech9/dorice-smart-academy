import sharp from 'sharp';

async function generateCleanBadge() {
  const image = sharp('public/brand/dorice-logo-badge-on-orange.jpg');
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // Let's create an alpha mask
  // Geometry parameters measured from image:
  // Center of crest circle: (cx, cy) = (751, 410)
  // Radius of outer navy ring: R = 464
  // Left border: x = 287
  // Right border: x = 1215
  // Top: y = 14
  // Horizontal bar: y = 747 to 762, x = 308 to 1194
  // Bottom circle protrusion: y up to 805, inside circle R = 464

  const isInsideBadge = (x, y) => {
    // 1. Top half of circle: y <= 410
    const distSq = (x - 751) ** 2 + (y - 410) ** 2;
    const rSq = 464 ** 2;

    if (y <= 410) {
      return distSq <= rSq;
    }

    // 2. Middle section between y = 410 and y = 747
    if (y > 410 && y <= 747) {
      // Must be between left and right walls (x: 287 to 1215)
      // Note: the arch sides taper or follow the circle on the outside?
      // On the photo, the outer border is the circle itself, plus the white fill inside!
      // In fact, the outer navy ring is a complete circle except it is clipped or has the horizontal line!
      // Let's check if distSq <= rSq or if sides are vertical:
      // Notice: x=287 is 751 - 464. So at y=410, it is on the circle!
      // Below y=410, the sides are within x in [287, 1215] AND inside the outer shape.
      if (x >= 287 && x <= 1215) {
        // Check if pixel is not orange background
        const idx = (y * width + x) * channels;
        const r = data[idx], g = data[idx+1], b = data[idx+2];
        // If it's orange cloth, it's outside
        if (r > 160 && g < 135 && b < 65 && (r - b) > 100) {
          return false;
        }
        return true;
      }
      return false;
    }

    // 3. Horizontal bar
    if (y >= 747 && y <= 762) {
      if (x >= 308 && x <= 1194) return true;
    }

    // 4. Bottom circle protrusion: y > 747 and y <= 805
    if (y > 747 && y <= 806) {
      if (distSq <= rSq) {
        const idx = (y * width + x) * channels;
        const r = data[idx], g = data[idx+1], b = data[idx+2];
        if (r > 160 && g < 135 && b < 65 && (r - b) > 100) {
          return false;
        }
        return true;
      }
    }

    return false;
  };

  const minX = 280, maxX = 1222, minY = 8, maxY = 812;
  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;

  const cropped = Buffer.alloc(cropW * cropH * 4);

  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const srcIdx = (y * width + x) * channels;
      const dstIdx = ((y - minY) * cropW + (x - minX)) * 4;

      const r = data[srcIdx];
      const g = data[srcIdx + 1];
      const b = data[srcIdx + 2];

      if (isInsideBadge(x, y)) {
        cropped[dstIdx] = r;
        cropped[dstIdx + 1] = g;
        cropped[dstIdx + 2] = b;
        cropped[dstIdx + 3] = 255;
      } else {
        // Transparent
        cropped[dstIdx] = 0;
        cropped[dstIdx + 1] = 0;
        cropped[dstIdx + 2] = 0;
        cropped[dstIdx + 3] = 0;
      }
    }
  }

  await sharp(cropped, { raw: { width: cropW, height: cropH, channels: 4 } })
    .png()
    .toFile('public/brand/dorice-logo-badge.png');

  console.log(`Saved public/brand/dorice-logo-badge.png (${cropW}x${cropH})`);
}

generateCleanBadge();
