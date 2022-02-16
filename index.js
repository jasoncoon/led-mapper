import { getColorAtBrightness } from "./js/color.js";
import { parseCoordinatesText } from "./js/coordinates.js";
import { beat8, beatsin8, CHSV, cos8, CRGB, generateFastLedMapCode, sin8 } from "./js/fastled.js";
import { parseLayoutText } from "./js/layout.js";
import { mapNumber } from "./js/math.js";
import { MDN } from "./js/mdn.js";
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
let depth, width, height, rows, leds, maxX, maxY, maxZ, minX, minY, minZ, coordsX, coordsY, angles, radii;

let offset = 0;
let offsetIncrement = 1.0;

let running = true;
let showPreviewNumbers = false;
let showPreviewLEDs = true;

let renderFunction = undefined;

let renderScale = false;

const currentPalette = null;

let pixelMap = [];
let pixelMapDimensions;

let focalLength = 384;

let angleX = (Math.PI / 4.0).toFixed(2);
let angleZ = 0.0;
let scale = 0.4;

let dragOffset = { x: 0, y: 0 };
let isMouseDown = false;

// const render = render2d;
const render = render3d;

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
    renderFunction = Function(
      "angles",
      "beat8",
      "beatsin8",
      "CHSV",
      "ColorFromPalette",
      "coordsX",
      "coordsY",
      "cos8",
      "CRGB",
      "currentPalette",
      "i",
      "offset",
      "radii",
      "sin8",
      "speed",
      code
    );
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

function onShowPreviewLEDsChange() {
  showPreviewLEDs = !showPreviewLEDs;

  document.getElementById("iconShowPreviewLEDs").className = showPreviewLEDs ? "bi bi-check-square" : "bi bi-square";

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

function onToggleScale() {
  renderScale = !renderScale;
  const scale = renderScale ? 256 : width > height ? width : height;
  document.getElementById("buttonToggleScale").innerText = `Scale: ${scale}`;
  if (!running) window.requestAnimationFrame(render);
}

function onWindowResize() {
  // const min = window.innerWidth - 48;

  // canvasPreview.width = min;
  // canvasPreview.height = min;
  // canvasPreview.style.width = `${min}px`;
  // canvasPreview.style.height = `${min}px`;
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
  document.getElementById("buttonToggleScale").onclick = onToggleScale;

  document.getElementById("checkboxFlipX").onchange = flipX;
  document.getElementById("checkboxFlipY").onchange = flipY;

  document.getElementById("checkboxShowPreviewLEDs").onchange = onShowPreviewLEDsChange;
  document.getElementById("checkboxShowPreviewNumbers").onchange = onShowPreviewNumbersChange;

  document.getElementById("form").onsubmit = onFormSubmit;

  // const elem = document.getElementById("panzoom-element");
  // // eslint-disable-next-line no-undef
  // const panzoom = Panzoom(elem, {
  //   canvas: true,
  //   maxScale: 5,
  // });
  // elem.parentElement.addEventListener("wheel", panzoom.zoomWithWheel);
  // document.getElementById("buttonReset").onclick = panzoom.reset;

  canvasPreview.onmousedown = (e) => {
    dragOffset.x = e.x - angleZ * 100;
    dragOffset.y = e.y - angleX * 100;
    isMouseDown = true;
  };

  canvasPreview.onmouseup = () => {
    isMouseDown = false;
  };

  canvasPreview.onmousemove = (e) => {
    if (!isMouseDown) return;

    angleZ = (e.x - dragOffset.x) / -100.0;
    angleX = (e.y - dragOffset.y) / 100.0;
  };
}

function configureCanvas2dContext() {
  context.lineWidth = 1;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "1px monospace";
}

function ColorFromPalette(palette, index, brightness = 255) {
  while (index > 255) index -= 256;
  while (index < 0) index += 256;
  const imageData = contextSelectedPalette.getImageData(index, 0, canvasSelectedPalette.width, canvasSelectedPalette.height);
  const data = imageData.data;

  while (brightness > 255) brightness -= 256;
  while (brightness < 0) brightness += 256;

  const rgb = getColorAtBrightness(data, brightness);

  // console.log({ rgb });

  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
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

  const results = generateFastLedMapCode({ centerX, centerY, leds, maxX, maxY, maxZ, minX, minY, minZ });

  // destructure the results into our global variables
  ({ coordsX, coordsY, angles, radii } = results);

  // destructure the results into our local variables
  const { fastLedCode, stats } = results;

  codeFastLED.innerText = fastLedCode;

  document.getElementById("codeStats").innerText = stats;

  if (!running) window.requestAnimationFrame(render);

  generatePixelblazeMap();

  generatePixelMap();
}

function generatePixelblazeMap() {
  const map = leds.map((led) => `[${led.x},${led.y},${led.z}]`).join(",");
  codePixelblaze.innerText = `[${map}]`;
}

function generatePixelMap() {
  var t = [];
  var a = [];
  leds.forEach(function (led) {
    const e = [led.x, led.y, led.z];
    e.forEach(function (e, n) {
      a[n] = void 0 === a[n] ? e : a[n];
      t[n] = void 0 === t[n] ? e : t[n];
      a[n] = Math.max(a[n], e);
      t[n] = Math.min(t[n], e);
    });
  });

  pixelMapDimensions = t.length;

  for (
    var n =
        (pixelMap = leds.map(function (led) {
          const e = [led.x, led.y, led.z];
          return e.map(function (e, n) {
            var r = a[n] - t[n];
            return (r = 0 === r ? 1 : r), Math.round((255 * (e - t[n])) / r);
          });
        })).length * pixelMapDimensions,
      r = new Uint8Array(n),
      o = 0,
      i = 0;
    i < pixelMap.length;
    i++
  ) {
    for (var s = 0; s < pixelMapDimensions; s++) {
      r[o++] = pixelMap[i][s] || 0;
    }
  }
  var l = new Uint32Array(3);
  (l[0] = 1), (l[1] = pixelMapDimensions), (l[2] = n);
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
  ({ depth, height, leds, maxX, maxY, maxZ, minX, minY, minZ, rows, width } = results);

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

function render2d() {
  if (renderFunction === undefined) return;

  offset += offsetIncrement;
  if (offset > 255) offset = 0;

  const canvasWidth = canvasPreview.width;
  const canvasHeight = canvasPreview.height;

  let max;
  if (renderScale) {
    max = 255;
  } else {
    max = width > height ? width : height;
  }

  let ledWidth = canvasWidth / (max + 1);
  let ledHeight = canvasHeight / (max + 1);

  context.globalCompositeOperation = "source-over";
  context.clearRect(0, 0, canvasWidth, canvasHeight);
  context.fillStyle = "black";
  context.fillRect(0, 0, canvasWidth, canvasHeight);
  context.globalCompositeOperation = "lighter";

  const center = ledWidth / 2;

  for (const led of leds || []) {
    let fillStyle;

    const i = led.index;
    const speed = offsetIncrement;

    try {
      fillStyle = renderFunction(angles, beat8, beatsin8, CHSV, ColorFromPalette, coordsX, coordsY, cos8, CRGB, currentPalette, i, offset, radii, sin8, speed);
    } catch (error) {
      handleRenderFunctionError(error);
      return;
    }

    let x, y;
    if (renderScale) {
      x = led.x256 * ledWidth;
      y = led.y256 * ledHeight;
    } else {
      x = (led.x - minX) * ledWidth;
      y = (led.y - minY) * ledHeight;
    }

    if (showPreviewLEDs) {
      context.fillStyle = fillStyle;
      context.beginPath();
      context.ellipse(x + center, y + center, center, center, 0, 0, Math.PI * 2, false);
      context.fill();
    }

    if (showPreviewNumbers) {
      context.fillStyle = !showPreviewLEDs ? fillStyle : "white";
      context.fillText(led.index, x + ledWidth / 2, y + ledHeight / 2);
    }
  }

  if (running) window.requestAnimationFrame(render);
}

function render3d() {
  offset += offsetIncrement;
  if (offset > 255) offset = 0;

  context.globalCompositeOperation = "source-over";
  context.fillStyle = "rgb(0,0,0)";
  context.fillRect(0, 0, 266, 266);
  context.globalCompositeOperation = "lighter";

  // var t = new Date().getTime();

  var e = 10;
  // var e = ((256 / Math.sqrt(pixelMap.length)) * pixelMapDimensions) / 2;
  var a = MDN.multiplyArrayOfMatrices([
    MDN.translateMatrix(128, 128, 128),
    MDN.rotateXMatrix(angleX),
    // MDN.rotateYMatrix(angleY),
    MDN.rotateZMatrix(angleZ),
    MDN.scaleMatrix(scale, scale, scale),
    MDN.translateMatrix(-128, -128, -128),
  ]);

  pixelMap.forEach((pixel, index) => {
    var x = pixel[0];
    var y = pixel[1];
    var z = pixel[2];
    var c = MDN.multiplyPoint(a, [x, y, z, 1]);
    x = c[0];
    y = c[1];
    z = c[2];
    var d = focalLength / (y + focalLength);
    x = (x - 128) * d + 128;
    z = (z - 128) * d + 128;

    let fillStyle;

    const i = index;
    const speed = offsetIncrement;

    if (renderFunction) {
      try {
        fillStyle = renderFunction(
          angles,
          beat8,
          beatsin8,
          CHSV,
          ColorFromPalette,
          coordsX,
          coordsY,
          cos8,
          CRGB,
          currentPalette,
          i,
          offset,
          radii,
          sin8,
          speed
        );
      } catch (error) {
        handleRenderFunctionError(error);
        return;
      }
    }

    if (fillStyle) {
      // console.log(fillStyle);
      if (fillStyle.startsWith("rgb(") && fillStyle.endsWith(")")) {
        let gradient = context.createRadialGradient(x, z, d, x, z, (e / 2) * d);

        fillStyle = fillStyle.replace("rgb(", "rgba(").replace(")", "");

        gradient.addColorStop(0, fillStyle + ", 1)");
        gradient.addColorStop(0.25, fillStyle + ", .2)");
        gradient.addColorStop(1, "rgba(0,0,0,0)");

        fillStyle = gradient;
      } else if (fillStyle.startsWith("hsl(") && fillStyle.endsWith(")")) {
        let gradient = context.createRadialGradient(x, z, d, x, z, (e / 2) * d);

        fillStyle = fillStyle.replace("hsl(", "hsla(").replace(")", "");

        gradient.addColorStop(0, fillStyle + ", 1)");
        gradient.addColorStop(0.25, fillStyle + ", .2)");
        gradient.addColorStop(1, "rgba(0,0,0,0)");

        fillStyle = gradient;
      }
      context.fillStyle = fillStyle;
      context.fillRect(x - e / 2, z - e / 2, e, e);
    }
  });

  requestAnimationFrame(render3d);
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
// window.requestAnimationFrame(render);
window.requestAnimationFrame(render);

onWindowResize();

function spiralMap(pixelCount) {
  var map = [];
  for (let i = 0; i < pixelCount; i++) {
    let c = ((-i * 10) / pixelCount) * Math.PI * 2;
    map.push([Math.cos(c), Math.sin(c), 1 - i / pixelCount]);
  }
  return map;
}

console.log(JSON.stringify(spiralMap(64)));
