export interface SerialConfig {
  portId: string;
  baudRate: number;
  dataBits: 7 | 8;
  stopBits: 1 | 2;
  parity: 'none' | 'even' | 'odd';
}

export interface SerialMessage {
  id: string;
  timestamp: number;
  data: string;
  direction: 'received' | 'sent';
  format: 'HEX' | 'ASCII';
}

export interface QuickCommand {
  id: string;
  name: string;
  command: string;
  format: 'HEX' | 'ASCII';
}

export interface LogConfig {
  maxSize: number;
  autoScroll: boolean;
  showTimestamp: boolean;
}

export interface SendConfig {
  autoNewline: boolean;
}