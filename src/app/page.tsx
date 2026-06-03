"use client";

import {
  ChangeEvent,
  DragEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import type { CSSProperties } from "react";

const DESIGN_SIZE = 3000;
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
type FontKey =
  | "handwritten"
  | "script"
  | "cute"
  | "baby"
  | "simple"
  | "bold"
  | "natural"
  | "vintage";
type PaletteKey = "soft" | "vivid" | "natural";
type ExportSize = 1000 | 2000 | 3000;
type ExportFormat = "png" | "jpg";
type CreationMode = "grid" | "top";
type AssetSource = "new" | "uploaded";
type TopStyle = "centerText" | "fullCollage" | "cleanSpace" | "playfulPop";
type PanelShape = "square" | "circle";
type ClipartDensity = "low" | "normal" | "high";
type ClipartPlacement = "auto" | "bestseller" | "grid" | "ring" | "collage" | "random";
type TopAssetCount = "auto" | "4" | "8" | "12" | "16" | "20" | "25" | "all";

type Rgb = {
  r: number;
  g: number;
  b: number;
};

type UploadedClipart = {
  id: string;
  name: string;
  previewUrl: string;
  trimmedCanvas: HTMLCanvasElement;
  trimmedWidth: number;
  trimmedHeight: number;
  colors: Rgb[];
};

type Preset = {
  key: PresetKey;
  label: string;
  description: string;
  fallback: string[];
  background: string;
  titleScale: number;
  subtitleScale: number;
  margin: number;
  textAreaBoost: number;
  defaultTitleFont: FontKey;
  defaultSubtitleFont: FontKey;
};

type FontOption = {
  key: FontKey;
  label: string;
  sample: string;
  stack: string;
  weight: number;
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

const exportSizeOptions: Array<{ label: string; value: ExportSize }> = [
  { label: "1000×1000px", value: 1000 },
  { label: "2000×2000px", value: 2000 },
  { label: "3000×3000px", value: 3000 }
];

const exportFormatOptions: Array<{ label: string; value: ExportFormat }> = [
  { label: "PNG", value: "png" },
  { label: "JPG", value: "jpg" }
];

const topStyleOptions: Array<{ label: string; value: TopStyle; description: string }> = [
  { label: "中央テキスト型", value: "centerText", description: "素材を周囲に配置して中央に大きな文字" },
  { label: "コラージュ全面型", value: "fullCollage", description: "全面コラージュに白パネルを重ねる" },
  { label: "余白きれい型", value: "cleanSpace", description: "角に素材を寄せた上品ミニマル" },
  { label: "にぎやかポップ型", value: "playfulPop", description: "大きめ素材を楽しく散らす" }
];

const panelShapeOptions: Array<{ label: string; value: PanelShape }> = [
  { label: "四角", value: "square" },
  { label: "円", value: "circle" }
];

const densityOptions: Array<{ label: string; value: ClipartDensity }> = [
  { label: "少なめ", value: "low" },
  { label: "普通", value: "normal" },
  { label: "多め", value: "high" }
];

const placementOptions: Array<{ label: string; value: ClipartPlacement }> = [
  { label: "自動おすすめ配置", value: "auto" },
  { label: "Etsyベストセラー風", value: "bestseller" },
  { label: "グリッド配置", value: "grid" },
  { label: "円形配置", value: "ring" },
  { label: "コラージュ配置", value: "collage" },
  { label: "ランダム配置", value: "random" }
];

const topAssetCountOptions: Array<{ label: string; value: TopAssetCount }> = [
  { label: "自動", value: "auto" },
  { label: "4", value: "4" },
  { label: "8", value: "8" },
  { label: "12", value: "12" },
  { label: "16", value: "16" },
  { label: "20", value: "20" },
  { label: "25", value: "25" },
  { label: "全部", value: "all" }
];

const fontOptions: FontOption[] = [
  {
    key: "handwritten",
    label: "手書き風",
    sample: "Handmade Clipart",
    stack: "'Caveat', 'Patrick Hand', 'Indie Flower', 'Pacifico', 'Hiragino Maru Gothic ProN', cursive",
    weight: 700
  },
  {
    key: "script",
    label: "筆記体",
    sample: "Elegant Bundle",
    stack: "'Great Vibes', 'Sacramento', 'Dancing Script', cursive",
    weight: 400
  },
  {
    key: "cute",
    label: "かわいい",
    sample: "Cute Nursery",
    stack: "'Fredoka', 'Baloo 2', 'Nunito', 'Hiragino Maru Gothic ProN', sans-serif",
    weight: 700
  },
  {
    key: "baby",
    label: "ベビー向け",
    sample: "Soft Baby Set",
    stack: "'Chewy', 'Bubblegum Sans', 'Fredoka', 'Baloo 2', 'Hiragino Maru Gothic ProN', cursive",
    weight: 400
  },
  {
    key: "simple",
    label: "シンプル",
    sample: "Minimal Clipart",
    stack: "'Quicksand', 'Helvetica Neue', Arial, 'Yu Gothic', sans-serif",
    weight: 700
  },
  {
    key: "bold",
    label: "太字",
    sample: "Bold Kids Party",
    stack: "'Baloo 2', 'Fredoka', 'Arial Black', Impact, sans-serif",
    weight: 900
  },
  {
    key: "natural",
    label: "ナチュラル",
    sample: "Natural Art Set",
    stack: "'Nunito', 'Quicksand', 'Hiragino Kaku Gothic ProN', sans-serif",
    weight: 800
  },
  {
    key: "vintage",
    label: "ヴィンテージ",
    sample: "Vintage Gouache",
    stack: "'Playfair Display', 'Cormorant Garamond', Georgia, 'Yu Mincho', serif",
    weight: 800
  }
];

const presets: Preset[] = [
  {
    key: "watercolorBaby",
    label: "Watercolor Baby（水彩ベビー）",
    description: "やわらかい水彩・ベビー向け",
    fallback: ["#89b7c9", "#f2b6c2", "#f4d58d", "#9cc7a1"],
    background: "#fffdf9",
    titleScale: 1,
    subtitleScale: 0.9,
    margin: 110,
    textAreaBoost: 1,
    defaultTitleFont: "baby",
    defaultSubtitleFont: "handwritten"
  },
  {
    key: "vintageGouache",
    label: "Vintage Gouache（ヴィンテージガッシュ）",
    description: "くすみカラー・手描き感",
    fallback: ["#9a6b4f", "#c48b5d", "#66806a", "#d7b98e"],
    background: "#fffaf0",
    titleScale: 0.96,
    subtitleScale: 0.85,
    margin: 120,
    textAreaBoost: 1.05,
    defaultTitleFont: "vintage",
    defaultSubtitleFont: "natural"
  },
  {
    key: "halloweenCute",
    label: "Halloween Cute（ハロウィン）",
    description: "かわいい季節イベント",
    fallback: ["#f47b20", "#7a4ca0", "#1f1f1f", "#6aa84f"],
    background: "#fff9f0",
    titleScale: 1.05,
    subtitleScale: 0.95,
    margin: 96,
    textAreaBoost: 0.95,
    defaultTitleFont: "bold",
    defaultSubtitleFont: "cute"
  },
  {
    key: "christmasCozy",
    label: "Christmas Cozy（クリスマス）",
    description: "あたたかいホリデー感",
    fallback: ["#b23a3a", "#2f7d57", "#d8af55", "#f0d7c0"],
    background: "#fffdf8",
    titleScale: 0.98,
    subtitleScale: 0.9,
    margin: 110,
    textAreaBoost: 1,
    defaultTitleFont: "vintage",
    defaultSubtitleFont: "script"
  },
  {
    key: "minimalLineArt",
    label: "Minimal Line Art（線画）",
    description: "白場多め・上品シンプル",
    fallback: ["#222222", "#b9a995", "#ded6ca", "#8f8f8f"],
    background: "#ffffff",
    titleScale: 0.88,
    subtitleScale: 0.78,
    margin: 140,
    textAreaBoost: 1.08,
    defaultTitleFont: "simple",
    defaultSubtitleFont: "simple"
  },
  {
    key: "pastelNursery",
    label: "Pastel Nursery（パステル）",
    description: "淡い色・子ども部屋風",
    fallback: ["#f8b9cc", "#bfe8dc", "#f7e5aa", "#b9d9f6", "#e8d7ff"],
    background: "#fffaf6",
    titleScale: 0.94,
    subtitleScale: 0.84,
    margin: 118,
    textAreaBoost: 1.08,
    defaultTitleFont: "cute",
    defaultSubtitleFont: "baby"
  },
  {
    key: "boldKidsParty",
    label: "Bold Kids Party（ポップ）",
    description: "明るく目立つキッズ向け",
    fallback: ["#ff2f6d", "#ffbd00", "#00c77b", "#1687ff", "#8b3ffc"],
    background: "#fffefe",
    titleScale: 1.16,
    subtitleScale: 1,
    margin: 72,
    textAreaBoost: 0.86,
    defaultTitleFont: "bold",
    defaultSubtitleFont: "cute"
  }
];

function layoutToGrid(layout: LayoutOption, assetCount: number): GridSize {
  if (layout === "4x3") return { columns: 4, rows: 3 };
  if (layout === "4x4") return { columns: 4, rows: 4 };
  if (layout === "5x4") return { columns: 5, rows: 4 };
  if (assetCount >= 61 && assetCount <= 90) return { columns: 5, rows: 4 };
  if (assetCount >= 41 && assetCount <= 60) return { columns: 4, rows: 4 };
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

function saturation(color: Rgb) {
  const max = Math.max(color.r, color.g, color.b);
  const min = Math.min(color.r, color.g, color.b);
  return max === 0 ? 0 : (max - min) / max;
}

function brightness(color: Rgb) {
  return (color.r + color.g + color.b) / 3;
}

function warmScore(color: Rgb) {
  return color.r * 0.52 + color.g * 0.34 - color.b * 0.28;
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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getFont(key: FontKey) {
  return fontOptions.find((font) => font.key === key) ?? fontOptions[2];
}

async function ensureCanvasFonts(fonts: FontOption[]) {
  if (typeof document === "undefined" || !("fonts" in document)) return;

  await Promise.all(
    fonts.map((font) => document.fonts.load(`${font.weight} 180px ${font.stack}`))
  );
  await document.fonts.ready;
}

function prepareCanvas(canvas: HTMLCanvasElement, size: number) {
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) return null;

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.setTransform(size / DESIGN_SIZE, 0, 0, size / DESIGN_SIZE, 0, 0);
  return context;
}

function dedupePalette(colors: Rgb[], fallback: Rgb[]) {
  const selected: Rgb[] = [];
  const candidates = [...colors, ...fallback];

  for (const color of candidates) {
    if (selected.every((existing) => colorDistance(existing, color) > 36)) {
      selected.push(color);
    }
    if (selected.length === 5) break;
  }

  return selected;
}

function makePaletteOptions(extractedColors: Rgb[], fallbackColors: Rgb[]) {
  const baseColors = extractedColors.length > 0 ? extractedColors : fallbackColors;
  const white = hexToRgb("#ffffff");
  const beige = hexToRgb("#ead7bf");
  const brown = hexToRgb("#7f5d45");

  const soft = dedupePalette(
    baseColors
      .slice()
      .sort((a, b) => brightness(b) - brightness(a))
      .map((color) => mix(color, white, 0.48)),
    fallbackColors.map((color) => mix(color, white, 0.45))
  );

  const vivid = dedupePalette(
    baseColors
      .slice()
      .sort((a, b) => saturation(b) - saturation(a) || brightness(a) - brightness(b))
      .map((color) => mix(color, saturation(color) > 0.45 ? color : brown, 0.08)),
    fallbackColors
  );

  const natural = dedupePalette(
    baseColors
      .slice()
      .sort((a, b) => warmScore(b) - warmScore(a))
      .map((color) => mix(mix(color, beige, 0.36), brown, 0.08)),
    fallbackColors.map((color) => mix(color, beige, 0.34))
  );

  return [
    {
      key: "soft" as const,
      label: "やわらかカラー",
      description: "ベビー・水彩・ナーサリー向け",
      colors: soft
    },
    {
      key: "vivid" as const,
      label: "くっきりカラー",
      description: "ハロウィン・キッズ・ポップ向け",
      colors: vivid
    },
    {
      key: "natural" as const,
      label: "ナチュラルカラー",
      description: "ヴィンテージ・ガッシュ・自然素材向け",
      colors: natural
    }
  ];
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
  if (!sourceContext) throw new Error("このブラウザではCanvasを利用できません。");

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
  if (!trimmedContext) throw new Error("このブラウザではCanvasを利用できません。");

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

function createPreviewUrl(canvas: HTMLCanvasElement) {
  const previewCanvas = document.createElement("canvas");
  previewCanvas.width = 140;
  previewCanvas.height = 140;
  const context = previewCanvas.getContext("2d");
  if (!context) return "";

  context.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  const ratio = Math.min(118 / canvas.width, 118 / canvas.height);
  const drawWidth = canvas.width * ratio;
  const drawHeight = canvas.height * ratio;
  context.drawImage(canvas, (140 - drawWidth) / 2, (140 - drawHeight) / 2, drawWidth, drawHeight);
  return previewCanvas.toDataURL("image/png");
}

function fitFontSize(
  context: CanvasRenderingContext2D,
  text: string,
  font: FontOption,
  maxSize: number,
  minSize: number,
  maxWidth: number
) {
  for (let size = maxSize; size >= minSize; size -= 2) {
    context.font = `${font.weight} ${size}px ${font.stack}`;
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

function seededRandom(seed: number) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;

  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function drawPanel(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  shape: PanelShape,
  fill: string,
  stroke: string
) {
  context.fillStyle = fill;
  context.strokeStyle = stroke;
  context.lineWidth = 8;

  if (shape === "circle") {
    context.beginPath();
    context.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    return;
  }

  context.beginPath();
  context.roundRect(x, y, width, height, 48);
  context.fill();
  context.stroke();
}

type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type PlacementPoint = {
  x: number;
  y: number;
  scale: number;
};

function rectsOverlap(a: Rect, b: Rect) {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

function resolveTopPlacement(placement: ClipartPlacement, assetCount: number): Exclude<ClipartPlacement, "auto"> {
  if (placement !== "auto") return placement;
  if (assetCount <= 12) return "grid";
  if (assetCount <= 30) return "ring";
  return "bestseller";
}

function resolveTopAssetCount(option: TopAssetCount, uploadedCount: number, random: () => number) {
  if (option === "all") return uploadedCount;
  if (option !== "auto") return Math.min(uploadedCount, Number(option));
  if (uploadedCount <= 8) return uploadedCount;
  if (uploadedCount <= 16) return Math.min(uploadedCount, 10 + Math.floor(random() * 5));
  if (uploadedCount <= 30) return Math.min(uploadedCount, 16 + Math.floor(random() * 9));
  return Math.min(uploadedCount, 24 + Math.floor(random() * 12));
}

function shufflePoints(points: PlacementPoint[], random: () => number) {
  const shuffled = [...points];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function createTopPlacementPoints(
  placement: Exclude<ClipartPlacement, "auto">,
  count: number,
  centerX: number,
  centerY: number,
  safeArea: Rect,
  random: () => number
) {
  const points: PlacementPoint[] = [];
  const safeCenterX = safeArea.x + safeArea.width / 2;
  const safeCenterY = safeArea.y + safeArea.height / 2;
  const ringRadiusX = Math.max(safeArea.width / 2 + 390, 1030);
  const ringRadiusY = Math.max(safeArea.height / 2 + 330, 840);

  if (placement === "bestseller") {
    const anchors: PlacementPoint[] = [
      { x: 360, y: 360, scale: 1.18 },
      { x: DESIGN_SIZE - 360, y: 360, scale: 1.16 },
      { x: 380, y: DESIGN_SIZE - 360, scale: 1.14 },
      { x: DESIGN_SIZE - 380, y: DESIGN_SIZE - 360, scale: 1.12 },
      { x: 260, y: DESIGN_SIZE / 2, scale: 0.96 },
      { x: DESIGN_SIZE - 260, y: DESIGN_SIZE / 2, scale: 0.96 },
      { x: DESIGN_SIZE / 2, y: 250, scale: 0.9 },
      { x: DESIGN_SIZE / 2, y: DESIGN_SIZE - 250, scale: 0.9 }
    ];
    points.push(...anchors);
    for (let index = anchors.length; index < count + 10; index += 1) {
      const angle = (Math.PI * 2 * index) / Math.max(1, count + 6);
      points.push({
        x: safeCenterX + Math.cos(angle) * (ringRadiusX + (random() - 0.5) * 280),
        y: safeCenterY + Math.sin(angle) * (ringRadiusY + (random() - 0.5) * 220),
        scale: 0.72 + random() * 0.24
      });
    }
    return points;
  }

  if (placement === "ring") {
    for (let index = 0; index < count + 18; index += 1) {
      const angle = (-Math.PI / 2) + (Math.PI * 2 * index) / Math.max(1, count + 2);
      points.push({
        x: safeCenterX + Math.cos(angle) * (ringRadiusX + (index % 2) * 150),
        y: safeCenterY + Math.sin(angle) * (ringRadiusY + (index % 3) * 110),
        scale: 0.86 + (index % 3) * 0.06
      });
    }
    return points;
  }

  if (placement === "grid") {
    const columns = count <= 6 ? 3 : count <= 12 ? 4 : count <= 20 ? 5 : 6;
    const rows = Math.ceil((count + 8) / columns);
    const startX = 350;
    const startY = 350;
    const usableWidth = DESIGN_SIZE - startX * 2;
    const usableHeight = DESIGN_SIZE - startY * 2;
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        points.push({
          x: startX + (usableWidth * column) / Math.max(1, columns - 1),
          y: startY + (usableHeight * row) / Math.max(1, rows - 1),
          scale: 0.98
        });
      }
    }
    return points
      .filter((point) => !rectsOverlap({ x: point.x - 220, y: point.y - 220, width: 440, height: 440 }, safeArea))
      .sort((a, b) => Math.hypot(a.x - centerX, a.y - centerY) - Math.hypot(b.x - centerX, b.y - centerY));
  }

  if (placement === "collage") {
    const columns = 6;
    const rows = 6;
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        points.push({
          x: 230 + (column * (DESIGN_SIZE - 460)) / (columns - 1) + (random() - 0.5) * 160,
          y: 230 + (row * (DESIGN_SIZE - 460)) / (rows - 1) + (random() - 0.5) * 160,
          scale: 0.62 + random() * 0.28
        });
      }
    }
    return shufflePoints(points, random);
  }

  for (let index = 0; index < count + 28; index += 1) {
    points.push({
      x: 180 + random() * (DESIGN_SIZE - 360),
      y: 180 + random() * (DESIGN_SIZE - 360),
      scale: 0.72 + random() * 0.46
    });
  }
  return points;
}

function downloadCanvas(canvas: HTMLCanvasElement, title: string, suffix: string, format: ExportFormat) {
  const fileTitle = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const link = document.createElement("a");
  link.download = `${fileTitle || "etsy-thumbnail"}-${suffix}.${format}`;
  link.href = canvas.toDataURL(format === "jpg" ? "image/jpeg" : "image/png", 0.94);
  link.click();
}

export default function Home() {
  const renderCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [cliparts, setCliparts] = useState<UploadedClipart[]>([]);
  const [creationMode, setCreationMode] = useState<CreationMode>("grid");
  const [title, setTitle] = useState("Watercolor Baby Clipart");
  const [subtitle, setSubtitle] = useState(DEFAULT_SUBTITLE);
  const [topTitle, setTopTitle] = useState("Cute Clipart Bundle");
  const [topSubtitle, setTopSubtitle] = useState("COMMERCIAL LICENSE INCLUDED");
  const [topSmallText, setTopSmallText] = useState("PNG CLIPART SET");
  const [topBadgeText, setTopBadgeText] = useState("NEW");
  const [assetSource, setAssetSource] = useState<AssetSource>("uploaded");
  const [topStyle, setTopStyle] = useState<TopStyle>("centerText");
  const [topTitleFontKey, setTopTitleFontKey] = useState<FontKey>("bold");
  const [topSubtitleFontKey, setTopSubtitleFontKey] = useState<FontKey>("cute");
  const [topPanelEnabled, setTopPanelEnabled] = useState(true);
  const [topPanelShape, setTopPanelShape] = useState<PanelShape>("square");
  const [frameWidth, setFrameWidth] = useState(1700);
  const [frameHeight, setFrameHeight] = useState(760);
  const [frameRadius, setFrameRadius] = useState(96);
  const [textBlockX, setTextBlockX] = useState(0);
  const [textBlockY, setTextBlockY] = useState(0);
  const [textBlockWidth, setTextBlockWidth] = useState(1700);
  const [textBlockHeight, setTextBlockHeight] = useState(760);
  const [topTitleSize, setTopTitleSize] = useState(210);
  const [topTitleY, setTopTitleY] = useState(-145);
  const [topTitleX, setTopTitleX] = useState(0);
  const [topTitleLineHeight, setTopTitleLineHeight] = useState(102);
  const [topSubtitleSize, setTopSubtitleSize] = useState(82);
  const [topSubtitleY, setTopSubtitleY] = useState(135);
  const [topSubtitleX, setTopSubtitleX] = useState(0);
  const [topSubtitleLineHeight, setTopSubtitleLineHeight] = useState(110);
  const [showTopSmallText, setShowTopSmallText] = useState(true);
  const [topSmallTextSize, setTopSmallTextSize] = useState(54);
  const [topSmallTextY, setTopSmallTextY] = useState(250);
  const [topSmallTextX, setTopSmallTextX] = useState(0);
  const [clipartPlacement, setClipartPlacement] = useState<ClipartPlacement>("auto");
  const [topAssetCount, setTopAssetCount] = useState<TopAssetCount>("auto");
  const [topClipartSize, setTopClipartSize] = useState(500);
  const [topClipartVariation, setTopClipartVariation] = useState(45);
  const [clipartDistance, setClipartDistance] = useState(70);
  const [clipartDensity, setClipartDensity] = useState<ClipartDensity>("normal");
  const [topSeed, setTopSeed] = useState(20260603);
  const [presetKey, setPresetKey] = useState<PresetKey>("watercolorBaby");
  const [titleFontKey, setTitleFontKey] = useState<FontKey>("baby");
  const [subtitleFontKey, setSubtitleFontKey] = useState<FontKey>("handwritten");
  const [paletteKey, setPaletteKey] = useState<PaletteKey>("soft");
  const [exportSize, setExportSize] = useState<ExportSize>(3000);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("png");
  const [layout, setLayout] = useState<LayoutOption>("auto");
  const [selectedPage, setSelectedPage] = useState(0);
  const [clipartSize, setClipartSize] = useState(98);
  const [topTitleArea, setTopTitleArea] = useState(21);
  const [horizontalSpacing, setHorizontalSpacing] = useState(4);
  const [verticalSpacing, setVerticalSpacing] = useState(4);
  const [titleY, setTitleY] = useState(185);
  const [titleX, setTitleX] = useState(0);
  const [titleFontSize, setTitleFontSize] = useState(178);
  const [subtitleY, setSubtitleY] = useState(390);
  const [subtitleX, setSubtitleX] = useState(0);
  const [subtitleFontSize, setSubtitleFontSize] = useState(66);
  const [textGap, setTextGap] = useState(78);
  const [isDragging, setIsDragging] = useState(false);
  const [fontLoadTick, setFontLoadTick] = useState(0);
  const [error, setError] = useState("");

  const activePreset = useMemo(
    () => presets.find((preset) => preset.key === presetKey) ?? presets[0],
    [presetKey]
  );
  const activeGrid = useMemo(() => layoutToGrid(layout, cliparts.length), [cliparts.length, layout]);
  const pageSize = activeGrid.columns * activeGrid.rows;
  const pageCount = Math.max(1, Math.ceil(cliparts.length / pageSize));
  const currentPageAssets = useMemo(
    () => cliparts.slice(selectedPage * pageSize, selectedPage * pageSize + pageSize),
    [cliparts, pageSize, selectedPage]
  );
  const topPreviewAssetCount = useMemo(
    () => Math.min(cliparts.length, resolveTopAssetCount(topAssetCount, cliparts.length, seededRandom(topSeed))),
    [cliparts.length, topAssetCount, topSeed]
  );
  const titleFont = getFont(titleFontKey);
  const subtitleFont = getFont(subtitleFontKey);
  const topTitleFont = getFont(topTitleFontKey);
  const topSubtitleFont = getFont(topSubtitleFontKey);
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
  const paletteOptions = useMemo(
    () => makePaletteOptions(extractedColors, activePreset.fallback.map(hexToRgb)),
    [activePreset.fallback, extractedColors]
  );
  const palette = paletteOptions.find((option) => option.key === paletteKey)?.colors ?? paletteOptions[0].colors;
  const titleColor = palette[0] ?? hexToRgb("#222222");
  const subtitleColor = palette[1] ?? mix(titleColor, hexToRgb("#ffffff"), 0.35);
  const accentColor = palette[2] ?? mix(titleColor, hexToRgb("#ffffff"), 0.25);
  const appThemeStyle = {
    "--accent": rgbToHex(accentColor),
    "--accent-dark": rgbToHex(mix(accentColor, hexToRgb("#171514"), 0.32)),
    "--soft": rgbToHex(mix(accentColor, hexToRgb("#ffffff"), 0.88))
  } as CSSProperties;

  useEffect(() => {
    setTitleFontKey(activePreset.defaultTitleFont);
    setSubtitleFontKey(activePreset.defaultSubtitleFont);
  }, [activePreset.defaultSubtitleFont, activePreset.defaultTitleFont]);

  useEffect(() => {
    setSelectedPage((page) => clamp(page, 0, pageCount - 1));
  }, [pageCount]);

  useEffect(() => {
    let isActive = true;

    void ensureCanvasFonts([titleFont, subtitleFont, topTitleFont, topSubtitleFont]).then(() => {
      if (isActive) setFontLoadTick((tick) => tick + 1);
    });

    return () => {
      isActive = false;
    };
  }, [subtitleFont, titleFont, topSubtitleFont, topTitleFont]);

  const renderThumbnail = useCallback(
    (
      options: {
        withText: boolean;
        pageIndex?: number;
        targetCanvas?: HTMLCanvasElement;
        outputSize?: number;
      } = { withText: true }
    ) => {
      const canvas = options.targetCanvas ?? renderCanvasRef.current;
      if (!canvas) return;

      const outputSize = options.outputSize ?? DESIGN_SIZE;
      const context = prepareCanvas(canvas, outputSize);
      if (!context) return;

      const withText = options.withText;
      const pageIndex = options.pageIndex ?? selectedPage;
      const pageAssets = cliparts.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize);

      context.clearRect(0, 0, DESIGN_SIZE, DESIGN_SIZE);
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, DESIGN_SIZE, DESIGN_SIZE);
      context.fillStyle = activePreset.background;
      context.fillRect(0, 0, DESIGN_SIZE, DESIGN_SIZE);

      const margin = withText ? activePreset.margin : 70;
      const topAreaHeight = withText
        ? Math.round((topTitleArea / 100) * DESIGN_SIZE * activePreset.textAreaBoost)
        : Math.round(DESIGN_SIZE * 0.055);
      const gridTop = withText ? Math.max(topAreaHeight + 8, 520) : 95;
      const gridBottom = withText ? DESIGN_SIZE - 90 : DESIGN_SIZE - 70;
      const gridWidth = DESIGN_SIZE - margin * 2;
      const gridHeight = gridBottom - gridTop;
      const columnGap = horizontalSpacing * (withText ? 7 : 3.5);
      const rowGap = verticalSpacing * (withText ? 7 : 3.5);
      const cellWidth = (gridWidth - columnGap * (activeGrid.columns - 1)) / activeGrid.columns;
      const cellHeight = (gridHeight - rowGap * (activeGrid.rows - 1)) / activeGrid.rows;
      const sizeMultiplier = (withText ? clipartSize : Math.max(116, clipartSize + 20)) / 100;

      context.textAlign = "center";
      context.textBaseline = "middle";

      if (withText) {
        const maxTextWidth = DESIGN_SIZE - margin * 2;
        const titleSize = fitFontSize(
          context,
          title,
          titleFont,
          Math.round(titleFontSize * activePreset.titleScale),
          58,
          maxTextWidth
        );
        const safeTitleX = clamp(DESIGN_SIZE / 2 + titleX * 10, margin, DESIGN_SIZE - margin);
        const safeTitleY = clamp(titleY, 75, Math.max(120, topAreaHeight - 110));

        context.font = `${titleFont.weight} ${titleSize}px ${titleFont.stack}`;
        context.fillStyle = rgbToHex(titleColor);
        drawWrappedText(context, title, safeTitleX, safeTitleY, maxTextWidth, titleSize * 1.02, 2);

        const subtitleSize = fitFontSize(
          context,
          subtitle,
          subtitleFont,
          Math.round(subtitleFontSize * activePreset.subtitleScale),
          30,
          maxTextWidth
        );
        const safeSubtitleX = clamp(DESIGN_SIZE / 2 + subtitleX * 10, margin, DESIGN_SIZE - margin);
        const preferredSubtitleY = Math.max(subtitleY, safeTitleY + titleSize * 0.48 + textGap);
        const safeSubtitleY = clamp(preferredSubtitleY, safeTitleY + 56, Math.max(safeTitleY + 64, topAreaHeight - 34));

        context.font = `${subtitleFont.weight} ${subtitleSize}px ${subtitleFont.stack}`;
        context.fillStyle = rgbToHex(subtitleColor);
        context.fillText(subtitle, safeSubtitleX, safeSubtitleY);
      }

      const visibleColumns = pageAssets.length > 0
        ? Math.min(activeGrid.columns, Math.max(1, Math.ceil(Math.sqrt(pageAssets.length * activeGrid.columns / activeGrid.rows))))
        : activeGrid.columns;
      const visibleRows = pageAssets.length > 0 ? Math.ceil(pageAssets.length / visibleColumns) : activeGrid.rows;
      const centeredBlockHeight = visibleRows * cellHeight + Math.max(0, visibleRows - 1) * rowGap;
      const centeredStartY = gridTop + (gridHeight - centeredBlockHeight) / 2;

      pageAssets.forEach((clipart, index) => {
        const row = Math.floor(index / visibleColumns);
        const column = index % visibleColumns;
        const itemsInRow = Math.min(visibleColumns, pageAssets.length - row * visibleColumns);
        const rowWidth = itemsInRow * cellWidth + Math.max(0, itemsInRow - 1) * columnGap;
        const cellX = margin + (gridWidth - rowWidth) / 2 + column * (cellWidth + columnGap);
        const cellY = centeredStartY + row * (cellHeight + rowGap);
        const maxDrawWidth = cellWidth * sizeMultiplier;
        const maxDrawHeight = cellHeight * sizeMultiplier;
        const ratio = Math.min(maxDrawWidth / clipart.trimmedWidth, maxDrawHeight / clipart.trimmedHeight);
        const drawWidth = clipart.trimmedWidth * ratio;
        const drawHeight = clipart.trimmedHeight * ratio;
        const drawX = cellX + (cellWidth - drawWidth) / 2;
        const drawY = cellY + (cellHeight - drawHeight) / 2;

        context.drawImage(clipart.trimmedCanvas, drawX, drawY, drawWidth, drawHeight);
      });

      const preview = previewRef.current;
      if (preview && !options.targetCanvas) {
        const previewContext = preview.getContext("2d");
        if (!previewContext) return;
        previewContext.imageSmoothingEnabled = true;
        previewContext.imageSmoothingQuality = "high";
        previewContext.setTransform(1, 0, 0, 1, 0, 0);
        previewContext.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
        previewContext.drawImage(canvas, 0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
      }
    },
    [
      activeGrid.columns,
      activeGrid.rows,
      activePreset,
      clipartSize,
      cliparts,
      horizontalSpacing,
      fontLoadTick,
      pageSize,
      selectedPage,
      subtitle,
      subtitleColor,
      subtitleFont,
      subtitleFontSize,
      subtitleX,
      subtitleY,
      textGap,
      title,
      titleColor,
      titleFont,
      titleFontSize,
      titleX,
      titleY,
      topTitleArea,
      verticalSpacing
    ]
  );

  const renderTopThumbnail = useCallback(
    (options: { targetCanvas?: HTMLCanvasElement; outputSize?: number } = {}) => {
      const canvas = options.targetCanvas ?? renderCanvasRef.current;
      if (!canvas) return;

      const outputSize = options.outputSize ?? DESIGN_SIZE;
      const context = prepareCanvas(canvas, outputSize);
      if (!context) return;

      const random = seededRandom(topSeed);
      const sourceAssets = assetSource === "uploaded" ? cliparts : cliparts;
      const selectedAssetCount = resolveTopAssetCount(topAssetCount, sourceAssets.length, random);
      const assets = sourceAssets.slice(0, Math.max(1, Math.min(sourceAssets.length, selectedAssetCount)));
      const resolvedPlacement = resolveTopPlacement(clipartPlacement, sourceAssets.length);
      const panelFill = `rgba(255, 255, 255, ${topStyle === "fullCollage" ? 0.9 : 0.82})`;
      const panelStroke = rgbToHex(mix(accentColor, hexToRgb("#ffffff"), 0.35));
      const blockCenterX = DESIGN_SIZE / 2 + textBlockX * 10;
      const blockCenterY = DESIGN_SIZE / 2 + textBlockY * 10;
      const blockWidth = textBlockWidth;
      const blockHeight = textBlockHeight;
      const blockX = blockCenterX - blockWidth / 2;
      const blockY = blockCenterY - blockHeight / 2;
      const frameW = frameWidth;
      const frameH = frameHeight;
      const frameX = blockCenterX - frameW / 2;
      const frameY = blockCenterY - frameH / 2;
      const safeArea: Rect = {
        x: Math.min(blockX, frameX) - clipartDistance,
        y: Math.min(blockY, frameY) - clipartDistance,
        width: Math.max(blockX + blockWidth, frameX + frameW) - Math.min(blockX, frameX) + clipartDistance * 2,
        height: Math.max(blockY + blockHeight, frameY + frameH) - Math.min(blockY, frameY) + clipartDistance * 2
      };

      context.clearRect(0, 0, DESIGN_SIZE, DESIGN_SIZE);
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, DESIGN_SIZE, DESIGN_SIZE);
      context.fillStyle = topStyle === "playfulPop" ? "#fffdf5" : activePreset.background;
      context.fillRect(0, 0, DESIGN_SIZE, DESIGN_SIZE);

      if (assets.length === 0) {
        context.fillStyle = "#d8d1c8";
        context.font = `800 96px ${topSubtitleFont.stack}`;
        context.textAlign = "center";
        context.fillText("PNG素材をアップロードしてください", DESIGN_SIZE / 2, DESIGN_SIZE / 2);
      }

      const placedRects: Rect[] = [];
      const placementPoints = createTopPlacementPoints(
        resolvedPlacement,
        assets.length,
        blockCenterX,
        blockCenterY,
        safeArea,
        random
      );
      let placementCursor = 0;

      assets.forEach((clipart, index) => {
        const styleBoost = topStyle === "playfulPop" ? 1.12 : topStyle === "cleanSpace" ? 0.84 : 1;
        const templateBoost =
          resolvedPlacement === "bestseller" && index < 4
            ? 1.2
            : resolvedPlacement === "grid"
              ? 1.08
              : resolvedPlacement === "collage"
                ? 0.78
                : 1;
        const densityScale = clipartDensity === "low" ? 0.88 : clipartDensity === "high" ? 1.06 : 1;
        const crowdScale =
          assets.length >= 25
            ? 0.64
            : assets.length >= 20
              ? 0.72
              : assets.length >= 16
                ? 0.82
                : 1;
        const variation = 1 - topClipartVariation / 200 + random() * (topClipartVariation / 100);
        const baseSize = topClipartSize * styleBoost * templateBoost * densityScale * crowdScale * variation;
        let chosen: { x: number; y: number; drawWidth: number; drawHeight: number } | null = null;

        for (let attempt = 0; attempt < Math.max(180, placementPoints.length * 2); attempt += 1) {
          const point = placementPoints[(placementCursor + attempt) % Math.max(1, placementPoints.length)] ?? {
            x: 180 + random() * (DESIGN_SIZE - 360),
            y: 180 + random() * (DESIGN_SIZE - 360),
            scale: 1
          };
          const retryScale = Math.max(0.54, 1 - attempt * 0.0045);
          const pointSize = baseSize * point.scale * retryScale;
          const ratio = Math.min(pointSize / clipart.trimmedWidth, pointSize / clipart.trimmedHeight);
          const drawWidth = clipart.trimmedWidth * ratio;
          const drawHeight = clipart.trimmedHeight * ratio;
          let x = point.x + (resolvedPlacement === "random" || resolvedPlacement === "collage" ? (random() - 0.5) * 150 : 0);
          let y = point.y + (resolvedPlacement === "random" || resolvedPlacement === "collage" ? (random() - 0.5) * 150 : 0);
          x = clamp(x, drawWidth / 2 + 40, DESIGN_SIZE - drawWidth / 2 - 40);
          y = clamp(y, drawHeight / 2 + 40, DESIGN_SIZE - drawHeight / 2 - 40);
          const collisionGap = Math.max(8, clipartDistance - attempt * 1.6);
          const rect: Rect = {
            x: x - drawWidth / 2 - collisionGap / 2,
            y: y - drawHeight / 2 - collisionGap / 2,
            width: drawWidth + collisionGap,
            height: drawHeight + collisionGap
          };
          const softOverlapAllowed = resolvedPlacement === "collage" && attempt > 36;
          const overlapIsOk = softOverlapAllowed || placedRects.every((placed) => !rectsOverlap(rect, placed));

          if (!rectsOverlap(rect, safeArea) && overlapIsOk) {
            placedRects.push(rect);
            chosen = { x, y, drawWidth, drawHeight };
            placementCursor = placementCursor + attempt + 1;
            break;
          }
        }

        if (!chosen) return;

        context.save();
        context.translate(chosen.x, chosen.y);
        context.rotate((random() - 0.5) * (topStyle === "cleanSpace" ? 0.25 : 0.55));
        context.drawImage(
          clipart.trimmedCanvas,
          -chosen.drawWidth / 2,
          -chosen.drawHeight / 2,
          chosen.drawWidth,
          chosen.drawHeight
        );
        context.restore();
      });

      if (topPanelEnabled || topStyle === "fullCollage") {
        context.save();
        if (topPanelShape === "square") {
          context.fillStyle = panelFill;
          context.strokeStyle = panelStroke;
          context.lineWidth = 8;
          context.beginPath();
          context.roundRect(frameX, frameY, frameW, frameH, frameRadius);
          context.fill();
          context.stroke();
        } else {
          drawPanel(context, frameX, frameY, frameW, frameH, "circle", panelFill, panelStroke);
        }
        context.restore();
      }

      context.textAlign = "center";
      context.textBaseline = "middle";

      const titleSize = fitFontSize(
        context,
        topTitle,
        topTitleFont,
        topTitleSize,
        76,
        blockWidth - 120
      );
      context.font = `${topTitleFont.weight} ${titleSize}px ${topTitleFont.stack}`;
      context.fillStyle = rgbToHex(titleColor);
      drawWrappedText(
        context,
        topTitle,
        blockCenterX + topTitleX * 10,
        blockCenterY + topTitleY,
        blockWidth - 120,
        titleSize * (topTitleLineHeight / 100),
        2
      );

      const subtitleSize = fitFontSize(context, topSubtitle, topSubtitleFont, topSubtitleSize, 28, blockWidth - 160);
      context.font = `${topSubtitleFont.weight} ${subtitleSize}px ${topSubtitleFont.stack}`;
      context.fillStyle = rgbToHex(subtitleColor);
      drawWrappedText(
        context,
        topSubtitle,
        blockCenterX + topSubtitleX * 10,
        blockCenterY + topSubtitleY,
        blockWidth - 160,
        subtitleSize * (topSubtitleLineHeight / 100),
        2
      );

      if (showTopSmallText && topSmallText.trim()) {
        context.font = `800 ${topSmallTextSize}px ${topSubtitleFont.stack}`;
        context.fillStyle = rgbToHex(mix(subtitleColor, hexToRgb("#171514"), 0.22));
        context.fillText(topSmallText, blockCenterX + topSmallTextX * 10, blockCenterY + topSmallTextY);
      }

      if (topBadgeText.trim()) {
        const badgeColor = accentColor;
        const badgeX = frameX + frameW - 210;
        const badgeY = frameY + 105;
        context.fillStyle = rgbToHex(badgeColor);
        context.beginPath();
        context.roundRect(badgeX - 175, badgeY - 70, 350, 140, 70);
        context.fill();
        context.fillStyle = "#ffffff";
        context.font = `900 58px ${topSubtitleFont.stack}`;
        context.fillText(topBadgeText, badgeX, badgeY + 3);
      }

      const preview = previewRef.current;
      if (preview && !options.targetCanvas) {
        const previewContext = preview.getContext("2d");
        if (!previewContext) return;
        previewContext.imageSmoothingEnabled = true;
        previewContext.imageSmoothingQuality = "high";
        previewContext.setTransform(1, 0, 0, 1, 0, 0);
        previewContext.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
        previewContext.drawImage(canvas, 0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
      }
    },
    [
      accentColor,
      activePreset.background,
      assetSource,
      clipartDistance,
      clipartDensity,
      clipartPlacement,
      cliparts,
      frameHeight,
      frameRadius,
      frameWidth,
      fontLoadTick,
      showTopSmallText,
      subtitleColor,
      textBlockHeight,
      textBlockWidth,
      textBlockX,
      textBlockY,
      titleColor,
      topBadgeText,
      topAssetCount,
      topClipartSize,
      topClipartVariation,
      topPanelEnabled,
      topPanelShape,
      topSeed,
      topSmallText,
      topSmallTextSize,
      topSmallTextX,
      topSmallTextY,
      topStyle,
      topSubtitle,
      topSubtitleFont,
      topSubtitleLineHeight,
      topSubtitleSize,
      topSubtitleX,
      topSubtitleY,
      topTitle,
      topTitleFont,
      topTitleLineHeight,
      topTitleSize,
      topTitleX,
      topTitleY
    ]
  );

  useEffect(() => {
    if (creationMode === "grid") {
      renderThumbnail({ withText: true });
    } else {
      renderTopThumbnail();
    }
  }, [creationMode, renderThumbnail, renderTopThumbnail]);

  async function addFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList).filter((file) => file.type === "image/png" || file.name.endsWith(".png"));
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
            name: file.name,
            previewUrl: createPreviewUrl(trimmedCanvas),
            trimmedCanvas,
            trimmedWidth: trimmedCanvas.width,
            trimmedHeight: trimmedCanvas.height,
            colors: extractColorsFromCanvas(trimmedCanvas, 4)
          };
        })
      );

      setCliparts((current) => [...current, ...loadedCliparts]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "PNG素材を読み込めませんでした。");
    }
  }

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) {
      void addFiles(event.target.files);
      event.target.value = "";
    }
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDragging(false);
    void addFiles(event.dataTransfer.files);
  }

  async function handleDownload(withText: boolean, pageIndex = selectedPage) {
    const canvas = renderCanvasRef.current;
    if (!canvas) return;
    await ensureCanvasFonts([titleFont, subtitleFont]);
    const highResCanvas = document.createElement("canvas");
    renderThumbnail({ withText, pageIndex, targetCanvas: highResCanvas, outputSize: exportSize * 2 });
    canvas.width = exportSize;
    canvas.height = exportSize;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, exportSize, exportSize);
    context.drawImage(highResCanvas, 0, 0, exportSize, exportSize);
    downloadCanvas(
      canvas,
      title,
      `${withText ? "text" : "no-text"}-${exportSize}px-page-${pageIndex + 1}`,
      exportFormat
    );
    renderThumbnail({ withText: true });
  }

  async function handleTopDownload() {
    const canvas = renderCanvasRef.current;
    if (!canvas) return;
    await ensureCanvasFonts([topTitleFont, topSubtitleFont]);
    const highResCanvas = document.createElement("canvas");
    renderTopThumbnail({ targetCanvas: highResCanvas, outputSize: exportSize * 2 });
    canvas.width = exportSize;
    canvas.height = exportSize;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, exportSize, exportSize);
    context.drawImage(highResCanvas, 0, 0, exportSize, exportSize);
    downloadCanvas(canvas, topTitle, `top-thumbnail-${exportSize}px`, exportFormat);
    renderTopThumbnail();
  }

  function handleDownloadAll(withText: boolean) {
    for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
      window.setTimeout(() => void handleDownload(withText, pageIndex), pageIndex * 300);
    }
  }

  return (
    <main
      className={creationMode === "grid" ? "appShell gridModeActive" : "appShell topModeActive"}
      style={appThemeStyle}
    >
      <section className="heroBar">
        <div>
          <p className="eyebrow">日本語 Etsy セラー向けサムネイル作成ツール</p>
          <h1>Clipart Thumbnail Maker</h1>
        </div>
        <div className="presetStatus">
          <span>選択中プリセット</span>
          <b>{activePreset.label}</b>
        </div>
      </section>

      <section className="modeSelector" aria-label="作成モード">
        <span>作成モード</span>
        <button
          type="button"
          className={creationMode === "grid" ? "active" : ""}
          onClick={() => setCreationMode("grid")}
        >
          一覧サムネイル
        </button>
        <button
          type="button"
          className={creationMode === "top" ? "active" : ""}
          onClick={() => setCreationMode("top")}
        >
          トップサムネイル
        </button>
      </section>

      <section className="workspace">
        <aside className="controls" aria-label="サムネイル設定">
          <div className="gridControls">
          <section className="controlGroup">
            <div className="sectionTitle">
              <span>1</span>
              <h2>PNG素材をアップロード</h2>
            </div>
            <label
              className={isDragging ? "fileDrop dragging" : "fileDrop"}
              onDragEnter={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setIsDragging(false);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
            >
              <b>ここにPNG素材をドラッグ＆ドロップ</b>
              <span>またはクリックしてファイルを選択</span>
              <small>透明PNGを複数まとめて追加できます</small>
              <input ref={fileInputRef} type="file" accept="image/png" multiple onChange={handleFiles} />
            </label>
            <div className="statsLine">
              <span>アップロード済み素材：{cliparts.length}枚</span>
              <span>
                {pageCount}ページ / 1ページ{pageSize}枚
              </span>
            </div>
            {cliparts.length > 0 ? (
              <div className="assetPreviewGrid" aria-label="アップロード素材プレビュー">
                {cliparts.slice(0, 24).map((clipart, index) => (
                  <img key={clipart.id} src={clipart.previewUrl} alt={`素材 ${index + 1}`} title={clipart.name} />
                ))}
                {cliparts.length > 24 ? <span className="moreAssets">+{cliparts.length - 24}</span> : null}
              </div>
            ) : null}
            {error ? <p className="errorText">{error}</p> : null}
          </section>

          <section className="controlGroup">
            <div className="sectionTitle">
              <span>2</span>
              <h2>カラーパレット</h2>
            </div>
            <div className="paletteOptions">
              {paletteOptions.map((option) => (
                <button
                  className={paletteKey === option.key ? "paletteCard active" : "paletteCard"}
                  key={option.key}
                  type="button"
                  onClick={() => setPaletteKey(option.key)}
                >
                  <b>{option.label}</b>
                  <small>{option.description}</small>
                  <span className="colorStrip">
                    {option.colors.map((color, index) => (
                      <i
                        key={`${option.key}-${rgbToHex(color)}-${index}`}
                        style={{ backgroundColor: rgbToHex(color) }}
                        title={rgbToHex(color)}
                      />
                    ))}
                  </span>
                  <em>このカラーを使う</em>
                </button>
              ))}
            </div>
            <p className="helperText">
              透明部分を無視し、白・黒・グレーをなるべく除外して3種類のパレットを自動生成します。
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
              <h2>文字設定</h2>
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
                タイトルフォント
                <select value={titleFontKey} onChange={(event) => setTitleFontKey(event.target.value as FontKey)}>
                  {fontOptions.map((font) => (
                    <option key={font.key} value={font.key}>
                      {font.label} - {font.sample}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                サブタイトルフォント
                <select value={subtitleFontKey} onChange={(event) => setSubtitleFontKey(event.target.value as FontKey)}>
                  {fontOptions.map((font) => (
                    <option key={font.key} value={font.key}>
                      {font.label} - {font.sample}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="fontPreviewGrid">
              {fontOptions.map((font) => (
                <button
                  key={font.key}
                  type="button"
                  className={titleFontKey === font.key ? "fontPreview active" : "fontPreview"}
                  onClick={() => setTitleFontKey(font.key)}
                >
                  <span>{font.label}</span>
                  <b style={{ fontFamily: font.stack }}>{font.sample}</b>
                </button>
              ))}
            </div>
          </section>

          <section className="controlGroup">
            <div className="sectionTitle">
              <span>5</span>
              <h2>位置とサイズ</h2>
            </div>
            <div className="sliderStack">
              <label>
                <span>
                  タイトルの上下位置 <b>{titleY}</b>
                </span>
                <input type="range" min="80" max="520" value={titleY} onChange={(event) => setTitleY(Number(event.target.value))} />
              </label>
              <label>
                <span>
                  タイトルの左右位置 <b>{titleX}</b>
                </span>
                <input type="range" min="-100" max="100" value={titleX} onChange={(event) => setTitleX(Number(event.target.value))} />
              </label>
              <label>
                <span>
                  タイトルの文字サイズ <b>{titleFontSize}px</b>
                </span>
                <input type="range" min="80" max="230" value={titleFontSize} onChange={(event) => setTitleFontSize(Number(event.target.value))} />
              </label>
              <label>
                <span>
                  サブタイトルの上下位置 <b>{subtitleY}</b>
                </span>
                <input type="range" min="170" max="720" value={subtitleY} onChange={(event) => setSubtitleY(Number(event.target.value))} />
              </label>
              <label>
                <span>
                  サブタイトルの左右位置 <b>{subtitleX}</b>
                </span>
                <input type="range" min="-100" max="100" value={subtitleX} onChange={(event) => setSubtitleX(Number(event.target.value))} />
              </label>
              <label>
                <span>
                  サブタイトルの文字サイズ <b>{subtitleFontSize}px</b>
                </span>
                <input type="range" min="30" max="110" value={subtitleFontSize} onChange={(event) => setSubtitleFontSize(Number(event.target.value))} />
              </label>
              <label>
                <span>
                  タイトルとサブタイトルの間隔 <b>{textGap}</b>
                </span>
                <input type="range" min="20" max="180" value={textGap} onChange={(event) => setTextGap(Number(event.target.value))} />
              </label>
            </div>
          </section>

          <section className="controlGroup">
            <div className="sectionTitle">
              <span>6</span>
              <h2>素材レイアウト</h2>
            </div>
            <div className="twoColumn">
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
              <label>
                タイトルエリア高さ
                <input
                  type="range"
                  min="15"
                  max="32"
                  value={topTitleArea}
                  onChange={(event) => setTopTitleArea(Number(event.target.value))}
                />
              </label>
            </div>
            <div className="sliderStack">
              <label>
                <span>
                  素材サイズ <b>{clipartSize}%</b>
                </span>
                <input type="range" min="60" max="130" value={clipartSize} onChange={(event) => setClipartSize(Number(event.target.value))} />
              </label>
              <label>
                <span>
                  横余白 <b>{horizontalSpacing}</b>
                </span>
                <input type="range" min="0" max="16" value={horizontalSpacing} onChange={(event) => setHorizontalSpacing(Number(event.target.value))} />
              </label>
              <label>
                <span>
                  縦余白 <b>{verticalSpacing}</b>
                </span>
                <input type="range" min="0" max="16" value={verticalSpacing} onChange={(event) => setVerticalSpacing(Number(event.target.value))} />
              </label>
            </div>
          </section>

          <section className="downloadGroup">
            <div className="exportSettings">
              <label>
                保存サイズ
                <select value={exportSize} onChange={(event) => setExportSize(Number(event.target.value) as ExportSize)}>
                  {exportSizeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                保存形式
                <select value={exportFormat} onChange={(event) => setExportFormat(event.target.value as ExportFormat)}>
                  {exportFormatOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button type="button" onClick={() => handleDownloadAll(true)}>
              全ページを文字ありで保存
            </button>
            <button type="button" onClick={() => handleDownloadAll(false)}>
              全ページを文字なしで保存
            </button>
          </section>
          </div>

          <div className="topControls">
            <section className="controlGroup">
              <div className="sectionTitle">
                <span>1</span>
                <h2>素材の選択方法</h2>
              </div>
              <div className="modeButtonRow">
                <button
                  type="button"
                  className={assetSource === "new" ? "active" : ""}
                  onClick={() => setAssetSource("new")}
                >
                  新しく素材をアップロード
                </button>
                <button
                  type="button"
                  className={assetSource === "uploaded" ? "active" : ""}
                  onClick={() => setAssetSource("uploaded")}
                >
                  アップロード済み素材からランダム生成
                </button>
              </div>
              <label
                className={isDragging ? "fileDrop dragging" : "fileDrop"}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  setIsDragging(false);
                }}
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrop}
              >
                <b>トップ用PNG素材をドラッグ＆ドロップ</b>
                <span>またはクリックしてファイルを選択</span>
                <small>一覧サムネイルの素材と共有されます</small>
                <input type="file" accept="image/png" multiple onChange={handleFiles} />
              </label>
              <div className="statsLine">
                <span>使用可能素材：{cliparts.length}枚</span>
                <span>{clipartDensity === "low" ? "少なめ" : clipartDensity === "high" ? "多め" : "普通"}</span>
              </div>
            </section>

            <section className="controlGroup">
              <div className="sectionTitle">
                <span>2</span>
                <h2>トップサムネイルスタイル</h2>
              </div>
              <div className="presetGrid">
                {topStyleOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={topStyle === option.value ? "presetCard active" : "presetCard"}
                    onClick={() => setTopStyle(option.value)}
                  >
                    <b>{option.label}</b>
                    <small>{option.description}</small>
                  </button>
                ))}
              </div>
            </section>

            <section className="controlGroup">
              <div className="sectionTitle">
                <span>3</span>
                <h2>カラーパレット</h2>
              </div>
              <div className="paletteOptions">
                {paletteOptions.map((option) => (
                  <button
                    className={paletteKey === option.key ? "paletteCard active" : "paletteCard"}
                    key={`top-${option.key}`}
                    type="button"
                    onClick={() => setPaletteKey(option.key)}
                  >
                    <b>{option.label}</b>
                    <small>{option.description}</small>
                    <span className="colorStrip">
                      {option.colors.map((color, index) => (
                        <i
                          key={`top-${option.key}-${rgbToHex(color)}-${index}`}
                          style={{ backgroundColor: rgbToHex(color) }}
                          title={rgbToHex(color)}
                        />
                      ))}
                    </span>
                    <em>このカラーを使う</em>
                  </button>
                ))}
              </div>
            </section>

            <section className="controlGroup">
              <div className="sectionTitle">
                <span>4</span>
                <h2>文字とフォント</h2>
              </div>
              <label>
                メインタイトル
                <input value={topTitle} onChange={(event) => setTopTitle(event.target.value)} />
              </label>
              <label>
                サブタイトル
                <input value={topSubtitle} onChange={(event) => setTopSubtitle(event.target.value)} />
              </label>
              <div className="twoColumn">
                <label>
                  小文字テキスト
                  <input value={topSmallText} onChange={(event) => setTopSmallText(event.target.value)} />
                </label>
                <label>
                  バッジテキスト
                  <input value={topBadgeText} onChange={(event) => setTopBadgeText(event.target.value)} />
                </label>
              </div>
              <div className="twoColumn">
                <label>
                  メインタイトルフォント
                  <select value={topTitleFontKey} onChange={(event) => setTopTitleFontKey(event.target.value as FontKey)}>
                    {fontOptions.map((font) => (
                      <option key={font.key} value={font.key}>
                        {font.label} - {font.sample}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  サブタイトルフォント
                  <select value={topSubtitleFontKey} onChange={(event) => setTopSubtitleFontKey(event.target.value as FontKey)}>
                    {fontOptions.map((font) => (
                      <option key={font.key} value={font.key}>
                        {font.label} - {font.sample}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <section className="controlGroup">
              <div className="sectionTitle">
                <span>5</span>
                <h2>中央テキストフレーム</h2>
              </div>
              <div className="modeButtonRow">
                <button type="button" className={!topPanelEnabled ? "active" : ""} onClick={() => setTopPanelEnabled(false)}>
                  フレームなし
                </button>
                <button type="button" className={topPanelEnabled ? "active" : ""} onClick={() => setTopPanelEnabled(true)}>
                  フレームあり
                </button>
              </div>
              <div className="twoColumn">
                <label>
                  フレーム形状
                  <select value={topPanelShape} onChange={(event) => setTopPanelShape(event.target.value as PanelShape)}>
                    {panelShapeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                {topPanelShape === "square" ? (
                  <label>
                    角丸
                    <input type="range" min="0" max="240" value={frameRadius} onChange={(event) => setFrameRadius(Number(event.target.value))} />
                  </label>
                ) : null}
              </div>
              <div className="sliderStack">
                <label>
                  <span>フレーム幅 <b>{frameWidth}</b></span>
                  <input type="range" min="800" max="2300" value={frameWidth} onChange={(event) => setFrameWidth(Number(event.target.value))} />
                </label>
                <label>
                  <span>フレーム高さ <b>{frameHeight}</b></span>
                  <input type="range" min="420" max="1500" value={frameHeight} onChange={(event) => setFrameHeight(Number(event.target.value))} />
                </label>
              </div>
            </section>

            <section className="controlGroup">
              <div className="sectionTitle">
                <span>6</span>
                <h2>テキストブロック</h2>
              </div>
              <div className="sliderStack">
                <label><span>テキストブロックの上下位置 <b>{textBlockY}</b></span><input type="range" min="-120" max="120" value={textBlockY} onChange={(event) => setTextBlockY(Number(event.target.value))} /></label>
                <label><span>テキストブロックの左右位置 <b>{textBlockX}</b></span><input type="range" min="-120" max="120" value={textBlockX} onChange={(event) => setTextBlockX(Number(event.target.value))} /></label>
                <label><span>テキストブロック幅 <b>{textBlockWidth}</b></span><input type="range" min="900" max="2300" value={textBlockWidth} onChange={(event) => setTextBlockWidth(Number(event.target.value))} /></label>
                <label><span>テキストブロック高さ <b>{textBlockHeight}</b></span><input type="range" min="420" max="1500" value={textBlockHeight} onChange={(event) => setTextBlockHeight(Number(event.target.value))} /></label>
              </div>
            </section>

            <section className="controlGroup">
              <div className="sectionTitle">
                <span>7</span>
                <h2>タイトル調整</h2>
              </div>
              <div className="sliderStack">
                <label><span>タイトルサイズ <b>{topTitleSize}</b></span><input type="range" min="80" max="300" value={topTitleSize} onChange={(event) => setTopTitleSize(Number(event.target.value))} /></label>
                <label><span>タイトルの上下位置 <b>{topTitleY}</b></span><input type="range" min="-420" max="240" value={topTitleY} onChange={(event) => setTopTitleY(Number(event.target.value))} /></label>
                <label><span>タイトルの左右位置 <b>{topTitleX}</b></span><input type="range" min="-120" max="120" value={topTitleX} onChange={(event) => setTopTitleX(Number(event.target.value))} /></label>
                <label><span>タイトル行間 <b>{topTitleLineHeight}%</b></span><input type="range" min="80" max="150" value={topTitleLineHeight} onChange={(event) => setTopTitleLineHeight(Number(event.target.value))} /></label>
              </div>
            </section>

            <section className="controlGroup">
              <div className="sectionTitle">
                <span>8</span>
                <h2>サブタイトル調整</h2>
              </div>
              <div className="sliderStack">
                <label><span>サブタイトルサイズ <b>{topSubtitleSize}</b></span><input type="range" min="30" max="150" value={topSubtitleSize} onChange={(event) => setTopSubtitleSize(Number(event.target.value))} /></label>
                <label><span>サブタイトルの上下位置 <b>{topSubtitleY}</b></span><input type="range" min="-180" max="420" value={topSubtitleY} onChange={(event) => setTopSubtitleY(Number(event.target.value))} /></label>
                <label><span>サブタイトルの左右位置 <b>{topSubtitleX}</b></span><input type="range" min="-120" max="120" value={topSubtitleX} onChange={(event) => setTopSubtitleX(Number(event.target.value))} /></label>
                <label><span>サブタイトル行間 <b>{topSubtitleLineHeight}%</b></span><input type="range" min="80" max="160" value={topSubtitleLineHeight} onChange={(event) => setTopSubtitleLineHeight(Number(event.target.value))} /></label>
              </div>
            </section>

            <section className="controlGroup">
              <div className="sectionTitle">
                <span>9</span>
                <h2>小文字テキスト</h2>
              </div>
              <label className="checkLabel">
                <input type="checkbox" checked={showTopSmallText} onChange={(event) => setShowTopSmallText(event.target.checked)} />
                <span>小文字テキストを表示</span>
              </label>
              <div className="sliderStack">
                <label><span>小文字テキストサイズ <b>{topSmallTextSize}</b></span><input type="range" min="24" max="100" value={topSmallTextSize} onChange={(event) => setTopSmallTextSize(Number(event.target.value))} /></label>
                <label><span>小文字テキストの上下位置 <b>{topSmallTextY}</b></span><input type="range" min="-50" max="520" value={topSmallTextY} onChange={(event) => setTopSmallTextY(Number(event.target.value))} /></label>
                <label><span>小文字テキストの左右位置 <b>{topSmallTextX}</b></span><input type="range" min="-120" max="120" value={topSmallTextX} onChange={(event) => setTopSmallTextX(Number(event.target.value))} /></label>
              </div>
            </section>

            <section className="controlGroup">
              <div className="sectionTitle">
                <span>10</span>
                <h2>素材配置</h2>
              </div>
              <label>
                配置スタイル
                <select value={clipartPlacement} onChange={(event) => setClipartPlacement(event.target.value as ClipartPlacement)}>
                  {placementOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <div className="twoColumn">
                <label>
                  使用する素材数
                  <select value={topAssetCount} onChange={(event) => setTopAssetCount(event.target.value as TopAssetCount)}>
                    {topAssetCountOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label>
                  素材密度
                  <select value={clipartDensity} onChange={(event) => setClipartDensity(event.target.value as ClipartDensity)}>
                    {densityOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <button className="utilityButton" type="button" onClick={() => setTopSeed(Date.now())}>
                  配置をシャッフル
                </button>
              </div>
              <div className="sliderStack">
                <label><span>素材サイズ <b>{topClipartSize}</b></span><input type="range" min="220" max="820" value={topClipartSize} onChange={(event) => setTopClipartSize(Number(event.target.value))} /></label>
                <label><span>ランダムサイズ差 <b>{topClipartVariation}%</b></span><input type="range" min="0" max="90" value={topClipartVariation} onChange={(event) => setTopClipartVariation(Number(event.target.value))} /></label>
                <label><span>素材同士の距離 <b>{clipartDistance}</b></span><input type="range" min="20" max="220" value={clipartDistance} onChange={(event) => setClipartDistance(Number(event.target.value))} /></label>
              </div>
            </section>

            <section className="downloadGroup">
              <div className="exportSettings">
                <label>
                  保存サイズ
                  <select value={exportSize} onChange={(event) => setExportSize(Number(event.target.value) as ExportSize)}>
                    {exportSizeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  保存形式
                  <select value={exportFormat} onChange={(event) => setExportFormat(event.target.value as ExportFormat)}>
                    {exportFormatOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <button type="button" onClick={() => void handleTopDownload()}>
                トップサムネイルを保存
              </button>
            </section>
          </div>
        </aside>

        <section className="previewPanel" aria-label="サムネイルプレビュー">
          <div className="previewHeader">
            <div>
              <p>{exportSize} × {exportSize} px / {exportFormat.toUpperCase()}</p>
              <h2>{creationMode === "grid" ? "一覧サムネイルプレビュー" : "トップサムネイルプレビュー"}</h2>
            </div>
            <span>
              {creationMode === "grid"
                ? `${activeGrid.columns}×${activeGrid.rows}`
                : topStyleOptions.find((option) => option.value === topStyle)?.label}
            </span>
          </div>
          <div className="pageControls">
            <button type="button" disabled={selectedPage === 0} onClick={() => setSelectedPage((page) => page - 1)}>
              前のページ
            </button>
            <strong>
              {selectedPage + 1}ページ目 / {pageCount}ページ
            </strong>
            <button
              type="button"
              disabled={selectedPage >= pageCount - 1}
              onClick={() => setSelectedPage((page) => page + 1)}
            >
              次のページ
            </button>
          </div>
          <div className="pageJumpGrid">
            {Array.from({ length: pageCount }, (_, index) => (
              <button
                key={index}
                type="button"
                className={selectedPage === index ? "active" : ""}
                onClick={() => setSelectedPage(index)}
              >
                {index + 1}ページ目
              </button>
            ))}
          </div>
          <div className="previewMeta">
            <span>
              {creationMode === "grid"
                ? `表示中：${currentPageAssets.length}枚`
                : `使用素材：${topPreviewAssetCount}枚 / ${cliparts.length}枚`}
            </span>
            {creationMode === "top" ? <span>Etsyトップ画像向け</span> : null}
          </div>
          <div className="canvasFrame">
            <canvas ref={previewRef} width={PREVIEW_SIZE} height={PREVIEW_SIZE} aria-label="サムネイルプレビュー" />
          </div>
          {creationMode === "grid" ? (
            <div className="currentPageDownloads">
              <button type="button" onClick={() => handleDownload(true)}>
                現在のページを文字ありで保存
              </button>
              <button type="button" onClick={() => handleDownload(false)}>
                現在のページを文字なしで保存
              </button>
            </div>
          ) : null}
        </section>
      </section>

      <canvas className="hiddenCanvas" ref={renderCanvasRef} width={DESIGN_SIZE} height={DESIGN_SIZE} />
    </main>
  );
}
