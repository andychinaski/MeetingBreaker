import styles from './GameHud.module.css';
import type { Language } from '../services/storageService';
import { t } from '../services/i18n';

interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onExit: () => void;
  language?: Language;
}

export function PauseMenu({ onResume, onRestart, onExit, language = 'ru' }: PauseMenuProps) {
  return (
    <div className={styles.resultBackdrop} role="dialog" aria-modal="true">
      <section className={styles.pauseCard}>
        <p className={styles.resultEyebrow}>{t(language, 'pause.saved')}</p>
        <h2>{t(language, 'game.pause')}</h2>
        <p className={styles.pauseDescription}>
          {t(language, 'pause.description')}
        </p>
        <div className={styles.pauseActions}>
          <button type="button" className={styles.primaryButton} onClick={onResume}>
            {t(language, 'common.continue')}
          </button>
          <button type="button" className={styles.secondaryButton} onClick={onRestart}>
            {t(language, 'pause.restart')}
          </button>
          <button type="button" className={styles.secondaryButton} onClick={onExit}>
            {t(language, 'pause.exit')}
          </button>
        </div>
        <p className={styles.pauseHint}>{t(language, 'pause.hint')}</p>
      </section>
    </div>
  );
}
