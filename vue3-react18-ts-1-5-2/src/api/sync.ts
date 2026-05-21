import type { SyncMessage } from '../types';

const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('meal-revenue-sync') : null;
const localEmitter = new EventTarget();

export const publishSync = (message: Omit<SyncMessage, 'at'>): void => {
  const payload: SyncMessage = { ...message, at: new Date().toISOString() };
  localEmitter.dispatchEvent(new CustomEvent<SyncMessage>('sync', { detail: payload }));
  channel?.postMessage(payload);
};

export const subscribeSync = (listener: (message: SyncMessage) => void): (() => void) => {
  const localHandler = (event: Event) => {
    listener((event as CustomEvent<SyncMessage>).detail);
  };
  const channelHandler = (event: MessageEvent<SyncMessage>) => listener(event.data);

  localEmitter.addEventListener('sync', localHandler);
  channel?.addEventListener('message', channelHandler);

  return () => {
    localEmitter.removeEventListener('sync', localHandler);
    channel?.removeEventListener('message', channelHandler);
  };
};
