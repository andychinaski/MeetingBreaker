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
import type { GameModeId } from '../game/types/mode';
import { GAME_THEME_REGISTRY_KEY } from '../game/config/theme';
import { GAME_EVENTS } from '../game/events/gameEvents';

interface GameCanvasProps {
  settings: UserSettings;
  mode: GameModeId;
  tutorial: boolean;
  levelId: string;
  onExitToMenu: () => void;
  onLevelResult: (result: LevelResult) => void;
}

export function GameCanvas({
  settings,
  mode,
  tutorial,
  levelId,
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

    const game = new Phaser.Game(createGameConfig(container, initialSettings.current, mode, tutorial, levelId));
    setGame(game);

    return () => {
      game.destroy(true);
      setGame(null);
    };
  }, [levelId, mode, tutorial]);

  useEffect(() => {
    if (!game) return;
    game.registry.set(SETTINGS_REGISTRY_KEY, settings);
    game.registry.set(GAME_THEME_REGISTRY_KEY, settings.theme);
    game.events.emit(GAME_EVENTS.THEME_CHANGED, settings.theme);
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
