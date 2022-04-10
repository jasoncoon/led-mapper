export function parsePixelblazeText(text) {
  // pixelblaze layout should already be JSON formatted 2D array
  const rows = JSON.parse(text);

  const leds = [];

  let minX, minY, maxX, maxY, minZ, maxZ, width, height, depth;

  minX = minY = minZ = 1000000;
  maxX = maxY = maxZ = -1000000;

  let index = 0;

  for (const row of rows) {
    const x = row[0];
    const y = row[1];
    const z = row.length > 2 ? row[2] : 0;

    if (x < minX) minX = x;
    if (x > maxX) maxX = x;

    if (y < minY) minY = y;
    if (y > maxY) maxY = y;

    if (z < minZ) minZ = z;
    if (z > maxZ) maxZ = z;

    leds.push({
      index: index++,
      x,
      y,
      z,
    });
  }

  width = maxX - minX + 1;
  height = maxY - minY + 1;

  return {
    depth,
    height,
    leds,
    maxX,
    maxY,
    maxZ,
    minX,
    minY,
    minZ,
    rows,
    width,
  };
}
