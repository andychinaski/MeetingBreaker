export interface GameBridge {
  on<T>(event: string, listener: (payload: T) => void): void;
  off<T>(event: string, listener: (payload: T) => void): void;
  emit(event: string, payload?: unknown): void;
  getRegistry<T>(key: string): T | undefined;
}
