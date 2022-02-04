# LED Mapper

Web App: [https://jasoncoon.github.io/led-mapper](https://jasoncoon.github.io/led-mapper)

An online tool to generate and visualize maps for irregular and/or gapped LED layouts, for use with [FastLED], [Pixelblaze] and other libraries.

Heavily inspired by the excellent [FastLED XY Map Generator](https://macetech.github.io/FastLED-XY-Map-Generator) by Garrett Mace of [Macetech] which in turn was inspired by Mark Kriegsman.

The difference with this tool is that instead of generating coordinates for any "gaps", coordinates are only generated for each actual LED. So if you had an irregular/gapped matrix of 128 LEDs in a 16x16 grid, this tool would only create coordinate maps for 128 LEDs instead of 256.  This usually results in lower memory usage, but also generates coordinate maps for radius and angle.

Using [Google Sheets] to create a layout:
![Using Google Sheets to create a layout](images/google-sheets.mp4)

Using LED Mapper to generate maps:
![Using LED Mapper to generate maps](images/led-mapper.mp4)

---

Here's an example of a serpentine matrix layout (it's deliberately irregular and asymmetrical):
```
	0	1	2	3	4	5	6		7	8	9	10	11	12	
28	27	26	25	24	23	22	21	20	19	18	17	16	15	14	13
29	30	31	32	33	34	35	36	37	38	39	40	41	42	43	44
59	58	57	56	55	54	53	52		51	50	49	48	47	46	45
	60	61	62	63	64	65				66	67	68	69	70	
```

---

And the generated [FastLED] coordinate maps:

```c
#define NUM_LEDS 71

byte coordsX[NUM_LEDS] = { 17, 34, 51, 68, 85, 102, 119, 153, 170, 187, 204, 221, 238, 255, 238, 221, 204, 187, 170, 153, 136, 119, 102, 85, 68, 51, 34, 17, 0, 0, 17, 34, 51, 68, 85, 102, 119, 136, 153, 170, 187, 204, 221, 238, 255, 255, 238, 221, 204, 187, 170, 153, 119, 102, 85, 68, 51, 34, 17, 0, 17, 34, 51, 68, 85, 102, 170, 187, 204, 221, 238 };

byte coordsY[NUM_LEDS] = { 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 191, 191, 191, 191, 191, 191, 191, 191, 191, 191, 191, 191, 191, 191, 191, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255 };

byte angles[NUM_LEDS] = { 0, 0, 0, 0, 0, 0, 0, 128, 128, 128, 128, 128, 128, 133, 134, 136, 137, 141, 146, 159, 191, 223, 236, 242, 245, 247, 248, 249, 250, 245, 244, 242, 240, 236, 231, 223, 210, 191, 172, 159, 151, 146, 143, 141, 139, 144, 146, 149, 154, 159, 167, 178, 204, 215, 223, 229, 233, 236, 239, 240, 234, 231, 228, 223, 217, 210, 172, 165, 159, 155, 151 };

byte radii[NUM_LEDS] = { 209, 179, 149, 119, 90, 60, 30, 30, 60, 90, 119, 149, 179, 211, 182, 152, 123, 94, 67, 42, 30, 42, 67, 94, 123, 152, 182, 211, 241, 246, 217, 189, 161, 133, 108, 84, 67, 60, 67, 84, 108, 133, 161, 189, 217, 227, 200, 174, 149, 127, 108, 94, 94, 108, 127, 149, 174, 200, 227, 255, 241, 215, 191, 169, 149, 133, 133, 149, 169, 191, 215 };
```

---

In addition to [FastLED] maps, a [Pixelblaze] 2D XY map is also generated:

```c
[[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[9,0],[10,0],[11,0],[12,0],[13,0],[14,0],[15,1],[14,1],[13,1],[12,1],[11,1],[10,1],[9,1],[8,1],[7,1],[6,1],[5,1],[4,1],[3,1],[2,1],[1,1],[0,1],[0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2],[9,2],[10,2],[11,2],[12,2],[13,2],[14,2],[15,2],[15,3],[14,3],[13,3],[12,3],[11,3],[10,3],[9,3],[7,3],[6,3],[5,3],[4,3],[3,3],[2,3],[1,3],[0,3],[1,4],[2,4],[3,4],[4,4],[5,4],[6,4],[10,4],[11,4],[12,4],[13,4],[14,4]]
```

With the generated maps, the following Arduino code can be used with the [FastLED] library.

---

All of the following examples assume the following structure:
```c
uint8_t speed = 30; // beats per minute (BPM)

for (uint16_t i = 0; i < NUM_PIXELS; i++) {
  leds[i] = COLOR_FUNCTION;
}

FastLED.show();
```

---

For a horizontal rainbow:
```c
  leds[i] = CHSV(coordsX[i]);
```
![East Rainbow](images/east-rainbow.png)

---

To make it move/scroll:
```c
  leds[i] = CHSV(beat8(speed) - coordsX[i]);
```
![East Rainbow](images/east-rainbow.mov)

---

To go the other direction horizontally:
```c
  leds[i] = CHSV(beat8(speed) + coordsX[i]);
```
![West Rainbow](images/west-rainbow.mov)

---

Vertical:
```c
  leds[i] = CHSV(beat8(speed) + coordsY[i]);
```
images/north-rainbow.mov
![North Rainbow](images/north-rainbow.mov)

---

Diagonal:
```c
  leds[i] = CHSV(beat8(speed) + coordsX[i] + coordsY[i]);
```
![Northeast Rainbow](images/northeast-rainbow.mov)

---

Radius (expanding/contracting):
```c
  leds[i] = CHSV(beat8(speed) + radii[i]);
```
images/outward-rainbow.mov

---

Angle (rotating):
```c
  leds[i] = CHSV(beat8(speed) + angles[i]);
```
![Clockwise Rainbow](images/clockwise-rainbow.mov)

[FastLED]: https://github.com/FastLED/FastLED
[Pixelblaze]: https://www.bhencke.com/pixelblaze
[Google Sheets]: https://sheets.google.com
[Macetech]: https://macetech.com