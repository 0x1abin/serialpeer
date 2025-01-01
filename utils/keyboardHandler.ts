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
    68: '\x04', // Ctrl+D (EOT)
    69: '\x05', // Ctrl+E (ENQ)
    70: '\x06', // Ctrl+F (ACK)
    71: '\x07', // Ctrl+G (BEL)
    75: '\x0B', // Ctrl+K (VT)
    76: '\x0C', // Ctrl+L (FF)
    78: '\x0E', // Ctrl+N (SO)
    80: '\x10', // Ctrl+P (DLE)
    81: '\x11', // Ctrl+Q (DC1/XON)
    82: '\x12', // Ctrl+R (DC2)
    83: '\x13', // Ctrl+S (DC3/XOFF)
    84: '\x14', // Ctrl+T (DC4)
    85: '\x15', // Ctrl+U (NAK)
    87: '\x17', // Ctrl+W (ETB)
    88: '\x18', // Ctrl+X (CAN)
    89: '\x19', // Ctrl+Y (EM)
    90: '\x1A'  // Ctrl+Z (SUB)
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