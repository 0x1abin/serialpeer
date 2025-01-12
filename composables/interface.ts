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
 * Timed command interface
 */
export interface TimedCommand {
  id: string;
  quickCommandId: string; // Associated QuickCommand ID
  interval: number;       // Interval in milliseconds
  isLoop: boolean;        // Whether to loop the command
  isActive: boolean;      // Whether the command is currently active
}

/**
 * Serial event interface
 */
export interface SerialEvent {
  key: string;
  data: any;
}