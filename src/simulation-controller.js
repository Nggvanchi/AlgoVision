// Bộ điều khiển mô phỏng dùng chung cho Sorting và Searching.
// Chỉ quản lý trạng thái + chỉ số bước; việc vẽ giao diện do onChange đảm nhận.

const defaultScheduler = {
  schedule: (callback, delay) => setTimeout(callback, delay),
  cancel: (timerId) => clearTimeout(timerId),
}

// Bảng nút theo trạng thái. runMode cho biết nút Run lúc này là Chạy / Tiếp tục / Chạy lại.
export function getControlState(state, stepIndex) {
  const isRunning = state === 'running'
  const runModes = { idle: 'start', paused: 'resume', completed: 'restart' }

  return {
    run: !isRunning,
    runMode: runModes[state] ?? null,
    pause: isRunning,
    next: state === 'idle' || state === 'paused',
    previous: (state === 'paused' || state === 'completed') && stepIndex > 0,
    reset: true,
  }
}

export function createSimulationController({
  getDelay,
  onChange = () => {},
  scheduler = defaultScheduler,
}) {
  let steps = []
  let stepIndex = 0
  let state = 'idle'
  let timerId = null

  const lastIndex = () => steps.length - 1

  function getSnapshot() {
    return {
      state,
      stepIndex,
      stepCount: steps.length,
      step: steps[stepIndex],
      controls: getControlState(state, stepIndex),
    }
  }

  function notify() {
    onChange(getSnapshot())
  }

  function stopTimer() {
    if (timerId !== null) {
      scheduler.cancel(timerId)
      timerId = null
    }
  }

  function scheduleTick() {
    timerId = scheduler.schedule(() => {
      timerId = null
      advance()

      if (state === 'running') {
        scheduleTick()
      }
    }, getDelay())
  }

  // Tiến một bước; tới bước cuối thì hoàn thành và dừng timer.
  function advance() {
    if (stepIndex < lastIndex()) {
      stepIndex++
    }

    if (stepIndex >= lastIndex()) {
      stopTimer()
      state = 'completed'
    }

    notify()
  }

  function load(newSteps) {
    stopTimer()
    steps = [...newSteps]
    stepIndex = 0
    state = 'idle'
    notify()
  }

  function run() {
    if (state === 'running' || steps.length === 0) return

    if (state === 'completed') {
      stepIndex = 0
    }

    state = 'running'
    scheduleTick()
    notify()
  }

  function pause() {
    if (state !== 'running') return

    stopTimer()
    state = 'paused'
    notify()
  }

  function next() {
    if (!getControlState(state, stepIndex).next || steps.length === 0) return

    state = 'paused'
    advance()
  }

  function previous() {
    if (!getControlState(state, stepIndex).previous) return

    stepIndex--
    state = 'paused'
    notify()
  }

  function reset() {
    stopTimer()
    stepIndex = 0
    state = 'idle'
    notify()
  }

  return { load, run, pause, next, previous, reset, getSnapshot }
}
