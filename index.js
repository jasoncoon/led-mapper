const form = document.getElementById("form");

const textAreaInput = document.getElementById("textAreaInput");

const inputWidth = document.getElementById("inputWidth");
const inputHeight = document.getElementById("inputHeight");
const inputCenterX = document.getElementById("inputCenterX");
const inputCenterY = document.getElementById("inputCenterY");

const codeParsedText = document.getElementById("codeParsedText");
const codeMaps = document.getElementById("codeMaps");
const codeStats = document.getElementById("codeStats");
const codePixelblaze = document.getElementById("codePixelblaze");

const selectPattern = document.getElementById("selectPattern");

const buttonGenerateCode = document.getElementById("buttonGenerateCode");
const buttonStart = document.getElementById("buttonStart");
const buttonStop = document.getElementById("buttonStop");
const buttonPreviousPattern = document.getElementById("buttonPreviousPattern");
const buttonNextPattern = document.getElementById("buttonNextPattern");
const buttonCopyInput = document.getElementById("buttonCopyInput");
const buttonCopyCode = document.getElementById("buttonCopyCode");
const buttonCopyPixelblaze = document.getElementById("buttonCopyPixelblaze");

const canvasPreview = document.getElementById("canvasPreview");
const context = canvasPreview.getContext("2d");

context.strokeStyle = "black";
context.lineWidth = 1;
context.textAlign = "center";
context.textBaseline = "middle";

form.onsubmit = onParseText;

textAreaInput.onchange = () => {
  parseText();
  generateCode();
};

inputCenterX.onchange = generateCode;
inputCenterY.onchange = generateCode;

selectPattern.onchange = onPatternChanged;

buttonGenerateCode.onclick = generateCode;
buttonStart.onclick = startPreview;
buttonStop.onclick = stopPreview;
buttonPreviousPattern.onclick = previousPattern;
buttonNextPattern.onclick = nextPattern;
buttonCopyInput.onclick = copyInput;
buttonCopyCode.onclick = copyCode;
buttonCopyPixelblaze.onclick = copyPixelblaze;

let width, height, rows, leds;

let minX, minY, minAngle, minRadius;
let maxX, maxY, maxAngle, maxRadius;

let running = false;

function onParseText(event) {
  event.preventDefault();
  parseText();
  generateCode();
}

function parseText() {
  rows = textAreaInput.value
    ?.split("\n")
    .map((line) => line.split("\t").map((s) => parseInt(s)));

  // codeParsedText.innerText = JSON.stringify(rows, null, 2);
  codeParsedText.innerText = JSON.stringify(rows);

  width = rows?.[0]?.length;
  height = rows?.length;

  inputWidth.value = width;
  inputHeight.value = height;
  inputCenterX.value = (width - 1) / 2;
  inputCenterY.value = (height - 1) / 2;
}

function generateCode() {
  leds = [];
  // [
  //   {
  //     index: string,
  //     x: number,
  //     y: number,
  //     angle: number,
  //     radius: number,
  //     x256: number,
  //     y256: number,
  //     angle256: number,
  //     radius256: number
  //   }
  // }

  const centerX = parseFloat(inputCenterX.value);
  const centerY = parseFloat(inputCenterY.value);

  minX = minY = minAngle = minRadius = 1000000;
  maxX = maxY = maxAngle = maxRadius = -1000000;

  let y = -1;

  for (let y = 0; y < rows.length; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const cell = row[x];

      if (!cell && cell !== 0) continue;

      const index = parseInt(cell);

      const radius = Math.sqrt(
        Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
      );
      const radians = Math.atan2(centerY - y, centerX - x);

      let angle = radians * (180 / Math.PI);
      while (angle < 0) angle += 360;
      while (angle > 360) angle -= 360;

      if (x < minX) minX = x;
      if (x > maxX) maxX = x;

      if (y < minY) minY = y;
      if (y > maxY) maxY = y;

      if (angle < minAngle) minAngle = angle;
      if (angle > maxAngle) maxAngle = angle;

      if (radius < minRadius) minRadius = radius;
      if (radius > maxRadius) maxRadius = radius;

      leds.push({
        index,
        x,
        y,
        angle,
        radius,
      });
    }
  }

  let minX256 = (minY256 = minAngle256 = minRadius256 = 1000000);
  let maxX256 = (maxY256 = maxAngle256 = maxRadius256 = -1000000);

  for (led of leds) {
    const { x, y, angle, radius } = led;

    let x256 = mapNumber(x, minX, maxX, 0, 255); // .toFixed(0);
    let y256 = mapNumber(y, minY, maxY, 0, 255); // .toFixed(0);
    let angle256 = mapNumber(angle, 0, 360, 0, 255); // .toFixed(0);
    let radius256 = mapNumber(radius, 0, maxRadius, 0, 255); // .toFixed(0);

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

  // const coordsX = `byte coordsX[NUM_LEDS] = { ${leds
  //   .map((led) => led.x)
  //   .join(", ")} };`;
  // const coordsY = `byte coordsY[NUM_LEDS] = { ${leds
  //   .map((led) => led.y)
  //   .join(", ")} };`;
  // const angles = `byte angles[NUM_LEDS] = { ${leds
  //   .map((led) => led.angle.toFixed(0))
  //   .join(", ")} };`;
  // const radii = `byte radii[NUM_LEDS] = { ${leds
  //   .map((led) => led.radius.toFixed(0))
  //   .join(", ")} };`;

  const coordsX256 = `byte coordsX[NUM_LEDS] = { ${leds
    .map((led) => led.x256.toFixed(0))
    .join(", ")} };`;
  const coordsY256 = `byte coordsY[NUM_LEDS] = { ${leds
    .map((led) => led.y256.toFixed(0))
    .join(", ")} };`;
  const angles256 = `byte angles[NUM_LEDS] = { ${leds
    .map((led) => led.angle256.toFixed(0))
    .join(", ")} };`;
  const radii256 = `byte radii[NUM_LEDS] = { ${leds
    .map((led) => led.radius256.toFixed(0))
    .join(", ")} };`;

  codeMaps.innerText = [
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

  codeStats.innerText = `Stats:
LEDs: ${leds.length}
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

function onPatternChanged() {
  console.log("here");
  if (!running) window.requestAnimationFrame(render);
}

function startPreview() {
  running = true;
  window.requestAnimationFrame(render);
}

function stopPreview() {
  running = false;
}

function previousPattern() {
  const newIndex =
    (selectPattern.selectedIndex - 1) % selectPattern.options.length;

  selectPattern.selectedIndex =
    newIndex > -1 ? newIndex : selectPattern.options.length - 1;
  onPatternChanged();
}

function nextPattern() {
  selectPattern.selectedIndex =
    (selectPattern.selectedIndex + 1) % selectPattern.options.length;
  onPatternChanged();
}

function render(timestamp) {
  const width = canvasPreview.width;
  const height = canvasPreview.height;

  const max = maxX > maxY ? maxX : maxY;

  const ratioX = width / (max + 1);
  const ratioY = height / (max + 1);

  context.clearRect(0, 0, width, height);

  for (let led of leds || []) {
    let hue = 0;

    switch (selectPattern.value) {
      case "rainbow":
        hue = mapNumber(led.index - timestamp / 10, 0, leds.length - 1, 0, 360);
        break;
      case "clockwise rainbow":
        hue = mapNumber(led.angle256 - timestamp / 10, 0, 256, 0, 360);
        break;
      case "counter-clockwise rainbow":
        hue = mapNumber(led.angle256 + timestamp / 10, 0, 256, 0, 360);
        break;
      case "outward rainbow":
        hue = mapNumber(led.radius256 - timestamp / 10, 0, 256, 0, 360);
        break;
      case "inward rainbow":
        hue = mapNumber(led.radius256 + timestamp / 10, 0, 256, 0, 360);
        break;
      case "north rainbow":
        hue = mapNumber(led.y256 + timestamp / 10, 0, 256, 0, 360);
        break;
      case "northeast rainbow":
        hue = mapNumber(led.x256 - led.y256 - timestamp / 10, 0, 256, 0, 360);
        break;
      case "east rainbow":
        hue = mapNumber(led.x256 - timestamp / 10, 0, 256, 0, 360);
        break;
      case "southeast rainbow":
        hue = mapNumber(led.x256 + led.y256 - timestamp / 10, 0, 256, 0, 360);
        break;
      case "south rainbow":
        hue = mapNumber(led.y256 - timestamp / 10, 0, 256, 0, 360);
        break;
      case "southwest rainbow":
        hue = mapNumber(led.x256 - led.y256 + timestamp / 10, 0, 256, 0, 360);
        break;
      case "west rainbow":
        hue = mapNumber(led.x256 + timestamp / 10, 0, 256, 0, 360);
        break;
      case "northwest rainbow":
        hue = mapNumber(led.x256 + led.y256 + timestamp / 10, 0, 256, 0, 360);
        break;
    }
    context.fillStyle = `hsl(${hue}, 100%, 50%)`;
    context.strokeRect(led.x * ratioX, led.y * ratioY, ratioX, ratioY);
    context.fillRect(led.x * ratioX, led.y * ratioY, ratioX, ratioY);
    context.fillStyle = "black";
    context.fillText(
      led.index,
      led.x * ratioX + ratioX / 2,
      led.y * ratioY + ratioY / 2
    );
  }

  if (running) window.requestAnimationFrame(render);
}

function mapNumber(l, inMin, inMax, outMin, outMax) {
  return ((l - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

function copyInput() {
  copyInputValueToClipboard(textAreaInput);
  const div = document.getElementById("divCopyInput");
  div.innerText = "Copied to clipboard";
  div.className = "visible input-group-text";

  setTimeout(() => (div.className = "invisible input-group-text"), 1000);
}

function copyCode() {
  copyElementToClipboard(codeMaps);

  const div = document.getElementById("divCopyCode");
  div.innerText = "Copied to clipboard";
  div.className = "visible input-group-text";
  setTimeout(() => (div.className = "invisible input-group-text"), 1000);
}

function copyPixelblaze() {
  copyElementToClipboard(codePixelblaze);

  const div = document.getElementById("divCopyPixelblaze");
  div.innerText = "Copied to clipboard";
  div.className = "visible input-group-text";
  setTimeout(() => (div.className = "invisible input-group-text"), 1000);
}

function copyInputValueToClipboard(element) {
  element.select();

  element.select();
  element.setSelectionRange(0, 99999); /* For mobile devices */

  /* Copy the text inside the text field */
  navigator.clipboard.writeText(element.value);
}

function copyElementToClipboard(element) {
  var range = document.createRange();
  range.selectNode(element);
  window.getSelection().removeAllRanges(); // clear current selection
  window.getSelection().addRange(range); // to select text
  document.execCommand("copy");
}

parseText();
generateCode();

window.requestAnimationFrame(render);
