export function parseCoordinatesText(text) {
  // split the newline delimited text into lines
  const lines = text?.split("\n");

  // map over the lines, convert to rows (array of float number columns)
  const rows = lines.map((line) => {
    const columns = line.split("\t");
    // parse the string columns into integer numbers
    return columns.map((s) => parseFloat(s));
  });

  const leds = [];

  let minX, minY, maxX, maxY, width, height;

  minX = minY = 1000000;
  maxX = maxY = -1000000;

  for (const row of rows) {
    const index = parseInt(row[0]);
    const x = row[1];
    const y = row[2];

    if (isNaN(index) || isNaN(x) || isNaN(y)) continue;

    if (x < minX) minX = x;
    if (x > maxX) maxX = x;

    if (y < minY) minY = y;
    if (y > maxY) maxY = y;

    leds.push({
      index,
      x,
      y,
    });
  }

  width = maxX - minX;
  height = maxY - minY;

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
