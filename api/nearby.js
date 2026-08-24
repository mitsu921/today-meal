// 오늘 뭐먹지 — 주변 맛집 검색 (카카오 로컬 API 프록시)
// 역할: 브라우저의 위치(위도·경도)를 받아, 카카오 로컬 API로 근처 음식점을 찾아 돌려줍니다.
// 카카오 REST API 키는 여기(서버)에만 있고, 브라우저에는 절대 노출되지 않습니다.

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "GET만 받아요" });
  }
  if (!process.env.KAKAO_REST_API_KEY) {
    return res.status(500).json({ error: "서버에 KAKAO_REST_API_KEY가 설정되지 않았어요" });
  }

  const { lat, lng, query, cat } = req.query;
  const y = parseFloat(lat), x = parseFloat(lng);
  if (!y || !x || Number.isNaN(y) || Number.isNaN(x)) {
    return res.status(400).json({ error: "위치 정보(lat, lng)가 필요해요" });
  }

  // 카테고리 코드: 음식점(FD6, 기본값) / 카페(CE7) — 프론트에서 cat 파라미터로 지정
  const allowedCats = ["FD6", "CE7"];
  const categoryGroup = allowedCats.includes(cat) ? cat : "FD6";

  // 검색어가 있으면 키워드 검색(예: "김치찌개"), 없으면 음식점 카테고리 전체
  const q = (query || "맛집").toString().slice(0, 30);
  const url = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
  url.searchParams.set("query", q);
  url.searchParams.set("y", y);
  url.searchParams.set("x", x);
  url.searchParams.set("radius", "2500"); // 반경 2.5km (결과가 너무 적지 않도록 확대)
  url.searchParams.set("category_group_code", categoryGroup);
  url.searchParams.set("sort", "distance");
  url.searchParams.set("size", "15");

  const callKakao = async (u) => {
    const r = await fetch(u.toString(), {
      headers: { Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}` },
    });
    const data = await r.json();
    if (!r.ok) throw { status: r.status, data };
    return data.documents || [];
  };

  try {
    let docs = await callKakao(url);

    // 결과가 5개 미만이면, 반경을 더 넓혀서(6km) 한 번 더 찾아 보충
    if (docs.length < 5) {
      const url2 = new URL(url.toString());
      url2.searchParams.set("radius", "6000");
      url2.searchParams.set("size", "15");
      try {
        const more = await callKakao(url2);
        const seen = new Set(docs.map((d) => d.id));
        for (const d of more) {
          if (!seen.has(d.id)) { docs.push(d); seen.add(d.id); }
        }
      } catch (_) { /* 보충 실패해도 원래 결과는 그대로 반환 */ }
    }

    const places = docs.map((p) => ({
      name: p.place_name,
      category: (p.category_name || "").split(">").pop().trim(),
      address: p.road_address_name || p.address_name,
      distance: p.distance ? Math.round(p.distance) : null, // 미터
      phone: p.phone || null,
      url: p.place_url,
      x: p.x, y: p.y,
    }));

    res.status(200).json({ places });
  } catch (e) {
    if (e && e.status) return res.status(e.status).json({ error: "카카오 API 오류", detail: e.data });
    res.status(500).json({ error: "요청 실패: " + String(e).slice(0, 150) });
  }
}
