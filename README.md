# EtsyThumbnailWeb

日本のEtsyセラー向けの、ブラウザだけで使えるクリップアートバンドル用サムネイル生成アプリです。

## 主な機能

- 複数のPNG素材をアップロード
- 透明余白を自動トリミング
- 透明部分を無視して素材のメインカラーを自動抽出
- 白・黒・グレーをなるべく除外して3〜5色のパレットを作成
- 抽出カラーをタイトル、サブタイトル、バッジ、アクセントに反映
- 雰囲気プリセットを選択
- 文字あり版と文字なし版をそれぞれPNGでダウンロード
- 3000 × 3000 px のEtsy向け正方形サムネイル
- すべてブラウザ内で処理し、APIへ画像を送信しません

## プリセット

- Watercolor Baby（水彩ベビー）
- Vintage Gouache（ヴィンテージガッシュ）
- Halloween Cute（ハロウィン）
- Christmas Cozy（クリスマス）
- Minimal Line Art（線画）
- Pastel Nursery（パステル）
- Bold Kids Party（ポップ）

各プリセットでフォント、タイトルカラー、サブタイトルカラー、バッジデザイン、余白バランス、全体の雰囲気が変わります。

## レイアウト

- 自動
- 4×3
- 4×4
- 5×4

自動レイアウトの目安:

- 30〜40 PNG: 4×3
- 41〜60 PNG: 4×4
- 61〜90 PNG: 5×4

## ローカル開発

```bash
npm install
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## ビルド

```bash
npm run build
```

## Vercelへデプロイ

1. このフォルダをGitHubリポジトリにアップロードします。
2. [Vercel](https://vercel.com) で新しいプロジェクトを作成します。
3. GitHubリポジトリをインポートします。
4. Framework Preset は `Next.js` のままでOKです。
5. 通常は以下の設定でデプロイできます。
   - Install Command: `npm install`
   - Build Command: `npm run build`
   - Output Directory: `.next`
6. `Deploy` を押すと公開URLが発行されます。

このアプリはNext.js / React / TypeScript / HTML Canvasで作られており、Vercelにそのままデプロイできます。
