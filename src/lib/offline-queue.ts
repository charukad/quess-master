import { get, set, update } from 'idb-keyval'

interface QueuedAction {
  id: string; // Idempotency key
  type: string;
  payload: unknown;
  timestamp: number;
}

const QUEUE_KEY = 'quiz_master_action_queue'

export async function queueAction(type: string, payload: unknown) {
  const action: QueuedAction = {
    id: crypto.randomUUID(),
    type,
    payload,
    timestamp: Date.now()
  }

  await update(QUEUE_KEY, (value: QueuedAction[] | undefined) => {
    const queue = value ?? []
    return [...queue, action]
  })

  return action.id
}

export async function getQueue(): Promise<QueuedAction[]> {
  return (await get(QUEUE_KEY)) || []
}

export async function removeFromQueue(actionId: string) {
  await update(QUEUE_KEY, (value: QueuedAction[] | undefined) => {
    const queue = value ?? []
    return queue.filter((a: QueuedAction) => a.id !== actionId)
  })
}

export async function clearQueue() {
  await set(QUEUE_KEY, [])
}

// Concept: In a React component, use a `useInterval` to periodically check `navigator.onLine`.
// If online and `getQueue().length > 0`, iterate through the queue, dispatch the actions via API route,
// and call `removeFromQueue` upon success.
