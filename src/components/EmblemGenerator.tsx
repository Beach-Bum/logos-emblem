import { useState, useRef, useCallback, useEffect } from "react";

/* ── Brand palette ── */
const PALETTE = [
  { name: "Paper", hex: "#f5f5ef" },
  { name: "Ink", hex: "#152521" },
  { name: "Signal", hex: "#ffd328" },
  { name: "Fog", hex: "#dbddd7" },
  { name: "Slate", hex: "#475651" },
  { name: "Steel", hex: "#5f797c" },
  { name: "Rust", hex: "#6d3d30" },
  { name: "Plum", hex: "#48373f" },
  { name: "Sky", hex: "#c6ebf7" },
  { name: "Moss", hex: "#616e69" },
  { name: "Forest", hex: "#0d2b2d" },
  { name: "Sand", hex: "#e2e0c9" },
];

/* ── Filters ── */
type FilterId = "none" | "dither" | "grain";
const FILTERS: { id: FilterId; label: string }[] = [
  { id: "none", label: "None" },
  { id: "dither", label: "Dither" },
  { id: "grain", label: "Grain" },
];

/* ── Fonts ── */
const FONTS = [
  { id: "display", label: "Cormorant Garamond", css: '"Cormorant Garamond", Georgia, serif' },
  { id: "sans", label: "Public Sans", css: '"Public Sans", system-ui, sans-serif' },
  { id: "mono", label: "Fira Code", css: '"Fira Code", monospace' },
];

/* ── Library (user will populate) ── */
const LIBRARY: string[] = [];

/* ── Canvas ── */
const CW = 1080;
const CH = 1080;

/* ── Vector lambda path — traced from Logos brand mark ── */
function drawLambda(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, color: string) {
  // Lambda drawn in a 100x140 viewbox, scaled to height h
  const scale = h / 140;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.beginPath();
  // Traced from the Logos lambda mark
  ctx.moveTo(38, 0);
  ctx.bezierCurveTo(36, 0, 34, 1, 33, 3);
  ctx.lineTo(0, 95);
  ctx.bezierCurveTo(-1, 98, 1, 100, 4, 100);
  ctx.lineTo(14, 100);
  ctx.bezierCurveTo(17, 100, 19, 98, 20, 95);
  ctx.lineTo(44, 32);
  ctx.lineTo(68, 95);
  ctx.bezierCurveTo(69, 98, 71, 100, 74, 100);
  ctx.lineTo(84, 100);
  ctx.bezierCurveTo(87, 100, 89, 98, 88, 95);
  // Right descender with calligraphic curve
  ctx.lineTo(88, 95);
  ctx.bezierCurveTo(88, 95, 92, 108, 86, 120);
  ctx.bezierCurveTo(80, 132, 65, 138, 50, 140);
  ctx.bezierCurveTo(48, 140, 46, 139, 46, 137);
  ctx.lineTo(46, 130);
  ctx.bezierCurveTo(46, 128, 48, 127, 50, 127);
  ctx.bezierCurveTo(60, 126, 70, 122, 74, 114);
  ctx.bezierCurveTo(78, 106, 76, 98, 76, 98);
  ctx.lineTo(48, 22);
  ctx.bezierCurveTo(46, 17, 44, 8, 44, 3);
  ctx.bezierCurveTo(44, 1, 42, 0, 40, 0);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

type State = {
  imageSrc: string | null;
  topText: string;
  bottomText: string;
  font: string;
  textColor: string;
  filter: FilterId;
  showEmblem: boolean;
  emblemColor: string;
  fontSize: number;
};

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const INITIAL: State = {
  imageSrc: null,
  topText: "",
  bottomText: "",
  font: FONTS[0].css,
  textColor: "#f5f5ef",
  filter: "none",
  showEmblem: true,
  emblemColor: "#f5f5ef",
  fontSize: 72,
};

/* ── Social share URLs ── */
const SITE_URL = "https://logos-emblem.vercel.app";
const SHARE_TEXT = "Made with the Logos Emblem Generator";

function shareToX() {
  window.open(
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(SHARE_TEXT)}&url=${encodeURIComponent(SITE_URL)}`,
    "_blank",
  );
}

function shareToBluesky() {
  window.open(
    `https://bsky.app/intent/compose?text=${encodeURIComponent(`${SHARE_TEXT} ${SITE_URL}`)}`,
    "_blank",
  );
}

function shareToLinkedIn() {
  window.open(
    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(SITE_URL)}`,
    "_blank",
  );
}

function shareToTelegram() {
  window.open(
    `https://t.me/share/url?url=${encodeURIComponent(SITE_URL)}&text=${encodeURIComponent(SHARE_TEXT)}`,
    "_blank",
  );
}

function shareToReddit() {
  window.open(
    `https://reddit.com/submit?url=${encodeURIComponent(SITE_URL)}&title=${encodeURIComponent(SHARE_TEXT)}`,
    "_blank",
  );
}

export default function EmblemGenerator() {
  const [s, setS] = useState<State>(INITIAL);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const set = useCallback(<K extends keyof State>(k: K, v: State[K]) => {
    setS((prev) => ({ ...prev, [k]: v }));
  }, []);

  /* ── File upload ── */
  const handleFile = useCallback((file: File) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      set("imageSrc", url);
    };
    img.src = url;
  }, [set]);

  /* ── Library pick ── */
  const pickLibrary = useCallback((src: string) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      set("imageSrc", src);
    };
    img.src = src;
  }, [set]);

  /* ── Apply pixel filters ── */
  const applyFilter = useCallback((ctx: CanvasRenderingContext2D) => {
    if (s.filter === "none") return;
    const imageData = ctx.getImageData(0, 0, CW, CH);
    const d = imageData.data;

    switch (s.filter) {
      case "dither": {
        const gray = new Float32Array(CW * CH);
        for (let i = 0; i < gray.length; i++) {
          gray[i] = d[i * 4] * 0.299 + d[i * 4 + 1] * 0.587 + d[i * 4 + 2] * 0.114;
        }
        for (let y = 0; y < CH; y++) {
          for (let x = 0; x < CW; x++) {
            const idx = y * CW + x;
            const old = gray[idx];
            const val = old > 127 ? 255 : 0;
            gray[idx] = val;
            const err = old - val;
            if (x + 1 < CW) gray[idx + 1] += err * 7 / 16;
            if (y + 1 < CH) {
              if (x > 0) gray[(y + 1) * CW + x - 1] += err * 3 / 16;
              gray[(y + 1) * CW + x] += err * 5 / 16;
              if (x + 1 < CW) gray[(y + 1) * CW + x + 1] += err * 1 / 16;
            }
          }
        }
        for (let i = 0; i < gray.length; i++) {
          const v = Math.max(0, Math.min(255, gray[i]));
          d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v;
        }
        break;
      }

      case "grain": {
        for (let i = 0; i < d.length; i += 4) {
          const noise = (Math.random() - 0.5) * 80;
          d[i] = Math.max(0, Math.min(255, d[i] + noise));
          d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + noise));
          d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + noise));
        }
        break;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, [s.filter]);

  /* ── Render canvas ── */
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background
    ctx.fillStyle = "#152521";
    ctx.fillRect(0, 0, CW, CH);

    // Image
    if (imgRef.current) {
      const img = imgRef.current;
      const scale = Math.max(CW / img.width, CH / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      ctx.drawImage(img, (CW - w) / 2, (CH - h) / 2, w, h);
    }

    // Filter
    applyFilter(ctx);

    // Lambda emblem — fixed top-right corner, vector-drawn
    if (s.showEmblem) {
      const emblemHeight = 64;
      const margin = 32;
      const emblemWidth = emblemHeight * (100 / 140); // viewbox ratio
      const ex = CW - margin - emblemWidth;
      const ey = margin;
      ctx.globalAlpha = 0.9;
      drawLambda(ctx, ex, ey, emblemHeight, s.emblemColor);
      ctx.globalAlpha = 1;
    }

    // Text
    const drawText = (text: string, position: "top" | "bottom") => {
      if (!text) return;
      ctx.save();
      ctx.font = `600 ${s.fontSize}px ${s.font}`;
      ctx.fillStyle = s.textColor;
      ctx.textAlign = "center";
      ctx.textBaseline = position === "top" ? "top" : "bottom";

      ctx.shadowColor = "rgba(0,0,0,0.7)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      const maxWidth = CW - 80;
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
      const startY = position === "top" ? 40 : CH - 40 - (lines.length - 1) * lineHeight;

      lines.forEach((line, i) => {
        ctx.fillText(line, CW / 2, startY + i * lineHeight);
      });
      ctx.restore();
    };

    drawText(s.topText, "top");
    drawText(s.bottomText, "bottom");
  }, [s, applyFilter]);

  useEffect(() => { render(); }, [render]);

  /* ── Randomizer ── */
  const randomize = () => {
    setS((prev) => ({
      ...prev,
      filter: randomChoice(FILTERS).id,
      textColor: randomChoice(PALETTE).hex,
      emblemColor: randomChoice(PALETTE).hex,
      font: randomChoice(FONTS).css,
      fontSize: 48 + Math.floor(Math.random() * 72),
      showEmblem: true,
    }));
  };

  /* ── Download ── */
  const download = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "logos-emblem.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  /* ── Copy to clipboard ── */
  const copyToClipboard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), "image/png")
      );
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    } catch {
      download();
    }
  };

  /* ── Native share (mobile) ── */
  const nativeShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !navigator.share) return;
    try {
      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), "image/png")
      );
      const file = new File([blob], "logos-emblem.png", { type: "image/png" });
      await navigator.share({ text: SHARE_TEXT, url: SITE_URL, files: [file] });
    } catch {
      // User cancelled or not supported
    }
  };

  return (
    <>
      <div className="gen">
        {/* ── Controls ── */}
        <div className="gen__controls">
          {/* Image */}
          <div className="gen__field">
            <label className="gen__field-label">Image</label>
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
          </div>

          {/* Top text */}
          <div className="gen__field">
            <label className="gen__field-label">Top text</label>
            <input
              type="text"
              value={s.topText}
              onChange={(e) => set("topText", e.target.value)}
              placeholder="Top line..."
            />
          </div>

          {/* Bottom text */}
          <div className="gen__field">
            <label className="gen__field-label">Bottom text</label>
            <input
              type="text"
              value={s.bottomText}
              onChange={(e) => set("bottomText", e.target.value)}
              placeholder="Bottom line..."
            />
          </div>

          {/* Font */}
          <div className="gen__field">
            <label className="gen__field-label">Font</label>
            <select value={s.font} onChange={(e) => set("font", e.target.value)}>
              {FONTS.map((f) => (
                <option key={f.id} value={f.css}>{f.label}</option>
              ))}
            </select>
          </div>

          {/* Font size */}
          <div className="gen__field">
            <label className="gen__field-label">Font size ({s.fontSize}px)</label>
            <input
              className="gen__range"
              type="range"
              min={24}
              max={160}
              value={s.fontSize}
              onChange={(e) => set("fontSize", Number(e.target.value))}
            />
          </div>

          {/* Text color */}
          <div className="gen__field">
            <label className="gen__field-label">Text color</label>
            <div className="gen__swatches">
              {PALETTE.map((c) => (
                <div
                  key={c.hex}
                  className={`gen__swatch${s.textColor === c.hex ? " is-active" : ""}`}
                  style={{ background: c.hex, border: c.hex === "#f5f5ef" ? "1px solid #d6d6ce" : undefined }}
                  title={c.name}
                  onClick={() => set("textColor", c.hex)}
                />
              ))}
            </div>
          </div>

          {/* Filter */}
          <div className="gen__field">
            <label className="gen__field-label">Filter</label>
            <select value={s.filter} onChange={(e) => set("filter", e.target.value as FilterId)}>
              {FILTERS.map((f) => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
          </div>

          {/* Emblem */}
          <div className="gen__field">
            <label className="gen__field-label">
              <input
                type="checkbox"
                checked={s.showEmblem}
                onChange={(e) => set("showEmblem", e.target.checked)}
                style={{ marginRight: 6 }}
              />
              Lambda emblem (top-right)
            </label>
          </div>

          {s.showEmblem && (
            <div className="gen__field">
              <label className="gen__field-label">Emblem color</label>
              <div className="gen__swatches">
                {PALETTE.map((c) => (
                  <div
                    key={`e-${c.hex}`}
                    className={`gen__swatch${s.emblemColor === c.hex ? " is-active" : ""}`}
                    style={{ background: c.hex, border: c.hex === "#f5f5ef" ? "1px solid #d6d6ce" : undefined }}
                    title={c.name}
                    onClick={() => set("emblemColor", c.hex)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="gen__actions">
            <button className="gen__btn" onClick={randomize}>Mix</button>
            <button className="gen__btn gen__btn--solid" onClick={download}>Download</button>
            <button className="gen__btn" onClick={copyToClipboard}>Copy</button>
          </div>

          {/* Share */}
          <div className="gen__field">
            <label className="gen__field-label">Share</label>
            <div className="gen__share">
              <button className="gen__share-btn" onClick={shareToX} title="Share to X">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              </button>
              <button className="gen__share-btn" onClick={shareToBluesky} title="Share to Bluesky">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.862 14.17c-.122.36-.596.586-1.186.586-.797 0-1.47-.454-2.142-1.072-.448-.412-.87-.912-1.33-.912h-.408c-.46 0-.882.5-1.33.912-.672.618-1.345 1.072-2.142 1.072-.59 0-1.064-.226-1.186-.587-.21-.624.36-1.494 1.386-2.482.684-.66 1.512-1.29 2.222-1.71.252-.15.492-.278.694-.378a4.35 4.35 0 0 1-.694-.378c-.71-.42-1.538-1.05-2.222-1.71-1.026-.988-1.596-1.858-1.386-2.482.122-.36.596-.587 1.186-.587.797 0 1.47.454 2.142 1.072.448.413.87.912 1.33.912h.408c.46 0 .882-.5 1.33-.912C13.006 7.454 13.679 7 14.476 7c.59 0 1.064.227 1.186.587.21.624-.36 1.494-1.386 2.482-.684.66-1.512 1.29-2.222 1.71a6.1 6.1 0 0 1-.694.378c.202.1.442.228.694.378.71.42 1.538 1.05 2.222 1.71 1.026.988 1.596 1.858 1.386 2.482z"/></svg>
              </button>
              <button className="gen__share-btn" onClick={shareToLinkedIn} title="Share to LinkedIn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
              </button>
              <button className="gen__share-btn" onClick={shareToTelegram} title="Share to Telegram">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              </button>
              <button className="gen__share-btn" onClick={shareToReddit} title="Share to Reddit">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>
              </button>
              {typeof navigator !== "undefined" && navigator.share && (
                <button className="gen__share-btn gen__share-btn--native" onClick={nativeShare} title="Share with image">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Preview ── */}
        <div className="gen__preview">
          <div className="gen__canvas-wrap">
            <canvas
              ref={canvasRef}
              width={CW}
              height={CH}
            />
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
