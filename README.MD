# 概要
https://cloudflare-pages-test-ehv.pages.dev/
- 上記URLでイジンデンのカードを検索するツールです。

## DBの詳細について
### URL
` https://lxsdiqvyhxokuoofgpor.supabase.co`

### anon key (publishable key)
` sb_publishable_r885Rez5bZWiO0nfToFI-w_bqi_zvoU`

### DBの中身をみたい人へ
windowsなら「win+R」押下後に「cmd」で検索して実行するか、macならターミナルで実行してください。
```bash
# DBの中身を丸ごと取得する
curl \
  -H "apikey: sb_publishable_r885Rez5bZWiO0nfToFI-w_bqi_zvoU" \
  -H "Authorization: Bearer sb_publishable_r885Rez5bZWiO0nfToFI-w_bqi_zvoU" \
  "https://lxsdiqvyhxokuoofgpor.supabase.co/rest/v1/cards?select=*" \
  -o cards.json
```
```bash
# json形式からCSV形式に変換する
jq -r '(.[0] | keys_unsorted) as $keys |
      $keys, map([.[ $keys[] ]])[] | @csv' cards.json > cards.csv
```

## 使用ツール
https://dash.cloudflare.com/
- githubに上げたHTMLを公開してくれるサービス(無料)

https://supabase.com/
- githubに上げたリポジトリのDBとして使えるサービス(無料)

https://dashboard.render.com/
- 常駐node.jsサーバとして使用。ずっと起動し続けてもらいます(無料プラン)

# 最近の修正
2026/08/13
- カード削除ボタンを追加しました。
- デッキ検索の機能を実装しました。
- ヘッダーとフッターを追加しました。

2026/07/31
- デッキシミュレータのPDF出力に対応しました。<br>
デッキのPDF出力にcloudflareではAPIのリクエスト制限が発生しました。<br>
常駐node.jsサーバに処理をさせるためRenderを使用してPDFサーバを構築しました。

2026/07/28
- カードデータベースにてデッキIDを生成できるようにしました。
- デッキシュミレータを追加しました
- 機能追加に伴いこれまでのURLをトップページに変更しました。

2026/07/25
- 第六弾をうｐしました
- 数値検索の際に「-」が含まれてないなら「N-M」でなくても検索するように修正しました。

2026/07/03
- 数値検索の範囲検索に対応しました。

2026/07/01
- サービス開始しました。DBに第5弾から追加したのでユニークID01が第5弾になってます。すみません。

