
export interface SerialConfig {
  portId: string;
  baudRate: number;
  dataBits: 7 | 8;
  stopBits: 1 | 2;
  parity: 'none' | 'even' | 'odd';
}

export function useSerialPort() {
  const port = ref()
  const isConnected = ref(false)
  const error = ref<string | null>(null)

  async function connect(config: SerialConfig) {
    try {
      const newPort = await navigator.serial.requestPort()
      try {
        await newPort.open({
          baudRate: config.baudRate,
          dataBits: config.dataBits,
          stopBits: config.stopBits,
          parity: config.parity
        })
        
        port.value = newPort
        isConnected.value = true
        error.value = null

        return port.value
      } catch (e) {
        error.value = 'Failed to open serial port. Please check if the device is in use by another program or if the port settings are correct.'
        console.error('Failed to open serial port:', e)
        throw new Error(error.value)
      }
    } catch (e) {
      if ((e as Error).name === 'NotFoundError') {
        error.value = 'No serial port selected'
      } else {
        error.value = 'Failed to connect to serial port. Please ensure the device is properly connected.'
      }
      console.error('Serial connection failed:', e)
      throw e
    }
  }

  async function disconnect() {
    try {
      if (port.value) {
        await port.value.close()
        port.value = null
        isConnected.value = false
        error.value = null
      }
    } catch (e) {
      error.value = 'Failed to disconnect from serial port'
      console.error(e)
      throw e
    }
  }

  return {
    isConnected,
    error,
    connect,
    disconnect
  }
}