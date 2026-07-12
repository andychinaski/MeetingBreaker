import type { LevelResult } from '../game/types/game';
import { formatFreedTime } from '../game/systems/ScoreSystem';
import styles from './GameHud.module.css';
import type { Language } from '../services/storageService';
import { t } from '../services/i18n';

export type GameOutcome = 'victory' | 'defeat';

interface GameResultOverlayProps {
  outcome: GameOutcome;
  result: LevelResult;
  onRestart: () => void;
  onExit: () => void;
  onNextLevel?: () => void;
  language?: Language;
}

export function GameResultOverlay({
  outcome,
  result,
  onRestart,
  onExit,
  onNextLevel = onExit,
  language = 'ru',
}: GameResultOverlayProps) {
  const victory = outcome === 'victory';

  return (
    <div className={styles.resultBackdrop} role="dialog" aria-modal="true">
      <section className={styles.resultCard}>
        <p className={styles.resultEyebrow}>
          {t(language, victory ? 'result.victoryEyebrow' : 'result.defeatEyebrow')}
        </p>
        <h2>{t(language, victory ? 'result.victoryTitle' : 'result.defeatTitle')}</h2>
        {!victory && <p className={styles.defeatMessage}>{t(language, 'result.defeatMessage')}</p>}

        {victory && (
          <dl className={styles.resultStats}>
            <div>
              <dt>{t(language, 'game.score')}</dt>
              <dd>{result.score.toLocaleString(language === 'ru' ? 'ru-RU' : 'en-US')}</dd>
            </div>
            <div>
              <dt>{t(language, 'result.meetings')}</dt>
              <dd>{result.destroyedMeetings}</dd>
            </div>
            <div>
              <dt>{t(language, 'result.freed')}</dt>
              <dd>{formatFreedTime(result.freedMinutes, language)}</dd>
            </div>
            <div>
              <dt>{t(language, 'result.maxCombo')}</dt>
              <dd>×{result.maxCombo}</dd>
            </div>
            <div>
              <dt>{t(language, 'result.coffeeSpent')}</dt>
              <dd>{result.coffeeSpent}</dd>
            </div>
          </dl>
        )}

        {victory && <p className={styles.rating}>{result.rating}</p>}

        <div className={styles.resultActions}>
          <button type="button" className={victory ? styles.secondaryButton : styles.primaryButton} onClick={onRestart}>
            {t(language, victory ? 'result.playAgain' : 'result.retry')}
          </button>
          {victory ? <button type="button" className={styles.homeButton} aria-label={t(language, 'result.home')} title={t(language, 'result.home')} onClick={onExit}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10Z" /></svg></button> : null}
          {victory ? <button type="button" className={styles.primaryButton} onClick={onNextLevel}>{t(language, 'result.next')}</button> : <button type="button" className={styles.secondaryButton} onClick={onExit}>{t(language, 'pause.exit')}</button>}
        </div>
      </section>
    </div>
  );
}
