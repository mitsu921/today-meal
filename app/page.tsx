"use client";

import { useState } from "react";

const menuPool = [
  { name: "소고기 버섯전골", type: "따뜻한 국물요리", time: "30분", emoji: "🍲", desc: "온 가족이 둘러앉아 먹기 좋은 담백하고 든든한 저녁 메뉴" },
  { name: "간장 닭볶음", type: "아이와 함께", time: "25분", emoji: "🍗", desc: "맵지 않고 달큰해서 아이도 어른도 맛있게 먹는 한 끼" },
  { name: "두부 달걀덮밥", type: "냉장고 파먹기", time: "15분", emoji: "🍳", desc: "집에 있는 재료로 빠르게 완성하는 부드럽고 든든한 한 그릇" },
  { name: "참치 김치볶음밥", type: "간단한 한 그릇", time: "15분", emoji: "🍚", desc: "반찬 걱정 없이 한 팬으로 완성하는 실패 없는 메뉴" },
];

const articles = [
  { category: "아이 반찬", title: "이번 주 아이 반찬 5가지", copy: "맵지 않고 만들기 쉬운 반찬만 모았어요.", icon: "🥕", color: "peach" },
  { category: "냉장고 활용", title: "시들기 전 채소 활용법", copy: "애매하게 남은 채소를 맛있게 비우는 방법.", icon: "🥬", color: "green" },
  { category: "살림·장보기", title: "식비 줄이는 장보기 순서", copy: "필요한 만큼 사고 버리는 재료는 줄여보세요.", icon: "🧺", color: "yellow" },
];

const weekly = [
  ["월", "닭갈비", "콩나물국"], ["화", "고등어구이", "된장찌개"], ["수", "카레라이스", "오이무침"],
  ["목", "소불고기", "달걀찜"], ["금", "김치볶음밥", "어묵국"],
];

export default function Home() {
  const [meal, setMeal] = useState(menuPool[0]);
  const [active, setActive] = useState("저녁");
  const [loading, setLoading] = useState(false);
  const recommend = () => { setLoading(true); window.setTimeout(() => { const next = menuPool.filter((m) => m.name !== meal.name); setMeal(next[Math.floor(Math.random() * next.length)]); setLoading(false); }, 350); };

  return <main>
    <div className="topline"><div className="shell"><span>매일의 식사 고민을 가볍게</span><div><a href="#weekly">주간 식단</a><a href="#stories">살림 노트</a></div></div></div>
    <header className="header shell"><a className="logo" href="#top"><span>오늘의 식사</span><small>TODAY MEAL</small></a><nav><a className="active" href="#top">홈</a><a href="#recommend">오늘 뭐 먹지</a><a href="#weekly">일주일 식단</a><a href="#stories">아이 반찬</a><a href="#stories">냉장고 파먹기</a><a href="#stories">살림·장보기</a></nav><button className="search" aria-label="레시피 검색">⌕</button></header>

    <section className="hero shell" id="top">
      <div className="hero-main"><div className="hero-photo"><img src="/family-table.png" alt="따뜻한 집밥이 차려진 식탁" /><span>오늘의 추천 이야기</span></div><div className="hero-copy"><p>WEEKLY TABLE</p><h1>매일 저녁,<br />무엇을 먹을지 고민되나요?</h1><span>가족이 함께 먹기 좋은 메뉴부터 장보기 정보까지,<br />우리 집 식탁에 필요한 이야기를 모았습니다.</span><a href="#recommend">오늘 메뉴 골라보기 <b>→</b></a></div></div>
      <aside className="quick-pick" id="recommend"><p className="overline">QUICK PICK</p><h2>오늘 뭐 먹지?</h2><p className="quick-desc">몇 번의 선택만으로<br />오늘의 메뉴를 골라드려요.</p><div className="meal-times">{["아침","점심","저녁","야식"].map((t) => <button key={t} className={active === t ? "active" : ""} onClick={() => setActive(t)}>{t}</button>)}</div><div className={`meal-result ${loading ? "loading" : ""}`}><span>{meal.emoji}</span><div><small>{meal.type} · {meal.time}</small><h3>{loading ? "메뉴 고르는 중" : meal.name}</h3><p>{meal.desc}</p></div></div><button className="recommend-button" onClick={recommend} disabled={loading}>{loading ? "잠시만 기다려주세요" : "다른 메뉴 추천받기"}<span>↻</span></button></aside>
    </section>

    <section className="category-bar shell"><a href="#recommend"><span>01</span><div><b>오늘 메뉴 추천</b><small>고민 없이 바로 골라보세요</small></div><i>→</i></a><a href="#weekly"><span>02</span><div><b>일주일 식단표</b><small>한 주 식사를 미리 준비해요</small></div><i>→</i></a><a href="#stories"><span>03</span><div><b>냉장고 파먹기</b><small>남은 재료를 알뜰하게 써요</small></div><i>→</i></a></section>

    <section className="content-section shell" id="stories"><div className="section-title"><div><p>FAMILY FOOD &amp; LIVING</p><h2>가족 식사와 살림 이야기</h2></div><a href="#stories">전체 글 보기 →</a></div><div className="story-grid">{articles.map((a) => <article key={a.title}><div className={`story-image ${a.color}`}><span>{a.icon}</span></div><div className="story-copy"><small>{a.category}</small><h3>{a.title}</h3><p>{a.copy}</p><a href="#stories">자세히 보기</a></div></article>)}</div></section>

    <section className="weekly-wrap" id="weekly"><div className="weekly shell"><div className="weekly-intro"><p>THIS WEEK&apos;S MENU</p><h2>이번 주 저녁,<br />미리 정해두세요</h2><span>매일 고민하지 않도록 부담 없는 집밥 메뉴로 구성했어요.</span><a href="#weekly">식단표 전체 보기 →</a></div><div className="week-list">{weekly.map((d, i) => <article key={d[0]} className={i === 0 ? "today" : ""}><span>{d[0]}</span><div><h3>{d[1]}</h3><p>{d[2]}</p></div><b>{i === 0 ? "TODAY" : ""}</b></article>)}</div></div></section>

    <section className="newsletter shell"><div><small>오늘의 식사 편지</small><h2>매주 새로운 식단과 살림 정보를 받아보세요.</h2></div><form onSubmit={(e) => e.preventDefault()}><input type="email" placeholder="이메일 주소" aria-label="이메일 주소" /><button>구독하기</button></form></section>
    <footer><div className="shell footer"><div className="logo light"><span>오늘의 식사</span><small>TODAY MEAL</small></div><p>오늘 먹을 메뉴부터 가족의 일주일 식단까지.</p><div><a href="#top">이용약관</a><a href="#top">개인정보처리방침</a></div><small>© 2026 TODAY MEAL</small></div></footer>
  </main>;
}
