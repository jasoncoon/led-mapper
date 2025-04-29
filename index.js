import { getColorAtBrightness } from "./js/color.js";
import { defaultCoordinates, parseCoordinatesText } from "./js/coordinates.js";
import { CHSV, CRGB, beat8, beatsin8, cos8, generateFastLedMapCode, sin8 } from "./js/fastled.js";
import { drawImageMap, getCursorPosition } from "./js/image.js";
import { defaultLayout, parseLayoutText } from "./js/layout.js";
import { mapNumber } from "./js/math.js";
import { palettes } from "./js/palettes.js";
import { getPatternCode } from "./js/patterns.js";
import { defaultPixelblazeMap, parsePixelblazeText } from "./js/pixelblaze.js";

let imageInput;
let imageScaleFactor = 1;
const devicePixelRatio = window.devicePixelRatio || 1;

// get some elements by id
const buttonPlayPause = document.getElementById("buttonPlayPause");

const canvasPreview = document.getElementById("canvasPreview");
const canvasImageInput = document.getElementById("canvasImageInput");
const canvasSelectedPalette = document.getElementById("canvasSelectedPalette");

const codeFastLED = document.getElementById("codeFastLED");
const codePixelblaze = document.getElementById("codePixelblaze");

const context = canvasPreview.getContext("2d");
const contextImageInput = canvasImageInput.getContext("2d");
const contextSelectedPalette = canvasSelectedPalette.getContext("2d");

const inputCenterX = document.getElementById("inputCenterX");
const inputCenterY = document.getElementById("inputCenterY");
const inputHeight = document.getElementById("inputHeight");
const inputWidth = document.getElementById("inputWidth");
const inputPreviewCode = document.getElementById("inputPreviewCode");
const inputPreviewFontSize = document.getElementById("inputPreviewFontSize");
const inputPreviewSpeed = document.getElementById("inputPreviewSpeed");
const inputImage = document.getElementById("inputImage");

const selectPalette = document.getElementById("selectPalette");
const selectPreviewText = document.getElementById("selectPreviewText");

const textAreaCoordinates = document.getElementById("textAreaCoordinates");
const textAreaLayout = document.getElementById("textAreaLayout");
const textAreaPixelblaze = document.getElementById("textAreaPixelblaze");

const renderError = document.getElementById("renderError");

// define some global variables (working on eliminating these)
let width, height, rows, leds, maxIndex, maxX, maxY, minIndex, minX, minY, coordsX, coordsY, angles, radii, duplicateIndices, gaps;

let offset = 0;
let offsetIncrement = 1.0;

let running = true;
let showPreviewNumbers = false;
let showPreviewLEDs = true;
let previewNumberSource = 'index';

let renderFunction = undefined;

let renderScale = false;

const currentPalette = null;

let duplicateCount = 0;

// event handlers
function onCopyCodeClick() {
  copyElementToClipboard(codeFastLED);

  const div = document.getElementById("divCopyCode");
  div.innerText = "Copied to clipboard";
  div.className = "visible input-group-text";
  setTimeout(() => (div.className = "invisible input-group-text"), 1000);
}

function onCopyCoordinatesClick() {
  copyElementValueToClipboard(textAreaCoordinates);
  const div = document.getElementById("divCopyCoordinatesInput");
  div.innerText = "Copied to clipboard";
  div.className = "visible input-group-text";

  setTimeout(() => (div.className = "invisible input-group-text"), 1000);
}

function onCopyLayoutClick() {
  copyElementValueToClipboard(textAreaLayout);
  const div = document.getElementById("divCopyLayoutInput");
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

function onDeleteClick() {
  if (duplicateCount < 1) {
    return;
  } else if (duplicateCount === 1) {
    document.getElementById(`formClone${duplicateCount}`).style.display = 'none';
  } else {
    const configDiv = document.getElementById('config');
    const formClone = document.getElementById(`formClone${duplicateCount}`);
    configDiv.removeChild(formClone);
  }
  duplicateCount--;
}

let startLeds, startMaxX, startMaxY;

function onDuplicateClick() {
  const configDiv = document.getElementById('config');
  const formClone0 = document.getElementById('formClone0');
  let formClone;

  duplicateCount++;

  if (duplicateCount === 1) {
    formClone0.style.display = 'flex';
    formClone = formClone0;
    startLeds = JSON.parse(JSON.stringify(leds));
    startMaxX = maxX;
    startMaxY = maxY;
    initCloneControls(0, formClone);
  }

  formClone = formClone0.cloneNode(true);
  formClone.setAttribute('id', `formClone${duplicateCount}`);
  configDiv.appendChild(formClone);
  initCloneControls(duplicateCount, formClone);

  const newLeds = [...leds];
  
  let index = leds.length;

  for (const led of startLeds) {
    const x = led.x + startMaxX;
    const y = led.y + startMaxY;

    newLeds.push({
      index,
      x,
      y,
    });

    if (x < minX) minX = x;
    if (x > maxX) maxX = x;

    if (y < minY) minY = y;
    if (y > maxY) maxY = y;

    width = maxX - minX + 1;
    height = maxY - minY + 1;

    index++;
  }

  leds = newLeds;
}

function initCloneControls(duplicateCount, formClone) {
  const inputX = formClone.querySelector('#inputXClone0');
  inputX.setAttribute('id', `inputXClone${duplicateCount}`);
  const inputY = formClone.querySelector('#inputYClone0');
  inputY.setAttribute('id', `inputYClone${duplicateCount}`);

  formClone.querySelector('#labelXClone0').innerText = `Set ${duplicateCount} X`;
  formClone.querySelector('#labelYClone0').innerText = `Set ${duplicateCount} Y`;

  inputX.onchange = onInputXChange;
  inputY.onchange = onInputYChange;
}

function onInputXChange(e) {
  const inputX = e.currentTarget;
  const id = inputX.getAttribute('id');
  const index = parseInt(id.replace('inputXClone', ''));
  const inputY = document.getElementById(`inputYClone${index}`);
  const mx = parseFloat(inputX.value);
  const my = parseFloat(inputY.value);
  moveLeds(index, mx, my);
}

function onInputYChange(e) {
  const inputY = e.currentTarget;
  const id = inputY.getAttribute('id');
  const index = parseInt(id.replace('inputYClone', ''));
  const inputX = document.getElementById(`inputXClone${index}`);
  const mx = parseFloat(inputX.value);
  const my = parseFloat(inputY.value);
  moveLeds(index, mx, my);
}

function moveLeds(copyIndex, mx, my) {
  const start = startLeds.length * copyIndex;
  const end = start + startLeds.length;

  console.log({copyIndex, mx, my, start, end}); 

  let originalIndex = 0;
  for (let newIndex = start; newIndex < end; newIndex++) {
    const originalLed = startLeds[originalIndex];
    const newLed = leds[newIndex];

    const x = originalLed.x + mx;
    const y = originalLed.y + my;

    newLed.x = x;
    newLed.y = y;

    if (x < minX) minX = x;
    if (x > maxX) maxX = x;

    if (y < minY) minY = y;
    if (y > maxY) maxY = y;

    width = maxX - minX + 1;
    height = maxY - minY + 1;

    originalIndex++;
  }

  generateCode();
}

function onFormSubmit(event) {
  event.preventDefault();
  parseLayout();
  generateCode();
}

function onGenerateCode() {
  generateCode();
}

function onCanvasImageInputKeyDown(event) {
  console.log({key: event.key, ctrlKey: event.ctrlKey, metaKey: event.metaKey});
  if (event.key === 'Backspace' || (event.key === 'z' && (event.ctrlKey || event.metaKey))) {
    onImageInputUndo();
  }
}

function onImageInputChange(event) {
  const files = [...event.target.files];
  console.log({files});
  const file = files.find(f => /image/.test(f.type));
  if (!file) {
    alert('Invalid file');
    return;
  }
  const url = window.URL || window.webkitURL;
  const objectUrl = url.createObjectURL(file);

  contextImageInput.clearRect(0, 0, canvasImageInput.width, canvasImageInput.height);
  imageInput = new Image();

  imageInput.onload = () => {
    contextImageInput.imageSmoothingEnabled = imageInput.width > 255 || imageInput.height > 255;

    let canvasWidth = canvasImageInput.width;
    let canvasHeight = canvasImageInput.height;

    console.log({canvasWidth, canvasHeight});
    
    const imageWidth = imageInput.width;
    const imageHeight = imageInput.height;

    canvasWidth = canvasWidth * devicePixelRatio;
    canvasHeight = imageHeight / imageWidth * canvasWidth;

    canvasImageInput.width = canvasWidth;
    canvasImageInput.height = canvasHeight;

    imageScaleFactor = canvasImageInput.width / imageInput.width;

    console.log({imageWidth, imageHeight, canvasWidth, canvasHeight, devicePixelRatio, imageScaleFactor});

    contextImageInput.drawImage(imageInput, 0, 0, canvasWidth, canvasHeight);

    textAreaPixelblaze.value = "[]";
  };

  imageInput.src = objectUrl;
}

function onImageInputUndo() {
  if (!imageInput) return;

  const { leds } = parsePixelblazeText(textAreaPixelblaze.value);

  if (leds.length < 1) return;

  leds.pop();

  textAreaPixelblaze.value = JSON.stringify(leds.map(({x, y}) => ([x, y])));

  parsePixelblaze();
  
  refreshImageMap();
}

function onImageCanvasClick(event) {
  if (!imageInput) return;
  
  const {x, y} = getCursorPosition(canvasImageInput, imageScaleFactor, event);

  const { leds } = parsePixelblazeText(textAreaPixelblaze.value);

  leds.push({index: leds.length, x, y});

  textAreaPixelblaze.value = JSON.stringify(leds.map(({x, y}) => ([x, y])));

  parsePixelblaze();

  renderScale = false;
  const scale = renderScale ? 256 : width > height ? width : height;
  document.getElementById("buttonToggleScale").innerText = `Scale: ${scale}`;

  showPreviewNumbers = true;
  document.getElementById("iconShowPreviewNumbers").className = showPreviewNumbers ? "bi bi-check-square" : "bi bi-square";
  inputPreviewFontSize.disabled = false;

  showPreviewLEDs = false;
  document.getElementById("iconShowPreviewLEDs").className = showPreviewLEDs ? "bi bi-check-square" : "bi bi-square";
 
  refreshImageMap();
}

function refreshImageMap() {
  const fontSize = inputPreviewFontSize.value;

  context.font = `${fontSize}px monospace`;

  drawImageMap(contextImageInput, canvasImageInput, imageInput, imageScaleFactor, leds, fontSize);
}

function onLinkCoordinates() {
  copyLinkToClipboard(textAreaCoordinates, 'c', 'Coordinates');
}

function onLinkLayout() {
  copyLinkToClipboard(textAreaLayout, 'l', 'Layout');
}

function onLinkPixelblaze() {
  copyLinkToClipboard(textAreaPixelblaze, 'p', 'Pixelblaze');
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
  if (!running) window.requestAnimationFrame(renderPreview);
}

function onPatternChange() {
  const code = getPatternCode(selectPattern.value);
  inputPreviewCode.value = code;
  onPreviewCodeChange();
  if (!running) window.requestAnimationFrame(renderPreview);
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
    window.requestAnimationFrame(renderPreview);
  } catch (error) {
    handleRenderFunctionError(error);
    return;
  }
}

function onPreviewFontSizeChange() {
  context.font = `${inputPreviewFontSize.value}px monospace`;
  if (!running) window.requestAnimationFrame(renderPreview);
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

  if (!running) window.requestAnimationFrame(renderPreview);
}

function onShowPreviewNumbersChange() {
  showPreviewNumbers = !showPreviewNumbers;

  document.getElementById("iconShowPreviewNumbers").className = showPreviewNumbers ? "bi bi-check-square" : "bi bi-square";

  inputPreviewFontSize.disabled = !showPreviewNumbers;

  if (!running) window.requestAnimationFrame(renderPreview);
}

function onPreviewTextChange() {
  switch(selectPreviewText.value) {
    case "Index":
      previewNumberSource = 'index';
      break;
    case "X":
      previewNumberSource = 'x256';
      break;
    case "Y":
      previewNumberSource = 'y256';
      break;
    case "Angle":
      previewNumberSource = 'angle256';
      break;
    case "Radius":
      previewNumberSource = 'radius256';
      break;
  }
}

function onTextLayoutChange() {
  parseLayout();
  generateCode();
}

function onToggleScale() {
  renderScale = !renderScale;
  const scale = renderScale ? 256 : width > height ? width : height;
  document.getElementById("buttonToggleScale").innerText = `Scale: ${scale}`;
  if (!running) window.requestAnimationFrame(renderPreview);
}

function onWindowResize() {
  const min = window.innerWidth - 48;

  canvasPreview.width = min;
  canvasPreview.height = min;
  canvasPreview.style.width = `${min}px`;
  canvasPreview.style.height = `${min}px`;
  context.textAlign = "center";
  context.textBaseline = "middle";

  if (!running) window.requestAnimationFrame(renderPreview);
}

// functions
function addEventHandlers() {
  buttonPlayPause.onclick = onPlayPauseClick;

  inputCenterX.oninput = onGenerateCode;
  inputCenterY.oninput = onGenerateCode;
  inputPreviewCode.oninput = onPreviewCodeChange;
  inputPreviewFontSize.oninput = onPreviewFontSizeChange;
  inputPreviewSpeed.oninput = onPreviewSpeedChange;

  inputImage.onchange = onImageInputChange;

  selectPalette.onchange = onPaletteChange;
  selectPattern.onchange = onPatternChange;

  textAreaLayout.oninput = onTextLayoutChange;

  window.onresize = onWindowResize;

  document.getElementById("buttonCopyCode").onclick = onCopyCodeClick;
  document.getElementById("buttonCopyCoordinates").onclick = onCopyCoordinatesClick;
  document.getElementById("buttonCopyLayout").onclick = onCopyLayoutClick;
  document.getElementById("buttonCopyPixelblaze").onclick = onCopyPixelblazeClick;
  document.getElementById("buttonCopyPixelblazeInput").onclick = onCopyPixelblazeInputClick;
  document.getElementById("buttonDelete").onclick = onDeleteClick;
  document.getElementById("buttonClone").onclick = onDuplicateClick;
  document.getElementById("buttonLinkCoordinates").onclick = onLinkCoordinates;
  document.getElementById("buttonLinkLayout").onclick = onLinkLayout;
  document.getElementById("buttonLinkPixelblaze").onclick = onLinkPixelblaze;
  document.getElementById("buttonNextPalette").onclick = onNextPaletteClick;
  document.getElementById("buttonNextPattern").onclick = onNextPatternClick;
  document.getElementById("buttonParseCoordinates").onclick = onParseCoordinatesClick;
  document.getElementById("buttonParseLayout").onclick = onParseLayoutClick;
  document.getElementById("buttonParsePixelblaze").onclick = onParsePixelblazeClick;
  document.getElementById("buttonPreviousPalette").onclick = onPreviousPaletteClick;
  document.getElementById("buttonPreviousPattern").onclick = onPreviousPatternClick;
  document.getElementById("buttonToggleScale").onclick = onToggleScale;
  document.getElementById("buttonImageInputUndo").onclick = onImageInputUndo;

  document.getElementById("checkboxFlipX").onchange = flipX;
  document.getElementById("checkboxFlipY").onchange = flipY;

  document.getElementById("checkboxShowPreviewLEDs").onchange = onShowPreviewLEDsChange;
  document.getElementById("checkboxShowPreviewNumbers").onchange = onShowPreviewNumbersChange;
  document.getElementById("selectPreviewText").onchange = onPreviewTextChange;

  document.getElementById("form").onsubmit = onFormSubmit;

  const elem = document.getElementById("panzoom-element");
  // eslint-disable-next-line no-undef
  const panzoom = Panzoom(elem, {
    canvas: true,
    maxScale: 5,
  });
  elem.parentElement.addEventListener("wheel", panzoom.zoomWithWheel);

  document.getElementById("buttonReset").onclick = panzoom.reset;

  canvasImageInput.onclick = onImageCanvasClick;
  canvasImageInput.onkeydown = onCanvasImageInputKeyDown;
}

function configureCanvas2dContext() {
  context.lineWidth = 1;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = "20px monospace";
}

function ColorFromPalette(palette, index, brightness = 255) {
  let fixedIndex = index;
  while (fixedIndex > 255) fixedIndex -= 256;
  while (fixedIndex < 0) fixedIndex += 256;
  let imageData;
  try {
    imageData = contextSelectedPalette.getImageData(fixedIndex, 0, canvasSelectedPalette.width, canvasSelectedPalette.height);
  } catch(error) {
    console.error(`Error getting color from palette. index: ${index}, fixedIndex: ${fixedIndex}`, error);
    throw error;
  }
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

function copyElementValueToClipboard(element) {
  element.select();

  element.select();
  element.setSelectionRange(0, 99999); /* For mobile devices */

  /* Copy the text inside the text field */
  navigator.clipboard.writeText(element.value);
}

function copyLinkToClipboard(element, queryParam, name) {
  element.select();
  element.select();
  element.setSelectionRange(0, 99999); /* For mobile devices */
  const text = element.value;
  // const data = btoa(text);
  const data = LZString.compressToEncodedURIComponent(text);
  // console.log({location: location.toString(), search: location.search, data});
  navigator.clipboard.writeText(`${location.toString().replace(location.search, "")}?${queryParam}=${data}`);

  const div = document.getElementById(`divCopy${name}Input`);
  div.innerText = `${name} link copied to clipboard`;
  div.className = "visible input-group-text";
  setTimeout(() => (div.className = "invisible input-group-text"), 1000);
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

  const results = generateFastLedMapCode({ centerX, centerY, leds, maxX, maxY, minX, minY, minIndex, maxIndex });

  // destructure the results into our global variables
  ({ coordsX, coordsY, angles, radii } = results);

  // destructure the results into our local variables
  const { fastLedCode, stats } = results;

  codeFastLED.innerText = fastLedCode;

  document.getElementById("codeStats").innerText = stats;

  if (!running) window.requestAnimationFrame(renderPreview);

  if (imageInput) refreshImageMap();

  generatePixelblazeMap();
}

function generatePixelblazeMap() {
  const map = leds.map((led) => `[${+led.x.toFixed(3)},${+led.y.toFixed(3)}]`).join(",");
  codePixelblaze.innerText = `[${map}]`;
}

function parseCoordinates(value) {
  if (!value) value = textAreaCoordinates.value
  const results = parseCoordinatesText(value);

  // destructure the results into our global variables
  ({ height, leds, maxX, maxY, minX, minY, rows, width } = results);

  document.getElementById("codeParsedCoordinates").innerText = JSON.stringify(rows);

  inputWidth.value = width;
  inputHeight.value = height;
  inputCenterX.value = width / 2;
  inputCenterY.value = height / 2;
}

function parseLayout(value) {
  document.getElementById('layoutError').innerText = '';

  if (!value) value = textAreaLayout.value;
  const results = parseLayoutText(value);

  // destructure the results into our global variables
  ({ height, leds, maxX, maxY, minX, minY, rows, width, minIndex, maxIndex, duplicateIndices, gaps } = results);

  let errors = [];

  if (leds.length !== maxIndex + 1) {
    errors.push(`Layout has ${leds.length} LEDs but only ${maxIndex + 1} unique LED indices.`);
  }
  if (minIndex !== 0) {
    errors.push(`Layout should start at 0 instead of ${minIndex}.`);
  } 
  if (duplicateIndices.length > 0) {
    errors.push(`Duplicate indices found: ${duplicateIndices.join(', ')}.`);
  } 
  if (gaps.length > 0) {
    errors.push(`Gaps found at indices: ${gaps.join(', ')}.`);
  }

  errors.forEach(error => console.error(error));
  document.getElementById('layoutError').innerHTML = errors.join('<br />');

  document.getElementById("codeParsedLayout").innerText = JSON.stringify(rows);

  inputWidth.value = width;
  inputHeight.value = height;
  inputCenterX.value = width / 2;
  inputCenterY.value = height / 2;
}

function parsePixelblaze(value) {
  if (!value) value = textAreaPixelblaze.value;

  const results = parsePixelblazeText(value);

  // destructure the results into our global variables
  ({ height, leds, maxX, maxY, minX, minY, rows, width } = results);

  document.getElementById("codeParsedPixelblaze").innerText = JSON.stringify(rows);

  inputWidth.value = width;
  inputHeight.value = height;
  inputCenterX.value = width / 2;
  inputCenterY.value = height / 2;
}

function parseQueryString() {
  if (!location.search) return;
  const params = new URLSearchParams(location.search);
  const coordinates = params.get('c');
  const layout = params.get('l');
  const pixelblaze = params.get('p');

  let data;
  let tabName;
  if (coordinates) {
    // data = atob(coordinates);
    data = LZString.decompressFromEncodedURIComponent(coordinates);
    textAreaCoordinates.value = data;
    tabName = 'coordinates';
    parseCoordinates();
  } else if (layout) {
    // data = atob(layout);
    data = LZString.decompressFromEncodedURIComponent(layout);
    textAreaLayout.value = data;
    tabName = 'layout';
    parseLayout();
  } else if (pixelblaze) { 
    // data = atob(pixelblaze);
    data = LZString.decompressFromEncodedURIComponent(pixelblaze);
    // console.log({data});
    textAreaPixelblaze.value = data;
    tabName = 'pixelblaze';
    parsePixelblaze();
  }

  // console.log({search: location.search, data, tabName});

  const tabNames = ['coordinates', 'layout', 'pixelblaze'];

  if (tabName) {
    for (const t of tabNames) {
      let e = document.getElementById(`${t}-input-tab`);
      e.setAttribute('aria-selected', 'false');
      e.setAttribute('class', 'nav-link');

      e = document.getElementById(`${t}-input`);
      e.setAttribute('class', 'tab-pane fade');
    }

    let e = document.getElementById(`${tabName}-input-tab`);
    e.setAttribute('aria-selected', 'true');
    e.setAttribute('class', 'nav-link active');

    e = document.getElementById(`${tabName}-input`);
    e.setAttribute('class', 'tab-pane fade show active');
    return true;
  }
}

function handleRenderFunctionError(error, led) {
  renderFunction = undefined;
  console.error({ error });
  renderError.innerText = `Error: ${error.message}, LED: ${JSON.stringify(led)}.`;
}

function renderPreview() {
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
      handleRenderFunctionError(error, led);
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
      context.fillText(led[previewNumberSource].toFixed(0), x + ledWidth / 2, y + ledHeight / 2);
    }
  }

  if (running) window.requestAnimationFrame(renderPreview);
}

function setRunning(value) {
  running = value;
  document.getElementById("iconPlayPause").className = running ? "bi bi-pause-fill" : "bi bi-play-fill";

  buttonPlayPause.title = running ? "Pause" : "Play";

  if (running) window.requestAnimationFrame(renderPreview);
}

function initDefaultInputs() {
  textAreaLayout.value = defaultLayout;

  textAreaCoordinates.value = defaultCoordinates;

  textAreaPixelblaze.value = defaultPixelblazeMap;
}

// initial setup function calls
initDefaultInputs();

addEventHandlers();

configureCanvas2dContext();
if (!parseQueryString()) {
  parseLayout();
}
generateCode();
onPatternChange();
onPaletteChange();
window.requestAnimationFrame(renderPreview);

onWindowResize();
