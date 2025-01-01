import type { IKeyboardEvent } from 'xterm'
import type { SerialStore } from '~/stores/serial'

export async function handleKeyboardEvent(
  e: IKeyboardEvent, 
  store: SerialStore
) {
  if (!store.isConnected) return
  
  e.domEvent.preventDefault()
  
  const { key, domEvent: { ctrlKey, keyCode } } = e
  
  if (ctrlKey) {
    await handleCtrlKey(keyCode, store)
  } else {
    await handleRegularKey(key, keyCode, store)
  }
}

async function handleCtrlKey(keyCode: number, store: SerialStore) {
  const ctrlKeyMap: Record<number, string> = {
    65: '\x01', // Ctrl+A (SOH)
    66: '\x02', // Ctrl+B (STX)
    67: '\x03', // Ctrl+C (ETX)
    // ... 其他 Ctrl 组合键映射
  }
  
  if (keyCode in ctrlKeyMap) {
    await store.sendData(ctrlKeyMap[keyCode], 'ASCII')
  }
}

async function handleRegularKey(
  key: string, 
  keyCode: number, 
  store: SerialStore
) {
  const specialKeyMap: Record<number, string> = {
    13: '\n',    // Enter
    8: '\b',     // Backspace
    27: '\x1B',  // ESC
    9: '\t',     // Tab
  }

  if (keyCode in specialKeyMap) {
    await store.sendData(specialKeyMap[keyCode], 'ASCII')
  } else {
    await store.sendData(key, 'ASCII')
  }
} 