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

  minX = minY = minIndex = Number.MAX_VALUE;
  maxX = maxY = maxIndex = Number.MIN_VALUE;

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

      if (leds.some((l) => l.index === index)) {
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
    gaps,
  };
}

export const defaultLayout = `	0	1	2	3	4	5	6		7	8	9	10	11	12	13	
30	29	28	27	26	25	24	23	22	21	20	19	18	17	16	15	14
31	32	33	34	35	36	37	38	39	40	41	42	43	44	45	46	47
64	63	62	61	60	59	58	57	56	55	54	53	52	51	50	49	48
65	66	67	68	69	70	71	72	73	74	75	76	77	78	79	80	81
97	96	95	94	93	92	91	90		89	88	87	86	85	84	83	82
	98	99	100	101	102	103				104	105	106	107	108	109`;