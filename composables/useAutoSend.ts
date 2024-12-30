import { ref } from 'vue';
import type { AutoSendConfig } from '~/types/serial';

export function useAutoSend() {
  const config = ref<AutoSendConfig>({
    enabled: false,
    interval: 1000,
    content: '',
    format: 'ASCII'
  });
  
  let interval: NodeJS.Timeout | null = null;

  function start(callback: () => Promise<void>) {
    if (config.value.enabled && !interval) {
      interval = setInterval(callback, config.value.interval);
    }
  }

  function stop() {
    if (interval) {
      clearInterval(interval);
      interval = null;
    }
  }

  return {
    config,
    start,
    stop
  };
}