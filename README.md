# Intellistar Emulator
A web application that displays weather information in the same visual presentation as the cable headend unit [Intellistar](https://en.wikipedia.org/wiki/IntelliStar).

## Overview
This is a local forecast segment that airs on The Weather Channel called the "Local on the 8s". The forecast is approximately a minute long and provides information on current and forecasted weather conditions. This type of forecast started in 1982 using WeatherStar units. It was later upgraded to Intellistar in 2003 and received various graphic changes over the years. This emulator uses the style that started in 2013.

## Instructions
1. Visit: <https://kaosfactor.github.io/>.
2. Enter zip code
3. Click start
4. Press F11 for fullscreen

## Features
Most of core animation and logic has been replicated including severe weather alerts, forecast descriptions, crawl text, and the Doppler radar map.

## Looping
To enable or disable looping, click on the TWC logo in the info-bar in the top-left corner of the emulator.

To get looping working properly, you may (as of Chrome M66) have to go to chrome://flags#autoplay-policy (Autoplay Policy) and change it to `User gesture is required for cross-origin iframes` or `No user gesture is required`  

