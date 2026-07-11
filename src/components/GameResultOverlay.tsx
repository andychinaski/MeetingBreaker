import type { LevelResult } from '../game/types/game';
import { formatFreedTime } from '../game/systems/ScoreSystem';
import styles from './GameHud.module.css';

export type GameOutcome = 'victory' | 'defeat';

interface GameResultOverlayProps {
  outcome: GameOutcome;
  result: LevelResult;
  onRestart: () => void;
  onExit: () => void;
}

export function GameResultOverlay({
  outcome,
  result,
  onRestart,
  onExit,
}: GameResultOverlayProps) {
  const victory = outcome === 'victory';

  return (
    <div className={styles.resultBackdrop} role="dialog" aria-modal="true">
      <section className={styles.resultCard}>
        <p className={styles.resultEyebrow}>
          {victory ? 'Неделя под контролем' : 'Рабочий день завершён'}
        </p>
        <h2>{victory ? 'Рабочий день спасён' : 'Кофе закончился'}</h2>
        {!victory && <p className={styles.defeatMessage}>Встречи победили.</p>}

        {victory && (
          <dl className={styles.resultStats}>
            <div>
              <dt>Очки</dt>
              <dd>{result.score.toLocaleString('ru-RU')}</dd>
            </div>
            <div>
              <dt>Встреч уничтожено</dt>
              <dd>{result.destroyedMeetings}</dd>
            </div>
            <div>
              <dt>Свободное время</dt>
              <dd>{formatFreedTime(result.freedMinutes)}</dd>
            </div>
            <div>
              <dt>Максимальное комбо</dt>
              <dd>×{result.maxCombo}</dd>
            </div>
            <div>
              <dt>Потрачено кофе</dt>
              <dd>{result.coffeeSpent}</dd>
            </div>
          </dl>
        )}

        {victory && <p className={styles.rating}>{result.rating}</p>}

        <div className={styles.resultActions}>
          <button type="button" className={styles.primaryButton} onClick={onRestart}>
            {victory ? 'Сыграть ещё раз' : 'Заварить заново'}
          </button>
          <button type="button" className={styles.secondaryButton} onClick={onExit}>
            Закончить рабочий день
          </button>
        </div>
      </section>
    </div>
  );
}
