// Cloudflare Workers — 공공 API CORS 프록시
// 배포: npx wrangler deploy worker/proxy.js
// 시크릿 등록: npx wrangler secret put JUSO_KEY / MOLIT_KEY
//
// 프론트는 이 워커의 /juso, /building, /deals 만 호출한다.
// API 키는 워커 안에만 있으므로 브라우저에 노출되지 않는다.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: CORS })

    const url = new URL(request.url)

    try {
      // ---- 도로명주소 자동완성 (juso.go.kr) ----
      if (url.pathname === '/juso') {
        const keyword = url.searchParams.get('keyword') || ''
        const api = new URL('https://business.juso.go.kr/addrlink/addrLinkApi.do')
        api.searchParams.set('confmKey', env.JUSO_KEY)
        api.searchParams.set('keyword', keyword)
        api.searchParams.set('currentPage', '1')
        api.searchParams.set('countPerPage', '5')
        api.searchParams.set('resultType', 'json')
        const res = await fetch(api)
        return json(await res.json())
      }

      // ---- 건축물대장 표제부 (국토교통부) ----
      // bdMgtSn(건물관리번호) 앞자리에서 시군구·법정동 코드, 번지를 잘라 조회한다.
      if (url.pathname === '/building') {
        const bdMgtSn = url.searchParams.get('bdMgtSn') || ''
        const sigunguCd = bdMgtSn.slice(0, 5)
        const bjdongCd = bdMgtSn.slice(5, 10)
        const bun = bdMgtSn.slice(11, 15)
        const ji = bdMgtSn.slice(15, 19)
        const api = new URL(
          'https://apis.data.go.kr/1613000/BldRgstHubService/getBrTitleInfo',
        )
        api.searchParams.set('serviceKey', env.MOLIT_KEY)
        api.searchParams.set('sigunguCd', sigunguCd)
        api.searchParams.set('bjdongCd', bjdongCd)
        api.searchParams.set('bun', bun)
        api.searchParams.set('ji', ji)
        api.searchParams.set('_type', 'json')
        const res = await fetch(api)
        const raw = await res.json()
        const item = raw?.response?.body?.items?.item
        const first = Array.isArray(item) ? item[0] : item
        if (!first) return json({ error: 'not_found' }, 404)
        // 프론트가 쓰는 형태로 번역
        return json({
          mainUse: first.mainPurpsCdNm || '확인 불가',
          builtYear: first.useAprDay ? Number(String(first.useAprDay).slice(0, 4)) : null,
          floors: `지상 ${first.grndFlrCnt}층${first.ugrndFlrCnt ? ` / 지하 ${first.ugrndFlrCnt}층` : ''}`,
          areaM2: first.totArea ? Math.round(first.totArea * 10) / 10 : null,
          violation: first.violYn === 'Y' || first.violBldYn === '1',
          isNonResidential: /근린생활|업무|숙박|판매/.test(first.mainPurpsCdNm || ''),
          recentDeals: [], // /deals 로 별도 조회
        })
      }

      // ---- 실거래가 (국토교통부 아파트/오피스텔/연립다세대) ----
      if (url.pathname === '/deals') {
        const lawdCd = url.searchParams.get('lawdCd') // 법정동 5자리
        const ym = url.searchParams.get('ym') // YYYYMM
        const kind = url.searchParams.get('kind') || 'RTMSDataSvcRHRent' // 연립다세대 전월세
        const api = new URL(`https://apis.data.go.kr/1613000/${kind}/get${kind.slice(10)}`)
        api.searchParams.set('serviceKey', env.MOLIT_KEY)
        api.searchParams.set('LAWD_CD', lawdCd)
        api.searchParams.set('DEAL_YMD', ym)
        api.searchParams.set('_type', 'json')
        const res = await fetch(api)
        return json(await res.json())
      }

      return json({ error: 'unknown_path' }, 404)
    } catch (e) {
      return json({ error: String(e) }, 500)
    }
  },
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  })
}
