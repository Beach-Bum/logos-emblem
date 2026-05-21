import { useState, useRef, useCallback, useEffect } from "react";

/* ── Brand palette for text color picker ── */
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

/* ── Filter definitions ── */
type FilterId = "none" | "dither" | "grayscale" | "posterize" | "highcontrast" | "thermal" | "grain";
const FILTERS: { id: FilterId; label: string }[] = [
  { id: "none", label: "None" },
  { id: "dither", label: "Dither" },
  { id: "grayscale", label: "Grayscale" },
  { id: "posterize", label: "Posterize" },
  { id: "highcontrast", label: "Hi-Con" },
  { id: "thermal", label: "Thermal" },
  { id: "grain", label: "Grain" },
];

/* ── Font options ── */
const FONTS = [
  { id: "display", label: "Cormorant Garamond", css: '"Cormorant Garamond", Georgia, serif' },
  { id: "sans", label: "Public Sans", css: '"Public Sans", system-ui, sans-serif' },
  { id: "mono", label: "Fira Code", css: '"Fira Code", monospace' },
];

/* ── Text position presets ── */
type TextPosition = "top" | "bottom" | "center";

/* ── Pre-populated library (placeholder — user will add images) ── */
const LIBRARY: string[] = [];

/* ── Canvas dimensions ── */
const CW = 1080;
const CH = 1080;

/* ── Lambda overlay as inline SVG path ── */
const LAMBDA_PATH = "M 20 2 L 50 98 L 80 2 L 72 2 L 50 78 L 28 2 Z";

type State = {
  imageSrc: string | null;
  topText: string;
  bottomText: string;
  font: string;
  textColor: string;
  filter: FilterId;
  emblemScale: number;
  emblemX: number;
  emblemY: number;
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
  emblemScale: 0.2,
  emblemX: 0.5,
  emblemY: 0.5,
  showEmblem: true,
  emblemColor: "#f5f5ef",
  fontSize: 72,
};

export default function EmblemGenerator() {
  const [s, setS] = useState<State>(INITIAL);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const lambdaImgRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{ dragging: boolean; offsetX: number; offsetY: number }>({
    dragging: false, offsetX: 0, offsetY: 0,
  });

  const set = useCallback(<K extends keyof State>(k: K, v: State[K]) => {
    setS((prev) => ({ ...prev, [k]: v }));
  }, []);

  /* Load lambda image once */
  useEffect(() => {
    const img = new Image();
    img.src = "/assets/img/logo-lambda.png";
    img.onload = () => { lambdaImgRef.current = img; };
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
      case "grayscale":
        for (let i = 0; i < d.length; i += 4) {
          const avg = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114;
          d[i] = d[i + 1] = d[i + 2] = avg;
        }
        break;

      case "dither": {
        // Floyd-Steinberg dithering
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

      case "posterize": {
        const levels = 4;
        const step = 255 / (levels - 1);
        for (let i = 0; i < d.length; i += 4) {
          d[i] = Math.round(d[i] / step) * step;
          d[i + 1] = Math.round(d[i + 1] / step) * step;
          d[i + 2] = Math.round(d[i + 2] / step) * step;
        }
        break;
      }

      case "highcontrast":
        for (let i = 0; i < d.length; i += 4) {
          d[i] = d[i] > 127 ? 255 : 0;
          d[i + 1] = d[i + 1] > 127 ? 255 : 0;
          d[i + 2] = d[i + 2] > 127 ? 255 : 0;
        }
        break;

      case "thermal":
        for (let i = 0; i < d.length; i += 4) {
          const avg = (d[i] + d[i + 1] + d[i + 2]) / 3;
          const t = avg / 255;
          // Logos thermal: forest -> rust -> signal
          d[i] = Math.round(13 + t * (255 - 13));     // R: forest to signal
          d[i + 1] = Math.round(43 + t * (211 - 43));  // G
          d[i + 2] = Math.round(45 + t * (40 - 45));   // B: cool to warm
        }
        break;

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

    // Lambda emblem overlay — tint via offscreen canvas
    if (s.showEmblem && lambdaImgRef.current) {
      const size = CW * s.emblemScale;
      const x = s.emblemX * CW - size / 2;
      const y = s.emblemY * CH - size / 2;

      // Tint on offscreen canvas so source-atop doesn't affect main canvas
      const off = document.createElement("canvas");
      off.width = Math.ceil(size);
      off.height = Math.ceil(size);
      const oc = off.getContext("2d")!;
      oc.drawImage(lambdaImgRef.current, 0, 0, off.width, off.height);
      oc.globalCompositeOperation = "source-atop";
      oc.fillStyle = s.emblemColor;
      oc.fillRect(0, 0, off.width, off.height);

      ctx.globalAlpha = 0.85;
      ctx.drawImage(off, x, y);
      ctx.globalAlpha = 1;
    }

    // Text rendering helper
    const drawText = (text: string, position: "top" | "bottom") => {
      if (!text) return;
      ctx.save();
      ctx.font = `600 ${s.fontSize}px ${s.font}`;
      ctx.fillStyle = s.textColor;
      ctx.textAlign = "center";
      ctx.textBaseline = position === "top" ? "top" : "bottom";

      // Text shadow for readability
      ctx.shadowColor = "rgba(0,0,0,0.7)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      // Word wrap
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

  /* Re-render on state change */
  useEffect(() => { render(); }, [render]);

  /* ── Emblem drag on canvas ── */
  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  };

  const onCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!s.showEmblem) return;
    const pos = getCanvasPos(e);
    const halfSize = s.emblemScale / 2;
    if (
      Math.abs(pos.x - s.emblemX) < halfSize &&
      Math.abs(pos.y - s.emblemY) < halfSize
    ) {
      dragRef.current = {
        dragging: true,
        offsetX: pos.x - s.emblemX,
        offsetY: pos.y - s.emblemY,
      };
    }
  };

  const onCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragRef.current.dragging) return;
    const pos = getCanvasPos(e);
    setS((prev) => ({
      ...prev,
      emblemX: Math.max(0, Math.min(1, pos.x - dragRef.current.offsetX)),
      emblemY: Math.max(0, Math.min(1, pos.y - dragRef.current.offsetY)),
    }));
  };

  const onCanvasMouseUp = () => { dragRef.current.dragging = false; };

  /* ── Randomizer ── */
  const randomize = () => {
    setS((prev) => ({
      ...prev,
      filter: randomChoice(FILTERS).id,
      textColor: randomChoice(PALETTE).hex,
      emblemColor: randomChoice(PALETTE).hex,
      emblemScale: 0.1 + Math.random() * 0.35,
      emblemX: 0.15 + Math.random() * 0.7,
      emblemY: 0.15 + Math.random() * 0.7,
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
      // Fallback: just download
      download();
    }
  };

  return (
    <>
      <div className="gen">
        {/* ── Controls panel ── */}
        <div className="gen__controls">
          {/* Image source */}
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

          {/* Emblem toggle + controls */}
          <div className="gen__field">
            <label className="gen__field-label">
              <input
                type="checkbox"
                checked={s.showEmblem}
                onChange={(e) => set("showEmblem", e.target.checked)}
                style={{ marginRight: 6 }}
              />
              Lambda emblem
            </label>
          </div>

          {s.showEmblem && (
            <>
              <div className="gen__field">
                <label className="gen__field-label">Emblem size ({Math.round(s.emblemScale * 100)}%)</label>
                <input
                  className="gen__range"
                  type="range"
                  min={0.05}
                  max={0.6}
                  step={0.01}
                  value={s.emblemScale}
                  onChange={(e) => set("emblemScale", Number(e.target.value))}
                />
              </div>
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
              <p style={{ fontSize: 12, color: "var(--fg-subtle)", margin: 0 }}>
                Drag the emblem on the canvas to reposition.
              </p>
            </>
          )}

          {/* Actions */}
          <div className="gen__actions">
            <button className="gen__btn" onClick={randomize}>Mix</button>
            <button className="gen__btn gen__btn--solid" onClick={download}>Download</button>
            <button className="gen__btn" onClick={copyToClipboard}>Copy</button>
          </div>
        </div>

        {/* ── Preview ── */}
        <div className="gen__preview">
          <div className="gen__canvas-wrap">
            <canvas
              ref={canvasRef}
              width={CW}
              height={CH}
              onMouseDown={onCanvasMouseDown}
              onMouseMove={onCanvasMouseMove}
              onMouseUp={onCanvasMouseUp}
              onMouseLeave={onCanvasMouseUp}
              style={{ cursor: s.showEmblem ? "grab" : "default" }}
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
