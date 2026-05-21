# Logos Emblem Generator

Create Logos memes, posters, and social posts. Upload or pick an image, add text, overlay the logomark.

**Live:** [logos-emblem.vercel.app](https://logos-emblem.vercel.app)

## Features

- 120+ gallery templates (memes + Logos-flavored imagery)
- Drag-and-drop or URL image upload
- Webcam capture
- Multi-line text with font, color, stroke, shadow, rotation controls
- Floyd-Steinberg dither and grain noise filters
- Logomark overlay with placement (top, middle, bottom-left) and color
- Output size presets: Square, Story, Landscape, Poster A2, Portrait, HD
- Download as PNG or share via Web Share API

## Stack

- [Astro](https://astro.build) static site
- Vanilla JS with Web Components
- Canvas 2D API
- Bootstrap 5.3 with Logos brand overrides
- Deployed on Vercel

## Development

```sh
npm install
npm run dev      # localhost:4321
npm run build    # production build to ./dist/
```
