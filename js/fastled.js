function hsvToRgb(h, s, v) {
  var r, g, b, i, f, p, q, t;
  if (arguments.length === 1) {
    (s = h.s), (v = h.v), (h = h.h);
  }
  i = Math.floor(h * 6);
  f = h * 6 - i;
  p = v * (1 - s);
  q = v * (1 - f * s);
  t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0:
      (r = v), (g = t), (b = p);
      break;
    case 1:
      (r = q), (g = v), (b = p);
      break;
    case 2:
      (r = p), (g = v), (b = t);
      break;
    case 3:
      (r = p), (g = q), (b = v);
      break;
    case 4:
      (r = t), (g = p), (b = v);
      break;
    case 5:
      (r = v), (g = p), (b = q);
      break;
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

export function CHSV(hue, saturation, value) {
  while (hue > 255) hue -= 256;
  while (hue < 0) hue += 256;
  while (saturation > 255) saturation -= 256;
  while (saturation < 0) saturation += 256;
  while (value > 255) value -= 256;
  while (value < 0) value += 256;
  const h = mapNumber(hue, 0, 255, 0.0, 1.0);
  const s = mapNumber(saturation, 0, 255, 0.0, 1.0);
  const v = mapNumber(value, 0, 255, 0.0, 1.0);

  const { r, g, b } = hsvToRgb(h, s, v);
  return `rgb(${r}, ${g}, ${b})`;
}

export function CRGB(r, g, b) {
  return `rgb(${r}, ${g}, ${b})`;
}
