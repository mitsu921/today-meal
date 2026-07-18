// 오늘 뭐먹지 — API 심부름꾼 (Vercel판)
// 깃허브 서랍의 api/menu.js 위치에 저장하면, 사이트와 같은 주소의 /api/menu 로 작동합니다.
// 같은 지붕(도메인)이라 출처(CORS) 문제가 아예 없습니다.

const ALLOWED_MODELS = ["claude-sonnet-4-5", "claude-haiku-4-5"];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST만 받아요" });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(429).json({ error: "limit", message: "[진단9] 열쇠(ANTHROPIC_API_KEY)가 Vercel 환경변수에 없어요" });
  }

  const body = req.body || {};
  const model = ALLOWED_MODELS.includes(body.model) ? body.model : ALLOWED_MODELS[0];
  const max_tokens = Math.min(Number(body.max_tokens) || 700, 1500);
  const messages = Array.isArray(body.messages) ? body.messages.slice(0, 4) : null;
  if (!messages) {
    return res.status(400).json({ error: "messages가 필요해요" });
  }

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model, max_tokens, messages }),
    });

    if (!r.ok) {
      const t = await r.text();
      return res.status(429).json({
        error: "limit",
        message: "[진단9] AI쪽 오류 " + r.status + ": " + t.slice(0, 160) + " ← 이 문구를 복사해 알려주세요",
      });
    }

    const data = await r.json();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(429).json({
      error: "limit",
      message: "[진단9] 연결 오류: " + String(e).slice(0, 120),
    });
  }
}
