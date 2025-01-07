import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import type { ITerminalOptions } from '@xterm/xterm'

interface TerminalConfig extends ITerminalOptions {
  scrollback?: number
  fontSize?: number
  fontFamily?: string
}

const defaultConfig: TerminalConfig = {
  fontSize: 14,
  fontFamily: 'Consolas, Monaco, monospace',
  theme: {
    background: 'var(--b3)',
    foreground: 'var(--bc)',
    cursor: 'var(--bc)',
    black: '#000000',
    red: '#FF0000',
    green: '#00FF00',
    yellow: '#FFFF00',
    blue: '#0000FF',
    magenta: '#FF00FF',
    cyan: '#00FFFF',
    white: '#FFFFFF',
  },
  cursorBlink: true,
  scrollback: 5000,
  convertEol: true
}

export function useTerminal(config: Partial<TerminalConfig> = {}) {
  const terminal = ref<Terminal | null>(null)
  const fitAddon = ref<FitAddon | null>(null)

  const initTerminal = (container: HTMLElement) => {
    const terminalConfig = { ...defaultConfig, ...config }
    
    terminal.value = new Terminal(terminalConfig)
    fitAddon.value = new FitAddon()
    
    terminal.value.loadAddon(fitAddon.value)
    terminal.value.loadAddon(new WebLinksAddon())

    terminal.value.open(container)
    fitAddon.value.fit()
  }

  const write = (data: string) => {
    terminal.value?.write(data)
  }

  const clear = () => {
    terminal.value?.clear()
  }

  const handleResize = () => {
    fitAddon.value?.fit()
  }

  const dispose = () => {
    terminal.value?.dispose()
  }

  return {
    terminal,
    fitAddon,
    initTerminal,
    write,
    clear,
    handleResize,
    dispose
  }
} 