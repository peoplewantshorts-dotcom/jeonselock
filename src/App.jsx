import { useState } from 'react'
import Header from './components/Header.jsx'
import HomeScreen from './components/HomeScreen.jsx'
import ResultScreen from './components/ResultScreen.jsx'
import AgentScreen from './components/AgentScreen.jsx'
import { fetchBuilding, diagnose } from './api.js'

export default function App() {
  const [screen, setScreen] = useState('home') // home | loading | result | agent
  const [addr, setAddr] = useState(null)
  const [depositMan, setDepositMan] = useState(0)
  const [unit, setUnit] = useState('')
  const [building, setBuilding] = useState(null)
  const [result, setResult] = useState(null)
  const [modal, setModal] = useState(null) // 'premium' | 'notify' | null

  const runDiagnosis = async (selectedAddr, deposit, selectedUnit = '') => {
    setScreen('loading')
    setAddr(selectedAddr)
    setDepositMan(deposit)
    setUnit(selectedUnit)
    const [b] = await Promise.all([
      fetchBuilding(selectedAddr),
      new Promise((r) => setTimeout(r, 700)), // 로딩 상태가 보이도록 최소 시간
    ])
    setBuilding(b)
    setResult(diagnose(b, deposit, selectedUnit))
    setScreen('result')
    window.scrollTo(0, 0)
  }

  const goHome = () => {
    setScreen('home')
    window.scrollTo(0, 0)
  }

  return (
    <div className="app">
      <Header onNotify={() => setModal('notify')} />

      {screen === 'home' && (
        <HomeScreen
          onDiagnose={runDiagnosis}
          onPickFeature={(tag) => {
            if (tag === 'agent') {
              setScreen('agent')
              window.scrollTo(0, 0)
            }
          }}
        />
      )}

      {screen === 'agent' && <AgentScreen onBack={goHome} onLock={() => setModal('premium')} />}

      {screen === 'loading' && (
        <div className="loading-wrap">
          <div className="spinner" />
          <p className="loading-text">
            건축물대장과 실거래가를
            <br />
            확인하고 있어요…
          </p>
        </div>
      )}

      {screen === 'result' && building && result && (
        <ResultScreen
          addr={addr}
          depositMan={depositMan}
          unit={unit}
          building={building}
          result={result}
          onBack={goHome}
          onLock={() => setModal('premium')}
        />
      )}

      {modal && (
        <div className="modal-backdrop" onClick={() => setModal(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            {modal === 'premium' ? (
              <>
                <div className="modal-icon">🔒</div>
                <h3>정밀 진단 준비 중이에요</h3>
                <p>
                  등기부등본을 연동해 근저당·신탁·압류까지 확인하는 유료 정밀 진단을 준비하고
                  있어요. 조금만 기다려주세요!
                </p>
              </>
            ) : (
              <>
                <div className="modal-icon">🔔</div>
                <h3>알림 준비 중이에요</h3>
                <p>관심 주소에 새로 확인할 정보가 생기면 알려드리는 기능을 준비하고 있어요.</p>
              </>
            )}
            <button className="modal-close" onClick={() => setModal(null)}>
              확인
            </button>
          </div>
        </div>
      )}

      <footer className="disclaimer">
        <div className="disclaimer-inner">
          공개된 공공데이터를 정리한 참고 정보예요. 법적 효력이나 계약 판단을 대신하지 않아요.
        </div>
      </footer>
    </div>
  )
}
