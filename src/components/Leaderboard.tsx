import type { GameModeId } from '../game/types/mode';
import type { LeaderboardEntry } from '../services/storageService';
import { Modal } from './Modal';
import styles from './SettingsModal.module.css';

export function Leaderboard({ entries, onClear, onClose }: { entries: LeaderboardEntry[]; onClear: () => void; onClose: () => void }) {
  const tabs: GameModeId[] = ['campaign', 'relax', 'hard'];
  const ranked = (mode: GameModeId) => entries.filter((entry) => entry.mode === mode).sort((a, b) => mode === 'relax' ? b.freedMinutes - a.freedMinutes || b.durationSeconds - a.durationSeconds : b.score - a.score).slice(0, 10);
  return <Modal title="Локальная таблица лидеров" onClose={onClose}>
    <p className={styles.kicker}>Только на этом устройстве</p>
    {tabs.map((mode) => <section key={mode}><h3>{mode === 'campaign' ? 'Прохождение' : mode === 'relax' ? 'Relax' : 'Hard'}</h3><ol>{ranked(mode).map((entry) => <li key={entry.id}>{entry.playerName} — {entry.score.toLocaleString('ru-RU')} · {entry.freedMinutes} мин · {entry.durationSeconds} сек</li>)}</ol></section>)}
    {entries.length === 0 && <p>Результатов пока нет.</p>}
    <div className={styles.actions}><button type="button" className={styles.secondary} onClick={onClear}>Очистить результаты</button></div>
  </Modal>;
}
