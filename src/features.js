// 서비스의 3가지 메인 기능. 홈(입력 전 안내)과 결과(코너 이동 메뉴) 양쪽에서 공용.
// who/tag: 이 기능이 누구에게 필요한지 (소비자 / 중개사 / 둘 다)
export const FEATURES = [
  {
    n: 1,
    id: 'feat-1',
    name: '건축물대장 쉽게 읽기',
    desc: '건축물대장 = 건물의 기본정보가 적힌 서류. 어려운 말을 쉽게',
    short: '건물 정보 쉽게 읽기',
    who: '소비자·중개사',
    tag: 'both',
  },
  {
    n: 2,
    id: 'feat-2',
    name: '등급 확인 & 직접 판단',
    desc: 'S·A·B·C 보고 스스로 판단',
    short: '등급 보고 직접 판단',
    who: '소비자',
    tag: 'consumer',
  },
  {
    n: 3,
    id: 'feat-3',
    name: '서류 원클릭 발급',
    desc: '원하는 서류만 골라 한 번에',
    short: '서류 원클릭 발급',
    who: '중개사',
    tag: 'agent',
  },
]
