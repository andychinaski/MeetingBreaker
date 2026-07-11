import { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { createGameConfig } from '../game/config/gameConfig';
import { GameHud } from './GameHud';
import type { LevelResult } from '../game/types/game';
import {
  SETTINGS_REGISTRY_KEY,
  type UserSettings,
} from '../services/storageService';
import styles from './GameCanvas.module.css';

interface GameCanvasProps {
  settings: UserSettings;
  onExitToMenu: () => void;
  onLevelResult: (result: LevelResult) => void;
}

export function GameCanvas({
  settings,
  onExitToMenu,
  onLevelResult,
}: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialSettings = useRef(settings);
  const [game, setGame] = useState<Phaser.Game | null>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const game = new Phaser.Game(createGameConfig(container));
    game.registry.set(SETTINGS_REGISTRY_KEY, initialSettings.current);
    setGame(game);

    return () => {
      game.destroy(true);
      setGame(null);
    };
  }, []);

  useEffect(() => {
    game?.registry.set(SETTINGS_REGISTRY_KEY, settings);
  }, [game, settings]);

  return (
    <section className={styles.gameFrame} aria-label="Игровое поле">
      <div ref={containerRef} className={styles.canvasContainer} />
      {game && (
        <GameHud
          game={game}
          onExitToMenu={onExitToMenu}
          onLevelResult={onLevelResult}
        />
      )}
      <div className={styles.statusBar}>
        <span>A / D или ← / → · движение</span>
        <span>Space или клик · запуск задачи</span>
      </div>
    </section>
  );
}
