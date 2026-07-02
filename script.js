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

  if (!cards || cards.length === 0) {
    result.innerHTML = `<p style="color:red; font-weight:bold;">検索結果がありませんでした。</p>`;
    return;
  }

  cards.forEach(card => {
    const div = document.createElement("div");
    div.className = "card";

    let html = "";

    // 名称はタイトルとして常に表示
    html += `<h2>${card.名称}</h2>`;

    // ★ チェックボックス ON の項目だけ表示
    const display = name => document.getElementById("表示_" + name)?.checked;

    if (display("収録版")) html += `<p>収録版：${card.収録版}</p>`;
    if (display("カード番号")) html += `<p>カード番号：${card.カード番号}</p>`;
    if (display("レアリティ")) html += `<p>レアリティ：${card.レアリティ}</p>`;
    if (display("色")) html += `<p>色：${card.色}</p>`;
    if (display("種別")) html += `<p>種別：${card.種別}</p>`;
    if (display("レベル")) html += `<p>レベル：${card.レベル}</p>`;
    if (display("魔力コスト")) html += `<p>魔力コスト：${card.魔力コスト}</p>`;
    if (display("パワー")) html += `<p>パワー：${card.パワー}</p>`;
    if (display("特性")) html += `<p>特性：${card.特性}</p>`;
    if (display("ルールテキスト")) html += `<p>ルールテキスト：${card.ルールテキスト}</p>`;
    if (display("遺業能力")) html += `<p>遺業能力：${card.遺業能力}</p>`;
    if (display("Illustlation")) html += `<p>Illustlation：${card.Illustlation}</p>`;
    if (display("収録")) html += `<p>収録：${card.収録}</p>`;
    if (display("ゲストコンセプトデザイン")) html += `<p>ゲストコンセプトデザイン：${card.ゲストコンセプトデザイン}</p>`;

    // ★ 画像表示（デフォルト ON）
    if (display("画像格納先")) {
      html += `<img src="${card.画像格納先}" class="card-image">`;
    }

    div.innerHTML = html;
    result.appendChild(div);
  });
}
