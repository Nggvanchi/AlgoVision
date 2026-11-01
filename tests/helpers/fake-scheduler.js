// Scheduler giả với thời gian ảo, thay cho setTimeout/clearTimeout trong test.
// Test chủ động gọi advance(ms) nên không phụ thuộc thời gian thực.
export function createFakeScheduler() {
  const tasks = new Map()
  let now = 0
  let nextId = 1

  const scheduler = {
    scheduledDelays: [],
    cancelCount: 0,

    schedule(callback, delay) {
      const id = nextId++

      tasks.set(id, { callback, runAt: now + delay })
      scheduler.scheduledDelays.push(delay)

      return id
    },

    cancel(id) {
      if (tasks.delete(id)) {
        scheduler.cancelCount++
      }
    },

    get pendingCount() {
      return tasks.size
    },

    advance(ms) {
      const end = now + ms

      while (true) {
        let dueId = null
        let dueTask = null

        for (const [id, task] of tasks) {
          if (task.runAt <= end && (!dueTask || task.runAt < dueTask.runAt)) {
            dueId = id
            dueTask = task
          }
        }

        if (!dueTask) break

        tasks.delete(dueId)
        now = dueTask.runAt
        dueTask.callback()
      }

      now = end
    },
  }

  return scheduler
}
