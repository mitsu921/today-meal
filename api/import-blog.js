// 오늘 뭐먹지 — 블로그 레시피 가져오기
// 네이버 블로그·티스토리 글 주소를 받아 본문을 가져온 뒤,
// AI가 레시피 형태(제목/재료/만드는 법)로 정리해서 돌려줍니다.
// 저작권 책임은 실제로 글을 올리는 사용자에게 있음을 프론트에서 명확히 고지합니다.

const ALLOWED_HOSTS = [
  "blog.naver.com",
  "m.blog.naver.com",
  "tistory.com", // *.tistory.com 서브도메인은 아래에서 endsWith로 별도 처리
];

function isAllowedUrl(raw) {
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    const host = u.hostname.toLowerCase();
    if (ALLOWED_HOSTS.includes(host)) return true;
    if (host.endsWith(".tistory.com")) return true;
    return false;
  } catch (e) {
    return false;
  }
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>|<\/div>|<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST만 받아요" });
  }

  const { url } = req.body || {};
  if (!url || !isAllowedUrl(url)) {
    return res.status(400).json({ error: "네이버 블로그 또는 티스토리 주소만 가져올 수 있어요" });
  }

  try {
    // 1) 원본 페이지 가져오기
    let html = "";
    try {
      const r = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; TodayMealBot/1.0)" },
      });
      html = await r.text();
    } catch (e) {
      return res.status(502).json({ error: "블로그 페이지를 불러오지 못했어요. 주소를 확인해주세요." });
    }

    // 네이버 블로그는 본문이 iframe(mainFrame) 안에 있는 경우가 많음 → 실제 본문 주소로 재요청
    const iframeMatch = html.match(/id=["']mainFrame["'][^>]*src=["']([^"']+)["']/i);
    if (iframeMatch) {
      const real = new URL(iframeMatch[1], url).toString();
      try {
        const r2 = await fetch(real, { headers: { "User-Agent": "Mozilla/5.0 (compatible; TodayMealBot/1.0)" } });
        html = await r2.text();
      } catch (e) {
        /* 실패하면 원래 html로 진행 */
      }
    }

    const text = stripHtml(html).slice(0, 6000); // 토큰 절약을 위해 앞부분만
    if (text.length < 50) {
      return res.status(422).json({ error: "본문을 읽지 못했어요. 비공개 글이거나 형식이 달라서 그럴 수 있어요." });
    }

    // 2) AI로 레시피 형태 정리
    const prompt =
      "다음은 블로그에서 가져온 글 본문(태그가 제거된 텍스트)이야. 이 글이 진짜 요리 레시피인지 확인하고, " +
      "레시피라면 우리 서비스 형식(제목, 재료, 만드는 법)으로 자연스럽게 다듬어줘. " +
      "원문을 그대로 복사하지 말고, 같은 내용을 우리 서비스 톤(친근한 반말 아닌 정중체)으로 재작성해. " +
      "레시피가 아니거나 내용이 너무 부실하면 is_recipe를 false로 해.\n\n" +
      "본문:\n" + text + "\n\n" +
      'JSON만, 백틱 금지: {"is_recipe":true/false,"title":"12자 이내","target":"온 가족|아이|아이 간식|다이어트|남편 중 하나","body":"재료와 만드는 법을 정리한 본문(줄바꿈 포함)"}';

    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 800,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const aiData = await aiRes.json();
    const raw = (aiData.content || []).map((b) => (b.type === "text" ? b.text : "")).join("\n");
    const parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());

    if (!parsed.is_recipe) {
      return res.status(422).json({ error: "이 글에서 레시피 내용을 찾지 못했어요. 요리 레시피 글 주소인지 확인해주세요." });
    }

    res.status(200).json({ title: parsed.title, target: parsed.target, body: parsed.body, source_url: url });
  } catch (e) {
    res.status(500).json({ error: "가져오기에 실패했어요: " + String(e).slice(0, 150) });
  }
}
