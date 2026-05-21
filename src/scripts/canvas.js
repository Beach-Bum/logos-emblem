import { isSolidColorSelected } from './utils/is-solid-color-selected.js';
import { MAX_SHADOW_BLUR_SIZE, MAX_STROKE_WIDTH, MAX_ROTATE } from './constants.js';

const LOGOMARK_PATH = "M14.6386 26C13.728 26 12.945 25.7854 12.2881 25.3549C11.6312 24.9244 11.1344 24.2467 10.7962 23.3233C10.5841 22.7003 10.4359 21.9368 10.3513 21.0328C10.2668 20.1302 10.2134 19.1833 10.1926 18.1948C10.1718 17.1842 10.1497 16.2061 10.1289 15.2592C10.1289 15.0017 10.0651 14.8716 9.93897 14.8716C9.83361 14.8716 9.72695 14.9575 9.62159 15.1292C9.21967 15.8822 8.74359 16.742 8.19208 17.7097C7.66268 18.6773 7.13328 19.645 6.60388 20.6127C6.07447 21.5804 5.5984 22.4518 5.17436 23.2257C4.77243 23.9788 4.48627 24.5264 4.31717 24.871C4.10515 25.3445 3.76696 25.6449 3.3013 25.7737C2.85644 25.9246 2.29582 25.9571 1.61814 25.8699C0.940452 25.7841 0.464381 25.5149 0.188624 25.0635C-0.107945 24.5901 -0.0546142 24.0958 0.347315 23.5795C0.623072 23.2348 1.01459 22.7198 1.52188 22.0317C2.03047 21.3216 2.6015 20.5269 3.23626 19.645C3.87102 18.7424 4.51749 17.8176 5.17306 16.8707C5.85075 15.9031 6.48551 14.9783 7.07865 14.0964C7.67178 13.1938 8.16867 12.4082 8.5706 11.7423C8.99464 11.0542 9.26909 10.5483 9.39657 10.2257C9.52404 9.92526 9.66062 9.591 9.8089 9.22551C9.95719 8.86003 10.0313 8.48414 10.0313 8.09655C10.0313 6.67754 9.89345 5.61231 9.61899 4.90345C9.36535 4.17249 9.01545 3.68864 8.5706 3.45193C8.14655 3.1944 7.68089 3.06433 7.1736 3.06433C6.79248 3.06433 6.38015 3.13977 5.9353 3.29065C5.51125 3.44152 5.2368 3.58069 5.10933 3.70945C4.87649 3.94617 4.65407 3.98909 4.44205 3.83822C4.23002 3.68734 4.16629 3.44022 4.25214 3.09685C4.48497 2.30085 4.90901 1.592 5.52296 0.967684C6.13951 0.322561 6.9967 0 8.09713 0C9.26129 0 10.1822 0.332967 10.8599 1.0002C11.5376 1.66743 12.0241 2.73137 12.3206 4.1933C12.6172 5.65523 12.7655 7.5906 12.7655 9.9994C12.7655 12.8374 12.8084 15.1071 12.893 16.8057C12.9775 18.5044 13.1154 19.7842 13.3053 20.6439C13.4952 21.4828 13.7606 22.0421 14.0987 22.3218C14.459 22.6014 14.9026 22.7406 15.432 22.7406C15.9614 22.7406 16.4167 22.6326 16.8615 22.418C17.3272 22.2034 17.7291 21.9238 18.0686 21.5791C18.2169 21.4074 18.386 21.3424 18.5772 21.3853C18.7671 21.4282 18.9154 21.5466 19.022 21.7404C19.1495 21.9121 19.1495 22.1384 19.022 22.418C18.5772 23.4078 17.9841 24.2571 17.2439 24.966C16.5246 25.654 15.6557 25.9987 14.6399 25.9987L14.6386 26Z";
const LOGOMARK_VB_W = 20;
const LOGOMARK_VB_H = 26;

function applyDither(ctx, cw, ch) {
  const imageData = ctx.getImageData(0, 0, cw, ch);
  const d = imageData.data;
  const gray = new Float32Array(cw * ch);
  for (let i = 0; i < gray.length; i++) gray[i] = d[i * 4] * 0.299 + d[i * 4 + 1] * 0.587 + d[i * 4 + 2] * 0.114;
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
    const idx = y * cw + x;
    const old = gray[idx];
    const val = old > 127 ? 255 : 0;
    gray[idx] = val;
    const err = old - val;
    if (x + 1 < cw) gray[idx + 1] += err * 7 / 16;
    if (y + 1 < ch) {
      if (x > 0) gray[(y + 1) * cw + x - 1] += err * 3 / 16;
      gray[(y + 1) * cw + x] += err * 5 / 16;
      if (x + 1 < cw) gray[(y + 1) * cw + x + 1] += err / 16;
    }
  }
  for (let i = 0; i < gray.length; i++) {
    const v = Math.max(0, Math.min(255, gray[i]));
    d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v;
  }
  ctx.putImageData(imageData, 0, 0);
}

function applyGrain(ctx, cw, ch) {
  const imageData = ctx.getImageData(0, 0, cw, ch);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * 80;
    d[i] = Math.max(0, Math.min(255, d[i] + n));
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n));
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n));
  }
  ctx.putImageData(imageData, 0, 0);
}

function drawLogomark(ctx, x, y, height, color) {
  const scale = height / LOGOMARK_VB_H;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = color;
  ctx.fill(new Path2D(LOGOMARK_PATH));
  ctx.restore();
}

export class Canvas {
  #canvas = null;
  #ctx = null;
  #filter = 'none';
  #logoPlacement = 'top';
  #logoColor = '#ffffff';
  #outputSize = 'original';

  constructor(canvasEl) {
    this.#canvas = canvasEl;
    this.#ctx = this.#canvas.getContext('2d');
  }

  get width() { return this.#canvas.width; }
  set width(value) { this.#canvas.width = value; }
  get height() { return this.#canvas.height; }
  set height(value) { this.#canvas.height = value; }

  getDimensions() { return { width: this.width, height: this.height }; }

  setDimensions({ width, height }) {
    this.width = width;
    this.height = height;
    return this;
  }

  setFilter(filter) { this.#filter = filter; }
  setLogoPlacement(placement) { this.#logoPlacement = placement; }
  setLogoColor(color) { this.#logoColor = color; }
  setOutputSize(size) { this.#outputSize = size; }
  getOutputSize() { return this.#outputSize; }

  toDataURL() { return this.#canvas.toDataURL(); }

  draw(image, textboxes = new Map()) {
    if (image == null) return;

    const canvas = this.#canvas;
    const ctx = this.#ctx;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (isSolidColorSelected(image)) {
      ctx.fillStyle = image;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else {
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    }

    // Apply filter
    if (this.#filter === 'dither') {
      applyDither(ctx, canvas.width, canvas.height);
    } else if (this.#filter === 'grain') {
      applyGrain(ctx, canvas.width, canvas.height);
    }

    // Draw logomark
    if (this.#logoPlacement !== 'none') {
      const markH = Math.min(canvas.width, canvas.height) * 0.06;
      const markW = (LOGOMARK_VB_W / LOGOMARK_VB_H) * markH;
      const margin = Math.min(canvas.width, canvas.height) * 0.04;
      let lx, ly;

      switch (this.#logoPlacement) {
        case 'top':
          lx = (canvas.width - markW) / 2;
          ly = margin;
          break;
        case 'middle':
          lx = (canvas.width - markW) / 2;
          ly = (canvas.height - markH) / 2;
          break;
        case 'bottom-left':
          lx = margin;
          ly = canvas.height - margin - markH;
          break;
      }

      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 6;
      drawLogomark(ctx, lx, ly, markH, this.#logoColor);
      ctx.restore();
    }

    // Draw text
    let multiplier = 0;
    textboxes.forEach(textbox => {
      const { data } = textbox;
      multiplier += 1;

      ctx.save();
      ctx.font = `${data.fontWeight} ${(data.fontSize * canvas.width) / 1000}px ${data.font}`;
      ctx.textAlign = data.textAlign;
      ctx.strokeStyle = data.strokeColor;

      const xPos = canvas.width / 2;
      const shadowBlur = data.shadowBlur;
      const text = data.allCaps === true ? data.text.toUpperCase() : data.text;
      const textLines = text.split('\n').filter(line => line.trim() !== '');
      const textMetrics = ctx.measureText(textLines[0]);
      const textHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
      const bgOffset = data.textBackgroundEnabled ? textHeight / 4 : 0;
      const lineHeight = textHeight + data.fontSize / 4 + bgOffset;

      ctx.translate(xPos + data.offsetX, lineHeight * multiplier + data.offsetY);
      ctx.rotate((Math.min(data.rotate, MAX_ROTATE) * Math.PI) / 180);

      if (data.textBackgroundEnabled) {
        ctx.fillStyle = data.textBackgroundColor;
        textLines.forEach((line, index) => {
          if (line) {
            const tm = ctx.measureText(line);
            const tw = tm.width;
            const th = tm.actualBoundingBoxAscent + tm.actualBoundingBoxDescent;
            const xOff = data.textAlign === 'left' ? 0 : data.textAlign === 'right' ? -tw : -tw / 2;
            ctx.fillRect(xOff - bgOffset, index * lineHeight - th - bgOffset, tw + bgOffset * 2, th + bgOffset * 2);
          }
        });
      }

      ctx.save();
      if (shadowBlur !== 0) {
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur = Math.min(shadowBlur, MAX_SHADOW_BLUR_SIZE);
        ctx.shadowColor = data.strokeColor;
      }
      ctx.fillStyle = data.fillColor;
      textLines.forEach((text, index) => ctx.fillText(text, 0, index * lineHeight));
      ctx.restore();

      if (data.strokeWidth > 0) {
        ctx.lineWidth = Math.min(data.strokeWidth, MAX_STROKE_WIDTH);
        textLines.forEach((text, index) => ctx.strokeText(text, 0, index * lineHeight));
      }

      ctx.restore();
    });

    return this;
  }

  clear() {
    this.#ctx.clearRect(0, 0, this.#canvas.width, this.#canvas.height);
    return this;
  }

  show() { this.#canvas.hidden = false; return this; }
  hide() { this.#canvas.hidden = true; return this; }

  static createInstance(canvasEl) { return new Canvas(canvasEl); }
}
