import { openDB, type IDBPDatabase } from 'idb'

interface SerialLogFile {
  id?: number
  content: string[]
  createdAt: number
  updatedAt: number
}

class SerialDB {
  private db: Promise<IDBPDatabase>
  
  constructor() {
    this.db = openDB('SerialDebugDB', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('logFiles')) {
          const store = db.createObjectStore('logFiles', { 
            keyPath: 'id', 
            autoIncrement: true 
          })
          store.createIndex('updatedAt', 'updatedAt')
        }
      }
    })
  }

  async saveLogFile(file: Omit<SerialLogFile, 'id'>) {
    const db = await this.db
    return db.add('logFiles', file)
  }

  async updateLogFile(id: number, content: string[]) {
    const db = await this.db
    const file = await db.get('logFiles', id)
    if (!file) throw new Error('File not found')

    return db.put('logFiles', {
      ...file,
      content,
      updatedAt: Date.now()
    })
  }

  async getLogFiles() {
    const db = await this.db
    return db.getAllFromIndex('logFiles', 'updatedAt')
  }

  async getLogFile(id: number) {
    const db = await this.db
    return db.get('logFiles', id)
  }

  async deleteLogFile(id: number) {
    const db = await this.db
    return db.delete('logFiles', id)
  }
}

export const serialDB = new SerialDB() 