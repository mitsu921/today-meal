# TodayMeal 원본 이미지 연결 수정본

기존 files.zip의 index.html 구조와 기능을 유지하면서 이미지 참조를 수정했습니다.

## 적용
- assets/hero_woman.png: 인사말 캐릭터
- assets/meal_bowl.png: 추천 메뉴
- assets/piggy.png: 절약 리포트
- assets/roulette.png: 룰렛 배너

네 파일 모두 todaymeal-home-v2-source.zip의 원본과 바이트 단위로 일치합니다. v3 이미지는 사용하지 않습니다. 이미지 변환, 재생성, 외부 대체, 오류 시 자동 대체를 추가하지 않았습니다. 원본 이미지 자체에 잘린 글자·버튼·배경이 들어 있는 점은 그대로 유지했습니다.

UI 키트의 냉장고·홈·시계·사람 및 6개 음식 분류 아이콘을 해당 용도에 연결했습니다. assets/ui-kit에는 제공된 이미지 전체를 보관했습니다.

## 실행
기존 서비스의 index.html을 이 파일로 교체하고 같은 위치에 assets 폴더를 복사하세요. /app/index.html에서는 /app/assets/로 연결되며 다른 하위 폴더에서도 네 이미지의 상대 경로가 유지됩니다.

기존 서버 API /api/menu, /api/nearby, /api/price 및 Supabase 연결은 유지했습니다. 해당 서버 구현은 세 ZIP에 포함되어 있지 않아 전체 서비스의 독립 실행이나 서버 연동은 검증하지 못했습니다. 외부 스크립트·폰트·광고·실제 게시물 이미지도 기존 기능을 위해 유지합니다.

## 여전히 제공되지 않은 별도 자산
다음은 홈 시안의 네 이미지와 별개이며, 세 ZIP에서 대응 원본을 찾을 수 없었습니다. 임의의 그림을 배정하지 않고 기존 참조를 유지했습니다. 기존 서버 루트에 파일이 없으면 해당 화면에서 누락될 수 있습니다.
- /hero-collage.jpg, /mission-pot.png, /icon-192.png
- /thumb-popular.jpg, /thumb-recent.jpg, /thumb-fridge.jpg, /thumb-demo4.jpg
- /icons/search.png, /icons/pencil.png, /icons/cart.png, /icons/chefhat.png, /icons/forkknife.png, /icons/heart-outline.png

## 검사 결과
네 원본 이미지 SHA-256 및 바이트 일치, 새 로컬 이미지 참조의 실제 파일 존재, HTML 내부 JavaScript 3개 문법 검사를 통과했습니다. asset-manifest.json으로 네 원본 파일을 확인할 수 있습니다. 브라우저 화면 및 서버 기능 검증은 수행하지 않았습니다.
