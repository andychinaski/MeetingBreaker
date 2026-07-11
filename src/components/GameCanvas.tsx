import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { createGameConfig } from '../game/config/gameConfig';
import styles from './GameCanvas.module.css';

export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const game = new Phaser.Game(createGameConfig(container));

    return () => {
      game.destroy(true);
    };
  }, []);

  return (
    <section className={styles.gameFrame} aria-label="Игровое поле">
      <div ref={containerRef} className={styles.canvasContainer} />
      <div className={styles.statusBar}>
        <span>A / D или ← / → · движение</span>
        <span>Space или клик · запуск задачи</span>
      </div>
    </section>
  );
}
