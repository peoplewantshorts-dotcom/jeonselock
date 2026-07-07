# 전세락 — 전세 계약 전 미리 확인하세요

주소만 입력하면 공공데이터로 전세 위험 신호를 걸러주는 무료 진단 서비스.
로그인·회원가입·PDF 업로드 없음. '공시락' 디자인 시스템을 따른다.

## 실행

```
npm install
npm run dev   # http://localhost:5173
```

`VITE_API_BASE`(Cloudflare Workers 프록시)가 비어 있으면 **목업 데이터**로 동작한다.
목업 주소 예시: `봉천로`(안전) / `신림로`(근생·주의) / `주안로`(위반건축물·위험) / `화곡로`(오피스텔) / `안암로`(안전)

## 구조

```
src/
  App.jsx                  화면 전환(home/loading/result) + 모달 + 디스클레이머
  api.js                   프록시 호출 + 목업 폴백 + 위험도 계산(diagnose)
  mockData.js              목업 주소/건축물대장/실거래가
  components/
    Header.jsx             로고·알림·기준 시각
    HomeScreen.jsx         주소 자동완성, 보증금, 진단 칩, 사기 유형 3종
    ResultScreen.jsx       등급 배지, 링 게이지, 기본정보 표, 경고 카드,
                           시세 비교막대, 🔒근저당/전세가율(블러), 체크리스트
    widgets.jsx            RingGauge / CompareBars / ProgressBar / DataTable
worker/proxy.js            Cloudflare Workers CORS 프록시 (juso / building / deals)
```

## 실데이터 연결 (다음 단계)

1. 키 발급: [juso.go.kr](https://business.juso.go.kr) 도로명주소 API, [공공데이터포털](https://www.data.go.kr) 건축물대장·실거래가 API
2. 워커 배포: `npx wrangler deploy worker/proxy.js` → `wrangler secret put JUSO_KEY`, `wrangler secret put MOLIT_KEY`
3. `.env`에 `VITE_API_BASE=https://<워커주소>` 설정

## 하지 않는 것 (설계 원칙)

- 등기부 연동(근저당·신탁·압류)은 유료 플랜 — 지금은 🔒 블러 카드 UI만
- 결제·로그인·PDF 업로드 없음, localStorage 사용 안 함
