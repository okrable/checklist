import { useEffect, useMemo, useState } from 'react'

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

export default function App() {
  const [state, setState] = useState(getInitialState)
  const [showCelebration, setShowCelebration] = useState(false)
  const [confetti, setConfetti] = useState([])

  const todayKey = formatDateKey()

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
    if (!allDone || state.lastCompletedDate === todayKey) return

    setState((prev) => ({
      ...prev,
      streak: prev.streak + 1,
      lastCompletedDate: todayKey,
    }))

    const canAnimate = !window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!canAnimate) return

    setShowCelebration(true)
    setConfetti(createConfetti())

    const timeout = setTimeout(() => {
      setShowCelebration(false)
      setConfetti([])
    }, 2600)

    return () => clearTimeout(timeout)
  }, [allDone, todayKey, state.lastCompletedDate])

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
        <p className="date">{todayKey}</p>
        <h1>Daily Accountability</h1>
        <p className="subtitle">Check off every goal to extend your streak.</p>

        <div className="streak-wrap">
          <span className="streak-label">Current streak</span>
          <strong>{state.streak} day{state.streak === 1 ? '' : 's'}</strong>
        </div>

        <div className="progress-wrap">
          <div className="progress-bar" aria-hidden="true">
            <span style={{ width: `${(completedCount / GOALS.length) * 100}%` }} />
          </div>
          <small>
            {completedCount} / {GOALS.length} completed
          </small>
        </div>

        <ul className="goal-list">
          {todayTasks.map((task, index) => (
            <li key={task.label}>
              <label>
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => toggleTask(index)}
                />
                <span>{task.label}</span>
              </label>
            </li>
          ))}
        </ul>

        <div className="action-row">
          <button type="button" onClick={resetToday}>
            Reset today
          </button>
        </div>

        {allDone && (
          <div className="reward-box" role="status">
            🎉 Nice work! All goals done for today.
          </div>
        )}
      </section>
    </main>
  )
}
