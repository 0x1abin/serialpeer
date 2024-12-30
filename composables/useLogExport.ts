import { saveAs } from 'file-saver';
import type { SerialMessage } from '~/types/serial';

export function useLogExport() {
  function exportLogs(messages: SerialMessage[], format: 'txt' | 'csv') {
    const content = format === 'csv' ? generateCSV(messages) : generateTXT(messages);
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const filename = `serial-logs-${new Date().toISOString()}.${format}`;
    saveAs(blob, filename);
  }

  function generateCSV(messages: SerialMessage[]): string {
    const header = 'Timestamp,Direction,Format,Data\n';
    const rows = messages.map(msg => {
      const timestamp = new Date(msg.timestamp).toISOString();
      return `${timestamp},${msg.direction},${msg.format},"${msg.data}"`;
    });
    return header + rows.join('\n');
  }

  function generateTXT(messages: SerialMessage[]): string {
    return messages.map(msg => {
      const timestamp = new Date(msg.timestamp).toISOString();
      return `[${timestamp}] ${msg.direction.toUpperCase()} (${msg.format}): ${msg.data}`;
    }).join('\n');
  }

  return {
    exportLogs
  };
}