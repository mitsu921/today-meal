// 오늘 뭐먹지 — 실시간 식재료 가격 조회 (KAMIS 공공데이터 프록시)
// 한국농수산식품유통공사(aT) "최근일자 도,소매가격정보" API를 안전하게 중계합니다.
// 서비스키는 여기(서버)에만 있고, 브라우저에는 절대 노출되지 않습니다.

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "GET만 받아요" });
  }
  if (!process.env.KAMIS_SERVICE_KEY) {
    return res.status(500).json({ error: "서버에 KAMIS_SERVICE_KEY가 설정되지 않았어요" });
  }

  const { item_cd } = req.query;
  if (!item_cd) {
    return res.status(400).json({ error: "item_cd(품목코드)가 필요해요" });
  }

  const url = new URL("https://apis.data.go.kr/B552845/recent/price");
  url.searchParams.set("serviceKey", process.env.KAMIS_SERVICE_KEY);
  url.searchParams.set("returnType", "JSON");
  url.searchParams.set("pageNo", "1");
  url.searchParams.set("numOfRows", "5");
  url.searchParams.set("cond[se_cd::EQ]", "1"); // 1=소매(일반 소비자가 사는 가격)
  url.searchParams.set("cond[item_cd::EQ]", String(item_cd).slice(0, 10));

  try {
    const r = await fetch(url.toString());
    const data = await r.json();
    const items = (data && data.body && data.body.items) || [];

    if (!items.length) {
      return res.status(200).json({ found: false, message: "가격 정보를 찾지 못했어요" });
    }

    // 여러 품종이 있으면 평균가격 기준으로 대표값 하나만 추림(가장 일반적인 것)
    const parsePrice = (s) => {
      const n = parseInt(String(s || "").replace(/[^0-9]/g, ""), 10);
      return Number.isFinite(n) ? n : null;
    };
    const rep = items
      .map((it) => ({
        name: it.item_nm,
        variety: it.vrty_nm,
        unit: it.unit,
        unitSize: it.unit_sz,
        price: parsePrice(it.exmn_dd_prc),
        priceWeekAgo: parsePrice(it.ww1_bfr_prc),
        date: it.exmn_ymd,
      }))
      .filter((x) => x.price)[0];

    if (!rep) {
      return res.status(200).json({ found: false, message: "가격 정보를 찾지 못했어요" });
    }

    res.status(200).json({ found: true, ...rep, source: "KAMIS(한국농수산식품유통공사)" });
  } catch (e) {
    res.status(500).json({ error: "요청 실패: " + String(e).slice(0, 150) });
  }
}
