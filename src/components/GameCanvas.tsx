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
import type { ControlScheme } from '../services/storageService';
import { t } from '../services/i18n';
import { TutorialOverlay } from './TutorialOverlay';
import type { GameBridge } from './GameBridge';

interface GameCanvasProps {
  settings: UserSettings;
  mode: GameModeId;
  tutorial: boolean;
  levelId: string;
  onExitToMenu: () => void;
  onLevelResult: (result: LevelResult) => void;
  onNextLevel: () => void;
  controlScheme: ControlScheme;
  onTutorialComplete: () => void;
}

export function GameCanvas({
  settings,
  mode,
  tutorial,
  levelId,
  onExitToMenu,
  onLevelResult,
  onNextLevel,
  controlScheme,
  onTutorialComplete,
}: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialSettings = useRef(settings);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [bridge, setBridge] = useState<GameBridge | null>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const game = new Phaser.Game(createGameConfig(container, initialSettings.current, mode, tutorial, levelId, controlScheme));
    gameRef.current = game;
    setBridge({
      on: (event, listener) => { game.events.on(event, listener); },
      off: (event, listener) => { game.events.off(event, listener); },
      emit: (event, payload) => { game.events.emit(event, payload); },
      getRegistry: (key) => game.registry.get(key),
    });

    return () => {
      gameRef.current = null;
      setBridge(null);
      game.destroy(true);
    };
  }, [controlScheme, levelId, mode, tutorial]);

  useEffect(() => {
    const game = gameRef.current;
    if (!game || !bridge) return;
    game.registry.set(SETTINGS_REGISTRY_KEY, settings);
    game.registry.set(GAME_THEME_REGISTRY_KEY, settings.theme);
    game.events.emit(GAME_EVENTS.THEME_CHANGED, settings.theme);
  }, [bridge, settings]);

  return (
    <section className={styles.gameFrame} aria-label={t(settings.language, 'game.aria')}>
      {bridge && (
        <GameHud
          bridge={bridge}
          mode={mode}
          language={settings.language}
          onExitToMenu={onExitToMenu}
          onLevelResult={onLevelResult}
          onNextLevel={onNextLevel}
        />
      )}
      <div ref={containerRef} className={styles.canvasContainer} />
      {bridge && tutorial && <TutorialOverlay bridge={bridge} language={settings.language} controlScheme={controlScheme} onCompleted={onTutorialComplete} />}
      <div className={styles.statusBar}>
        {controlScheme === 'keyboard' ? <><span>{t(settings.language, 'game.keyboardMove')}</span><span>{t(settings.language, 'game.keyboardLaunch')}</span></> : <><span>{t(settings.language, 'game.mouseMove')}</span><span>{t(settings.language, 'game.mouseLaunch')}</span></>}
      </div>
    </section>
  );
}
