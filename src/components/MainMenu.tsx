import { formatFreedTime } from '../game/systems/ScoreSystem';
import type { PlayerProgress } from '../services/storageService';
import styles from './MainMenu.module.css';
import { t } from '../services/i18n';
import type { Language } from '../services/storageService';

interface MainMenuProps {
  progress: PlayerProgress;
  playerName: string | null;
  language: Language;
  onStart: () => void;
  onLeaderboard: () => void;
  onInfo: () => void;
  onOpenSettings: () => void;
}

export function MainMenu({
  progress,
  playerName,
  language,
  onStart,
  onOpenSettings,
  onLeaderboard,
  onInfo,
}: MainMenuProps) {
  return (
    <section className={styles.menuCard} aria-label={t(language, 'menu.aria')}>
      <div>
        <p className={styles.kicker}>{playerName ? `${t(language, 'menu.greeting')}, ${playerName}` : t(language, 'menu.weekPlan')}</p>
        <p className={styles.description}>
          {t(language, 'menu.description')}
        </p>
      </div>

      <dl className={styles.records}>
        <div>
          <dt>{t(language, 'menu.bestScore')}</dt>
          <dd>{progress.bestScore.toLocaleString(language === 'ru' ? 'ru-RU' : 'en-US')}</dd>
        </div>
        <div>
          <dt>{t(language, 'menu.maxFreed')}</dt>
          <dd>{formatFreedTime(progress.maxFreedMinutes, language)}</dd>
        </div>
      </dl>

      <div className={styles.menuActions}>
        <button type="button" className={styles.startButton} onClick={onStart}>
          {t(language, 'menu.play')}
        </button>
        <button type="button" className={styles.settingsButton} onClick={onLeaderboard}>{t(language, 'menu.leaderboard')}</button>
        <button
          type="button"
          className={styles.settingsButton}
          onClick={onOpenSettings}
        >
          {t(language, 'menu.settings')}
        </button>
        <button type="button" className={styles.settingsButton} onClick={onInfo}>{t(language, 'menu.info')}</button>
      </div>
    </section>
  );
}
