export function getPatternCode(patternName) {
  switch (selectPattern.value) {
    case "palette":
      return "return ColorFromPalette(currentPalette, i - offset);";
    case "clockwise palette":
      return "return ColorFromPalette(currentPalette, angles[i] - offset);";
    case "counter-clockwise palette":
      return "return ColorFromPalette(currentPalette, angles[i] + offset);";
    case "outward palette":
      return "return ColorFromPalette(currentPalette, radii[i] - offset);";
    case "inward palette":
      return "return ColorFromPalette(currentPalette, radii[i] + offset);";
    case "north palette":
      return "return ColorFromPalette(currentPalette, coordsY[i] + offset);";
    case "northeast palette":
      return "return ColorFromPalette(currentPalette, coordsX[i] - coordsY[i] - offset);";
    case "east palette":
      return "return ColorFromPalette(currentPalette, coordsX[i] - offset);";
    case "southeast palette":
      return "return ColorFromPalette(currentPalette, coordsX[i] + coordsY[i] - offset);";
    case "south palette":
      return "return ColorFromPalette(currentPalette, coordsY[i] - offset);";
    case "southwest palette":
      return "return ColorFromPalette(currentPalette, coordsX[i] - coordsY[i] + offset);";
    case "west palette":
      return "return ColorFromPalette(currentPalette, coordsX[i] + offset);";
    case "northwest palette":
      return "return ColorFromPalette(currentPalette, coordsX[i] + coordsY[i] + offset);";
    case "red":
      return "return CRGB(255, 0, 0)";
    case "green":
      return "return CRGB(0, 255, 0)";
    case "blue":
      return "return CRGB(0, 0, 255)";
    case "white":
      return "return CRGB(255, 255, 255)";
    case "custom":
      return "";
  }
}
