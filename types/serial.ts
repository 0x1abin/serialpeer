/**
 * Serial port configuration interface
 */
export interface SerialConfig {
  portId: string;
  baudRate: number;
  dataBits: 7 | 8;
  stopBits: 1 | 2;
  parity: 'none' | 'even' | 'odd';
}

/**
 * Serial message interface
 */
export interface SerialMessage {
  id: string;
  timestamp: number;
  data: string;
  direction: 'received' | 'sent';
  format: 'HEX' | 'ASCII' | 'RAW';
}

/**
 * Quick command interface
 */
export interface QuickCommand {
  id: string;
  name: string;
  command: string;
  format: 'ASCII' | 'HEX';
  addNewline: boolean;
}

/**
 * Log configuration interface
 */
export interface LogConfig {
  maxSize: number;
  autoScroll: boolean;
  showTimestamp: boolean;
}

/**
 * Send configuration interface
 */
export interface SendConfig {
  autoNewline: boolean;
}

/**
 * Timed command interface
 */
export interface TimedCommand {
  id: string;
  quickCommandId: string; // Associated QuickCommand ID
  interval: number;       // Interval in milliseconds
  isLoop: boolean;        // Whether to loop the command
  isActive: boolean;      // Whether the command is currently active
}