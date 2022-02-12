import { parseCoordinatesText } from "./js/coordinates.js";
import { CHSV, CRGB, generateFastLedMapCode } from "./js/fastled.js";
import { parseLayoutText } from "./js/layout.js";
import { mapNumber } from "./js/math.js";
import { palettes } from "./js/palettes.js";
import { getPatternCode } from "./js/patterns.js";
import { parsePixelblazeText } from "./js/pixelblaze.js";

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

// define some global variables (working on eliminating these)
let width, height, rows, leds, maxX, maxY, minX, minY, coordsX, coordsY, angles, radii;

let offset = 0;
let offsetIncrement = 1.0;

let running = true;
let showPreviewBorders = true;
let showPreviewNumbers = true;

let renderFunction = undefined;

const currentPalette = null;

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
  const code = getPatternCode(selectPattern.value);
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
    renderFunction = Function("i", "coordsX", "coordsY", "angles", "radii", "ColorFromPalette", "currentPalette", "offset", "CRGB", "CHSV", code);
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
function addEventHandlers() {
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

  document.getElementById("checkboxFlipX").onchange = flipX;
  document.getElementById("checkboxFlipY").onchange = flipY;

  document.getElementById("checkboxShowPreviewBorders").onchange = onShowPreviewBordersChange;
  document.getElementById("checkboxShowPreviewNumbers").onchange = onShowPreviewNumbersChange;

  document.getElementById("form").onsubmit = onFormSubmit;
}

function configureCanvas2dContext() {
  context.strokeStyle = "black";
  context.lineWidth = 1;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "1px monospace";
}

function ColorFromPalette(palette, index) {
  while (index > 255) index -= 256;
  while (index < 0) index += 256;
  const imageData = contextSelectedPalette.getImageData(index, 0, canvasSelectedPalette.width, canvasSelectedPalette.height);
  const data = imageData.data;
  const color = `rgb(${data[0]}, ${data[1]}, ${data[2]})`;
  return color;
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

function flipX() {
  for (const led of leds) {
    led.x = mapNumber(led.x, maxX, minX, minX, maxX);
  }
  generateCode();
}

function flipY() {
  for (const led of leds) {
    led.y = mapNumber(led.y, maxY, minY, minY, maxY);
  }
  generateCode();
}

function generateCode() {
  // use the center defined by the user
  const centerX = inputCenterX.value;
  const centerY = inputCenterY.value;

  const results = generateFastLedMapCode({ centerX, centerY, leds, maxX, maxY, minX, minY });

  // destructure the results into our global variables
  ({ coordsX, coordsY, angles, radii } = results);

  // destructure the results into our local variables
  const { fastLedCode, stats } = results;

  codeFastLED.innerText = fastLedCode;

  document.getElementById("codeStats").innerText = stats;

  if (!running) window.requestAnimationFrame(render);

  generatePixelblazeMap();
}

function generatePixelblazeMap() {
  const map = leds.map((led) => `[${led.x},${led.y}]`).join(",");
  codePixelblaze.innerText = `[${map}]`;
}

function parseCoordinates() {
  const results = parseCoordinatesText(textAreaCoordinates.value);

  // destructure the results into our global variables
  ({ height, leds, maxX, maxY, minX, minY, rows, width } = results);

  document.getElementById("codeParsedCoordinates").innerText = JSON.stringify(rows);

  inputWidth.value = width;
  inputHeight.value = height;
  inputCenterX.value = width / 2;
  inputCenterY.value = height / 2;
}

function parseLayout() {
  const results = parseLayoutText(textAreaLayout.value);

  // destructure the results into our global variables
  ({ height, leds, maxX, maxY, minX, minY, rows, width } = results);

  document.getElementById("codeParsedLayout").innerText = JSON.stringify(rows);

  inputWidth.value = width;
  inputHeight.value = height;
  inputCenterX.value = width / 2;
  inputCenterY.value = height / 2;
}

function parsePixelblaze() {
  const results = parsePixelblazeText(textAreaPixelblaze.value);

  // destructure the results into our global variables
  ({ height, leds, maxX, maxY, minX, minY, rows, width } = results);

  document.getElementById("codeParsedPixelblaze").innerText = JSON.stringify(rows);

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

  for (const led of leds || []) {
    let fillStyle;

    try {
      fillStyle = renderFunction(led.index, coordsX, coordsY, angles, radii, ColorFromPalette, currentPalette, offset, CRGB, CHSV);
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
addEventHandlers();
configureCanvas2dContext();
parseLayout();
generateCode();
onPatternChange();
onPaletteChange();
window.requestAnimationFrame(render);

onWindowResize();
