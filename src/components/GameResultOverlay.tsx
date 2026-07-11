import type { LevelResult } from '../game/types/game';
import { formatFreedTime } from '../game/systems/ScoreSystem';
import styles from './GameHud.module.css';

export type GameOutcome = 'victory' | 'defeat';

interface GameResultOverlayProps {
  outcome: GameOutcome;
  result: LevelResult;
  onRestart: () => void;
  onExit: () => void;
  onNextLevel?: () => void;
}

export function GameResultOverlay({
  outcome,
  result,
  onRestart,
  onExit,
  onNextLevel = onExit,
}: GameResultOverlayProps) {
  const victory = outcome === 'victory';

  return (
    <div className={styles.resultBackdrop} role="dialog" aria-modal="true">
      <section className={styles.resultCard}>
        <p className={styles.resultEyebrow}>
          {victory ? 'Неделя под контролем' : 'Рабочая неделя завершена'}
        </p>
        <h2>{victory ? 'Рабочая неделя спасена' : 'Кофе закончился'}</h2>
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
          <button type="button" className={victory ? styles.secondaryButton : styles.primaryButton} onClick={onRestart}>
            {victory ? 'Сыграть еще' : 'Заварить заново'}
          </button>
          {victory ? <button type="button" className={styles.homeButton} aria-label="В главное меню" title="В главное меню" onClick={onExit}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z" /></svg></button> : null}
          {victory ? <button type="button" className={styles.primaryButton} onClick={onNextLevel}>Идем дальше</button> : <button type="button" className={styles.secondaryButton} onClick={onExit}>Закончить рабочую неделю</button>}
        </div>
      </section>
    </div>
  );
}
