import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { createGameConfig } from '../game/config/gameConfig';
import { GameHud } from './GameHud';
import styles from './GameCanvas.module.css';

export function GameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [game, setGame] = useState<Phaser.Game | null>(null);
  const [inMenu, setInMenu] = useState(false);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const game = new Phaser.Game(createGameConfig(container));
    setGame(game);

    return () => {
      game.destroy(true);
      setGame(null);
    };
  }, []);

  const exitToMenu = () => {
    if (!game) {
      return;
    }

    game.scene.stop('GameScene');
    setInMenu(true);
  };

  const startFromMenu = () => {
    if (!game) {
      return;
    }

    setInMenu(false);
    game.scene.start('GameScene');
  };

  return (
    <section className={styles.gameFrame} aria-label="Игровое поле">
      <div ref={containerRef} className={styles.canvasContainer} />
      {game && !inMenu && <GameHud game={game} onExitToMenu={exitToMenu} />}
      {inMenu && (
        <div className={styles.exitMenu}>
          <p>Рабочий день завершён</p>
          <h2>Meeting Breaker</h2>
          <button type="button" onClick={startFromMenu}>
            Начать работу
          </button>
        </div>
      )}
      <div className={styles.statusBar}>
        <span>A / D или ← / → · движение</span>
        <span>Space или клик · запуск задачи</span>
      </div>
    </section>
  );
}
