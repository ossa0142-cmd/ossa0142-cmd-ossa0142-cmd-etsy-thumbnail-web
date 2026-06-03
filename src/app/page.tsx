"use client";

import { ChangeEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

const CANVAS_SIZE = 3000;
const PREVIEW_SIZE = 760;
const DEFAULT_SUBTITLE = "COMMERCIAL LICENSE INCLUDED";

type LayoutOption = "auto" | "4x3" | "4x4" | "5x4";
type PresetKey =
  | "watercolorBaby"
  | "vintageGouache"
  | "halloweenCute"
  | "christmasCozy"
  | "minimalLineArt"
  | "pastelNursery"
  | "boldKidsParty";

type Rgb = {
  r: number;
  g: number;
  b: number;
};

type UploadedClipart = {
  id: string;
  trimmedCanvas: HTMLCanvasElement;
  trimmedWidth: number;
  trimmedHeight: number;
  colors: Rgb[];
};

type Preset = {
  key: PresetKey;
  label: string;
  description: string;
  font: string;
  weight: number;
  fallback: string[];
  background: string;
  badge: "pill" | "stamp" | "soft" | "square" | "line";
  titleScale: number;
  subtitleScale: number;
  margin: number;
  textAreaBoost: number;
};

type GridSize = {
  columns: number;
  rows: number;
};

const layoutOptions: Array<{ label: string; value: LayoutOption }> = [
  { label: "自動", value: "auto" },
  { label: "4×3", value: "4x3" },
  { label: "4×4", value: "4x4" },
  { label: "5×4", value: "5x4" }
];

const presets: Preset[] = [
  {
    key: "watercolorBaby",
    label: "Watercolor Baby（水彩ベビー）",
    description: "やわらかい水彩・ベビー向け",
    font: "'Hiragino Maru Gothic ProN', 'Arial Rounded MT Bold', 'Yu Gothic', sans-serif",
    weight: 800,
    fallback: ["#89b7c9", "#f2b6c2", "#f4d58d", "#9cc7a1"],
    background: "#fffdf9",
    badge: "soft",
    titleScale: 1,
    subtitleScale: 0.9,
    margin: 118,
    textAreaBoost: 1
  },
  {
    key: "vintageGouache",
    label: "Vintage Gouache（ヴィンテージガッシュ）",
    description: "くすみカラー・手描き感",
    font: "Georgia, 'Yu Mincho', serif",
    weight: 800,
    fallback: ["#9a6b4f", "#c48b5d", "#66806a", "#d7b98e"],
    background: "#fffaf0",
    badge: "stamp",
    titleScale: 0.96,
    subtitleScale: 0.85,
    margin: 128,
    textAreaBoost: 1.08
  },
  {
    key: "halloweenCute",
    label: "Halloween Cute（ハロウィン）",
    description: "かわいい季節イベント",
    font: "'Trebuchet MS', 'Yu Gothic', sans-serif",
    weight: 900,
    fallback: ["#f47b20", "#7a4ca0", "#1f1f1f", "#6aa84f"],
    background: "#fff9f0",
    badge: "pill",
    titleScale: 1.05,
    subtitleScale: 0.95,
    margin: 108,
    textAreaBoost: 0.96
  },
  {
    key: "christmasCozy",
    label: "Christmas Cozy（クリスマス）",
    description: "あたたかいホリデー感",
    font: "Georgia, 'Yu Mincho', serif",
    weight: 800,
    fallback: ["#b23a3a", "#2f7d57", "#d8af55", "#f0d7c0"],
    background: "#fffdf8",
    badge: "soft",
    titleScale: 0.98,
    subtitleScale: 0.9,
    margin: 120,
    textAreaBoost: 1
  },
  {
    key: "minimalLineArt",
    label: "Minimal Line Art（線画）",
    description: "白場多め・上品シンプル",
    font: "'Helvetica Neue', Arial, 'Yu Gothic', sans-serif",
    weight: 700,
    fallback: ["#222222", "#b9a995", "#ded6ca", "#8f8f8f"],
    background: "#ffffff",
    badge: "line",
    titleScale: 0.88,
    subtitleScale: 0.78,
    margin: 150,
    textAreaBoost: 1.15
  },
  {
    key: "pastelNursery",
    label: "Pastel Nursery（パステル）",
    description: "淡い色・子ども部屋風",
    font: "'Hiragino Maru Gothic ProN', 'Arial Rounded MT Bold', 'Yu Gothic', sans-serif",
    weight: 800,
    fallback: ["#f5b8cf", "#a7d8d0", "#f6dd9a", "#b7c8f2"],
    background: "#fffefe",
    badge: "soft",
    titleScale: 0.98,
    subtitleScale: 0.88,
    margin: 112,
    textAreaBoost: 0.98
  },
  {
    key: "boldKidsParty",
    label: "Bold Kids Party（ポップ）",
    description: "明るく目立つキッズ向け",
    font: "'Arial Black', 'Yu Gothic', sans-serif",
    weight: 900,
    fallback: ["#ef476f", "#ffd166", "#06d6a0", "#118ab2"],
    background: "#ffffff",
    badge: "square",
    titleScale: 1.08,
    subtitleScale: 0.96,
    margin: 96,
    textAreaBoost: 0.92
  }
];

function layoutToGrid(layout: LayoutOption, pngCount: number): GridSize {
  if (layout === "4x3") return { columns: 4, rows: 3 };
  if (layout === "4x4") return { columns: 4, rows: 4 };
  if (layout === "5x4") return { columns: 5, rows: 4 };
  if (pngCount >= 61 && pngCount <= 90) return { columns: 5, rows: 4 };
  if (pngCount >= 41 && pngCount <= 60) return { columns: 4, rows: 4 };
  return { columns: 4, rows: 3 };
}

function rgbToHex(color: Rgb) {
  return `#${[color.r, color.g, color.b].map((value) => value.toString(16).padStart(2, "0")).join("")}`;
}

function hexToRgb(hex: string): Rgb {
  const cleanHex = hex.replace("#", "");
  return {
    r: parseInt(cleanHex.slice(0, 2), 16),
    g: parseInt(cleanHex.slice(2, 4), 16),
    b: parseInt(cleanHex.slice(4, 6), 16)
  };
}

function mix(color: Rgb, target: Rgb, amount: number): Rgb {
  return {
    r: Math.round(color.r + (target.r - color.r) * amount),
    g: Math.round(color.g + (target.g - color.g) * amount),
    b: Math.round(color.b + (target.b - color.b) * amount)
  };
}

function contrastColor(color: Rgb) {
  const luminance = (color.r * 299 + color.g * 587 + color.b * 114) / 1000;
  return luminance > 170 ? "#1f1f1f" : "#ffffff";
}

function isNeutralColor(r: number, g: number, b: number) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max === 0 ? 0 : (max - min) / max;
  const brightness = (r + g + b) / 3;

  return saturation < 0.18 || brightness > 238 || brightness < 26;
}

function colorDistance(a: Rgb, b: Rgb) {
  return Math.hypot(a.r - b.r, a.g - b.g, a.b - b.b);
}

function extractColorsFromCanvas(canvas: HTMLCanvasElement, maxColors = 5): Rgb[] {
  const sampleSize = 120;
  const sampleCanvas = document.createElement("canvas");
  const ratio = Math.min(sampleSize / canvas.width, sampleSize / canvas.height, 1);
  sampleCanvas.width = Math.max(1, Math.round(canvas.width * ratio));
  sampleCanvas.height = Math.max(1, Math.round(canvas.height * ratio));

  const context = sampleCanvas.getContext("2d", { willReadFrequently: true });
  if (!context) return [];

  context.drawImage(canvas, 0, 0, sampleCanvas.width, sampleCanvas.height);
  const { data } = context.getImageData(0, 0, sampleCanvas.width, sampleCanvas.height);
  const buckets = new Map<string, { color: Rgb; count: number }>();

  for (let index = 0; index < data.length; index += 16) {
    const alpha = data[index + 3];
    if (alpha < 40) continue;

    const r = data[index];
    const g = data[index + 1];
    const b = data[index + 2];
    if (isNeutralColor(r, g, b)) continue;

    const bucket: Rgb = {
      r: Math.round(r / 24) * 24,
      g: Math.round(g / 24) * 24,
      b: Math.round(b / 24) * 24
    };
    const key = `${bucket.r}-${bucket.g}-${bucket.b}`;
    const current = buckets.get(key);
    buckets.set(key, { color: bucket, count: (current?.count ?? 0) + 1 });
  }

  const sorted: Array<{ color: Rgb; count: number }> = Array.from(buckets.values()).sort(
    (a, b) => b.count - a.count
  );
  const selected: Rgb[] = [];

  for (const bucket of sorted) {
    if (selected.every((color) => colorDistance(color, bucket.color) > 58)) {
      selected.push(bucket.color);
    }
    if (selected.length === maxColors) break;
  }

  return selected;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`${file.name} を読み込めませんでした。`));
    image.src = URL.createObjectURL(file);
  });
}

function trimTransparentPadding(image: HTMLImageElement): HTMLCanvasElement {
  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = image.naturalWidth;
  sourceCanvas.height = image.naturalHeight;

  const sourceContext = sourceCanvas.getContext("2d", { willReadFrequently: true });
  if (!sourceContext) {
    throw new Error("このブラウザではCanvasを利用できません。");
  }

  sourceContext.drawImage(image, 0, 0);
  const pixels = sourceContext.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  const { data, width, height } = pixels;
  let top = height;
  let left = width;
  let right = 0;
  let bottom = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 8) {
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }

  if (right <= left || bottom <= top) return sourceCanvas;

  const trimmedWidth = right - left + 1;
  const trimmedHeight = bottom - top + 1;
  const trimmedCanvas = document.createElement("canvas");
  trimmedCanvas.width = trimmedWidth;
  trimmedCanvas.height = trimmedHeight;

  const trimmedContext = trimmedCanvas.getContext("2d");
  if (!trimmedContext) {
    throw new Error("このブラウザではCanvasを利用できません。");
  }

  trimmedContext.drawImage(
    sourceCanvas,
    left,
    top,
    trimmedWidth,
    trimmedHeight,
    0,
    0,
    trimmedWidth,
    trimmedHeight
  );

  return trimmedCanvas;
}

function fitFontSize(
  context: CanvasRenderingContext2D,
  text: string,
  font: string,
  fontWeight: number,
  maxSize: number,
  minSize: number,
  maxWidth: number
) {
  for (let size = maxSize; size >= minSize; size -= 2) {
    context.font = `${fontWeight} ${size}px ${font}`;
    if (context.measureText(text).width <= maxWidth) return size;
  }

  return minSize;
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number
) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (context.measureText(candidate).width <= maxWidth || !currentLine) {
      currentLine = candidate;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);
  lines.slice(0, maxLines).forEach((line, index) => {
    context.fillText(line, x, y + index * lineHeight);
  });
}

function downloadCanvas(canvas: HTMLCanvasElement, title: string, suffix: string) {
  const fileTitle = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const link = document.createElement("a");
  link.download = `${fileTitle || "etsy-thumbnail"}-${suffix}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

export default function Home() {
  const renderCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewRef = useRef<HTMLCanvasElement | null>(null);
  const [cliparts, setCliparts] = useState<UploadedClipart[]>([]);
  const [title, setTitle] = useState("Watercolor Baby Clipart");
  const [pngCount, setPngCount] = useState(40);
  const [subtitle, setSubtitle] = useState(DEFAULT_SUBTITLE);
  const [presetKey, setPresetKey] = useState<PresetKey>("watercolorBaby");
  const [layout, setLayout] = useState<LayoutOption>("auto");
  const [clipartSize, setClipartSize] = useState(94);
  const [topTitleArea, setTopTitleArea] = useState(22);
  const [horizontalSpacing, setHorizontalSpacing] = useState(5);
  const [verticalSpacing, setVerticalSpacing] = useState(5);
  const [error, setError] = useState("");

  const activePreset = useMemo(
    () => presets.find((preset) => preset.key === presetKey) ?? presets[0],
    [presetKey]
  );
  const activeGrid = useMemo(() => layoutToGrid(layout, pngCount), [layout, pngCount]);
  const visibleCliparts = useMemo(
    () => cliparts.slice(0, activeGrid.columns * activeGrid.rows),
    [activeGrid.columns, activeGrid.rows, cliparts]
  );
  const extractedColors = useMemo(() => {
    const palette: Rgb[] = [];
    for (const clipart of cliparts) {
      for (const color of clipart.colors) {
        if (palette.every((existing) => colorDistance(existing, color) > 52)) {
          palette.push(color);
        }
        if (palette.length >= 5) return palette;
      }
    }
    return palette;
  }, [cliparts]);
  const palette = useMemo(
    () => {
      const colors: Rgb[] = [];
      const candidates = [...extractedColors, ...activePreset.fallback.map(hexToRgb)];

      for (const color of candidates) {
        if (colors.every((existing) => colorDistance(existing, color) > 42)) {
          colors.push(color);
        }
        if (colors.length === 5) break;
      }

      return colors;
    },
    [activePreset.fallback, extractedColors]
  );
  const titleColor = palette[0] ?? hexToRgb("#222222");
  const subtitleColor = palette[1] ?? mix(titleColor, hexToRgb("#ffffff"), 0.35);
  const accentColor = palette[2] ?? mix(titleColor, hexToRgb("#ffffff"), 0.2);
  const softAccent = mix(accentColor, hexToRgb("#ffffff"), 0.78);

  const renderThumbnail = useCallback(
    (options: { withText: boolean; targetCanvas?: HTMLCanvasElement } = { withText: true }) => {
      const canvas = options.targetCanvas ?? renderCanvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext("2d");
      if (!context) return;

      const withText = options.withText;
      context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      context.fillStyle = activePreset.background;
      context.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      const margin = withText ? activePreset.margin : 90;
      const topAreaHeight = withText
        ? Math.round((topTitleArea / 100) * CANVAS_SIZE * activePreset.textAreaBoost)
        : Math.round(CANVAS_SIZE * 0.07);
      const bottomArea = withText ? 250 : 80;
      const gridTop = withText ? Math.max(topAreaHeight + 20, 560) : 120;
      const gridBottom = CANVAS_SIZE - bottomArea;
      const gridWidth = CANVAS_SIZE - margin * 2;
      const gridHeight = gridBottom - gridTop;
      const columnGap = horizontalSpacing * (withText ? 7 : 4);
      const rowGap = verticalSpacing * (withText ? 7 : 4);
      const cellWidth = (gridWidth - columnGap * (activeGrid.columns - 1)) / activeGrid.columns;
      const cellHeight = (gridHeight - rowGap * (activeGrid.rows - 1)) / activeGrid.rows;
      const sizeMultiplier = (withText ? clipartSize : Math.max(108, clipartSize + 18)) / 100;

      context.textAlign = "center";
      context.textBaseline = "middle";

      if (withText) {
        const maxTextWidth = CANVAS_SIZE - margin * 2;
        const titleSize = fitFontSize(
          context,
          title,
          activePreset.font,
          activePreset.weight,
          Math.round(190 * activePreset.titleScale),
          82,
          maxTextWidth
        );
        context.font = `${activePreset.weight} ${titleSize}px ${activePreset.font}`;
        context.fillStyle = rgbToHex(titleColor);
        drawWrappedText(context, title, CANVAS_SIZE / 2, 170, maxTextWidth, titleSize * 1.03, 2);

        const subtitleSize = fitFontSize(
          context,
          subtitle,
          activePreset.font,
          800,
          Math.round(76 * activePreset.subtitleScale),
          38,
          maxTextWidth
        );
        context.font = `800 ${subtitleSize}px ${activePreset.font}`;
        context.fillStyle = rgbToHex(subtitleColor);
        context.fillText(subtitle, CANVAS_SIZE / 2, Math.max(330, topAreaHeight - 118));
      }

      visibleCliparts.forEach((clipart, index) => {
        const column = index % activeGrid.columns;
        const row = Math.floor(index / activeGrid.columns);
        const cellX = margin + column * (cellWidth + columnGap);
        const cellY = gridTop + row * (cellHeight + rowGap);
        const maxDrawWidth = cellWidth * sizeMultiplier;
        const maxDrawHeight = cellHeight * sizeMultiplier;
        const ratio = Math.min(maxDrawWidth / clipart.trimmedWidth, maxDrawHeight / clipart.trimmedHeight);
        const drawWidth = clipart.trimmedWidth * ratio;
        const drawHeight = clipart.trimmedHeight * ratio;
        const drawX = cellX + (cellWidth - drawWidth) / 2;
        const drawY = cellY + (cellHeight - drawHeight) / 2;

        context.drawImage(clipart.trimmedCanvas, drawX, drawY, drawWidth, drawHeight);
      });

      if (withText) {
        const badges = [`${pngCount} PNG`, "300 DPI", "Clipart Bundle"];
        context.font = `800 62px ${activePreset.font}`;
        const gap = 40;
        const widths = badges.map((badge) => context.measureText(badge).width + 94);
        const totalWidth = widths.reduce((sum, width) => sum + width, 0) + gap * (badges.length - 1);
        let currentX = CANVAS_SIZE / 2 - totalWidth / 2;
        const badgeY = CANVAS_SIZE - 125;

        badges.forEach((badge, index) => {
          const width = widths[index];
          const height = 98;
          const x = currentX;
          const y = badgeY - height / 2;
          const radius = activePreset.badge === "square" ? 18 : height / 2;

          context.lineWidth = activePreset.badge === "line" || activePreset.badge === "stamp" ? 6 : 0;
          context.strokeStyle = rgbToHex(titleColor);
          context.fillStyle =
            activePreset.badge === "pill" || activePreset.badge === "square"
              ? rgbToHex(accentColor)
              : rgbToHex(softAccent);
          context.beginPath();
          context.roundRect(x, y, width, height, radius);
          context.fill();
          if (activePreset.badge === "line" || activePreset.badge === "stamp") context.stroke();

          context.fillStyle =
            activePreset.badge === "pill" || activePreset.badge === "square"
              ? contrastColor(accentColor)
              : rgbToHex(titleColor);
          context.fillText(badge, x + width / 2, badgeY + 2);
          currentX += width + gap;
        });
      }

      const preview = previewRef.current;
      if (preview && !options.targetCanvas && withText) {
        const previewContext = preview.getContext("2d");
        if (!previewContext) return;
        previewContext.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
        previewContext.drawImage(canvas, 0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
      }
    },
    [
      accentColor,
      activeGrid.columns,
      activeGrid.rows,
      activePreset,
      clipartSize,
      horizontalSpacing,
      pngCount,
      softAccent,
      subtitle,
      subtitleColor,
      title,
      titleColor,
      topTitleArea,
      verticalSpacing,
      visibleCliparts
    ]
  );

  useEffect(() => {
    renderThumbnail({ withText: true });
  }, [renderThumbnail]);

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).filter((file) => file.type === "image/png");
    setError("");

    if (files.length === 0) {
      setError("PNGファイルを1つ以上選択してください。");
      return;
    }

    try {
      const loadedCliparts = await Promise.all(
        files.map(async (file) => {
          const image = await loadImage(file);
          const trimmedCanvas = trimTransparentPadding(image);
          URL.revokeObjectURL(image.src);

          return {
            id: `${file.name}-${file.lastModified}-${file.size}`,
            trimmedCanvas,
            trimmedWidth: trimmedCanvas.width,
            trimmedHeight: trimmedCanvas.height,
            colors: extractColorsFromCanvas(trimmedCanvas, 4)
          };
        })
      );

      setCliparts((current) => [...current, ...loadedCliparts]);
      setPngCount((current) =>
        current === 40 || current === cliparts.length ? cliparts.length + loadedCliparts.length : current
      );
      event.target.value = "";
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "PNG素材を読み込めませんでした。");
    }
  }

  function handleDownload(withText: boolean) {
    const canvas = renderCanvasRef.current;
    if (!canvas) return;
    renderThumbnail({ withText });
    downloadCanvas(canvas, title, withText ? "text" : "no-text");
    renderThumbnail({ withText: true });
  }

  return (
    <main className="appShell">
      <section className="heroBar">
        <div>
          <p className="eyebrow">日本語 Etsy サムネイル作成ツール</p>
          <h1>クリップアート素材を大きく見せるサムネイル生成</h1>
        </div>
        <div className="presetStatus">
          <span>選択中プリセット</span>
          <b>{activePreset.label}</b>
        </div>
      </section>

      <section className="workspace">
        <aside className="controls" aria-label="サムネイル設定">
          <section className="controlGroup">
            <div className="sectionTitle">
              <span>1</span>
              <h2>PNG素材をアップロード</h2>
            </div>
            <label className="fileDrop">
              <span>PNG素材を選択</span>
              <small>複数ファイルをまとめて追加できます</small>
              <input type="file" accept="image/png" multiple onChange={handleFiles} />
            </label>
            <div className="statsLine">
              <span>{cliparts.length}点アップロード済み</span>
              <span>
                表示 {visibleCliparts.length} / {activeGrid.columns * activeGrid.rows}
              </span>
            </div>
            {error ? <p className="errorText">{error}</p> : null}
          </section>

          <section className="controlGroup">
            <div className="sectionTitle">
              <span>2</span>
              <h2>抽出カラー</h2>
            </div>
            <div className="colorStrip">
              {palette.map((color) => (
                <span key={rgbToHex(color)} style={{ backgroundColor: rgbToHex(color) }} title={rgbToHex(color)} />
              ))}
            </div>
            <p className="helperText">
              透明部分を無視し、白・黒・グレーをなるべく除外してメインカラーを自動抽出します。
            </p>
          </section>

          <section className="controlGroup">
            <div className="sectionTitle">
              <span>3</span>
              <h2>雰囲気プリセット</h2>
            </div>
            <div className="presetGrid">
              {presets.map((preset) => (
                <button
                  className={preset.key === presetKey ? "presetCard active" : "presetCard"}
                  key={preset.key}
                  type="button"
                  onClick={() => setPresetKey(preset.key)}
                >
                  <b>{preset.label}</b>
                  <small>{preset.description}</small>
                </button>
              ))}
            </div>
          </section>

          <section className="controlGroup">
            <div className="sectionTitle">
              <span>4</span>
              <h2>文字とレイアウト</h2>
            </div>
            <label>
              商品タイトル
              <input value={title} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <label>
              サブタイトル
              <input value={subtitle} onChange={(event) => setSubtitle(event.target.value)} />
            </label>
            <div className="twoColumn">
              <label>
                PNG数
                <input
                  min="1"
                  max="999"
                  type="number"
                  value={pngCount}
                  onChange={(event) => setPngCount(Number(event.target.value))}
                />
              </label>
              <label>
                レイアウト
                <select value={layout} onChange={(event) => setLayout(event.target.value as LayoutOption)}>
                  {layoutOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="sliderStack">
              <label>
                <span>
                  素材サイズ <b>{clipartSize}%</b>
                </span>
                <input
                  type="range"
                  min="60"
                  max="125"
                  value={clipartSize}
                  onChange={(event) => setClipartSize(Number(event.target.value))}
                />
              </label>
              <label>
                <span>
                  横余白 <b>{horizontalSpacing}</b>
                </span>
                <input
                  type="range"
                  min="0"
                  max="16"
                  value={horizontalSpacing}
                  onChange={(event) => setHorizontalSpacing(Number(event.target.value))}
                />
              </label>
              <label>
                <span>
                  縦余白 <b>{verticalSpacing}</b>
                </span>
                <input
                  type="range"
                  min="0"
                  max="16"
                  value={verticalSpacing}
                  onChange={(event) => setVerticalSpacing(Number(event.target.value))}
                />
              </label>
              <label>
                <span>
                  タイトルエリア高さ <b>{topTitleArea}%</b>
                </span>
                <input
                  type="range"
                  min="15"
                  max="32"
                  value={topTitleArea}
                  onChange={(event) => setTopTitleArea(Number(event.target.value))}
                />
              </label>
            </div>
          </section>

          <section className="downloadGroup">
            <button type="button" onClick={() => handleDownload(true)}>
              文字あり版をダウンロード
            </button>
            <button type="button" onClick={() => handleDownload(false)}>
              文字なし版をダウンロード
            </button>
          </section>
        </aside>

        <section className="previewPanel" aria-label="サムネイルプレビュー">
          <div className="previewHeader">
            <div>
              <p>3000 × 3000 px</p>
              <h2>サムネイルプレビュー</h2>
            </div>
            <span>
              {activeGrid.columns}×{activeGrid.rows}
            </span>
          </div>
          <div className="previewMeta">
            <span>素材色は変更しません</span>
            <span>透明余白を自動トリミング</span>
            <span>文字なし版は素材面積を大きく配置</span>
          </div>
          <div className="canvasFrame">
            <canvas ref={previewRef} width={PREVIEW_SIZE} height={PREVIEW_SIZE} aria-label="サムネイルプレビュー" />
          </div>
        </section>
      </section>

      <canvas className="hiddenCanvas" ref={renderCanvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} />
    </main>
  );
}
