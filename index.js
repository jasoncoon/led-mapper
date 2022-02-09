// get some elements by id
const buttonPlayPause = document.getElementById("buttonPlayPause");

const canvasPreview = document.getElementById("canvasPreview");
const canvasSelectedPalette = document.getElementById("canvasSelectedPalette");

const codeFastLED = document.getElementById("codeFastLED");
const codePixelblaze = document.getElementById("codePixelblaze");

const context = canvasPreview.getContext("2d");
const contextSelectedPalette = canvasSelectedPalette.getContext("2d");

const inputCenterX = document.getElementById("inputCenterX");
const inputCenterY = document.getElementById("inputCenterY");
const inputHeight = document.getElementById("inputHeight");
const inputWidth = document.getElementById("inputWidth");
const inputPreviewCode = document.getElementById("inputPreviewCode");
const inputPreviewFontSize = document.getElementById("inputPreviewFontSize");
const inputPreviewSpeed = document.getElementById("inputPreviewSpeed");

const selectPalette = document.getElementById("selectPalette");
const selectPattern = document.getElementById("selectPattern");

const textAreaCoordinates = document.getElementById("textAreaCoordinates");
const textAreaLayout = document.getElementById("textAreaLayout");
const textAreaPixelblaze = document.getElementById("textAreaPixelblaze");

const renderError = document.getElementById("renderError");

// wire up event handlers
buttonPlayPause.onclick = onPlayPauseClick;

inputCenterX.oninput = onGenerateCode;
inputCenterY.oninput = onGenerateCode;
inputPreviewCode.oninput = onPreviewCodeChange;
inputPreviewFontSize.oninput = onPreviewFontSizeChange;
inputPreviewSpeed.oninput = onPreviewSpeedChange;

selectPalette.onchange = onPaletteChange;
selectPattern.onchange = onPatternChange;

textAreaLayout.oninput = onTextLayoutChange;

window.onresize = onWindowResize;

document.getElementById("buttonCopyCode").onclick = onCopyCodeClick;
document.getElementById("buttonCopyCoordinates").onclick = onCopyCoordinatesClick;
document.getElementById("buttonCopyLayout").onclick = onCopyLayoutClick;
document.getElementById("buttonCopyPixelblaze").onclick = onCopyPixelblazeClick;
document.getElementById("buttonCopyPixelblazeInput").onclick = onCopyPixelblazeInputClick;
document.getElementById("buttonNextPalette").onclick = onNextPaletteClick;
document.getElementById("buttonNextPattern").onclick = onNextPatternClick;
document.getElementById("buttonParseCoordinates").onclick = onParseCoordinatesClick;
document.getElementById("buttonParseLayout").onclick = onParseLayoutClick;
document.getElementById("buttonParsePixelblaze").onclick = onParsePixelblazeClick;
document.getElementById("buttonPreviousPalette").onclick = onPreviousPaletteClick;
document.getElementById("buttonPreviousPattern").onclick = onPreviousPatternClick;

document.getElementById("checkboxShowPreviewBorders").onchange = onShowPreviewBordersChange;
document.getElementById("checkboxShowPreviewNumbers").onchange = onShowPreviewNumbersChange;

document.getElementById("form").onsubmit = onFormSubmit;

// configure the canvas 2d context
context.strokeStyle = "black";
context.lineWidth = 1;
context.textAlign = "center";
context.textBaseline = "middle";
context.font = "1px monospace";

// define some global variables
let width, height, rows, leds;

let minX, minY, minAngle, minRadius;
let maxX, maxY, maxAngle, maxRadius;

let offset = 0;
let offsetIncrement = 1.0;
let coordsX, coordsY, angles, radii;

let running = true;
let showPreviewBorders = true;
let showPreviewNumbers = true;

let renderFunction = undefined;

const currentPalette = null;

const palettes = {
  rainbow: [
    "#ff0000",
    "#ff4000",
    "#ff8000",
    "#ffbf00",
    "#ffff00",
    "#bfff00",
    "#80ff00",
    "#40ff00",
    "#00ff00",
    "#00ff40",
    "#00ff80",
    "#00ffbf",
    "#00ffff",
    "#00bfff",
    "#0080ff",
    "#0040ff",
    "#0000ff",
    "#4000ff",
    "#8000ff",
    "#bf00ff",
    "#ff00ff",
    "#ff00bf",
    "#ff0080",
    "#ff0040",
    "#ff0000",
  ],
  "rainbow stripe": [
    "#ff0000",
    "#000000",
    "#ff4000",
    "#000000",
    "#ff8000",
    "#000000",
    "#ffbf00",
    "#000000",
    "#ffff00",
    "#000000",
    "#bfff00",
    "#000000",
    "#80ff00",
    "#000000",
    "#40ff00",
    "#000000",
    "#00ff00",
    "#000000",
    "#00ff40",
    "#000000",
    "#00ff80",
    "#000000",
    "#00ffbf",
    "#000000",
    "#00ffff",
    "#000000",
    "#00bfff",
    "#000000",
    "#0080ff",
    "#000000",
    "#0040ff",
    "#000000",
    "#0000ff",
    "#000000",
    "#4000ff",
    "#000000",
    "#8000ff",
    "#000000",
    "#bf00ff",
    "#000000",
    "#ff00ff",
    "#000000",
    "#ff00bf",
    "#000000",
    "#ff0080",
    "#000000",
    "#ff0040",
    "#000000",
    "#ff0000",
  ],
  cloud: [
    "Blue",
    "DarkBlue",
    "DarkBlue",
    "DarkBlue",
    "DarkBlue",
    "DarkBlue",
    "DarkBlue",
    "DarkBlue",
    "Blue",
    "DarkBlue",
    "SkyBlue",
    "SkyBlue",
    "LightBlue",
    "White",
    "LightBlue",
    "SkyBlue",
  ],
  lava: ["Black", "Maroon", "Black", "Maroon", "DarkRed", "Maroon", "DarkRed", "DarkRed", "DarkRed", "Red", "Orange", "White", "Orange", "Red", "DarkRed"],
  ocean: [
    "MidnightBlue",
    "DarkBlue",
    "MidnightBlue",
    "Navy",
    "DarkBlue",
    "MediumBlue",
    "SeaGreen",
    "Teal",
    "CadetBlue",
    "Blue",
    "DarkCyan",
    "CornflowerBlue",
    "Aquamarine",
    "SeaGreen",
    "Aqua",
    "LightSkyBlue",
  ],
  forest: [
    "DarkGreen",
    "DarkGreen",
    "DarkOliveGreen",
    "DarkGreen",
    "Green",
    "ForestGreen",
    "OliveDrab",
    "Green",
    "SeaGreen",
    "MediumAquamarine",
    "LimeGreen",
    "YellowGreen",
    "LightGreen",
    "LawnGreen",
    "MediumAquamarine",
    "ForestGreen",
  ],
  party: [
    "#5500ab",
    "#84007c",
    "#b5004b",
    "#e5001b",
    "#e81700",
    "#b84700",
    "#ab7700",
    "#abab00",
    "#ab5500",
    "#dd2200",
    "#f2000e",
    "#c2003e",
    "#8f0071",
    "#5f00a1",
    "#2f00d0",
    "#0007f9",
  ],
  heat: [
    "#000000",
    "#330000",
    "#660000",
    "#990000",
    "#cc0000",
    "#ff0000",
    "#ff3300",
    "#ff6600",
    "#ff9900",
    "#ffcc00",
    "#ffff00",
    "#ffff33",
    "#ffff66",
    "#ffff99",
    "#ffffcc",
    "#ffffff",
  ],

  // Gradient "cpt-city/arendal/temperature", originally from
  // http://soliton.vm.bytemark.co.uk/pub/cpt-city/arendal/tn/temperature.png.index.html
  temperature: [
    "rgb( 30, 92,179)   0.000%",
    "rgb( 30, 92,179)   5.500%",
    "rgb( 23,111,193)   5.500%",
    "rgb( 23,111,193)  11.170%",
    "rgb( 11,142,216)  11.170%",
    "rgb( 11,142,216)  16.670%",
    "rgb(  4,161,230)  16.670%",
    "rgb(  4,161,230)  22.170%",
    "rgb( 25,181,241)  22.170%",
    "rgb( 25,181,241)  27.830%",
    "rgb( 51,188,207)  27.830%",
    "rgb( 51,188,207)  33.330%",
    "rgb(102,204,206)  33.330%",
    "rgb(102,204,206)  38.830%",
    "rgb(153,219,184)  38.830%",
    "rgb(153,219,184)  44.500%",
    "rgb(192,229,136)  44.500%",
    "rgb(192,229,136)  50.000%",
    "rgb(204,230, 75)  50.000%",
    "rgb(204,230, 75)  55.500%",
    "rgb(243,240, 29)  55.500%",
    "rgb(243,240, 29)  61.170%",
    "rgb(254,222, 39)  61.170%",
    "rgb(254,222, 39)  66.670%",
    "rgb(252,199,  7)  66.670%",
    "rgb(252,199,  7)  72.170%",
    "rgb(248,157, 14)  72.170%",
    "rgb(248,157, 14)  77.830%",
    "rgb(245,114, 21)  77.830%",
    "rgb(245,114, 21)  83.330%",
    "rgb(241, 71, 28)  83.330%",
    "rgb(241, 71, 28)  88.830%",
    "rgb(219, 30, 38)  88.830%",
    "rgb(219, 30, 38)  94.500%",
    "rgb(164, 38, 44)  94.500%",
    "rgb(164, 38, 44) 100.000%",
  ],

  // Gradient "cpt-city/ing/xmas/ib_jul01", originally from
  // http://soliton.vm.bytemark.co.uk/pub/cpt-city/ing/xmas/tn/ib_jul01.png.index.html
  ib_jul01: ["rgb(230,  6, 17)   0.000%", "rgb( 37, 96, 90)  37.010%", "rgb(144,189,106)  52.000%", "rgb(187,  3, 13) 100.000%"],
};

// event handlers
function onCopyCodeClick() {
  copyElementToClipboard(codeFastLED);

  const div = document.getElementById("divCopyCode");
  div.innerText = "Copied to clipboard";
  div.className = "visible input-group-text";
  setTimeout(() => (div.className = "invisible input-group-text"), 1000);
}

function onCopyCoordinatesClick() {
  copyLayoutValueToClipboard(textAreaCoordinates);
  const div = document.getElementById("divCopyCoordinates");
  div.innerText = "Copied to clipboard";
  div.className = "visible input-group-text";

  setTimeout(() => (div.className = "invisible input-group-text"), 1000);
}

function onCopyLayoutClick() {
  copyLayoutValueToClipboard(textAreaLayout);
  const div = document.getElementById("divCopyLayout");
  div.innerText = "Copied to clipboard";
  div.className = "visible input-group-text";

  setTimeout(() => (div.className = "invisible input-group-text"), 1000);
}

function onCopyPixelblazeClick() {
  copyElementToClipboard(codePixelblaze);

  const div = document.getElementById("divCopyPixelblaze");
  div.innerText = "Copied to clipboard";
  div.className = "visible input-group-text";
  setTimeout(() => (div.className = "invisible input-group-text"), 1000);
}

function onCopyPixelblazeInputClick() {
  copyElementToClipboard(textAreaPixelblaze);

  const div = document.getElementById("divCopyPixelblazeInput");
  div.innerText = "Copied to clipboard";
  div.className = "visible input-group-text";
  setTimeout(() => (div.className = "invisible input-group-text"), 1000);
}

function onFormSubmit(event) {
  event.preventDefault();
  parseLayout();
  generateCode();
}

function onGenerateCode() {
  centerX = inputCenterX.value;
  centerY = inputCenterY.value;
  generateCode();
}

function onNextPaletteClick() {
  selectPalette.selectedIndex = (selectPalette.selectedIndex + 1) % selectPalette.options.length;
  onPaletteChange();
}

function onNextPatternClick() {
  selectPattern.selectedIndex = (selectPattern.selectedIndex + 1) % selectPattern.options.length;
  onPatternChange();
}

function onParseCoordinatesClick() {
  parseCoordinates();
  generateCode();
}

function onParseLayoutClick() {
  parseLayout();
  generateCode();
}

function onParsePixelblazeClick() {
  parsePixelblaze();
  generateCode();
}

function onPaletteChange() {
  const paletteName = selectPalette.value;
  const palette = palettes[paletteName];
  if (!palette) return;
  const gradient = contextSelectedPalette.createLinearGradient(0, 0, canvasSelectedPalette.width, 0);
  let offset = 0;
  const offsetIncrement = 1.0 / palette.length;
  palette.forEach((color) => {
    if (color.endsWith("%")) {
      const parts = color.split(")");
      color = parts[0] + ")";
      let percent = parts[parts.length - 1];
      percent = percent.substring(0, percent.length - 2);
      offset = parseFloat(percent) / 100.0;
    }
    gradient.addColorStop(offset, color);
    offset += offsetIncrement;
  });
  contextSelectedPalette.fillStyle = gradient;
  contextSelectedPalette.fillRect(0, 0, canvasSelectedPalette.width, canvasSelectedPalette.height);
  if (!running) window.requestAnimationFrame(render);
}

function onPatternChange() {
  let code;

  switch (selectPattern.value) {
    case "palette":
      code = "return ColorFromPalette(currentPalette, i - offset);";
      break;
    case "clockwise palette":
      code = "return ColorFromPalette(currentPalette, angles[i] - offset);";
      break;
    case "counter-clockwise palette":
      code = "return ColorFromPalette(currentPalette, angles[i] + offset);";
      break;
    case "outward palette":
      code = "return ColorFromPalette(currentPalette, radii[i] - offset);";
      break;
    case "inward palette":
      code = "return ColorFromPalette(currentPalette, radii[i] + offset);";
      break;
    case "north palette":
      code = "return ColorFromPalette(currentPalette, coordsY[i] + offset);";
      break;
    case "northeast palette":
      code = "return ColorFromPalette(currentPalette, coordsX[i] - coordsY[i] - offset);";
      break;
    case "east palette":
      code = "return ColorFromPalette(currentPalette, coordsX[i] - offset);";
      break;
    case "southeast palette":
      code = "return ColorFromPalette(currentPalette, coordsX[i] + coordsY[i] - offset);";
      break;
    case "south palette":
      code = "return ColorFromPalette(currentPalette, coordsY[i] - offset);";
      break;
    case "southwest palette":
      code = "return ColorFromPalette(currentPalette, coordsX[i] - coordsY[i] + offset);";
      break;
    case "west palette":
      code = "return ColorFromPalette(currentPalette, coordsX[i] + offset);";
      break;
    case "northwest palette":
      code = "return ColorFromPalette(currentPalette, coordsX[i] + coordsY[i] + offset);";
      break;
    case "red":
      code = "return CRGB(255, 0, 0)";
      break;
    case "green":
      code = "return CRGB(0, 255, 0)";
      break;
    case "blue":
      code = "return CRGB(0, 0, 255)";
      break;
    case "white":
      code = "return CRGB(255, 255, 255)";
      break;
    case "custom":
      code = "";
      break;
  }

  inputPreviewCode.value = code;
  onPreviewCodeChange();
  if (!running) window.requestAnimationFrame(render);
}

function onPlayPauseClick() {
  setRunning(!running);
}

function onPreviewCodeChange() {
  const code = inputPreviewCode.value;

  renderFunction = undefined;

  renderError.innerText = "";

  try {
    renderFunction = Function("i", "coordsX", "coordsY", "angles", "radii", code);
    window.requestAnimationFrame(render);
  } catch (error) {
    handleRenderFunctionError(error);
    return;
  }
}

function onPreviewFontSizeChange() {
  context.font = `${inputPreviewFontSize.value}px monospace`;
  if (!running) window.requestAnimationFrame(render);
}

function onPreviewSpeedChange() {
  offsetIncrement = parseFloat(inputPreviewSpeed.value) || 1.0;
}

function onPreviousPaletteClick() {
  const newIndex = (selectPalette.selectedIndex - 1) % selectPalette.options.length;

  selectPalette.selectedIndex = newIndex > -1 ? newIndex : selectPalette.options.length - 1;
  onPaletteChange();
}

function onPreviousPatternClick() {
  const newIndex = (selectPattern.selectedIndex - 1) % selectPattern.options.length;

  selectPattern.selectedIndex = newIndex > -1 ? newIndex : selectPattern.options.length - 1;
  onPatternChange();
}

function onShowPreviewBordersChange() {
  showPreviewBorders = !showPreviewBorders;

  document.getElementById("iconShowPreviewBorders").className = showPreviewBorders ? "bi bi-check-square" : "bi bi-square";

  if (!running) window.requestAnimationFrame(render);
}

function onShowPreviewNumbersChange() {
  showPreviewNumbers = !showPreviewNumbers;

  document.getElementById("iconShowPreviewNumbers").className = showPreviewNumbers ? "bi bi-check-square" : "bi bi-square";

  inputPreviewFontSize.disabled = !showPreviewNumbers;

  if (!running) window.requestAnimationFrame(render);
}

function onTextLayoutChange() {
  parseLayout();
  generateCode();
}

function onWindowResize() {
  // const min = Math.min(window.innerWidth, window.innerHeight) - 48;
  const min = window.innerWidth - 48;

  canvasPreview.width = min;
  canvasPreview.height = min;
  canvasPreview.style.width = `${min}px`;
  canvasPreview.style.height = `${min}px`;
  context.textAlign = "center";
  context.textBaseline = "middle";

  if (!running) window.requestAnimationFrame(render);
}

// functions
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

function ColorFromPalette(palette, index) {
  while (index > 255) index -= 256;
  while (index < 0) index += 256;
  const imageData = contextSelectedPalette.getImageData(index, 0, canvasSelectedPalette.width, canvasSelectedPalette.height);
  const data = imageData.data;
  const color = `rgb(${data[0]}, ${data[1]}, ${data[2]})`;
  return color;
}

function CHSV(hue, saturation, value) {
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

function CRGB(r, g, b) {
  return `rgb(${r}, ${g}, ${b})`;
}

function copyElementToClipboard(element) {
  var range = document.createRange();
  range.selectNode(element);
  window.getSelection().removeAllRanges(); // clear current selection
  window.getSelection().addRange(range); // to select text
  document.execCommand("copy");
}

function copyLayoutValueToClipboard(element) {
  element.select();

  element.select();
  element.setSelectionRange(0, 99999); /* For mobile devices */

  /* Copy the text inside the text field */
  navigator.clipboard.writeText(element.value);
}

function generateCode() {
  let minX256 = (minY256 = minAngle256 = minRadius256 = 1000000);
  let maxX256 = (maxY256 = maxAngle256 = maxRadius256 = -1000000);

  // use the center defined by the user
  const centerX = inputCenterX.value;
  const centerY = inputCenterY.value;

  // calculate the angle and radius for each LED, using the defined center
  for (led of leds) {
    const { index, x, y } = led;

    const radius = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
    const radians = Math.atan2(centerY - y, centerX - x);

    let angle = radians * (180 / Math.PI);
    while (angle < 0) angle += 360;
    while (angle > 360) angle -= 360;

    if (angle < minAngle) minAngle = angle;
    if (angle > maxAngle) maxAngle = angle;

    if (radius < minRadius) minRadius = radius;
    if (radius > maxRadius) maxRadius = radius;

    led.angle = angle;
    led.radius = radius;
  }

  for (led of leds) {
    const { x, y, angle, radius } = led;

    let x256 = mapNumber(x, minX, maxX, 0, 255);
    let y256 = mapNumber(y, minY, maxY, 0, 255);
    let angle256 = mapNumber(angle, 0, 360, 0, 255);
    let radius256 = mapNumber(radius, 0, maxRadius, 0, 255);

    led.x256 = x256;
    led.y256 = y256;
    led.angle256 = angle256;
    led.radius256 = radius256;

    if (x256 < minX256) minX256 = x256;
    if (x256 > maxX256) maxX256 = x256;

    if (y256 < minY256) minY256 = y256;
    if (y256 > maxY256) maxY256 = y256;

    if (angle256 < minAngle256) minAngle256 = angle256;
    if (angle256 > maxAngle256) maxAngle256 = angle256;

    if (radius256 < minRadius256) minRadius256 = radius256;
    if (radius256 > maxRadius256) maxRadius256 = radius256;
  }

  // sort leds by index ascending
  leds.sort((a, b) => parseInt(a.index) - parseInt(b.index));

  coordsX = leds.map((led) => led.x256);
  coordsY = leds.map((led) => led.y256);
  angles = leds.map((led) => led.angle256);
  radii = leds.map((led) => led.radius256);

  const coordsX256 = `byte coordsX[NUM_LEDS] = { ${coordsX.map((v) => v.toFixed(0)).join(", ")} };`;
  const coordsY256 = `byte coordsY[NUM_LEDS] = { ${coordsY.map((v) => v.toFixed(0)).join(", ")} };`;
  const angles256 = `byte angles[NUM_LEDS] = { ${angles.map((v) => v.toFixed(0)).join(", ")} };`;
  const radii256 = `byte radii[NUM_LEDS] = { ${radii.map((v) => v.toFixed(0)).join(", ")} };`;

  codeFastLED.innerText = [
    // coordsX,
    // coordsY,
    // angles,
    // radii,
    // "",
    `#define NUM_LEDS ${leds.length}`,
    "",
    coordsX256,
    coordsY256,
    angles256,
    radii256,
  ].join("\n");

  document.getElementById("codeStats").innerText = `LEDs: ${leds.length}
minX: ${minX}
maxX: ${maxX}
minY: ${minY}
maxY: ${maxY}
minAngle: ${minAngle}
maxAngle: ${maxAngle}
minRadius: ${minRadius}
maxRadius: ${maxRadius}
minX256: ${minX256}
maxX256: ${maxX256}
minY256: ${minY256}
maxY256: ${maxY256}
minAngle256: ${minAngle256}
maxAngle256: ${maxAngle256}
minRadius256: ${minRadius256}
maxRadius256: ${maxRadius256}`;

  if (!running) window.requestAnimationFrame(render);

  generatePixelblazeMap();
}

function generatePixelblazeMap() {
  const map = leds.map((led) => `[${led.x},${led.y}]`).join(",");
  codePixelblaze.innerText = `[${map}]`;
}

function mapNumber(l, inMin, inMax, outMin, outMax) {
  return ((l - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

function parseCoordinates() {
  rows = textAreaCoordinates.value?.split("\n").map((line) => line.split("\t").map((s) => parseFloat(s)));

  document.getElementById("codeParsedCoordinates").innerText = JSON.stringify(rows);

  leds = [];

  minX = minY = minAngle = minRadius = 1000000;
  maxX = maxY = maxAngle = maxRadius = -1000000;

  let y = -1;

  for (let row of rows) {
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

  inputWidth.value = width;
  inputHeight.value = height;
  inputCenterX.value = width / 2;
  inputCenterY.value = height / 2;
}

function parseLayout() {
  rows = textAreaLayout.value?.split("\n").map((line) => line.split("\t").map((s) => parseInt(s)));

  document.getElementById("codeParsedLayout").innerText = JSON.stringify(rows);

  leds = [];

  minX = minY = minAngle = minRadius = 1000000;
  maxX = maxY = maxAngle = maxRadius = -1000000;

  let y = -1;

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
      });
    }
  }

  width = maxX - minX;
  height = maxY - minY;

  inputWidth.value = width;
  inputHeight.value = height;
  inputCenterX.value = width / 2;
  inputCenterY.value = height / 2;
}

function parsePixelblaze() {
  rows = JSON.parse(textAreaPixelblaze.value);

  document.getElementById("codeParsedPixelblaze").innerText = JSON.stringify(rows);

  leds = [];

  minX = minY = minAngle = minRadius = 1000000;
  maxX = maxY = maxAngle = maxRadius = -1000000;

  let index = 0;

  for (let row of rows) {
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

  width = maxX - minX;
  height = maxY - minY;

  inputWidth.value = width;
  inputHeight.value = height;
  inputCenterX.value = width / 2;
  inputCenterY.value = height / 2;
}

function handleRenderFunctionError(error) {
  renderFunction = undefined;
  console.error({ error });
  renderError.innerText = `Error: ${error.message}.`;
}

function render() {
  if (renderFunction === undefined) return;

  offset += offsetIncrement;
  if (offset > 255) offset = 0;
  const canvasWidth = canvasPreview.width;
  const canvasHeight = canvasPreview.height;

  const max = width > height ? width : height;

  const ledWidth = canvasWidth / (max + 1);
  const ledHeight = canvasHeight / (max + 1);

  context.clearRect(0, 0, canvasWidth, canvasHeight);

  for (let led of leds || []) {
    let fillStyle;

    try {
      fillStyle = renderFunction(led.index, coordsX, coordsY, angles, radii);
    } catch (error) {
      handleRenderFunctionError(error);
      return;
    }

    const x = (led.x - minX) * ledWidth;
    const y = (led.y - minY) * ledHeight;

    if (showPreviewBorders) {
      context.strokeRect(x, y, ledWidth, ledHeight);
    }

    context.fillStyle = fillStyle;
    context.fillRect(x, y, ledWidth, ledHeight);

    if (showPreviewNumbers) {
      context.fillStyle = "black";
      context.fillText(led.index, x + ledWidth / 2, y + ledHeight / 2);
    }
  }

  if (running) window.requestAnimationFrame(render);
}

function setRunning(value) {
  running = value;
  document.getElementById("iconPlayPause").className = running ? "bi bi-pause-fill" : "bi bi-play-fill";

  buttonPlayPause.title = running ? "Pause" : "Play";

  if (running) window.requestAnimationFrame(render);
}

// initial setup function calls
parseLayout();
generateCode();
onPatternChange();
onPaletteChange();
window.requestAnimationFrame(render);

onWindowResize();
