const SUPABASE_URL = "https://lxsdiqvyhxokuoofgpor.supabase.co";
const SUPABASE_KEY = "sb_publishable_r885Rez5bZWiO0nfToFI-w_bqi_zvoU";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ✔ 表示チェックボックスの ON/OFF を判定する関数
function display(name) {
  const el = document.getElementById("表示_" + name);
  return el ? el.checked : false;
}

// ✔ チェックボックス全選択
document.getElementById("checkAllBtn").addEventListener("click", () => {
  const boxes = document.querySelectorAll("#display-options input[type='checkbox']");
  boxes.forEach(box => box.checked = true);
});

// ✔ チェックボックス全解除（画像表示だけ ON）
document.getElementById("uncheckAllBtn").addEventListener("click", () => {
  const boxes = document.querySelectorAll("#display-options input[type='checkbox']");
  boxes.forEach(box => {
    // 画像表示だけ ON にする
    if (box.id === "表示_画像格納先") {
      box.checked = true;
    } else {
      box.checked = false;
    }
  });
});


// ✔ 初期表示：全カード一覧
window.onload = async () => {
  const { data } = await client.from("cards").select("*");
  renderCards(data);
};

// ✔ 検索ボタン
document.getElementById("searchBtn").addEventListener("click", async () => {
  let query = client.from("cards").select("*");

  // 検索対象フィールド
  const fields = [
    "名称",
    "番号",
    "色",
    "種別",
    "レベル",
    "魔力コスト",
    "パワー",
    "特性",
    "ルールテキスト",
    "遺業能力",
  ];
  const numericFields = new Set(["レベル", "魔力コスト", "パワー"]);

  fields.forEach(field => {
    const input = document.getElementById(field);
    if (!input) return;

    const value = input.value.trim();
    if (!value) return;

    // 数値検索（N / N-M）
    if (numericFields.has(field)) {
      if (value.match(/^\d+$/)) {
        query = query.eq(field, Number(value));
        return;
      }

      if (value.match(/^\d+\-\d+$/)) {
        const [min, max] = value.split("-").map(Number);
        query = query.gte(field, min).lte(field, max);
        return;
      }
    }

    // OR検索（?）
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
        const real = word.slice(1);
        query = query.not(field, "ilike", `%${real}%`);
      } else {
        query = query.ilike(field, `%${word}%`);
      }
    });
  });

  const { data, error } = await query;
  if (error) console.error(error);

  renderCards(data);
});

// ✔ リセットボタン
document.getElementById("resetBtn").addEventListener("click", async () => {
  const inputs = document.querySelectorAll("#search-area input");
  inputs.forEach(i => i.value = "");

  const { data } = await client.from("cards").select("*");
  renderCards(data);
});

// ✔ カード表示
function renderCards(cards) {
  const result = document.getElementById("result");
  result.innerHTML = "";

  const hitCount = document.getElementById("hitCount");
  if (hitCount) {
    hitCount.innerHTML = `<p>検索結果：${cards.length} 件</p>`;
  }

  if (cards.length === 0) {
    result.innerHTML += `<p style="color:red; font-weight:bold;">検索結果がありませんでした。</p>`;
    return;
  }

  cards.forEach(card => {
    const div = document.createElement("div");
    div.className = "card";

    let html = "";

    if (display("番号")) html += `<p>番号：${card.番号}</p>`;
    if (display("名称")) html += `<p>名称：${card.名称}</p>`;
    if (display("色")) html += `<p>色：${card.色}</p>`;
    if (display("種別")) html += `<p>種別：${card.種別}</p>`;
    if (display("レベル")) html += `<p>レベル：${card.レベル}</p>`;
    if (display("魔力コスト")) html += `<p>魔力コスト：${card.魔力コスト}</p>`;
    if (display("パワー")) html += `<p>パワー：${card.パワー}</p>`;
    if (display("特性")) html += `<p>特性：${card.特性}</p>`;
    if (display("ルールテキスト")) html += `<p>ルールテキスト：${card.ルールテキスト}</p>`;
    if (display("遺業能力")) html += `<p>遺業能力：${card.遺業能力}</p>`;
    if (display("Illustration")) html += `<p>Illustration：${card.Illustration}</p>`;
    if (display("ゲストコンセプトデザイン")) html += `<p>ゲストコンセプトデザイン：${card.ゲストコンセプトデザイン}</p>`;

    if (display("画像格納先") && card.画像格納先) {
      html += `<img src="${card.画像格納先}" class="card-image" alt="card image">`;
    }

    div.innerHTML = html;
    result.appendChild(div);
  });
}

// ✔ 軽量モード：指定項目だけ ON にして検索実行
document.getElementById("lightModeLink").addEventListener("click", async (e) => {
  e.preventDefault();

  const targetFields = [
    "名称",
    "番号",
    "色",
    "種別",
    "レベル",
    "魔力コスト",
    "パワー",
    "特性",
    "ルールテキスト",
    "遺業能力"
  ];

  // まず全解除（画像だけON）
  const boxes = document.querySelectorAll("#display-options input[type='checkbox']");
  boxes.forEach(box => {
    if (box.id === "表示_画像格納先") {
      box.checked = false; // 軽量モードなので画像もOFF
    } else {
      box.checked = false;
    }
  });

  // 指定項目だけ ON
  targetFields.forEach(name => {
    const box = document.getElementById("表示_" + name);
    if (box) box.checked = true;
  });

  // 検索実行
  const { data } = await client.from("cards").select("*");
  renderCards(data);
});


