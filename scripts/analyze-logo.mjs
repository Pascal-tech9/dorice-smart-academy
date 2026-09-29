import sharp from 'sharp';

async function analyze() {
  const image = sharp('public/brand/dorice-logo-badge-on-orange.jpg');
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  // Let's sample orange background at top-left corner
  const getPixel = (x, y) => {
    const idx = (y * width + x) * channels;
    return [data[idx], data[idx + 1], data[idx + 2]];
  };

  console.log('Top-left (orange bg):', getPixel(100, 100));
  console.log('Top-right (orange bg):', getPixel(1400, 100));
  console.log('Center (teal book):', getPixel(Math.floor(width/2), 520));
  console.log('Ring (navy):', getPixel(Math.floor(width/2), 20));
  console.log('Cream area inside crest:', getPixel(Math.floor(width/2), 340));
  console.log('Red letters ("SMART"):', getPixel(Math.floor(width/2), 120));

  // Find bounding box where pixel is NOT orange background
  // Orange bg has R > 170, G < 140, B < 60, and R - B > 120
  const isOrangeBg = (r, g, b) => {
    return (r > 160 && g < 135 && b < 65 && (r - b) > 110);
  };

  let minX = width, maxX = 0, minY = height, maxY = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const [r, g, b] = getPixel(x, y);
      if (!isOrangeBg(r, g, b)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  console.log('Badge bounds:', { minX, maxX, minY, maxY, width: maxX - minX + 1, height: maxY - minY + 1 });
}

analyze();
