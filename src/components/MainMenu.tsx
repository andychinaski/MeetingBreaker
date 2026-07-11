import type { LevelConfig } from '../game/types/level';
import { formatFreedTime } from '../game/systems/ScoreSystem';
import type { PlayerProgress } from '../services/storageService';
import styles from './MainMenu.module.css';
import { t } from '../services/i18n';
import type { Language } from '../services/storageService';

interface MainMenuProps {
  levels: readonly LevelConfig[];
  selectedLevelId: string;
  progress: PlayerProgress;
  onSelectLevel: (levelId: string) => void;
  playerName: string | null;
  language: Language;
  onStart: () => void;
  onLeaderboard: () => void;
  onInfo: () => void;
  onOpenSettings: () => void;
}

export function MainMenu({
  levels,
  selectedLevelId,
  progress,
  playerName,
  language,
  onSelectLevel,
  onStart,
  onOpenSettings,
  onLeaderboard,
  onInfo,
}: MainMenuProps) {
  return (
    <section className={styles.menuCard} aria-label="Главное меню">
      <div>
        <p className={styles.kicker}>{playerName ? `Привет, ${playerName}` : 'План на неделю'}</p>
        <p className={styles.description}>
          Разбей все встречи и сохрани кофе до пятницы.
        </p>
      </div>

      <label className={styles.levelSelect}>
        <span>Уровень</span>
        <select
          value={selectedLevelId}
          onChange={(event) => onSelectLevel(event.target.value)}
        >
          {levels.map((level) => (
            <option
              key={level.id}
              value={level.id}
              disabled={!progress.unlockedLevelIds.includes(level.id)}
            >
              {level.title}
            </option>
          ))}
        </select>
      </label>

      <dl className={styles.records}>
        <div>
          <dt>Лучший результат</dt>
          <dd>{progress.bestScore.toLocaleString('ru-RU')}</dd>
        </div>
        <div>
          <dt>Максимум свободного времени</dt>
          <dd>{formatFreedTime(progress.maxFreedMinutes)}</dd>
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
