const SUPABASE_URL = "https://lxsdiqvyhxokuoofgpor.supabase.co";
const SUPABASE_KEY = "sb_publishable_r885Rez5bZWiO0nfToFI-w_bqi_zvoU";
const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const deckIdInput = document.getElementById("deckIdInput");
const outputBtn = document.getElementById("outputBtn");
const shuffleBtn = document.getElementById("shuffleBtn");
const pdfBtn = document.getElementById("pdfBtn");
const deckOutput = document.getElementById("deckOutput");
const handOutput = document.getElementById("handOutput");
const guardianOutput = document.getElementById("guardianOutput");
const status = document.getElementById("status");
let currentCards = [];

function splitDeckId(deckId) {
  return deckId
    .split("-")
    .map(id => id.trim())
    .filter(Boolean);
}

function shuffleArray(array) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function createCardElement(card) {
  const wrapper = document.createElement("div");
  wrapper.className = "deck-card";

  const img = document.createElement("img");
  img.src = card.imageUrl;
  img.alt = card.id;

  wrapper.appendChild(img);
  return wrapper;
}

function renderSection(container, cards) {
  container.innerHTML = "";
  cards.forEach(card => container.appendChild(createCardElement(card)));
}

function wait(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function requestPdfPage(ids) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const response = await fetch("../api/deck-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids })
    });

    if (response.ok) return response;

    if (![502, 503, 504].includes(response.status) || attempt === 3) {
      throw new Error(`PDF生成に失敗しました (${response.status})`);
    }

    await wait(attempt * 1000);
  }
}

async function renderDeckCards(deckId) {
  const ids = splitDeckId(deckId);
  if (ids.length === 0) {
    status.textContent = "有効なデッキIDがありません。";
    deckOutput.innerHTML = "";
    handOutput.innerHTML = "";
    guardianOutput.innerHTML = "";
    return;
  }

  status.textContent = "処理中です...";
  deckOutput.innerHTML = "";
  handOutput.innerHTML = "";
  guardianOutput.innerHTML = "";

  const cards = [];
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    status.textContent = `処理中です... (${i + 1}/${ids.length})`;

    const { data, error } = await client
      .from("cards")
      .select("画像格納先")
      .eq("id", id);

    if (error) {
      console.error(error);
      continue;
    }

    if (!data || data.length === 0) continue;

    const imgUrl = data[0].画像格納先;
    if (!imgUrl) continue;

    cards.push({ id, imageUrl: imgUrl });
  }

  if (cards.length === 0) {
    status.textContent = "該当するカード画像が見つかりませんでした。";
    deckOutput.innerHTML = "";
    handOutput.innerHTML = "";
    guardianOutput.innerHTML = "";
    return;
  }

  currentCards = shuffleArray(cards);
  pdfBtn.disabled = false;
  const handCards = currentCards.slice(0, 6);
  const guardianCards = currentCards.slice(6, 10);
  const remainingCards = currentCards.slice(10);

  status.textContent = `${cards.length} 枚をシャッフルし、手札 ${handCards.length} 枚・ガーディアン ${guardianCards.length} 枚に分けました。`;

  renderSection(deckOutput, remainingCards);
  renderSection(handOutput, handCards);
  renderSection(guardianOutput, guardianCards);
}

outputBtn.addEventListener("click", () => {
  const deckId = deckIdInput.value.trim();
  if (!deckId) {
    status.textContent = "デッキIDを入力してください。";
    return;
  }

  renderDeckCards(deckId);
});

shuffleBtn.addEventListener("click", () => {
  if (!currentCards.length) {
    status.textContent = "先に出力してください。";
    return;
  }

  currentCards = shuffleArray(currentCards);
  const handCards = currentCards.slice(0, 6);
  const guardianCards = currentCards.slice(6, 10);
  const remainingCards = currentCards.slice(10);

  renderSection(deckOutput, remainingCards);
  renderSection(handOutput, handCards);
  renderSection(guardianOutput, guardianCards);
});

pdfBtn.addEventListener("click", async () => {
  if (!currentCards.length) {
    status.textContent = "先に出力してください。";
    return;
  }

  pdfBtn.disabled = true;
  status.textContent = "PDFを生成しています...";

  try {
    if (!window.PDFLib) {
      throw new Error("PDFライブラリを読み込めませんでした");
    }

    const mergedPdf = await PDFLib.PDFDocument.create();
    const pageSize = 3;
    const ids = currentCards.map(card => card.id);

    for (let start = 0; start < ids.length; start += pageSize) {
      const response = await requestPdfPage(ids.slice(start, start + pageSize));

      const pagePdf = await PDFLib.PDFDocument.load(await response.arrayBuffer());
      const pages = await mergedPdf.copyPages(pagePdf, pagePdf.getPageIndices());
      pages.forEach(page => mergedPdf.addPage(page));
      status.textContent = `PDFを生成しています... (${Math.min(start + pageSize, ids.length)}/${ids.length}枚)`;
      await wait(250);
    }

    const blob = new Blob([await mergedPdf.save()], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ijinden-deck.pdf";
    link.click();
    URL.revokeObjectURL(url);
    status.textContent = "PDFをダウンロードしました。A4・カード59×86mmです。";
  } catch (error) {
    console.error(error);
    status.textContent = "PDFの生成に失敗しました。時間をおいて再試行してください。";
  } finally {
    pdfBtn.disabled = false;
  }
});
