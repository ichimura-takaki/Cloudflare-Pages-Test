# 概要
https://cloudflare-pages-test-ehv.pages.dev/
- 上記URLでイジンデンのカードを検索するツールです。

## 使用ツール
https://dash.cloudflare.com/
- githubに上げたHTMLを公開してくれるサービス(無料)

https://supabase.com/
- githubに上げたリポジトリのDBとして使えるサービス(無料)

## DBについて
使用しているカラムは以下の通り。<br>
INTカラムは空白でNULLになります。
- 収録版(STR)
- カード番号(STR)
- レアリティ(STR)
- 色(STR)
- 種別(STR)
- 名称(STR)
- レベル	(INT)
- 魔力コスト(INT)	
- パワー	(INT)
- 特性(STR)
- ルールテキスト(STR)	
- 遺業能力(STR)
- Illustlation(STR)	
- 収録(STR)	
- ゲストコンセプトデザイン	
- 画像格納先	
- 番号


# 最近の修正
2026/07/25
- 第六弾をうｐしました
- 数値検索の際に「-」が含まれてないなら「N-M」でなくても検索するように修正しました。
