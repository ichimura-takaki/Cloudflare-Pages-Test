// server.js

import express from "express";
import cors from "cors";
import PDFDocument from "pdfkit";
import fetch from "node-fetch";
import { createClient } from "@supabase/supabase-js";

// ----- 環境変数から Supabase 設定を読む -----
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error("SUPABASE_URL または SUPABASE_ANON_KEY が設定されていません。");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ----- Express アプリ設定 -----
const app = express();

// リクエストサイズ制限（ids配列だけなので小さめでOK）
app.use(express.json({ limit: "1mb" }));

// CORS設定
const allowedOrigins = [
  "https://cloudflare-pages-test-ehv.pages.dev",
  "http://localhost:5173",
  "http://localhost:3000"
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) {
        // 同一オリジンやツールからのアクセスなど
        return callback(null, true);
      }
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("CORS: Origin not allowed"), false);
      }
    }
  })
);

// ヘルスチェック用 GET /
app.get("/", (req, res) => {
  res.status(200).send("Ijinden Deck PDF Server is running.");
});

// mm → pt 変換（PDFKitはポイント単位）
function mmToPt(mm) {
  return mm * 2.83465; // 1mm ≒ 2.83465pt
}

// PDF生成ロジック
async function generateDeckPdf(ids) {
  return new Promise(async (resolve, reject) => {
    try {
      // A4縦: PDFKitのプリセット 'A4' を使用
      const doc = new PDFDocument({
        size: "A4",
        margin: 0 // 自分でレイアウトするので余白0からスタート
      });

      // PDFをバッファにためる
      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => {
        const pdfBuffer = Buffer.concat(chunks);
        resolve(pdfBuffer);
      });

      // カードサイズ（mm → pt）
      const cardWidthPt = mmToPt(59); // 幅59mm
      const cardHeightPt = mmToPt(86); // 高さ86mm

      // A4サイズ（pt）: 約 595 x 842pt
      const pageWidthPt = doc.page.width;
      const pageHeightPt = doc.page.height;

      // 3列×3行固定配置
      const columns = 3;
      const rows = 3;
      const cardsPerPage = columns * rows; // 9枚

      // 余白と間隔をざっくり計算
      const totalCardsWidth = cardWidthPt * columns;
      const horizontalSpace = pageWidthPt - totalCardsWidth;
      const marginLeft = horizontalSpace / 4; // 左右に少し余白
      const marginRight = marginLeft;
      const gapX = horizontalSpace / 4; // 列間の隙間

      const totalCardsHeight = cardHeightPt * rows;
      const verticalSpace = pageHeightPt - totalCardsHeight;
      const marginTop = verticalSpace / 4;
      const marginBottom = marginTop;
      const gapY = verticalSpace / 4;

      // idsごとに Supabase からカード画像URLを取得
      // cards.id で検索することが重要
      const cardImageUrls = [];

      for (const id of ids) {
        const { data, error } = await supabase
          .from("cards")
          .select("*")
          .eq("id", id)
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("Supabase error:", error);
          // 画像取得失敗時はスキップ or プレースホルダ
          cardImageUrls.push(null);
          continue;
        }

        if (!data) {
          console.warn(`cards.id=${id} が見つかりませんでした。`);
          cardImageUrls.push(null);
          continue;
        }

        // 画像格納先の列名が「画像格納先」ならそこを使う
        // もし列名が違う場合はここを書き換える
        const imageUrl = data["画像格納先"] || data.image_url || null;

        if (!imageUrl) {
          console.warn(`cards.id=${id} に画像URLがありません。`);
          cardImageUrls.push(null);
          continue;
        }

        cardImageUrls.push(imageUrl);
      }

      // カードをページに配置
      for (let index = 0; index < cardImageUrls.length; index++) {
        const pageIndex = Math.floor(index / cardsPerPage);
        const positionInPage = index % cardsPerPage;

        if (positionInPage === 0 && index !== 0) {
          doc.addPage();
        }

        const col = positionInPage % columns;
        const row = Math.floor(positionInPage / columns);

        const x =
          marginLeft + col * (cardWidthPt + gapX);
        const y =
          marginTop + row * (cardHeightPt + gapY);

        const imageUrl = cardImageUrls[index];

        if (!imageUrl) {
          // 画像がない場合は枠だけ描くなど
          doc
            .rect(x, y, cardWidthPt, cardHeightPt)
            .stroke();
          continue;
        }

        try {
          const response = await fetch(imageUrl, {
            timeout: 10000 // 10秒タイムアウト
          });

          if (!response.ok) {
            console.error("画像取得失敗:", imageUrl, response.status);
            doc
              .rect(x, y, cardWidthPt, cardHeightPt)
              .stroke();
            continue;
          }

          const buffer = await response.arrayBuffer();
          const imgBuffer = Buffer.from(buffer);

          // カードは絶対に自動縮小しない → width/heightを固定指定
          doc.image(imgBuffer, x, y, {
            width: cardWidthPt,
            height: cardHeightPt
          });
        } catch (err) {
          console.error("画像取得エラー:", imageUrl, err);
          doc
            .rect(x, y, cardWidthPt, cardHeightPt)
            .stroke();
        }
      }

      // PDF終了
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// POST /deck-pdf
app.post("/deck-pdf", async (req, res) => {
  try {
    const body = req.body;

    // 1. リクエストJSONを受け取る & 2. idsを整数配列として検証
    if (!body || !Array.isArray(body.ids)) {
      return res.status(400).json({
        error: "ids 配列が必要です。例: { \"ids\": [1, 6, 11] }"
      });
    }

    const ids = body.ids.map((v) => Number(v)).filter((v) => Number.isInteger(v));

    if (ids.length === 0) {
      return res.status(400).json({
        error: "有効な整数の ids がありません。"
      });
    }

    if (ids.length > 200) {
      // リクエストサイズ制限（念のため）
      return res.status(400).json({
        error: "ids が多すぎます。最大 200 件までにしてください。"
      });
    }

    // 100枚程度にも対応できるように実装
    const pdfBuffer = await generateDeckPdf(ids);

    // 9. 生成したPDFをHTTPレスポンスとして返す
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="ijinden-deck.pdf"'
    );
    res.status(200).send(pdfBuffer);
  } catch (err) {
    console.error("PDF生成エラー:", err);
    // エラーレスポンス
    res.status(500).json({
      error: "PDF生成中にエラーが発生しました。時間をおいて再度お試しください。"
    });
  }
});

// PORT環境変数の利用
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Ijinden Deck PDF Server listening on port ${PORT}`);
});
