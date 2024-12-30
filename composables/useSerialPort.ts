import { ref } from 'vue'
import type { SerialConfig } from '~/types/serial'

export function useSerialPort() {
  const port = ref<SerialPort | null>(null)
  const availablePorts = ref<SerialPortInfo[]>([])
  const isConnected = ref(false)
  const error = ref<string | null>(null)

  async function listPorts() {
    try {
      const ports = await navigator.serial.getPorts()
      availablePorts.value = ports
    } catch (e) {
      error.value = 'Failed to list serial ports'
      console.error(e)
    }
  }

  async function connect(config: SerialConfig) {
    try {
      const newPort = await navigator.serial.requestPort()
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
      error.value = 'Failed to connect to serial port'
      console.error(e)
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
    port,
    availablePorts,
    isConnected,
    error,
    listPorts,
    connect,
    disconnect
  }
}