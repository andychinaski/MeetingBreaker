import Phaser from 'phaser';
import { BootScene } from '../scenes/BootScene';
import { GameScene } from '../scenes/GameScene';
import type { ControlScheme, UserSettings } from '../../services/storageService';
import { SETTINGS_REGISTRY_KEY } from '../../services/storageService';
import { LEVEL_REGISTRY_KEY, MODE_REGISTRY_KEY, TUTORIAL_REGISTRY_KEY, type GameModeId } from '../types/mode';
import { GAME_THEME_REGISTRY_KEY, getGameTheme } from './theme';
import { CONTROL_SCHEME_REGISTRY_KEY } from '../input/InputController';

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export function createGameConfig(
  parent: HTMLElement,
  settings?: UserSettings,
  mode: GameModeId = 'campaign',
  tutorial = false,
  levelId = 'calendar-overload',
  controlScheme: ControlScheme = 'keyboard',
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: settings ? getGameTheme(settings.theme).canvasCss : '#101827',
    transparent: true,
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scene: [BootScene, GameScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
      antialias: true,
      pixelArt: false,
    },
    callbacks: {
      preBoot: (game) => {
        if (settings) game.registry.set(SETTINGS_REGISTRY_KEY, settings);
        game.registry.set(GAME_THEME_REGISTRY_KEY, settings?.theme ?? 'dark');
        game.registry.set(MODE_REGISTRY_KEY, mode);
        game.registry.set(TUTORIAL_REGISTRY_KEY, tutorial);
        game.registry.set(LEVEL_REGISTRY_KEY, levelId);
        game.registry.set(CONTROL_SCHEME_REGISTRY_KEY, controlScheme);
      },
    },
  };
}
