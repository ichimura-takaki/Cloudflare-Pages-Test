import { PDFDocument } from "pdf-lib";

const SUPABASE_URL = "https://lxsdiqvyhxokuoofgpor.supabase.co";
const SUPABASE_KEY = "sb_publishable_r885Rez5bZWiO0nfToFI-w_bqi_zvoU";
const MM = 72 / 25.4;
const A4_WIDTH = 210 * MM;
const A4_HEIGHT = 297 * MM;
const CARD_WIDTH = 59 * MM;
const CARD_HEIGHT = 86 * MM;
const GAP = 3 * MM;
const COLUMNS = 3;
const ROWS = 3;

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}

export async function onRequestPost(context) {
  let body;
  try {
    body = await context.request.json();
  } catch {
    return jsonResponse({ error: "リクエスト形式が正しくありません。" }, 400);
  }

  const ids = Array.isArray(body?.ids)
    ? body.ids.filter(id => typeof id === "string" && /^[A-Za-z0-9_]+$/.test(id))
    : [];
  if (ids.length === 0 || ids.length > 3) {
    return jsonResponse({ error: "1回あたりのカード枚数は3枚までです。" }, 400);
  }

  const query = new URL(`${SUPABASE_URL}/rest/v1/cards`);
  query.searchParams.set("select", "カード番号,画像格納先");
  query.searchParams.set("カード番号", `in.(${[...new Set(ids)].join(",")})`);

  const cardsResponse = await fetch(query, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` }
  });
  if (!cardsResponse.ok) {
    return jsonResponse({ error: "カード情報を取得できませんでした。" }, 502);
  }

  const records = await cardsResponse.json();
  const imageUrls = new Map();
  records.forEach(card => {
    if (!imageUrls.has(card.カード番号)) {
      imageUrls.set(card.カード番号, card.画像格納先);
    }
  });
  const orderedCards = ids.map(id => ({ id, imageUrl: imageUrls.get(id) })).filter(card => card.imageUrl);
  if (orderedCards.length === 0) {
    return jsonResponse({ error: "カード画像が見つかりませんでした。" }, 404);
  }

  const pdf = await PDFDocument.create();
  const horizontalMargin = (A4_WIDTH - (COLUMNS * CARD_WIDTH + (COLUMNS - 1) * GAP)) / 2;
  const verticalMargin = (A4_HEIGHT - (ROWS * CARD_HEIGHT + (ROWS - 1) * GAP)) / 2;

  const page = pdf.addPage([A4_WIDTH, A4_HEIGHT]);
  const pageCards = orderedCards;
  const embeddedImages = new Map();

  for (let index = 0; index < pageCards.length; index++) {
      const card = pageCards[index];
    let image = embeddedImages.get(card.imageUrl);
    if (!image) {
      const imageResponse = await fetch(card.imageUrl);
      if (!imageResponse.ok) continue;

      const imageBytes = await imageResponse.arrayBuffer();
      const contentType = imageResponse.headers.get("content-type") || "";
      if (contentType.includes("png") || card.imageUrl.toLowerCase().endsWith(".png")) {
        image = await pdf.embedPng(imageBytes);
      } else if (contentType.includes("jpeg") || contentType.includes("jpg") || /\.(jpe?g)(\?|$)/i.test(card.imageUrl)) {
        image = await pdf.embedJpg(imageBytes);
      } else {
        continue;
      }
      embeddedImages.set(card.imageUrl, image);
    }

    const column = index % COLUMNS;
    const row = Math.floor(index / COLUMNS);
    const x = horizontalMargin + column * (CARD_WIDTH + GAP);
    const y = A4_HEIGHT - verticalMargin - (row + 1) * CARD_HEIGHT - row * GAP;
    page.drawImage(image, { x, y, width: CARD_WIDTH, height: CARD_HEIGHT });
  }

  const pdfBytes = await pdf.save();
  return new Response(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=ijinden-deck.pdf",
      "Cache-Control": "no-store"
    }
  });
}