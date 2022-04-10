export function parseLayoutText(text) {
  // split the newline delimited text into lines
  const lines = text?.split("\n");

  // map over the lines, convert to rows (array of int number columns)
  const rows = lines.map((line) => {
    // split the tab-delimited line into columns
    const columns = line.split("\t");
    // parse the string columns into integer numbers
    return columns.map((s) => parseInt(s));
  });

  const leds = [];

  let minX, minY, maxX, maxY, width, height;

  minX = minY = 1000000;
  maxX = maxY = -1000000;

  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const cell = row[x];

      if (!cell && cell !== 0) continue;

      const index = parseInt(cell);

      if (x < minX) minX = x;
      if (x > maxX) maxX = x;

      if (y < minY) minY = y;
      if (y > maxY) maxY = y;

      leds.push({
        index,
        x,
        y,
        z: 0,
      });
    }
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
