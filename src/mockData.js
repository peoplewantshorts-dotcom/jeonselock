// 실제 API(도로명주소·건축물대장·실거래가)가 붙기 전까지 UI를 채우는 목업 데이터.
// 프록시(VITE_API_BASE)가 설정되면 api.js가 실데이터를 우선 사용한다.

export const MOCK_ADDRESSES = [
  {
    id: 'bongcheon-100',
    road: '서울 관악구 봉천로 100',
    detail: '서울 관악구 봉천동 979-1 (해피하임빌)',
    buildingName: '해피하임빌',
  },
  {
    id: 'sillim-77',
    road: '서울 관악구 신림로 77',
    detail: '서울 관악구 신림동 1422-5 (그린타워)',
    buildingName: '그린타워',
  },
  {
    id: 'juan-21',
    road: '인천 미추홀구 주안로 21',
    detail: '인천 미추홀구 주안동 141-3 (대양빌라)',
    buildingName: '대양빌라',
  },
  {
    id: 'hwagok-55',
    road: '서울 강서구 화곡로 55',
    detail: '서울 강서구 화곡동 812-4 (화곡리버뷰)',
    buildingName: '화곡리버뷰',
  },
  {
    id: 'anam-30',
    road: '서울 성북구 안암로 30',
    detail: '서울 성북구 안암동5가 101-2 (안암캠퍼스텔)',
    buildingName: '안암캠퍼스텔',
  },
]

// 건축물대장 표제부 + 실거래가 목업 (id 기준)
export const MOCK_BUILDINGS = {
  'bongcheon-100': {
    mainUse: '다세대주택',
    builtYear: 2018,
    floors: '지상 5층 / 지하 1층',
    areaM2: 29.7,
    violation: false, // 위반건축물 여부
    isNonResidential: false, // 근생·업무시설 여부
    recentDeals: [
      { date: '2026.05', priceMan: 21000, type: '전세' },
      { date: '2026.03', priceMan: 20500, type: '전세' },
      { date: '2026.01', priceMan: 21500, type: '전세' },
    ],
  },
  'sillim-77': {
    mainUse: '제2종 근린생활시설',
    builtYear: 2021,
    floors: '지상 7층',
    areaM2: 24.3,
    violation: false,
    isNonResidential: true,
    recentDeals: [
      { date: '2026.04', priceMan: 17000, type: '전세' },
      { date: '2026.02', priceMan: 16500, type: '전세' },
    ],
  },
  'juan-21': {
    mainUse: '다세대주택',
    builtYear: 1996,
    floors: '지상 4층',
    areaM2: 42.1,
    violation: true,
    isNonResidential: false,
    recentDeals: [
      { date: '2026.02', priceMan: 9500, type: '전세' },
      { date: '2025.11', priceMan: 9000, type: '매매' },
    ],
  },
  'hwagok-55': {
    mainUse: '업무시설(오피스텔)',
    builtYear: 2015,
    floors: '지상 12층 / 지하 2층',
    areaM2: 33.6,
    violation: false,
    isNonResidential: true,
    recentDeals: [
      { date: '2026.05', priceMan: 19000, type: '전세' },
      { date: '2026.04', priceMan: 18500, type: '전세' },
    ],
  },
  'anam-30': {
    mainUse: '도시형생활주택',
    builtYear: 2020,
    floors: '지상 6층',
    areaM2: 21.5,
    violation: false,
    isNonResidential: false,
    recentDeals: [
      { date: '2026.06', priceMan: 15000, type: '전세' },
      { date: '2026.03', priceMan: 14800, type: '전세' },
    ],
  },
}

// 목록에 없는 주소를 진단할 때 쓰는 기본 목업
export const DEFAULT_BUILDING = {
  mainUse: '다세대주택',
  builtYear: 2012,
  floors: '지상 4층',
  areaM2: 26.4,
  violation: false,
  isNonResidential: false,
  recentDeals: [
    { date: '2026.05', priceMan: 18000, type: '전세' },
    { date: '2026.02', priceMan: 17500, type: '전세' },
  ],
}
