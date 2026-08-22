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

  const { lat, lng, query } = req.query;
  const y = parseFloat(lat), x = parseFloat(lng);
  if (!y || !x || Number.isNaN(y) || Number.isNaN(x)) {
    return res.status(400).json({ error: "위치 정보(lat, lng)가 필요해요" });
  }

  // 검색어가 있으면 키워드 검색(예: "김치찌개"), 없으면 음식점 카테고리 전체
  const q = (query || "맛집").toString().slice(0, 30);
  const url = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
  url.searchParams.set("query", q);
  url.searchParams.set("y", y);
  url.searchParams.set("x", x);
  url.searchParams.set("radius", "1500"); // 반경 1.5km
  url.searchParams.set("category_group_code", "FD6"); // 음식점
  url.searchParams.set("sort", "distance");
  url.searchParams.set("size", "15");

  try {
    const r = await fetch(url.toString(), {
      headers: { Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}` },
    });
    const data = await r.json();

    if (!r.ok) {
      return res.status(r.status).json({ error: "카카오 API 오류", detail: data });
    }

    const places = (data.documents || []).map((p) => ({
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
    res.status(500).json({ error: "요청 실패: " + String(e).slice(0, 150) });
  }
}
