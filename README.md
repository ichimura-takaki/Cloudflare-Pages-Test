# 概要
https://cloudflare-pages-test-ehv.pages.dev/
上記URLでイジンデンのカードを検索するツールです。

## 使用ツール
https://dash.cloudflare.com/
・githubに上げたHTMLを公開してくれるサービス(無料)

https://supabase.com/
・githubに上げたリポジトリのDBとして使えるサービス(無料)

# 最近の修正
2026/07/31
- デッキシミュレータのPDF出力に対応しました。

## デッキシミュレータのPDF出力

Cloudflare Pagesのビルド設定は次のようにしてください。

```text
Root directory: /
Build command: npm run build
Build output directory: /
```

`npm run build` が `pdf-lib` をインストールしてからPages Functionsをバンドルします。Build commandを空欄にすると、Functionsのビルドで `pdf-lib` を解決できません。

2026/07/28
- カードデータベースにてデッキIDを生成できるようにしました。
- デッキシュミレータを追加しました
- 機能追加に伴いこれまでのURLをメインページに変更しました。

2026/07/25
- 第六弾をうｐしました
- 数値検索の際に「-」が含まれてないなら「N-M」でなくても検索するように修正しました。