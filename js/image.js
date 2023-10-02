export function getCursorPosition(canvas, imageScaleFactor, event) {
  const canvasBounds = canvas.getBoundingClientRect();
  const x = event.clientX - canvasBounds.left;
  const y = event.clientY - canvasBounds.top;
  const scale = 1 / imageScaleFactor;

  const scaledX = Math.floor(x / canvas.clientWidth * canvas.width * scale);
  const scaledY = Math.floor(y / canvas.clientHeight * canvas.height * scale);
  
  console.log({x, y, scaledX, scaledY});
  
  return { x: scaledX, y: scaledY };
}

export function drawImageMap(context, canvas, image, imageScaleFactor, leds, fontSize) {
  context.globalCompositeOperation = "source-over";

  if (image) {
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
  } else {
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  try {
    context.font =`${fontSize}px monospace`;
    context.textAlign = "center" 
    context.textBaseline = "middle"
    context.fillStyle = "white";
    context.lineWidth = fontSize / 36;
    context.strokeStyle = "black";

    leds.forEach(function(led, i) {
      let x = led.x * imageScaleFactor;
      let y = led.y * imageScaleFactor;

      
      let number = String(i);
      
      y += imageScaleFactor / 2;
      x += imageScaleFactor / 2;
      
      // console.log({led, i, x, y, fontSize});

      context.globalCompositeOperation = "difference";
      context.fillText(number, x, y);
      if (fontSize >= 18) {
        context.globalCompositeOperation = "source-over"
        context.strokeText(number, x, y);
      }
    });
  } catch (error) {
    console.error(error);
  }
}
