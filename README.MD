# 概要
https://cloudflare-pages-test-ehv.pages.dev/
上記URLでイジンデンのカードを検索するツールです。

## 使用ツール
https://dash.cloudflare.com/
・githubに上げたHTMLを公開してくれるサービス(無料)

https://supabase.com/
・githubに上げたリポジトリのDBとして使えるサービス(無料)

# 最近の修正
2026/07/28
- カードデータベースにてデッキIDを生成できるようにしました。
- デッキシュミレータを追加しました
- 機能追加に伴いこれまでのURLをメインページに変更しました。

## デッキシミュレータのPDF出力

デッキシミュレータの「PDF出力」は Cloudflare Pages Functions の `/api/deck-pdf` でPDFを生成します。デプロイ時はリポジトリの `functions` ディレクトリを Pages Functions として有効にし、ルートの `package.json` にある `pdf-lib` を依存関係としてインストールしてください。

PDFはA4縦で、カード1枚を幅59mm × 高さ86mmとして3列×3行に配置します。4列ではA4の幅に収まらないため、カードが見切れない配置にしています。

2026/07/25
- 第六弾をうｐしました
- 数値検索の際に「-」が含まれてないなら「N-M」でなくても検索するように修正しました。