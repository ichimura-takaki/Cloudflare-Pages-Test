const SUPABASE_URL = "https://lxsdiqvyhxokuoofgpor.supabase.co";
const SUPABASE_KEY = "sb_publishable_r885Rez5bZWiO0nfToFI-w_bqi_zvoU";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// 初期表示：全カード一覧
window.onload = async () => {
  const { data } = await client.from("cards").select("*");
  renderCards(data);
};

// 検索ボタン
document.getElementById("searchBtn").addEventListener("click", async () => {
  let query = client.from("cards").select("*");

  const fields = [
    "名称",
    "カード番号",
    "レアリティ",
    "色",
    "種別",
    "レベル",
    "魔力コスト",
    "パワー",
    "特性",
    "ルールテキスト",
  ];

fields.forEach(field => {

    const input = document.getElementById(field);
    if (!input) return;   // ★ null を安全にスキップ
    
  const value = document.getElementById(field).value;
  if (!value) return;

  // OR検索（? で区切る）
  if (value.includes("?")) {
    const orWords = value.split("?").map(v => v.trim()).filter(v => v);
    query = query.or(
      orWords.map(w => `${field}.ilike.%${w}%`).join(",")
    );
    return;
  }

  // AND / NOT検索（スペース区切り）
  const words = value.split(/\s+/).filter(w => w);

  words.forEach(word => {
    if (word.startsWith("!")) {
      // ★ Supabase-js v2 の NOT検索
      const real = word.slice(1);
      query = query.not(field, "ilike", `%${real}%`);
    } else {
      // AND検索（デフォルト）
      query = query.ilike(field, `%${word}%`);
    }
  });
});

  const { data, error } = await query;
  if (error) console.error(error);

  renderCards(data);
});

// リセットボタン
document.getElementById("resetBtn").addEventListener("click", async () => {
  const inputs = document.querySelectorAll("#search-area input");
  inputs.forEach(i => i.value = "");

  const { data } = await client.from("cards").select("*");
  renderCards(data);
});

// カード表示
function renderCards(cards) {
  const result = document.getElementById("result");
  result.innerHTML = "";

  // ★ 追加：検索結果が0件なら赤文字で表示
  if (!cards || cards.length === 0) {
    result.innerHTML = `<p style="color:red; font-weight:bold;">検索結果がありませんでした。</p>`;

    return;
  }

  cards.forEach(card => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <h2>${card.名称}</h2>
      <p>カード詳細：${card.収録版} ${card.カード番号} ${card.レアリティ} ${card.収録}</p>
      <p>色：${card.色}</p>
      <p>種別：${card.種別}</p>
      <p>レベル：${card.レベル}</p>
      <p>魔力コスト：${card.魔力コスト}</p>
      <p>パワー：${card.パワー}</p>
      <p>特性：${card.特性}</p>
      <p>タグ：${card.検索タグ}</p>
      <p>ルールテキスト：${card.ルールテキスト}</p>
      <p>遺業能力：${card.遺業能力}</p>

    `;

    result.appendChild(div);
  });
}
