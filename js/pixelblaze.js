export function parsePixelblazeText(text) {
  // pixelblaze layout should already be JSON formatted 2D array
  const rows = JSON.parse(text);

  const leds = [];

  let minX, minY, maxX, maxY, width, height;

  minX = minY = 1000000;
  maxX = maxY = -1000000;

  let index = 0;

  for (const row of rows) {
    const x = row[0];
    const y = row[1];

    if (x < minX) minX = x;
    if (x > maxX) maxX = x;

    if (y < minY) minY = y;
    if (y > maxY) maxY = y;

    leds.push({
      index: index++,
      x,
      y,
    });
  }

  width = maxX - minX + 1;
  height = maxY - minY + 1;

  return {
    height,
    leds,
    maxX,
    maxY,
    minX,
    minY,
    rows,
    width,
  };
}
