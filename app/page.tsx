'use client'
import { useEffect, useMemo, useState } from 'react'
import { dict } from './lib/i18n'
import { useGame, loadDataset, pickSlot, resolveWinner } from './lib/store'

function useLang(){
  const [lang, setLang] = useState<'ar'|'en'>(()=> (typeof window!=='undefined' && (localStorage.getItem('lang') as any)) || 'ar')
  useEffect(()=>{
    document.documentElement.lang = lang
    document.documentElement.dir = lang==='ar' ? 'rtl' : 'ltr'
    localStorage.setItem('lang', lang)
  },[lang])
  return { lang, setLang, t: dict[lang] }
}

export default function Home(){
  const g = useGame()
  const { lang, setLang, t } = useLang()

  useEffect(()=>{
    fetch('/yalla_dataset.json').then(r=>r.json()).then(loadDataset)
  },[])

  return (
    <div className="container flex-col" style={{gap:16}}>
      <header className="flex" style={{justifyContent:'space-between'}}>
        <div className="flex" style={{gap:8}}>
          <span className="badge">🎉 {t.appTitle}</span>
          <span className="badge">⚡ Demo</span>
        </div>
        <div className="flex">
          <label className="badge">{t.language}</label>
          <button className="btn" onClick={()=>setLang(lang==='ar'?'en':'ar')}>{lang==='ar'?'English':'العربية'}</button>
        </div>
      </header>

      {g.view==='start' && <StartView t={t} />}
      {g.view==='board' && <BoardView t={t} />}
      {g.view==='question' && <QuestionView t={t} />}
      {g.view==='answer' && <AnswerView t={t} />}
      {g.view==='congrats' && <CongratsView t={t} />}
    </div>
  )
}

function StartView({t}:{t:any}){
  const g = useGame()
  const [title, setTitle] = useState(g.title)
  const [teamA, setTeamA] = useState(g.teamA)
  const [teamB, setTeamB] = useState(g.teamB)

  return (
    <div className="card flex-col">
      <h1 style={{margin:0}}>{t.appTitle}</h1>
      <div className="grid" style={{gridTemplateColumns:'1fr 1fr', gap:16}}>
        <div className="flex-col">
          <label className="label">{t.gameTitle}</label>
          <input className="input" value={title} onChange={e=>setTitle(e.target.value)} />
        </div>
        <div className="flex-col">
          <label className="label">{t.teamA}</label>
          <input className="input" value={teamA} onChange={e=>setTeamA(e.target.value)} />
        </div>
        <div className="flex-col">
          <label className="label">{t.teamB}</label>
          <input className="input" value={teamB} onChange={e=>setTeamB(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-3">
        {useGame.getState().categories.map(c=>(
          <div key={c.id} className="card">
            <div className="flex" style={{justifyContent:'space-between'}}>
              <div className="flex">
                <span style={{fontSize:24}}>{c.icon || '📦'}</span>
                <div className="flex-col">
                  <b>{c.name}</b>
                  <span className="hint">{c.group}</span>
                </div>
              </div>
              <span className="badge">ID: {c.id}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex" style={{justifyContent:'flex-end'}}>
        <button className="btn primary" onClick={()=> useGame.setState({ title, teamA, teamB, view:'board' })}>{t.startGame}</button>
      </div>
    </div>
  )
}

function BoardView({t}:{t:any}){
  const g = useGame()
  const difficulties:[200,400,600] = [200,400,600]
  return (
    <div className="grid" style={{gridTemplateColumns:'1fr 320px', gap:16}}>
      <div className="card flex-col">
        <div className="flex" style={{justifyContent:'space-between'}}>
          <div className="flex"><b>{g.title}</b><span className="badge">{t.yourTurn}: {g.turn==='A' ? g.teamA : g.teamB}</span></div>
          <button className="btn" onClick={()=> useGame.setState({view:'start'})}>⟲</button>
        </div>
        <div className="grid grid-3">
          {g.categories.map(cat=>(
            <div key={cat.id} className="card flex-col">
              <div className="flex" style={{justifyContent:'space-between'}}>
                <div className="flex">
                  <span style={{fontSize:24}}>{cat.icon || '📦'}</span>
                  <div className="flex-col"><b>{cat.name}</b><span className="hint">{cat.group}</span></div>
                </div>
              </div>
              <div className="grid" style={{gridTemplateColumns:'1fr 1fr 1fr'}}>
                {difficulties.map(d=>{
                  const slot = `${cat.id}-${d}` as const
                  // Disable if two questions of same difficulty already used in this category
                  const usedInThis = Array.from(useGame.getState().usedIds).filter(id=>{
                    const q = useGame.getState().questions.find(x=>x.id===id)
                    return q && q.categoryId===cat.id && q.difficulty===d
                  }).length
                  const disabled = usedInThis>=2
                  return (
                    <button key={slot} className="slot-btn" disabled={disabled} onClick={()=>pickSlot(cat.id, d)}>{d}</button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <aside className="card flex-col">
        <div className="flex" style={{justifyContent:'space-between'}}>
          <span className="badge">🏆 {t.points}</span>
        </div>
        <div className="flex" style={{justifyContent:'space-between'}}>
          <div className="flex-col"><b>{g.teamA}</b><span className="score">{g.scoreA}</span></div>
          <div className="flex-col"><b>{g.teamB}</b><span className="score">{g.scoreB}</span></div>
        </div>
        <hr style={{opacity:.1}}/>
        <div className="flex-col">
          <span className="badge">⏱️ Timer</span>
          <SimpleTimer />
        </div>
      </aside>
    </div>
  )
}

function SimpleTimer(){
  const [sec,setSec]=useState(0)
  const [running,setRunning]=useState(false)
  useEffect(()=>{
    if(!running) return
    const id=setInterval(()=>setSec(s=>s+1),1000)
    return ()=>clearInterval(id)
  },[running])
  return (
    <div className="flex" style={{justifyContent:'space-between'}}>
      <div className="timer">{sec}s</div>
      <div className="flex">
        <button className="btn" onClick={()=>setRunning(!running)}>{running?'⏸️':'▶️'}</button>
        <button className="btn danger" onClick={()=>{setRunning(false); setSec(0)}}>⟲</button>
      </div>
    </div>
  )
}

function QuestionView({t}:{t:any}){
  const g = useGame()
  if(!g.current) return null
  const { q } = g.current
  return (
    <div className="card flex-col">
      <div className="flex" style={{justifyContent:'space-between'}}>
        <span className="badge">📚 {t.categories}: {q.categoryId} — {t.points}: {q.difficulty}</span>
        <button className="btn" onClick={()=> useGame.setState({view:'board', current: undefined})}>{t.backToBoard}</button>
      </div>
      <div className="card" style={{background:'#0b1220'}}>
        <div style={{fontSize:24, lineHeight:1.6}}>{q.content.text}</div>
      </div>
      {q.content.hint && <div className="hint">💡 {t.hint}: {q.content.hint}</div>}
      <div className="flex" style={{justifyContent:'flex-end'}}>
        <button className="btn primary" onClick={()=> useGame.setState({view:'answer'})}>{t.showAnswer}</button>
      </div>
    </div>
  )
}

function AnswerView({t}:{t:any}){
  const g = useGame()
  if(!g.current) return null
  const { q } = g.current
  const [revealed, setRevealed] = useState(false)
  return (
    <div className="card flex-col">
      <div className="flex" style={{justifyContent:'space-between'}}>
        <button className="btn" onClick={()=> useGame.setState({view:'question'})}>← {t.backToBoard}</button>
        <span className="badge">✅ {t.answer}</span>
      </div>
      <div className="center" style={{height:160}}>
        {!revealed ? (
          <button className="btn accent" onClick={()=>setRevealed(true)}>{t.reveal}</button>
        ) : (
          <div className="card"><b style={{fontSize:24}}>{q.answer}</b></div>
        )}
      </div>
      <div className="flex" style={{justifyContent:'center'}}>
        <button className="btn" onClick={()=> resolveWinner('A')}>{t.teamA_btn}</button>
        <button className="btn" onClick={()=> resolveWinner('B')}>{t.teamB_btn}</button>
        <button className="btn danger" onClick={()=> resolveWinner('none')}>{t.nobody}</button>
      </div>
    </div>
  )
}

function CongratsView({t}:{t:any}){
  const g = useGame()
  const winner = g.scoreA===g.scoreB ? '—' : (g.scoreA>g.scoreB ? g.teamA : g.teamB)
  return (
    <div className="card center" style={{flexDirection:'column', gap:16}}>
      <div style={{fontSize:28}}>🎉 {t.winner}: <b>{winner}</b></div>
      <div className="flex" style={{gap:32}}>
        <div className="flex-col"><b>{g.teamA}</b><span className="score">{g.scoreA}</span></div>
        <div className="flex-col"><b>{g.teamB}</b><span className="score">{g.scoreB}</span></div>
      </div>
      <button className="btn primary" onClick={()=> useGame.setState({scoreA:0, scoreB:0, usedIds:new Set(), usedCount:0, fixedSlots:{}, turn:'A', view:'board'})}>{t.playAgain}</button>
    </div>
  )
}
