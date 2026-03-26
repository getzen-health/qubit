interface QueuedRequest {
  id: string
  method: string
  url: string
  body?: Record<string, unknown> | string | undefined
  timestamp: number
  retryCount: number
}

const QUEUE_STORAGE_KEY = 'kquarks_offline_queue'
const MAX_RETRIES = 3

export class OfflineQueue {
  private static instance: OfflineQueue
  private queue: Map<string, QueuedRequest> = new Map()

  private constructor() {
    this.loadFromStorage()
    this.setupOnlineListener()
  }

  static getInstance(): OfflineQueue {
    if (!OfflineQueue.instance) {
      OfflineQueue.instance = new OfflineQueue()
    }
    return OfflineQueue.instance
  }

  private setupOnlineListener() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.retryAllPending())
    }
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(QUEUE_STORAGE_KEY)
      if (stored) {
        const items = JSON.parse(stored) as QueuedRequest[]
        items.forEach(item => {
          this.queue.set(item.id, item)
        })
      }
    } catch (err) {
      console.error('Failed to load offline queue from storage:', err)
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return

    try {
      const items = Array.from(this.queue.values())
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(items))
    } catch (err) {
      console.error('Failed to save offline queue to storage:', err)
    }
  }

  add(method: string, url: string, body?: any): string {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const request: QueuedRequest = {
      id,
      method,
      url,
      body,
      timestamp: Date.now(),
      retryCount: 0,
    }
    this.queue.set(id, request)
    this.saveToStorage()
    return id
  }

  async retry(id: string): Promise<boolean> {
    const request = this.queue.get(id)
    if (!request) return false

    try {
      const response = await fetch(request.url, {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: request.body ? JSON.stringify(request.body) : undefined,
      })

      if (response.ok) {
        this.remove(id)
        return true
      } else {
        request.retryCount++
        if (request.retryCount >= MAX_RETRIES) {
          this.remove(id)
        } else {
          this.saveToStorage()
        }
        return false
      }
    } catch (err) {
      request.retryCount++
      if (request.retryCount >= MAX_RETRIES) {
        this.remove(id)
      } else {
        this.saveToStorage()
      }
      return false
    }
  }

  remove(id: string) {
    this.queue.delete(id)
    this.saveToStorage()
  }

  async retryAllPending(): Promise<void> {
    const ids = Array.from(this.queue.keys())
    for (const id of ids) {
      await this.retry(id)
    }
  }

  getPending(): QueuedRequest[] {
    return Array.from(this.queue.values())
  }

  getPendingCount(): number {
    return this.queue.size
  }

  clear() {
    this.queue.clear()
    this.saveToStorage()
  }
}

export const offlineQueue = OfflineQueue.getInstance()
