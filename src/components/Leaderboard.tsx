import type { GameModeId } from '../game/types/mode';
import type { Language, LeaderboardEntry } from '../services/storageService';
import { Modal } from './Modal';
import styles from './SettingsModal.module.css';
import { t } from '../services/i18n';

export function Leaderboard({ entries, onClear, onClose, language }: { entries: LeaderboardEntry[]; onClear: () => void; onClose: () => void; language: Language }) {
  const tabs: GameModeId[] = ['campaign', 'relax', 'hard'];
  const ranked = (mode: GameModeId) => entries.filter((entry) => entry.mode === mode).sort((a, b) => mode === 'relax' ? b.freedMinutes - a.freedMinutes || b.durationSeconds - a.durationSeconds : b.score - a.score).slice(0, 10);
  return <Modal title={t(language, 'leaderboard.title')} closeLabel={t(language, 'common.close')} onClose={onClose}>
    <p className={styles.kicker}>{t(language, 'leaderboard.local')}</p>
    {tabs.map((mode) => <section key={mode}><h3>{mode === 'campaign' ? t(language, 'modes.campaign.title') : mode === 'relax' ? 'Relax' : 'Hard'}</h3><ol>{ranked(mode).map((entry) => <li key={entry.id}>{entry.playerName} — {entry.score.toLocaleString(language === 'ru' ? 'ru-RU' : 'en-US')} · {entry.freedMinutes} {t(language, 'leaderboard.minutes')} · {entry.durationSeconds} {t(language, 'leaderboard.seconds')}</li>)}</ol></section>)}
    {entries.length === 0 && <p>{t(language, 'leaderboard.empty')}</p>}
    <div className={styles.actions}><button type="button" className={styles.secondary} onClick={onClear}>{t(language, 'leaderboard.clear')}</button></div>
  </Modal>;
}
