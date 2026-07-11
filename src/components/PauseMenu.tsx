import styles from './GameHud.module.css';

interface PauseMenuProps {
  onResume: () => void;
  onRestart: () => void;
  onExit: () => void;
}

export function PauseMenu({ onResume, onRestart, onExit }: PauseMenuProps) {
  return (
    <div className={styles.resultBackdrop} role="dialog" aria-modal="true">
      <section className={styles.pauseCard}>
        <p className={styles.resultEyebrow}>Фокус сохранён</p>
        <h2>Пауза</h2>
        <p className={styles.pauseDescription}>
          Задача и все рабочие таймеры остановлены.
        </p>
        <div className={styles.pauseActions}>
          <button type="button" className={styles.primaryButton} onClick={onResume}>
            Продолжить
          </button>
          <button type="button" className={styles.secondaryButton} onClick={onRestart}>
            Начать заново
          </button>
          <button type="button" className={styles.secondaryButton} onClick={onExit}>
            Закончить рабочий день
          </button>
        </div>
        <p className={styles.pauseHint}>Esc — продолжить · R — начать заново</p>
      </section>
    </div>
  );
}
