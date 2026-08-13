const SUPABASE_URL = "https://lxsdiqvyhxokuoofgpor.supabase.co";
const SUPABASE_KEY = "sb_publishable_r885Rez5bZWiO0nfToFI-w_bqi_zvoU";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let deckList = [];
let deckCounts = {};

// ✔ 表示チェックボックスの ON/OFF を判定する関数
function display(name) {
  const el = document.getElementById("表示_" + name);
  return el ? el.checked : false;
}

function getCardIdentifier(card) {
  return card?.id ?? card?.ID ?? card?.ユニークID ?? card?.カード番号 ?? card?.番号 ?? null;
}

function updateCounterLabels() {
  const labels = document.querySelectorAll(".count-label");
  labels.forEach(label => {
    const uniqueId = label.dataset.cardId || "";
    label.textContent = `x${deckCounts[uniqueId] || 0}`;
  });
}

function updateDeckCountDisplay() {
  const countDisplay = document.getElementById("deckCountDisplay");
  if (countDisplay) {
    countDisplay.textContent = `x${deckList.length}`;
  }
}

function updateDeckIdText() {
  const input = document.getElementById("deckIdOutput");
  if (!input) return;

  const deckIdText = deckList.map(item => item.id).join("-");
  input.value = deckIdText;
  updateCounterLabels();
  updateDeckCountDisplay();
}

function syncDeckStateFromText() {
  const input = document.getElementById("deckIdOutput");
  if (!input) return;

  let value = input.value;

  if (value.startsWith("-")) {
    value = value.replace(/^-+/, "");
    input.value = value;
  }

  const countMatch = value.match(/\s*\[(\d+)\]\s*$/);
  if (countMatch) {
    value = value.replace(/\s*\[\d+\]\s*$/, "").trim();
  }

  if (!value.trim()) {
    deckList = [];
    deckCounts = {};
    updateCounterLabels();
    updateDeckCountDisplay();
    return;
  }

  const rawParts = value.split("-").map(part => part.trim()).filter(Boolean);
  const invalidParts = rawParts.filter(part => !/^[A-Za-z0-9_]+$/.test(part));

  if (invalidParts.length > 0) {
    alert("無効なデッキID文字列があります。英数字と-のみ使用できます。");
    input.value = value.replace(/[^A-Za-z0-9_-]/g, "");
    return;
  }

  const ids = rawParts;
  deckList = ids.map(id => ({ id, name: "", number: "" }));
  deckCounts = {};

  ids.forEach(id => {
    deckCounts[id] = (deckCounts[id] || 0) + 1;
  });

  updateDeckIdText();
}

function addCardToDeck(card) {
  const uniqueId = getCardIdentifier(card);
  if (!uniqueId) {
    alert("このカードにはユニークIDがありません");
    return;
  }

  // Use deckIdOutput as single source of truth: append the id string and sync
  const input = document.getElementById("deckIdOutput");
  if (!input) return;

  const current = input.value.trim();
  const parts = current ? current.split("-").map(p => p.trim()).filter(Boolean) : [];
  parts.push(uniqueId);
  input.value = parts.join("-");
  syncDeckStateFromText();
}

function removeCardFromDeckById(uniqueId) {
  if (uniqueId === undefined || uniqueId === null) return;

  const uid = String(uniqueId).trim();

  // Update deckIdOutput (single source of truth)
  const input = document.getElementById("deckIdOutput");
  if (!input) {
    // fallback: remove from deckList if input missing
    const idxFallback = deckList.findIndex(item => String(item.id) === uid);
    if (idxFallback !== -1) {
      deckList.splice(idxFallback, 1);
      deckCounts[uid] = (deckCounts[uid] || 1) - 1;
      if (deckCounts[uid] <= 0) delete deckCounts[uid];
      updateDeckIdText();
    }
    return;
  }

  const parts = input.value.split("-").map(p => p.trim()).filter(Boolean);
  const idx = parts.findIndex(p => p === uid);
  if (idx !== -1) {
    parts.splice(idx, 1);
    input.value = parts.join("-");
    syncDeckStateFromText();
  } else {
    // no direct match — try numeric/string-insensitive match
    const idx2 = parts.findIndex(p => String(p) === uid);
    if (idx2 !== -1) {
      parts.splice(idx2, 1);
      input.value = parts.join("-");
      syncDeckStateFromText();
    }
  }
}

function clearDeckId() {
  const input = document.getElementById("deckIdOutput");
  if (input) {
    input.value = "";
  }
  syncDeckStateFromText();
}

// ✔ チェックボックス全選択
const checkAllBtn = document.getElementById("checkAllBtn");
if (checkAllBtn) {
  checkAllBtn.addEventListener("click", () => {
    const boxes = document.querySelectorAll("#display-options input[type='checkbox']");
    boxes.forEach(box => box.checked = true);
  });
}

// ✔ チェックボックス全解除（画像表示だけ ON）
const uncheckAllBtn = document.getElementById("uncheckAllBtn");
if (uncheckAllBtn) {
  uncheckAllBtn.addEventListener("click", () => {
    const boxes = document.querySelectorAll("#display-options input[type='checkbox']");
    boxes.forEach(box => {
      if (box.id === "表示_画像格納先") {
        box.checked = true;
      } else {
        box.checked = false;
      }
    });
  });
}

const clearDeckIdBtn = document.getElementById("clearDeckIdBtn");
if (clearDeckIdBtn) {
  clearDeckIdBtn.addEventListener("click", () => {
    clearDeckId();
  });
}

const deckIdInput = document.getElementById("deckIdOutput");
if (deckIdInput) {
  deckIdInput.addEventListener("input", () => {
    syncDeckStateFromText();
  });
}

const copyDeckIdBtn = document.getElementById("copyDeckIdBtn");
if (copyDeckIdBtn) {
  copyDeckIdBtn.addEventListener("click", async () => {
    const input = document.getElementById("deckIdOutput");
    const value = input ? input.value.trim() : "";

    if (!value) {
      alert("まずデッキIDを生成してください");
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      input.select();
      input.focus();
      alert("コピーしました");
    } catch (error) {
      console.error(error);
      alert("コピーに失敗しました");
    }
  });
}

// デッキIDのカードを全て表示するボタン
const deckSearchBtn = document.getElementById("deckSearchBtn");
if (deckSearchBtn) {
  deckSearchBtn.addEventListener("click", async () => {
    // Build ids list from deckIdOutput (allow duplicates) and sync state
    const input = document.getElementById("deckIdOutput");
    let idsAll = [];
    if (input && input.value.trim()) {
      idsAll = input.value.split("-").map(p => p.trim()).filter(Boolean);
    } else {
      // fallback to current deckList
      idsAll = deckList.map(d => d.id).filter(Boolean);
      if (idsAll.length > 0 && input) {
        input.value = idsAll.join("-");
      }
    }

    if (idsAll.length === 0) {
      alert("デッキIDがありません");
      return;
    }

    // ensure internal state is synced from text
    if (input) syncDeckStateFromText();

    const uniqueIds = Array.from(new Set(idsAll));

    try {
      const { data, error } = await client.from("cards").select("*").in("id", uniqueIds);
      if (error) {
        console.error(error);
        alert("カード取得に失敗しました");
        return;
      }

      // レンダリング（各カードのカウントラベルは deckCounts を参照して表示されます）
      renderCards(data || []);
      updateCounterLabels();
    } catch (err) {
      console.error(err);
      alert("検索に失敗しました");
    }
  });
}

// ✔ 初期表示：全カード一覧
window.onload = async () => {
  const { data } = await client.from("cards").select("*");
  renderCards(data);
};

// ✔ 検索ボタン
const searchBtn = document.getElementById("searchBtn");
if (searchBtn) {
  searchBtn.addEventListener("click", async () => {
    let query = client.from("cards").select("*");

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

      if (value.includes("?")) {
        const orWords = value.split("?").map(v => v.trim()).filter(v => v);
        query = query.or(
          orWords.map(w => `${field}.ilike.%${w}%`).join(",")
        );
        return;
      }

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
    updateCounterLabels();
  });
}

// ✔ リセットボタン
const resetBtn = document.getElementById("resetBtn");
if (resetBtn) {
  resetBtn.addEventListener("click", async () => {
    const inputs = document.querySelectorAll("#search-area input");
    inputs.forEach(i => i.value = "");

    const { data } = await client.from("cards").select("*");
    renderCards(data);
    updateCounterLabels();
  });
}

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

    const body = document.createElement("div");
    body.className = "card-body";

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

    body.innerHTML = html;
    div.appendChild(body);

    const actions = document.createElement("div");
    actions.className = "card-actions";

    const addButton = document.createElement("button");
    addButton.className = "add-card-btn";
    addButton.textContent = "追加";
    addButton.addEventListener("click", () => {
      addCardToDeck(card);
    });

    const countLabel = document.createElement("span");
    countLabel.className = "count-label";
    countLabel.dataset.cardId = getCardIdentifier(card) || "";
    countLabel.textContent = "x0";

    const removeButton = document.createElement("button");
    removeButton.className = "remove-card-btn";
    removeButton.textContent = "削除";
    removeButton.addEventListener("click", () => {
      const uid = getCardIdentifier(card);
      removeCardFromDeckById(uid);
    });

    actions.appendChild(addButton);
    actions.appendChild(removeButton);
    actions.appendChild(countLabel);
    div.appendChild(actions);

    result.appendChild(div);
  });
}

// ✔ 軽量モード：指定項目だけ ON にして検索実行
const lightModeLink = document.getElementById("lightModeLink");
if (lightModeLink) {
  lightModeLink.addEventListener("click", async (e) => {
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

    const boxes = document.querySelectorAll("#display-options input[type='checkbox']");
    boxes.forEach(box => {
      if (box.id === "表示_画像格納先") {
        box.checked = false;
      } else {
        box.checked = false;
      }
    });

    targetFields.forEach(name => {
      const box = document.getElementById("表示_" + name);
      if (box) box.checked = true;
    });

    const { data } = await client.from("cards").select("*");
    renderCards(data);
  });
}
