import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Etsyサムネイル生成ツール",
  description: "PNGクリップアート素材からEtsy向け正方形サムネイルを作成します。"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
