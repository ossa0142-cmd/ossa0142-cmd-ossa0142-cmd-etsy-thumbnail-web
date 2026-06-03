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
type FontKey =
  | "handwritten"
  | "script"
  | "cute"
  | "simple"
  | "bold"
  | "natural"
  | "vintage";

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

const fontOptions: FontOption[] = [
  {
    key: "handwritten",
    label: "手書き風",
    sample: "Handmade Clipart",
    stack: "'Comic Sans MS', 'Hiragino Maru Gothic ProN', 'Yu Gothic', cursive",
    weight: 800
  },
  {
    key: "script",
    label: "筆記体",
    sample: "Elegant Bundle",
    stack: "Georgia, 'Times New Roman', 'Yu Mincho', serif",
    weight: 700
  },
  {
    key: "cute",
    label: "かわいい",
    sample: "Cute Nursery",
    stack: "'Arial Rounded MT Bold', 'Hiragino Maru Gothic ProN', 'Yu Gothic', sans-serif",
    weight: 900
  },
  {
    key: "simple",
    label: "シンプル",
    sample: "Minimal Clipart",
    stack: "'Helvetica Neue', Arial, 'Yu Gothic', sans-serif",
    weight: 700
  },
  {
    key: "bold",
    label: "太字",
    sample: "Bold Kids Party",
    stack: "'Arial Black', Impact, 'Yu Gothic', sans-serif",
    weight: 900
  },
  {
    key: "natural",
    label: "ナチュラル",
    sample: "Natural Art Set",
    stack: "Trebuchet MS, 'Hiragino Kaku Gothic ProN', 'Yu Gothic', sans-serif",
    weight: 800
  },
  {
    key: "vintage",
    label: "ヴィンテージ",
    sample: "Vintage Gouache",
    stack: "Georgia, Garamond, 'Yu Mincho', serif",
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
    defaultTitleFont: "cute",
    defaultSubtitleFont: "natural"
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
    defaultSubtitleFont: "natural"
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
    fallback: ["#f5b8cf", "#a7d8d0", "#f6dd9a", "#b7c8f2"],
    background: "#fffefe",
    titleScale: 0.98,
    subtitleScale: 0.88,
    margin: 100,
    textAreaBoost: 0.98,
    defaultTitleFont: "cute",
    defaultSubtitleFont: "handwritten"
  },
  {
    key: "boldKidsParty",
    label: "Bold Kids Party（ポップ）",
    description: "明るく目立つキッズ向け",
    fallback: ["#ef476f", "#ffd166", "#06d6a0", "#118ab2"],
    background: "#ffffff",
    titleScale: 1.08,
    subtitleScale: 0.96,
    margin: 86,
    textAreaBoost: 0.92,
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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [cliparts, setCliparts] = useState<UploadedClipart[]>([]);
  const [title, setTitle] = useState("Watercolor Baby Clipart");
  const [subtitle, setSubtitle] = useState(DEFAULT_SUBTITLE);
  const [presetKey, setPresetKey] = useState<PresetKey>("watercolorBaby");
  const [titleFontKey, setTitleFontKey] = useState<FontKey>("cute");
  const [subtitleFontKey, setSubtitleFontKey] = useState<FontKey>("natural");
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
  const titleFont = getFont(titleFontKey);
  const subtitleFont = getFont(subtitleFontKey);
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
  const palette = useMemo(() => {
    const colors: Rgb[] = [];
    const candidates = [...extractedColors, ...activePreset.fallback.map(hexToRgb)];

    for (const color of candidates) {
      if (colors.every((existing) => colorDistance(existing, color) > 42)) {
        colors.push(color);
      }
      if (colors.length === 5) break;
    }

    return colors;
  }, [activePreset.fallback, extractedColors]);
  const titleColor = palette[0] ?? hexToRgb("#222222");
  const subtitleColor = palette[1] ?? mix(titleColor, hexToRgb("#ffffff"), 0.35);

  useEffect(() => {
    setTitleFontKey(activePreset.defaultTitleFont);
    setSubtitleFontKey(activePreset.defaultSubtitleFont);
  }, [activePreset.defaultSubtitleFont, activePreset.defaultTitleFont]);

  useEffect(() => {
    setSelectedPage((page) => clamp(page, 0, pageCount - 1));
  }, [pageCount]);

  const renderThumbnail = useCallback(
    (options: { withText: boolean; pageIndex?: number; targetCanvas?: HTMLCanvasElement } = { withText: true }) => {
      const canvas = options.targetCanvas ?? renderCanvasRef.current;
      if (!canvas) return;

      const context = canvas.getContext("2d");
      if (!context) return;

      const withText = options.withText;
      const pageIndex = options.pageIndex ?? selectedPage;
      const pageAssets = cliparts.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize);

      context.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      context.fillStyle = activePreset.background;
      context.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      const margin = withText ? activePreset.margin : 70;
      const topAreaHeight = withText
        ? Math.round((topTitleArea / 100) * CANVAS_SIZE * activePreset.textAreaBoost)
        : Math.round(CANVAS_SIZE * 0.055);
      const gridTop = withText ? Math.max(topAreaHeight + 8, 520) : 95;
      const gridBottom = withText ? CANVAS_SIZE - 90 : CANVAS_SIZE - 70;
      const gridWidth = CANVAS_SIZE - margin * 2;
      const gridHeight = gridBottom - gridTop;
      const columnGap = horizontalSpacing * (withText ? 7 : 3.5);
      const rowGap = verticalSpacing * (withText ? 7 : 3.5);
      const cellWidth = (gridWidth - columnGap * (activeGrid.columns - 1)) / activeGrid.columns;
      const cellHeight = (gridHeight - rowGap * (activeGrid.rows - 1)) / activeGrid.rows;
      const sizeMultiplier = (withText ? clipartSize : Math.max(116, clipartSize + 20)) / 100;

      context.textAlign = "center";
      context.textBaseline = "middle";

      if (withText) {
        const maxTextWidth = CANVAS_SIZE - margin * 2;
        const titleSize = fitFontSize(
          context,
          title,
          titleFont,
          Math.round(titleFontSize * activePreset.titleScale),
          58,
          maxTextWidth
        );
        const safeTitleX = clamp(CANVAS_SIZE / 2 + titleX * 10, margin, CANVAS_SIZE - margin);
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
        const safeSubtitleX = clamp(CANVAS_SIZE / 2 + subtitleX * 10, margin, CANVAS_SIZE - margin);
        const preferredSubtitleY = Math.max(subtitleY, safeTitleY + titleSize * 0.48 + textGap);
        const safeSubtitleY = clamp(preferredSubtitleY, safeTitleY + 56, Math.max(safeTitleY + 64, topAreaHeight - 34));

        context.font = `${subtitleFont.weight} ${subtitleSize}px ${subtitleFont.stack}`;
        context.fillStyle = rgbToHex(subtitleColor);
        context.fillText(subtitle, safeSubtitleX, safeSubtitleY);
      }

      pageAssets.forEach((clipart, index) => {
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

      const preview = previewRef.current;
      if (preview && !options.targetCanvas) {
        const previewContext = preview.getContext("2d");
        if (!previewContext) return;
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

  useEffect(() => {
    renderThumbnail({ withText: true });
  }, [renderThumbnail]);

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

  function handleDownload(withText: boolean, pageIndex = selectedPage) {
    const canvas = renderCanvasRef.current;
    if (!canvas) return;
    renderThumbnail({ withText, pageIndex });
    downloadCanvas(canvas, title, `${withText ? "text" : "no-text"}-page-${pageIndex + 1}`);
    renderThumbnail({ withText: true });
  }

  function handleDownloadAll(withText: boolean) {
    for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
      window.setTimeout(() => handleDownload(withText, pageIndex), pageIndex * 250);
    }
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
            <button type="button" onClick={() => handleDownload(true)}>
              文字あり版をダウンロード
            </button>
            <button type="button" onClick={() => handleDownload(false)}>
              文字なし版をダウンロード
            </button>
            <button type="button" onClick={() => handleDownloadAll(true)}>
              全ページ文字あり版
            </button>
            <button type="button" onClick={() => handleDownloadAll(false)}>
              全ページ文字なし版
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
          <div className="pageControls">
            <button type="button" disabled={selectedPage === 0} onClick={() => setSelectedPage((page) => page - 1)}>
              前のページ
            </button>
            <strong>
              Page {selectedPage + 1} / {pageCount}
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
                Page {index + 1}
              </button>
            ))}
          </div>
          <div className="previewMeta">
            <span>表示中：{currentPageAssets.length}枚</span>
            <span>全素材をページ分割</span>
            <span>素材色は変更しません</span>
            <span>透明余白を自動トリミング</span>
          </div>
          <div className="canvasFrame">
            <canvas ref={previewRef} width={PREVIEW_SIZE} height={PREVIEW_SIZE} aria-label="サムネイルプレビュー" />
          </div>
          <div className="currentPageDownloads">
            <button type="button" onClick={() => handleDownload(true)}>
              現在のページをダウンロード
            </button>
            <button type="button" onClick={() => handleDownload(false)}>
              現在のページを文字なしでダウンロード
            </button>
          </div>
        </section>
      </section>

      <canvas className="hiddenCanvas" ref={renderCanvasRef} width={CANVAS_SIZE} height={CANVAS_SIZE} />
    </main>
  );
}
