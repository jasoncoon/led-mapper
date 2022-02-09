// get some elements by id
const buttonPlayPause = document.getElementById("buttonPlayPause");

const canvasPreview = document.getElementById("canvasPreview");

const codeFastLED = document.getElementById("codeFastLED");
const codePixelblaze = document.getElementById("codePixelblaze");

const context = canvasPreview.getContext("2d");

const inputCenterX = document.getElementById("inputCenterX");
const inputCenterY = document.getElementById("inputCenterY");
const inputHeight = document.getElementById("inputHeight");
const inputWidth = document.getElementById("inputWidth");

const selectPattern = document.getElementById("selectPattern");

const textAreaCoordinates = document.getElementById("textAreaCoordinates");
const textAreaLayout = document.getElementById("textAreaLayout");
const textAreaPixelblaze = document.getElementById("textAreaPixelblaze");

const renderError = document.getElementById("renderError");

// wire up event handlers
buttonPlayPause.onclick = onPlayPauseClick;

inputCenterX.onchange = onGenerateCode;
inputCenterY.onchange = onGenerateCode;
inputPreviewFontSize.onchange = onPreviewFontSizeChange;

selectPattern.onchange = onPatternChange;

textAreaLayout.onchange = onTextLayoutChange;

window.onresize = onWindowResize;

document.getElementById("buttonCopyCode").onclick = onCopyCodeClick;
document.getElementById("buttonCopyCoordinates").onclick = onCopyCoordinatesClick;
document.getElementById("buttonCopyLayout").onclick = onCopyLayoutClick;
document.getElementById("buttonCopyPixelblaze").onclick = onCopyPixelblazeClick;
document.getElementById("buttonCopyPixelblazeInput").onclick = onCopyPixelblazeInputClick;
document.getElementById("buttonNextPattern").onclick = onNextPatternClick;
document.getElementById("buttonParseCoordinates").onclick = onParseCoordinatesClick;
document.getElementById("buttonParseLayout").onclick = onParseLayoutClick;
document.getElementById("buttonParsePixelblaze").onclick = onParsePixelblazeClick;
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
let coordsX, coordsY, angles, radii;

let running = true;
let showPreviewBorders = true;
let showPreviewNumbers = true;

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

function onPatternChange() {
  let code;

  switch (selectPattern.value) {
    case "rainbow":
      code = "return CHSV(i - offset, 255, 255)";
      break;
    case "clockwise rainbow":
      code = "return CHSV(angles[i] - offset, 255, 255);";
      break;
    case "counter-clockwise rainbow":
      code = "return CHSV(angles[i] + offset, 255, 255);";
      break;
    case "outward rainbow":
      code = "return CHSV(radii[i] - offset, 255, 255);";
      break;
    case "inward rainbow":
      code = "return CHSV(radii[i] + offset, 255, 255);";
      break;
    case "north rainbow":
      code = "return CHSV(coordsY[i] + offset, 255, 255);";
      break;
    case "northeast rainbow":
      code = "return CHSV(coordsX[i] - coordsY[i] - offset, 255, 255);";
      break;
    case "east rainbow":
      code = "return CHSV(coordsX[i] - offset, 255, 255);";
      break;
    case "southeast rainbow":
      code = "return CHSV(coordsX[i] + coordsY[i] - offset, 255, 255);";
      break;
    case "south rainbow":
      code = "return CHSV(coordsY[i] - offset, 255, 255);";
      break;
    case "southwest rainbow":
      code = "return CHSV(coordsX[i] - coordsY[i] + offset, 255, 255);";
      break;
    case "west rainbow":
      code = "return CHSV(coordsX[i] + offset, 255, 255);";
      break;
    case "northwest rainbow":
      code = "return CHSV(coordsX[i] + coordsY[i] + offset, 255, 255);";
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

  document.getElementById("inputPreviewCode").value = code;
  if (!running) window.requestAnimationFrame(render);
}

function onPlayPauseClick() {
  setRunning(!running);
  buttonPlayPause.className = "btn btn-sm btn-outline-secondary";
}

function onPreviewFontSizeChange() {
  context.font = `${inputPreviewFontSize.value}px monospace`;
  window.requestAnimationFrame(render);
}

function onPreviousPatternClick() {
  const newIndex = (selectPattern.selectedIndex - 1) % selectPattern.options.length;

  selectPattern.selectedIndex = newIndex > -1 ? newIndex : selectPattern.options.length - 1;
  onPatternChange();
}

function onShowPreviewBordersChange() {
  showPreviewBorders = !showPreviewBorders;

  document.getElementById("iconShowPreviewBorders").className = showPreviewBorders ? "bi bi-check-square" : "bi bi-square";

  window.requestAnimationFrame(render);
}

function onShowPreviewNumbersChange() {
  showPreviewNumbers = !showPreviewNumbers;

  document.getElementById("iconShowPreviewNumbers").className = showPreviewNumbers ? "bi bi-check-square" : "bi bi-square";

  inputPreviewFontSize.disabled = !showPreviewNumbers;

  window.requestAnimationFrame(render);
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
  console.error({ error });
  setRunning(false);
  renderError.innerText = `Error: ${error.message}. Fix and click the Play button.`;
  buttonPlayPause.className = "btn btn-sm btn-outline-danger";
}

function render(timestamp) {
  offset += 1;
  if (offset > 255) offset = 0;
  const canvasWidth = canvasPreview.width;
  const canvasHeight = canvasPreview.height;

  const max = width > height ? width : height;

  const ledWidth = canvasWidth / (max + 1);
  const ledHeight = canvasHeight / (max + 1);

  context.clearRect(0, 0, canvasWidth, canvasHeight);

  const code = `${document.getElementById("inputPreviewCode").value}`;

  let renderFunc = undefined;

  renderError.innerText = "";

  try {
    renderFunc = Function("i", "coordsX", "coordsY", "angles", "radii", code);
  } catch (error) {
    handleRenderFunctionError(error);
    return;
  }

  for (let led of leds || []) {
    let fillStyle;

    try {
      fillStyle = renderFunc(led.index, coordsX, coordsY, angles, radii);
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
window.requestAnimationFrame(render);

onWindowResize();
