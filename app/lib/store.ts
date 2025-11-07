'use client'
import { create } from 'zustand'

type SlotKey = `${string}-${number}` // categoryId-difficulty

export type Question = {
  id:string; categoryId:string; difficulty:200|400|600; type:'text';
  content:{text:string; hint?:string|null; mediaAlt?:string|null};
  answer:string; mediaUrl?:string|null; isActive:boolean;
}

export type Category = { id:string; group:string; name:string; icon?:string|null }

type State = {
  lang: 'ar'|'en'
  title: string
  teamA: string
  teamB: string
  turn: 'A'|'B'
  categories: Category[]
  questions: Question[]
  usedIds: Set<string>
  fixedSlots: Record<SlotKey, string | undefined> // slot -> questionId
  usedCount: number
  scoreA: number
  scoreB: number
  view: 'start'|'board'|'question'|'answer'|'congrats'
  current?: { slot: SlotKey, q: Question }
}

export const useGame = create<State>((set, get) => ({
  lang: 'ar',
  title: 'يلا',
  teamA: 'فريق أ',
  teamB: 'فريق ب',
  turn: 'A',
  categories: [],
  questions: [],
  usedIds: new Set(),
  fixedSlots: {},
  usedCount: 0,
  scoreA: 0,
  scoreB: 0,
  view: 'start',
  current: undefined
}))

export function loadDataset(data: any){
  const s = useGame.getState()
  useGame.setState({
    title: data.game?.title || s.title,
    teamA: data.game?.teamAName || s.teamA,
    teamB: data.game?.teamBName || s.teamB,
    categories: data.categories,
    questions: data.questions
  })
}

// pick a question for a slot (category + difficulty), fixed once chosen
export function pickSlot(categoryId: string, difficulty: 200|400|600){
  const state = useGame.getState()
  const slot: SlotKey = `${categoryId}-${difficulty}`
  const fixed = state.fixedSlots[slot]
  if (fixed){
    const q = state.questions.find(q=>q.id===fixed)!
    useGame.setState({ view:'question', current:{ slot, q } })
    return
  }
  const used = state.usedIds
  const pool = state.questions.filter(q=> q.categoryId===categoryId && q.difficulty===difficulty && !used.has(q.id))
  if (pool.length===0){
    alert('لا يوجد سؤال متاح لهذا المستوى في هذه الفئة.')
    return
  }
  const q = pool[Math.floor(Math.random()*pool.length)]
  const fixedSlots = {...state.fixedSlots, [slot]: q.id}
  useGame.setState({ fixedSlots, current:{slot, q}, view:'question' })
}

// resolve winner and update scores
export function resolveWinner(winner: 'A'|'B'|'none'){
  const s = useGame.getState()
  if (!s.current) return
  const { q, slot } = s.current
  const used = new Set(s.usedIds); used.add(q.id)
  const points = q.difficulty
  let scoreA = s.scoreA, scoreB = s.scoreB
  if (winner==='A') scoreA += points
  if (winner==='B') scoreB += points
  const turn = (winner==='A' || winner==='B') ? (winner==='A' ? 'B':'A') : (s.turn==='A'?'B':'A')
  const usedCount = s.usedCount + 1
  const view = usedCount >= 36 ? 'congrats' : 'board'
  useGame.setState({ usedIds: used, scoreA, scoreB, turn, usedCount, view, current: undefined })
}
