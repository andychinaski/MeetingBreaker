import type { LevelConfig } from '../game/types/level';
import { formatFreedTime } from '../game/systems/ScoreSystem';
import type { PlayerProgress } from '../services/storageService';
import styles from './MainMenu.module.css';

interface MainMenuProps {
  levels: readonly LevelConfig[];
  selectedLevelId: string;
  progress: PlayerProgress;
  onSelectLevel: (levelId: string) => void;
  onStart: () => void;
  onOpenSettings: () => void;
}

export function MainMenu({
  levels,
  selectedLevelId,
  progress,
  onSelectLevel,
  onStart,
  onOpenSettings,
}: MainMenuProps) {
  return (
    <section className={styles.menuCard} aria-label="Главное меню">
      <div>
        <p className={styles.kicker}>План на неделю</p>
        <h2>Освободи время для настоящей работы</h2>
        <p className={styles.description}>
          Разбивай встречи, удерживай фокус и береги кофе.
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

      <div className={styles.actions}>
        <button type="button" className={styles.startButton} onClick={onStart}>
          Начать работу
        </button>
        <button
          type="button"
          className={styles.settingsButton}
          onClick={onOpenSettings}
        >
          Настройки
        </button>
      </div>
    </section>
  );
}
