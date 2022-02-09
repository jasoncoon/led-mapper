/*
   FastLED Mapping Demo: https://github.com/jasoncoon/led-mapper
   Copyright (C) 2022 Jason Coon, Evil Genius Labs LLC

   This program is free software: you can redistribute it and/or modify
   it under the terms of the GNU General Public License as published by
   the Free Software Foundation, either version 3 of the License, or
   (at your option) any later version.
   This program is distributed in the hope that it will be useful,
   but WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
   GNU General Public License for more details.
   You should have received a copy of the GNU General Public License
   along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

#include <FastLED.h> // https://github.com/FastLED/FastLED

FASTLED_USING_NAMESPACE

// Based on FastLED "100-lines-of-code" demo reel, showing just a few
// of the kinds of animation patterns you can quickly and easily
// compose using FastLED.
//
// This example also shows one easy way to define multiple
// animations patterns and have them automatically rotate.
//
// -Mark Kriegsman, December 2014

#if defined(FASTLED_VERSION) && (FASTLED_VERSION < 3001000)
#warning "Requires FastLED 3.1 or later; check github for latest code."
#endif

// change these to match your data pin, LED type, and color order
#define DATA_PIN D5
#define LED_TYPE WS2812B
#define COLOR_ORDER GRB

#define BRIGHTNESS 32

// start of data copied from LED Mapper:

#define NUM_LEDS 64

byte coordsX[NUM_LEDS] = {0, 36, 73, 109, 146, 182, 219, 255, 255, 219, 182, 146, 109, 73, 36, 0, 0, 36, 73, 109, 146, 182, 219, 255, 255, 219, 182, 146, 109, 73, 36, 0, 0, 36, 73, 109, 146, 182, 219, 255, 255, 219, 182, 146, 109, 73, 36, 0, 0, 36, 73, 109, 146, 182, 219, 255, 255, 219, 182, 146, 109, 73, 36, 0};
byte coordsY[NUM_LEDS] = {0, 0, 0, 0, 0, 0, 0, 0, 36, 36, 36, 36, 36, 36, 36, 36, 73, 73, 73, 73, 73, 73, 73, 73, 109, 109, 109, 109, 109, 109, 109, 109, 146, 146, 146, 146, 146, 146, 146, 146, 182, 182, 182, 182, 182, 182, 182, 182, 219, 219, 219, 219, 219, 219, 219, 219, 255, 255, 255, 255, 255, 255, 255, 255};
byte angles[NUM_LEDS] = {32, 39, 47, 58, 70, 80, 89, 96, 102, 96, 86, 72, 56, 42, 32, 25, 16, 22, 32, 51, 77, 96, 106, 111, 122, 119, 114, 96, 32, 13, 8, 6, 249, 247, 242, 223, 159, 141, 136, 133, 144, 149, 159, 178, 204, 223, 233, 239, 230, 223, 213, 199, 183, 169, 159, 153, 159, 166, 175, 185, 197, 208, 216, 223};
byte radii[NUM_LEDS] = {255, 222, 196, 182, 182, 196, 222, 255, 222, 182, 150, 131, 131, 150, 182, 222, 196, 150, 109, 81, 81, 109, 150, 196, 182, 131, 81, 36, 36, 81, 131, 182, 182, 131, 81, 36, 36, 81, 131, 182, 196, 150, 109, 81, 81, 109, 150, 196, 222, 182, 150, 131, 131, 150, 182, 222, 255, 222, 196, 182, 182, 196, 222, 255};

// end of data copied from LED Mapper

CRGB leds[NUM_LEDS];

#define FRAMES_PER_SECOND 120
#define ARRAY_SIZE(A) (sizeof(A) / sizeof((A)[0]))

uint8_t offset = 0; // rotating "base color" used by many of the patterns
uint8_t speed = 30;

boolean autoplay = true;
uint8_t autoplaySeconds = 2;

void setup()
{
  //  delay(3000); // 3 second delay for recovery

  Serial.begin(9600);

  // tell FastLED about the LED strip configuration
  FastLED.addLeds<LED_TYPE, DATA_PIN, COLOR_ORDER>(leds, NUM_LEDS);
  FastLED.setCorrection(TypicalSMD5050);

  FastLED.setMaxPowerInVoltsAndMilliamps(5, 1000); // 1A

  FastLED.setBrightness(BRIGHTNESS);
}

// List of patterns to cycle through.  Each is defined as a separate function below.
typedef void (*SimplePatternList[])();
SimplePatternList patterns = {
    // 2D map examples:
    clockwisePalette,
    counterClockwisePalette,
    outwardPalette,
    inwardPalette,
    northPalette,
    northEastPalette,
    eastPalette,
    southEastPalette,
    southPalette,
    southWestPalette,
    westPalette,
    northWestPalette,

    // standard FastLED demo reel examples:
    //  rainbow,
    //  rainbowWithGlitter,
    //  confetti,
    //  sinelon,
    //  juggle,
    //  bpm
};

const uint8_t patternCount = ARRAY_SIZE(patterns);

uint8_t currentPatternIndex = 0; // Index number of which pattern is current

CRGBPalette16 IceColors_p = CRGBPalette16(CRGB::Black, CRGB::Blue, CRGB::Aqua, CRGB::White);

const CRGBPalette16 palettes[] = {
    RainbowColors_p,
    RainbowStripeColors_p,
    CloudColors_p,
    LavaColors_p,
    OceanColors_p,
    ForestColors_p,
    PartyColors_p,
    HeatColors_p,
    IceColors_p,
};

const uint8_t paletteCount = ARRAY_SIZE(palettes);

uint8_t currentPaletteIndex = 0;
CRGBPalette16 currentPalette = palettes[currentPaletteIndex];

boolean autoplayPalettes = true;
uint8_t autoplayPaletteSeconds = autoplaySeconds * patternCount;

void loop()
{
  // Call the current pattern function once, updating the 'leds' array
  patterns[currentPatternIndex]();

  offset = beat8(speed);

  // do some periodic updates
  EVERY_N_SECONDS(autoplaySeconds)
  {
    if (autoplay)
    {
      nextPattern(); // change patterns periodically
    }
  }

  EVERY_N_SECONDS(autoplayPaletteSeconds)
  {
    // change palettes periodically
    if (autoplayPalettes)
    {
      nextPalette();
    }
  }

  // send the 'leds' array out to the actual LED strip
  // FastLED.show(); called automatically, internally by FastLED.delay below:

  // insert a delay to keep the framerate modest
  FastLED.delay(1000 / FRAMES_PER_SECOND);
}

void nextPattern()
{
  // add one to the current pattern number, and wrap around at the end
  currentPatternIndex = (currentPatternIndex + 1) % patternCount;
}

void nextPalette()
{
  // add one to the current palette number, and wrap around at the end
  currentPaletteIndex = (currentPaletteIndex + 1) % paletteCount;
  currentPalette = palettes[currentPaletteIndex];
}

// 2D map examples:

void clockwisePalette()
{
  for (uint16_t i = 0; i < NUM_LEDS; i++)
  {
    leds[i] = ColorFromPalette(currentPalette, offset + angles[i]);
  }
}

void counterClockwisePalette()
{
  for (uint16_t i = 0; i < NUM_LEDS; i++)
  {
    leds[i] = ColorFromPalette(currentPalette, offset - angles[i]);
  }
}

void outwardPalette()
{
  for (uint16_t i = 0; i < NUM_LEDS; i++)
  {
    leds[i] = ColorFromPalette(currentPalette, offset - radii[i]);
  }
}

void inwardPalette()
{
  for (uint16_t i = 0; i < NUM_LEDS; i++)
  {
    leds[i] = ColorFromPalette(currentPalette, offset + radii[i]);
  }
}

void northPalette()
{
  for (uint16_t i = 0; i < NUM_LEDS; i++)
  {
    leds[i] = ColorFromPalette(currentPalette, offset - coordsY[i]);
  }
}

void northEastPalette()
{
  for (uint16_t i = 0; i < NUM_LEDS; i++)
  {
    leds[i] = ColorFromPalette(currentPalette, offset - (coordsX[i] + coordsY[i]));
  }
}

void eastPalette()
{
  for (uint16_t i = 0; i < NUM_LEDS; i++)
  {
    leds[i] = ColorFromPalette(currentPalette, offset - coordsX[i]);
  }
}

void southEastPalette()
{
  for (uint16_t i = 0; i < NUM_LEDS; i++)
  {
    leds[i] = ColorFromPalette(currentPalette, offset - coordsX[i] + coordsY[i]);
  }
}

void southPalette()
{
  for (uint16_t i = 0; i < NUM_LEDS; i++)
  {
    leds[i] = ColorFromPalette(currentPalette, offset + coordsY[i]);
  }
}

void southWestPalette()
{
  for (uint16_t i = 0; i < NUM_LEDS; i++)
  {
    leds[i] = ColorFromPalette(currentPalette, offset + coordsX[i] + coordsY[i]);
  }
}

void westPalette()
{
  for (uint16_t i = 0; i < NUM_LEDS; i++)
  {
    leds[i] = ColorFromPalette(currentPalette, offset + coordsX[i]);
  }
}

void northWestPalette()
{
  for (uint16_t i = 0; i < NUM_LEDS; i++)
  {
    leds[i] = ColorFromPalette(currentPalette, offset + coordsX[i] - coordsY[i]);
  }
}

// standard FastLED demo reel examples:

void rainbow()
{
  // FastLED's built-in rainbow generator
  fill_rainbow(leds, NUM_LEDS, offset, 7);
}

void rainbowWithGlitter()
{
  // built-in FastLED rainbow, plus some random sparkly glitter
  rainbow();
  addGlitter(80);
}

void addGlitter(fract8 chanceOfGlitter)
{
  if (random8() < chanceOfGlitter)
  {
    leds[random16(NUM_LEDS)] += CRGB::White;
  }
}

void confetti()
{
  // random colored speckles that blink in and fade smoothly
  fadeToBlackBy(leds, NUM_LEDS, 10);
  int pos = random16(NUM_LEDS);
  leds[pos] += CHSV(offset + random8(64), 200, 255);
}

void sinelon()
{
  // a colored dot sweeping back and forth, with fading trails
  fadeToBlackBy(leds, NUM_LEDS, 20);
  int pos = beatsin16(13, 0, NUM_LEDS - 1);
  leds[pos] += CHSV(offset, 255, 192);
}

void bpm()
{
  // colored stripes pulsing at a defined Beats-Per-Minute (BPM)
  uint8_t BeatsPerMinute = 62;
  CRGBPalette16 palette = PartyColors_p;
  uint8_t beat = beatsin8(BeatsPerMinute, 64, 255);
  for (int i = 0; i < NUM_LEDS; i++)
  { // 9948
    leds[i] = ColorFromPalette(palette, offset + (i * 2), beat - offset + (i * 10));
  }
}

const byte dotCount = 3;
const byte hues = 240 / dotCount;

void juggle()
{
  // eight colored dots, weaving in and out of sync with each other
  fadeToBlackBy(leds, NUM_LEDS, 20);
  for (int i = 0; i < dotCount; i++)
  {
    leds[beatsin16(i + 7, 0, NUM_LEDS - 1)] |= CHSV(i * hues, 200, 255);
  }
}
