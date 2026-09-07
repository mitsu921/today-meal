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

  // Only owner-supplied, licensed photo URLs keyed by the exact Kakao place ID.
  let photoMap = {};
  try { photoMap = JSON.parse(process.env.PLACES_PHOTO_MAP_JSON || '{}'); }
  catch { return res.status(500).json({ error: '가게 사진 설정의 JSON 형식을 확인해주세요' }); }
  if (!photoMap || Array.isArray(photoMap) || typeof photoMap !== 'object') return res.status(500).json({error:'가게 사진 설정 형식이 잘못되었습니다'});
  const httpsUrl = value => { try { const u = new URL(value); return u.protocol === 'https:' && !u.username && !u.password ? u.href : null; } catch { return null; } };
  const getPhoto = id => {
    const entry = Object.prototype.hasOwnProperty.call(photoMap, id) ? photoMap[id] : null;
    if (!entry || typeof entry !== 'object' || !httpsUrl(entry.url)) return {};
    return { photo_url: httpsUrl(entry.url), photo_credit: String(entry.credit || '').slice(0, 200), photo_credit_url: httpsUrl(entry.creditUrl), photo_source: 'owner_registered' };
  };
  const { lat, lng, query, cat } = req.query;
  const y = parseFloat(lat), x = parseFloat(lng);
  if (!Number.isFinite(y) || !Number.isFinite(x) || y < -90 || y > 90 || x < -180 || x > 180) {
    return res.status(400).json({ error: "위치 정보(lat, lng)가 필요해요" });
  }

  // 카테고리 코드: 음식점(FD6, 기본값) / 카페(CE7) — 프론트에서 cat 파라미터로 지정
  const allowedCats = ["FD6", "CE7"];
  const categoryGroup = allowedCats.includes(cat) ? cat : "FD6";

  // 검색어는 쉼표로 여러 개를 받을 수 있음(예: "냉면,짜장면,국수") — 각각 따로 검색해 합침
  const terms = (query || "맛집")
    .toString()
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 6); // 과도한 호출 방지
  if (!terms.length) terms.push("맛집");

  const buildUrl = (term, radius) => {
    const u = new URL("https://dapi.kakao.com/v2/local/search/keyword.json");
    u.searchParams.set("query", term.slice(0, 30));
    u.searchParams.set("y", y);
    u.searchParams.set("x", x);
    u.searchParams.set("radius", radius);
    u.searchParams.set("category_group_code", categoryGroup);
    u.searchParams.set("sort", "distance");
    u.searchParams.set("size", "15");
    return u;
  };

  const callKakao = async (u) => {
    const r = await fetch(u.toString(), {
      headers: { Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}` },
    });
    const data = await r.json();
    if (!r.ok) throw { status: r.status, data };
    return data.documents || [];
  };

  const mergeUnique = (target, incoming) => {
    const seen = new Set(target.map((d) => d.id));
    for (const d of incoming) {
      if (!seen.has(d.id)) { target.push(d); seen.add(d.id); }
    }
  };

  try {
    // 1단계: 검색어마다 반경 2.5km로 동시 조회 후 합침
    const firstPass = await Promise.all(
      terms.map((t) => callKakao(buildUrl(t, 2500)).catch(() => []))
    );
    let docs = [];
    for (const list of firstPass) mergeUnique(docs, list);

    // 2단계: 그래도 5개 미만이면 반경을 6km로 넓혀 재조회 후 보충
    if (docs.length < 5) {
      const secondPass = await Promise.all(
        terms.map((t) => callKakao(buildUrl(t, 6000)).catch(() => []))
      );
      for (const list of secondPass) mergeUnique(docs, list);
    }

    // 거리순 정렬 후 상위 20개만
    docs.sort((a, b) => (parseInt(a.distance) || 0) - (parseInt(b.distance) || 0));
    docs = docs.slice(0, 20);

    const places = docs.map((p) => ({
      id: p.id,
      name: p.place_name,
      category_full: p.category_name || "",
      ...getPhoto(p.id),
      category: (p.category_name || "").split(">").pop().trim(),
      address: p.road_address_name || p.address_name,
      distance: p.distance ? Math.round(p.distance) : null, // 미터
      phone: p.phone || null,
      url: p.place_url,
      x: p.x, y: p.y,
    }));

    res.setHeader('Cache-Control', 'private, no-store');
    res.status(200).json({ places });
  } catch (e) {
    if (e && e.status) return res.status(e.status).json({ error: "카카오 API 오류", detail: e.data });
    res.status(500).json({ error: "요청 실패: " + String(e).slice(0, 150) });
  }
}
