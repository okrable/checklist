import { useEffect, useMemo, useRef, useState } from 'react'
import congratsMessages from './data/congratsMessages.json'

const STORAGE_KEY = 'daily-accountability-state'
const GOALS = [
  'Morning walk or movement',
  'Deep work block (60+ min)',
  'Healthy meals plan followed',
  'Read 10 pages',
  'Reflect + plan tomorrow',
]

const CONFETTI_COLORS = ['#f43f5e', '#f59e0b', '#22c55e', '#3b82f6', '#a855f7', '#14b8a6']
const MAX_STORED_DAYS = 14

const formatDateKey = (date = new Date()) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const defaultTasks = () => GOALS.map((label) => ({ label, done: false }))

const pruneOldDays = (tasksByDate) => {
  const entries = Object.entries(tasksByDate)

  if (entries.length <= MAX_STORED_DAYS) {
    return tasksByDate
  }

  return Object.fromEntries(entries.sort(([a], [b]) => a.localeCompare(b)).slice(-MAX_STORED_DAYS))
}

const getInitialState = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY))

    if (!parsed) {
      return {
        streak: 0,
        lastCompletedDate: null,
        tasksByDate: {},
      }
    }

    return {
      streak: parsed.streak ?? 0,
      lastCompletedDate: parsed.lastCompletedDate ?? null,
      tasksByDate: pruneOldDays(parsed.tasksByDate ?? {}),
    }
  } catch {
    return {
      streak: 0,
      lastCompletedDate: null,
      tasksByDate: {},
    }
  }
}

const createConfetti = (count = 100) =>
  Array.from({ length: count }, (_, id) => ({
    id,
    left: Math.random() * 100,
    delay: Math.random() * 300,
    duration: 2200 + Math.random() * 1200,
    drift: (Math.random() - 0.5) * 180,
    rotate: Math.random() * 360,
    size: 6 + Math.random() * 8,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
  }))

const randomCongratsMessage = () =>
  congratsMessages[Math.floor(Math.random() * congratsMessages.length)]

export default function App() {
  const [state, setState] = useState(getInitialState)
  const [showCelebration, setShowCelebration] = useState(false)
  const [confetti, setConfetti] = useState([])
  const [completionModal, setCompletionModal] = useState({
    open: false,
    message: '',
    streak: 0,
  })
  const [lastCelebratedDate, setLastCelebratedDate] = useState(null)

  const todayKey = formatDateKey()
  const previousAllDoneRef = useRef(false)

  const todayTasks = useMemo(() => {
    const saved = state.tasksByDate[todayKey]
    return saved?.length === GOALS.length ? saved : defaultTasks()
  }, [state.tasksByDate, todayKey])

  const completedCount = todayTasks.filter((task) => task.done).length
  const allDone = completedCount === GOALS.length

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...state,
      tasksByDate: pruneOldDays(state.tasksByDate),
    }))
  }, [state])

  useEffect(() => {
    const justCompleted = !previousAllDoneRef.current && allDone
    previousAllDoneRef.current = allDone

    if (!justCompleted || lastCelebratedDate === todayKey) {
      return
    }

    const shouldIncrementStreak = state.lastCompletedDate !== todayKey
    const nextStreak = shouldIncrementStreak ? state.streak + 1 : state.streak

    if (shouldIncrementStreak) {
      setState((prev) => ({
        ...prev,
        streak: prev.streak + 1,
        lastCompletedDate: todayKey,
      }))
    }

    setCompletionModal({
      open: true,
      message: randomCongratsMessage(),
      streak: nextStreak,
    })
    setLastCelebratedDate(todayKey)

    const canAnimate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!canAnimate) return

    setShowCelebration(true)
    setConfetti(createConfetti())

    const timeout = setTimeout(() => {
      setShowCelebration(false)
      setConfetti([])
    }, 2600)

    return () => clearTimeout(timeout)
  }, [allDone, lastCelebratedDate, state.lastCompletedDate, state.streak, todayKey])

  const toggleTask = (index) => {
    const updated = todayTasks.map((task, idx) =>
      idx === index ? { ...task, done: !task.done } : task,
    )

    setState((prev) => ({
      ...prev,
      tasksByDate: pruneOldDays({
        ...prev.tasksByDate,
        [todayKey]: updated,
      }),
    }))
  }

  const resetToday = () => {
    previousAllDoneRef.current = false
    setLastCelebratedDate(null)

    setState((prev) => ({
      ...prev,
      tasksByDate: {
        ...prev.tasksByDate,
        [todayKey]: defaultTasks(),
      },
    }))
  }

  return (
    <main className="app-shell">
      {showCelebration && (
        <div className="confetti-layer" aria-hidden="true">
          {confetti.map((piece) => (
            <span
              key={piece.id}
              className="confetti-piece"
              style={{
                left: `${piece.left}%`,
                width: `${piece.size}px`,
                height: `${piece.size * 1.6}px`,
                backgroundColor: piece.color,
                animationDelay: `${piece.delay}ms`,
                animationDuration: `${piece.duration}ms`,
                '--drift': `${piece.drift}px`,
                '--rotate': `${piece.rotate}deg`,
              }}
            />
          ))}
        </div>
      )}

      <section className="card">
        <div className="task-lights" aria-label="Task progress lights">
          {todayTasks.map((task) => (
            <span
              key={`light-${task.label}`}
              className={`task-light ${task.done ? 'done' : ''}`}
              aria-hidden="true"
            />
          ))}
        </div>

        <div className="streak-wrap">
          <span className="streak-label">Current streak</span>
          <strong>{state.streak} day{state.streak === 1 ? '' : 's'}</strong>
        </div>

        <ul className="goal-list">
          {todayTasks.map((task, index) => (
            <li key={task.label}>
              <label>
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => toggleTask(index)}
                  className="task-checkbox"
                  aria-label={task.label}
                />
                <span className={task.done ? 'done' : ''}>{task.label}</span>
              </label>
            </li>
          ))}
        </ul>

        <div className="action-row">
          <button type="button" onClick={resetToday}>
            Reset today
          </button>
        </div>
      </section>

      {completionModal.open && (
        <div className="modal-root" role="dialog" aria-modal="true" aria-labelledby="completion-title">
          <div className="modal-overlay" onClick={() => setCompletionModal((prev) => ({ ...prev, open: false }))} />
          <div className="modal-content">
            <h2 id="completion-title">Day Complete 🎉</h2>
            <p>{completionModal.message}</p>
            <p className="modal-streak">Streak increased to {completionModal.streak}.</p>
            <button type="button" onClick={() => setCompletionModal((prev) => ({ ...prev, open: false }))}>
              Awesome
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
