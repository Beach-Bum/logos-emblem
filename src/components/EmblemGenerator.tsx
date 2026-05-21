/* ============================================================
   Logos Emblem Generator
   --------------------------------------------------------
   Merges the brand poster generator (SVG templates, themes,
   layouts) with meme-style image overlay (upload, filters,
   text). Exports PNG/SVG. Shares to social.
   ============================================================ */

import { useEffect, useMemo, useRef, useState, useCallback } from "react";

/* ── Logomark path (from /assets/img/logomark.svg, viewBox 0 0 20 26) ── */
const LOGOMARK_PATH =
  "M14.6386 26C13.728 26 12.945 25.7854 12.2881 25.3549C11.6312 24.9244 11.1344 24.2467 10.7962 23.3233C10.5841 22.7003 10.4359 21.9368 10.3513 21.0328C10.2668 20.1302 10.2134 19.1833 10.1926 18.1948C10.1718 17.1842 10.1497 16.2061 10.1289 15.2592C10.1289 15.0017 10.0651 14.8716 9.93897 14.8716C9.83361 14.8716 9.72695 14.9575 9.62159 15.1292C9.21967 15.8822 8.74359 16.742 8.19208 17.7097C7.66268 18.6773 7.13328 19.645 6.60388 20.6127C6.07447 21.5804 5.5984 22.4518 5.17436 23.2257C4.77243 23.9788 4.48627 24.5264 4.31717 24.871C4.10515 25.3445 3.76696 25.6449 3.3013 25.7737C2.85644 25.9246 2.29582 25.9571 1.61814 25.8699C0.940452 25.7841 0.464381 25.5149 0.188624 25.0635C-0.107945 24.5901 -0.0546142 24.0958 0.347315 23.5795C0.623072 23.2348 1.01459 22.7198 1.52188 22.0317C2.03047 21.3216 2.6015 20.5269 3.23626 19.645C3.87102 18.7424 4.51749 17.8176 5.17306 16.8707C5.85075 15.9031 6.48551 14.9783 7.07865 14.0964C7.67178 13.1938 8.16867 12.4082 8.5706 11.7423C8.99464 11.0542 9.26909 10.5483 9.39657 10.2257C9.52404 9.92526 9.66062 9.591 9.8089 9.22551C9.95719 8.86003 10.0313 8.48414 10.0313 8.09655C10.0313 6.67754 9.89345 5.61231 9.61899 4.90345C9.36535 4.17249 9.01545 3.68864 8.5706 3.45193C8.14655 3.1944 7.68089 3.06433 7.1736 3.06433C6.79248 3.06433 6.38015 3.13977 5.9353 3.29065C5.51125 3.44152 5.2368 3.58069 5.10933 3.70945C4.87649 3.94617 4.65407 3.98909 4.44205 3.83822C4.23002 3.68734 4.16629 3.44022 4.25214 3.09685C4.48497 2.30085 4.90901 1.592 5.52296 0.967684C6.13951 0.322561 6.9967 0 8.09713 0C9.26129 0 10.1822 0.332967 10.8599 1.0002C11.5376 1.66743 12.0241 2.73137 12.3206 4.1933C12.6172 5.65523 12.7655 7.5906 12.7655 9.9994C12.7655 12.8374 12.8084 15.1071 12.893 16.8057C12.9775 18.5044 13.1154 19.7842 13.3053 20.6439C13.4952 21.4828 13.7606 22.0421 14.0987 22.3218C14.459 22.6014 14.9026 22.7406 15.432 22.7406C15.9614 22.7406 16.4167 22.6326 16.8615 22.418C17.3272 22.2034 17.7291 21.9238 18.0686 21.5791C18.2169 21.4074 18.386 21.3424 18.5772 21.3853C18.7671 21.4282 18.9154 21.5466 19.022 21.7404C19.1495 21.9121 19.1495 22.1384 19.022 22.418C18.5772 23.4078 17.9841 24.2571 17.2439 24.966C16.5246 25.654 15.6557 25.9987 14.6399 25.9987L14.6386 26Z";
const LOGOMARK_VB_W = 20;
const LOGOMARK_VB_H = 26;

/* ── Templates / Formats ── */
const TEMPLATES = [
  { id: "square",    label: "Social — square",    w: 1080, h: 1080 },
  { id: "story",     label: "Social — story",     w: 1080, h: 1920 },
  { id: "landscape", label: "Social — landscape",  w: 1200, h: 628 },
  { id: "poster",    label: "Poster — A2",         w: 1414, h: 2000 },
  { id: "sticker",   label: "Sticker — circle",    w: 1080, h: 1080 },
] as const;
type Template = (typeof TEMPLATES)[number];

/* ── Color themes ── */
const THEMES = [
  { id: "ink-paper", label: "Ink on paper",   bg: "#f5f5ef", fg: "#152521", accent: "#5f797c" },
  { id: "paper-ink", label: "Paper on ink",   bg: "#152521", fg: "#f5f5ef", accent: "#ffd328" },
  { id: "signal",    label: "Signal yellow",  bg: "#ffd328", fg: "#152521", accent: "#152521" },
  { id: "steel",     label: "Steel",          bg: "#5f797c", fg: "#f5f5ef", accent: "#ffd328" },
  { id: "rust",      label: "Rust",           bg: "#6d3d30", fg: "#f5f5ef", accent: "#ffd328" },
  { id: "plum",      label: "Plum",           bg: "#48373f", fg: "#f5f5ef", accent: "#ffd328" },
  { id: "forest",    label: "Forest",         bg: "#0d2b2d", fg: "#f5f5ef", accent: "#c6ebf7" },
  { id: "sand",      label: "Sand",           bg: "#e2e0c9", fg: "#152521", accent: "#6d3d30" },
] as const;
type Theme = (typeof THEMES)[number];

/* ── Layouts ── */
const LAYOUTS = [
  { id: "stacked",  label: "Stacked — headline left, mark top-left" },
  { id: "centered", label: "Centered — single line, mark above" },
  { id: "split",    label: "Split — eyebrow top, headline bottom" },
  { id: "meme",     label: "Meme — image with top/bottom text" },
] as const;
type Layout = (typeof LAYOUTS)[number];

/* ── Filters ── */
type FilterId = "none" | "dither" | "grain";
const FILTERS: { id: FilterId; label: string }[] = [
  { id: "none", label: "None" },
  { id: "dither", label: "Dither" },
  { id: "grain", label: "Grain" },
];

/* ── Fonts for meme mode ── */
const FONTS = [
  { id: "display", label: "Cormorant Garamond", css: '"Cormorant Garamond", Georgia, serif' },
  { id: "sans", label: "Public Sans", css: '"Public Sans", system-ui, sans-serif' },
  { id: "mono", label: "Fira Code", css: '"Fira Code", monospace' },
];

/* ── Lambda position ── */
type LambdaPos = "top-right" | "center" | "top-left" | "bottom-right";
const LAMBDA_POSITIONS: { id: LambdaPos; label: string }[] = [
  { id: "top-right", label: "Top-right" },
  { id: "top-left", label: "Top-left" },
  { id: "center", label: "Center" },
  { id: "bottom-right", label: "Bottom-right" },
];

/* ── Library (user will add) ── */
const LIBRARY: string[] = [];

/* ── Share ── */
const SITE_URL = "https://logos-emblem.vercel.app";
const SHARE_TEXT = "Made with the Logos Emblem Generator";

/* ── State ── */
type State = {
  template: Template;
  theme: Theme;
  layout: Layout;
  eyebrow: string;
  headline: string;
  meta: string;
  // Meme-specific
  imageSrc: string | null;
  topText: string;
  bottomText: string;
  font: string;
  fontSize: number;
  // Shared
  filter: FilterId;
  showLambda: boolean;
  lambdaPos: LambdaPos;
};

function randomChoice<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const INITIAL: State = {
  template: TEMPLATES[0],
  theme: THEMES[1],
  layout: LAYOUTS[0],
  eyebrow: "Brand Guidelines",
  headline: "Build the parallel.",
  meta: "logos.co",
  imageSrc: null,
  topText: "",
  bottomText: "",
  font: FONTS[0].css,
  fontSize: 72,
  filter: "none",
  showLambda: true,
  lambdaPos: "top-right",
};

/* ── Helpers ── */
function wrapLines(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > maxChars && cur) {
      lines.push(cur);
      cur = w;
    } else {
      cur = (cur + " " + w).trim();
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 6);
}

function triggerDownload(url: string, filename: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/* ── SVG Logomark component (scales the path to target size) ── */
function LogomarkSVG({ x, y, height, color }: { x: number; y: number; height: number; color: string }) {
  const scale = height / LOGOMARK_VB_H;
  const w = LOGOMARK_VB_W * scale;
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <path d={LOGOMARK_PATH} fill={color} />
    </g>
  );
}

/* ── Draw logomark on canvas ── */
function drawLogomarkCanvas(ctx: CanvasRenderingContext2D, x: number, y: number, height: number, color: string) {
  const scale = height / LOGOMARK_VB_H;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  const path = new Path2D(LOGOMARK_PATH);
  ctx.fillStyle = color;
  ctx.fill(path);
  ctx.restore();
}

/* ── Dither (Floyd-Steinberg) applied to canvas imageData ── */
function applyDither(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
  const imageData = ctx.getImageData(0, 0, cw, ch);
  const d = imageData.data;
  const gray = new Float32Array(cw * ch);
  for (let i = 0; i < gray.length; i++) {
    gray[i] = d[i * 4] * 0.299 + d[i * 4 + 1] * 0.587 + d[i * 4 + 2] * 0.114;
  }
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      const idx = y * cw + x;
      const old = gray[idx];
      const val = old > 127 ? 255 : 0;
      gray[idx] = val;
      const err = old - val;
      if (x + 1 < cw) gray[idx + 1] += err * 7 / 16;
      if (y + 1 < ch) {
        if (x > 0) gray[(y + 1) * cw + x - 1] += err * 3 / 16;
        gray[(y + 1) * cw + x] += err * 5 / 16;
        if (x + 1 < cw) gray[(y + 1) * cw + x + 1] += err * 1 / 16;
      }
    }
  }
  for (let i = 0; i < gray.length; i++) {
    const v = Math.max(0, Math.min(255, gray[i]));
    d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v;
  }
  ctx.putImageData(imageData, 0, 0);
}

/* ── Grain applied to canvas imageData ── */
function applyGrain(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
  const imageData = ctx.getImageData(0, 0, cw, ch);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const noise = (Math.random() - 0.5) * 80;
    d[i] = Math.max(0, Math.min(255, d[i] + noise));
    d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + noise));
    d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + noise));
  }
  ctx.putImageData(imageData, 0, 0);
}

/* ============================================================
   COMPONENT
   ============================================================ */
export default function EmblemGenerator() {
  const [s, setS] = useState<State>(INITIAL);
  const svgRef = useRef<SVGSVGElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const set = useCallback(<K extends keyof State>(k: K, v: State[K]) => {
    setS((prev) => ({ ...prev, [k]: v }));
  }, []);

  const isMeme = s.layout.id === "meme";
  const { w, h } = s.template;

  /* ── File upload ── */
  const handleFile = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setS((prev) => ({ ...prev, imageSrc: url, layout: LAYOUTS[3] }));
    };
    img.src = url;
  }, []);

  const pickLibrary = useCallback((src: string) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      setS((prev) => ({ ...prev, imageSrc: src, layout: LAYOUTS[3] }));
    };
    img.src = src;
  }, []);

  /* ── Render meme canvas ── */
  const renderMemeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isMeme) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = w;
    canvas.height = h;

    // Background
    ctx.fillStyle = s.theme.bg;
    ctx.fillRect(0, 0, w, h);

    // Image (cover fit)
    if (imgRef.current) {
      const img = imgRef.current;
      const scale = Math.max(w / img.width, h / img.height);
      const iw = img.width * scale;
      const ih = img.height * scale;
      ctx.drawImage(img, (w - iw) / 2, (h - ih) / 2, iw, ih);
    }

    // Filter
    if (s.filter === "dither") applyDither(ctx, w, h);
    else if (s.filter === "grain") applyGrain(ctx, w, h);

    // Logomark overlay
    if (s.showLambda) {
      const markH = Math.min(w, h) * 0.06;
      const markW = (LOGOMARK_VB_W / LOGOMARK_VB_H) * markH;
      const margin = Math.min(w, h) * 0.04;
      let lx: number, ly: number;

      switch (s.lambdaPos) {
        case "top-left":
          lx = margin;
          ly = margin;
          break;
        case "top-right":
          lx = w - margin - markW;
          ly = margin;
          break;
        case "center":
          lx = (w - markW) / 2;
          ly = (h - markH) / 2;
          break;
        case "bottom-right":
          lx = w - margin - markW;
          ly = h - margin - markH;
          break;
      }

      ctx.globalAlpha = 0.9;
      ctx.shadowColor = "rgba(0,0,0,0.5)";
      ctx.shadowBlur = 6;
      drawLogomarkCanvas(ctx, lx, ly, markH, s.theme.fg);
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
    }

    // Text
    const drawText = (text: string, position: "top" | "bottom") => {
      if (!text) return;
      ctx.save();
      ctx.font = `600 ${s.fontSize}px ${s.font}`;
      ctx.fillStyle = s.theme.fg;
      ctx.textAlign = "center";
      ctx.textBaseline = position === "top" ? "top" : "bottom";
      ctx.shadowColor = "rgba(0,0,0,0.7)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      const maxWidth = w - 80;
      const words = text.split(" ");
      const lines: string[] = [];
      let current = "";
      for (const word of words) {
        const test = current ? `${current} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth && current) {
          lines.push(current);
          current = word;
        } else {
          current = test;
        }
      }
      if (current) lines.push(current);

      const lineHeight = s.fontSize * 1.15;
      const startY = position === "top" ? 40 : h - 40 - (lines.length - 1) * lineHeight;
      lines.forEach((line, i) => {
        ctx.fillText(line, w / 2, startY + i * lineHeight);
      });
      ctx.restore();
    };

    drawText(s.topText, "top");
    drawText(s.bottomText, "bottom");

    // Meta line bottom
    if (s.meta) {
      ctx.save();
      ctx.font = `500 ${Math.round(w * 0.016)}px "Fira Code", monospace`;
      ctx.fillStyle = s.theme.fg;
      ctx.globalAlpha = 0.65;
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.shadowColor = "rgba(0,0,0,0.4)";
      ctx.shadowBlur = 4;
      ctx.fillText(s.meta.toUpperCase(), 32, h - 20);
      ctx.restore();
    }
  }, [s, w, h, isMeme]);

  useEffect(() => { renderMemeCanvas(); }, [renderMemeCanvas]);

  /* ── SVG Poster (for non-meme layouts) ── */
  const Poster = useMemo(() => {
    if (isMeme) return null;
    const { bg, fg, accent } = s.theme;
    const pad = Math.round(Math.min(w, h) * 0.07);
    const isSticker = s.template.id === "sticker";
    const markH = Math.min(w, h) * 0.08;

    /* SVG filter defs for grain */
    const filterDefs = s.filter === "grain" ? (
      <defs>
        <filter id="grain-filter" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" result="noise" />
          <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise" />
          <feBlend in="SourceGraphic" in2="grayNoise" mode="multiply" result="blended" />
          <feComponentTransfer in="blended">
            <feFuncR type="linear" slope="1.2" intercept="-0.1" />
            <feFuncG type="linear" slope="1.2" intercept="-0.1" />
            <feFuncB type="linear" slope="1.2" intercept="-0.1" />
          </feComponentTransfer>
        </filter>
      </defs>
    ) : null;

    const filterAttr = s.filter === "grain" ? "url(#grain-filter)" : undefined;

    let body: JSX.Element;
    if (s.layout.id === "centered") {
      const size = Math.min(w, h) * 0.11;
      body = (
        <>
          {s.showLambda && (
            <LogomarkSVG
              x={w / 2 - (LOGOMARK_VB_W / LOGOMARK_VB_H) * (markH * 0.4) / 2}
              y={h / 2 - size * 1.2}
              height={markH * 0.4}
              color={accent}
            />
          )}
          <text
            x={w / 2} y={h / 2 + size * 0.2}
            textAnchor="middle"
            fontFamily="Cormorant Garamond, Georgia, serif"
            fontSize={size}
            fill={fg}
            style={{ letterSpacing: "-0.03em" }}
          >
            {s.headline || "Headline"}
          </text>
        </>
      );
    } else if (s.layout.id === "split") {
      const size = Math.min(w, h) * 0.13;
      body = (
        <>
          <text
            x={pad} y={pad * 1.3}
            fontFamily="Fira Code, monospace"
            fontSize={w * 0.018}
            letterSpacing="0.12em"
            fill={fg}
            style={{ textTransform: "uppercase" }}
          >
            {(s.eyebrow || "EYEBROW").toUpperCase()}
          </text>
          {s.showLambda && (
            <LogomarkSVG x={w - pad - (LOGOMARK_VB_W / LOGOMARK_VB_H) * markH} y={pad * 0.6} height={markH} color={accent} />
          )}
          <text
            x={pad} y={h - pad - size * 0.1}
            fontFamily="Cormorant Garamond, Georgia, serif"
            fontSize={size}
            fill={fg}
            style={{ letterSpacing: "-0.03em" }}
          >
            <tspan x={pad} dy={-size * 1.05}>{s.headline || "Headline"}</tspan>
          </text>
        </>
      );
    } else {
      // stacked (default)
      const size = Math.min(w, h) * 0.1;
      body = (
        <>
          {s.showLambda && (
            <LogomarkSVG x={pad} y={pad * 0.6} height={markH} color={accent} />
          )}
          <text
            x={pad} y={pad * 2.4}
            fontFamily="Fira Code, monospace"
            fontSize={w * 0.016}
            letterSpacing="0.12em"
            fill={fg}
            opacity={0.7}
            style={{ textTransform: "uppercase" }}
          >
            {(s.eyebrow || "EYEBROW").toUpperCase()}
          </text>
          <text
            x={pad} y={h * 0.55}
            fontFamily="Cormorant Garamond, Georgia, serif"
            fontSize={size}
            fill={fg}
            style={{ letterSpacing: "-0.03em" }}
          >
            {wrapLines(s.headline || "Headline", 14).map((line, i) => (
              <tspan key={i} x={pad} dy={i === 0 ? 0 : size * 1.0}>{line}</tspan>
            ))}
          </text>
        </>
      );
    }

    return (
      <svg
        ref={svgRef}
        xmlns="http://www.w3.org/2000/svg"
        viewBox={`0 0 ${w} ${h}`}
        width={w}
        height={h}
        style={{ display: "block", width: "100%", height: "auto", background: bg }}
      >
        {filterDefs}
        {isSticker ? (
          <circle cx={w / 2} cy={h / 2} r={w / 2} fill={bg} />
        ) : (
          <rect x={0} y={0} width={w} height={h} fill={bg} />
        )}
        {isSticker && (
          <clipPath id="sticker-clip"><circle cx={w / 2} cy={h / 2} r={w / 2} /></clipPath>
        )}
        <g clipPath={isSticker ? "url(#sticker-clip)" : undefined} filter={filterAttr}>
          {body}
          {/* foot meta strip */}
          <line x1={pad} y1={h - pad * 0.8} x2={w - pad} y2={h - pad * 0.8} stroke={fg} strokeOpacity={0.4} strokeWidth={1} />
          <text
            x={pad} y={h - pad * 0.4}
            fontFamily="Fira Code, monospace"
            fontSize={w * 0.013}
            letterSpacing="0.12em"
            fill={fg}
            opacity={0.7}
            style={{ textTransform: "uppercase" }}
          >
            {(s.meta || "logos.co").toUpperCase()}
          </text>
          <text
            x={w - pad} y={h - pad * 0.4}
            textAnchor="end"
            fontFamily="Fira Code, monospace"
            fontSize={w * 0.013}
            letterSpacing="0.12em"
            fill={fg}
            opacity={0.7}
          >
            LOGOS
          </text>
        </g>
      </svg>
    );
  }, [s.template, s.theme, s.layout, s.eyebrow, s.headline, s.meta, s.showLambda, s.lambdaPos, s.filter, w, h, isMeme]);

  /* ── Downloads ── */
  async function downloadPNG() {
    if (isMeme) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      triggerDownload(canvas.toDataURL("image/png"), `logos-${s.template.id}.png`);
      return;
    }
    if (!svgRef.current) return;
    const xml = new XMLSerializer().serializeToString(svgRef.current);
    const svgBlob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = url;
    await new Promise((r, j) => { img.onload = r; img.onerror = j; });
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, w, h);
    URL.revokeObjectURL(url);

    // Apply dither filter to PNG export (can't do in SVG preview)
    if (s.filter === "dither") applyDither(ctx, w, h);

    triggerDownload(canvas.toDataURL("image/png"), `logos-${s.template.id}.png`);
  }

  function downloadSVG() {
    if (isMeme || !svgRef.current) return;
    const xml = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    triggerDownload(url, `logos-${s.template.id}.svg`);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function copyToClipboard() {
    let canvas: HTMLCanvasElement;
    if (isMeme) {
      if (!canvasRef.current) return;
      canvas = canvasRef.current;
    } else {
      if (!svgRef.current) return;
      const xml = new XMLSerializer().serializeToString(svgRef.current);
      const svgBlob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = url;
      await new Promise((r) => { img.onload = r; });
      canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      if (s.filter === "dither") applyDither(canvas.getContext("2d")!, w, h);
    }
    try {
      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), "image/png")
      );
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    } catch {
      downloadPNG();
    }
  }

  /* ── Randomizer ── */
  const randomize = () => {
    setS((prev) => ({
      ...prev,
      theme: randomChoice(THEMES),
      filter: randomChoice(FILTERS).id,
      font: randomChoice(FONTS).css,
      fontSize: 48 + Math.floor(Math.random() * 72),
      lambdaPos: randomChoice(LAMBDA_POSITIONS).id,
      ...(prev.layout.id !== "meme" ? { layout: randomChoice(LAYOUTS.slice(0, 3)) } : {}),
    }));
  };

  /* ── Share ── */
  async function nativeShare() {
    try {
      let blob: Blob;
      if (isMeme && canvasRef.current) {
        blob = await new Promise<Blob>((r) => canvasRef.current!.toBlob((b) => r(b!), "image/png"));
      } else {
        return;
      }
      const file = new File([blob], "logos-emblem.png", { type: "image/png" });
      await navigator.share({ text: SHARE_TEXT, url: SITE_URL, files: [file] });
    } catch { /* cancelled */ }
  }

  return (
    <>
      <div className="gen">
        {/* ── Controls ── */}
        <aside className="gen__controls">
          {/* Template */}
          <Field label="Format">
            <select
              value={s.template.id}
              onChange={(e) => set("template", TEMPLATES.find((t) => t.id === e.target.value)!)}
            >
              {TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>{t.label} · {t.w}×{t.h}</option>
              ))}
            </select>
          </Field>

          {/* Layout */}
          <Field label="Layout">
            <select
              value={s.layout.id}
              onChange={(e) => set("layout", LAYOUTS.find((l) => l.id === e.target.value)!)}
            >
              {LAYOUTS.map((l) => (
                <option key={l.id} value={l.id}>{l.label}</option>
              ))}
            </select>
          </Field>

          {/* Theme */}
          <Field label="Theme">
            <div className="gen__swatches">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  className={`gen__swatch${s.theme.id === t.id ? " is-active" : ""}`}
                  onClick={() => set("theme", t)}
                  title={t.label}
                  style={{
                    background: t.bg,
                    color: t.fg,
                    borderColor: s.theme.id === t.id ? t.fg : "transparent",
                  }}
                >
                  <span style={{ color: t.accent, fontFamily: "Cormorant Garamond, serif", fontStyle: "italic", fontSize: 16 }}>λ</span>
                </button>
              ))}
            </div>
          </Field>

          {/* Image upload */}
          <Field label="Image">
            <div
              className="gen__upload"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const file = e.dataTransfer.files[0];
                if (file) handleFile(file);
              }}
            >
              {s.imageSrc ? "Change image" : "Drop image or click to upload"}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </Field>

          {/* Poster fields (non-meme) */}
          {!isMeme && (
            <>
              <Field label="Eyebrow">
                <input value={s.eyebrow} onChange={(e) => set("eyebrow", e.target.value)} placeholder="EYEBROW" />
              </Field>
              <Field label="Headline">
                <textarea value={s.headline} onChange={(e) => set("headline", e.target.value)} placeholder="Headline" rows={3} />
              </Field>
            </>
          )}

          {/* Meme fields */}
          {isMeme && (
            <>
              <Field label="Top text">
                <input value={s.topText} onChange={(e) => set("topText", e.target.value)} placeholder="Top line..." />
              </Field>
              <Field label="Bottom text">
                <input value={s.bottomText} onChange={(e) => set("bottomText", e.target.value)} placeholder="Bottom line..." />
              </Field>
              <Field label="Font">
                <select value={s.font} onChange={(e) => set("font", e.target.value)}>
                  {FONTS.map((f) => (
                    <option key={f.id} value={f.css}>{f.label}</option>
                  ))}
                </select>
              </Field>
              <Field label={`Font size (${s.fontSize}px)`}>
                <input
                  className="gen__range"
                  type="range"
                  min={24}
                  max={160}
                  value={s.fontSize}
                  onChange={(e) => set("fontSize", Number(e.target.value))}
                />
              </Field>
            </>
          )}

          {/* Filter — available in ALL modes */}
          <Field label="Filter">
            <select value={s.filter} onChange={(e) => set("filter", e.target.value as FilterId)}>
              {FILTERS.map((f) => (
                <option key={f.id} value={f.id}>{f.label}{!isMeme && f.id === "dither" ? " (PNG export)" : ""}</option>
              ))}
            </select>
          </Field>

          {/* Meta line */}
          <Field label="Meta line">
            <input value={s.meta} onChange={(e) => set("meta", e.target.value)} placeholder="logos.co" />
          </Field>

          {/* Lambda position + toggle — available in ALL modes */}
          <Field label="Logomark position">
            <select value={s.lambdaPos} onChange={(e) => set("lambdaPos", e.target.value as LambdaPos)}>
              {LAMBDA_POSITIONS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </Field>
          <label className="gen__field-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <input
              type="checkbox"
              checked={s.showLambda}
              onChange={(e) => set("showLambda", e.target.checked)}
            />
            Show logomark
          </label>

          {/* Actions */}
          <div className="gen__actions">
            <button className="gen__btn" onClick={randomize}>Mix</button>
            <button className="gen__btn gen__btn--solid" onClick={downloadPNG}>PNG</button>
            {!isMeme && <button className="gen__btn" onClick={downloadSVG}>SVG</button>}
            <button className="gen__btn" onClick={copyToClipboard}>Copy</button>
          </div>

          {/* Share */}
          <Field label="Share">
            <div className="gen__share">
              <ShareBtn label="X" onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(SITE_URL)}`, "_blank")} />
              <ShareBtn label="Bluesky" onClick={() => window.open(`https://bsky.app/intent/compose?text=${encodeURIComponent(`${SHARE_TEXT} ${SITE_URL}`)}`, "_blank")} />
              <ShareBtn label="LinkedIn" onClick={() => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(SITE_URL)}`, "_blank")} />
              <ShareBtn label="Telegram" onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(SITE_URL)}&text=${encodeURIComponent(SHARE_TEXT)}`, "_blank")} />
              <ShareBtn label="Reddit" onClick={() => window.open(`https://reddit.com/submit?url=${encodeURIComponent(SITE_URL)}&title=${encodeURIComponent(SHARE_TEXT)}`, "_blank")} />
              {typeof navigator !== "undefined" && navigator.share && (
                <button className="gen__share-btn gen__share-btn--native" onClick={nativeShare} title="Share with image">
                  Share...
                </button>
              )}
            </div>
          </Field>

          <p className="gen__help">
            {isMeme
              ? "Upload an image, add text, apply filters. Download or share."
              : s.filter === "dither"
                ? "Dither is applied on PNG/Copy export. Grain renders live in SVG preview."
                : "PNG is rendered from the live SVG. Grain + dither filters work on all exports."}
          </p>
        </aside>

        {/* ── Preview ── */}
        <div className="gen__preview">
          <div className="gen__canvas-wrap" style={{ background: s.theme.bg }}>
            {isMeme ? (
              <canvas ref={canvasRef} width={w} height={h} />
            ) : (
              Poster
            )}
          </div>
        </div>
      </div>

      {/* ── Image library ── */}
      {LIBRARY.length > 0 && (
        <div className="gen__library">
          <p className="bg-mono" style={{ margin: "0 0 12px" }}>Library</p>
          <div className="gen__library-grid">
            {LIBRARY.map((src, i) => (
              <img
                key={i}
                src={src}
                className={`gen__library-item${s.imageSrc === src ? " is-active" : ""}`}
                onClick={() => pickLibrary(src)}
                alt={`Template ${i + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/* ── Sub-components ── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="gen__field">
      <span className="gen__field-label">{label}</span>
      {children}
    </div>
  );
}

function ShareBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button className="gen__share-btn" onClick={onClick} title={`Share to ${label}`}>
      {label}
    </button>
  );
}
