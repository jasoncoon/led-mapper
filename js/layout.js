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

  let minX, minY, maxX, maxY, width, height, minIndex, maxIndex;

  const duplicateIndices = [];

  minX = minY = minIndex = 1000000;
  maxX = maxY = maxIndex = -1000000;

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

      minIndex = Math.min(minIndex, index);
      maxIndex = Math.max(maxIndex, index);

      if (leds.some(l => l.index === index)) {
        duplicateIndices.push(index);
      }

      leds.push({
        index,
        x,
        y,
      });
    }
  }

  width = maxX - minX + 1;
  height = maxY - minY + 1;

  let previousIndex = -1;
  const gaps = [];
  const sorted = [...leds].sort((a, b) => a.index - b.index);

  for (const led of sorted) {
    const index = led.index;
    if (index - 1 !== previousIndex && !duplicateIndices.includes(index)) {
      gaps.push(index);
    }
    previousIndex = index;
  }

  return {
    height,
    leds,
    maxX,
    maxY,
    minX,
    minY,
    rows,
    width,
    minIndex,
    maxIndex,
    duplicateIndices,
    gaps
  };
}
