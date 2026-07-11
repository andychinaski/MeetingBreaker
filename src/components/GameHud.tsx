import { useEffect, useRef, useState } from 'react';
import type Phaser from 'phaser';
import { DEFAULT_LEVEL } from '../data/levels';
import {
  GAME_COMMANDS,
  GAME_EVENTS,
  GAME_STATE_REGISTRY_KEY,
  type CoffeeChangedPayload,
  type CoffeeConsumedPayload,
  type GameOverPayload,
  type GameStartedPayload,
  type LevelCompletedPayload,
  type PauseChangedPayload,
  type PowerUpActivatedPayload,
  type ScoreChangedPayload,
} from '../game/events/gameEvents';
import { formatFreedTime } from '../game/systems/ScoreSystem';
import type { GameState, LevelResult } from '../game/types/game';
import {
  GameResultOverlay,
  type GameOutcome,
} from './GameResultOverlay';
import { PauseMenu } from './PauseMenu';
import styles from './GameHud.module.css';

interface GameHudProps {
  game: Phaser.Game;
  onExitToMenu: () => void;
}

interface HudState {
  levelTitle: string;
  score: number;
  freedMinutes: number;
  combo: number;
  multiplier: number;
  coffeeCups: number;
  initialCoffeeCups: number;
  activeBonus: string;
}

interface ResultState {
  outcome: GameOutcome;
  result: LevelResult;
}

const INITIAL_HUD_STATE: HudState = {
  levelTitle: DEFAULT_LEVEL.title,
  score: 0,
  freedMinutes: 0,
  combo: 0,
  multiplier: 1,
  coffeeCups: DEFAULT_LEVEL.initialCoffeeCups,
  initialCoffeeCups: DEFAULT_LEVEL.initialCoffeeCups,
  activeBonus: 'Нет',
};

export function GameHud({ game, onExitToMenu }: GameHudProps) {
  const [hud, setHud] = useState(INITIAL_HUD_STATE);
  const [notice, setNotice] = useState<string | null>(null);
  const [resultState, setResultState] = useState<ResultState | null>(null);
  const [paused, setPaused] = useState(false);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const registryState = game.registry.get(
      GAME_STATE_REGISTRY_KEY,
    ) as GameState | undefined;

    if (registryState) {
      setHud((current) => ({
        ...current,
        ...registryState,
      }));
      setPaused(registryState.status === 'paused');
    }

    const handleStarted = (payload: GameStartedPayload) => {
      setHud({
        levelTitle: payload.levelTitle,
        ...payload.score,
        coffeeCups: payload.coffeeCups,
        initialCoffeeCups: payload.initialCoffeeCups,
        activeBonus: 'Нет',
      });
      setNotice(null);
      setResultState(null);
      setPaused(false);
    };
    const handleScore = (payload: ScoreChangedPayload) => {
      setHud((current) => ({ ...current, ...payload }));
    };
    const handleCoffee = (payload: CoffeeChangedPayload) => {
      setHud((current) => ({ ...current, ...payload }));
    };
    const handleCoffeeConsumed = (payload: CoffeeConsumedPayload) => {
      setNotice(payload.message);

      if (noticeTimer.current) {
        clearTimeout(noticeTimer.current);
      }
      noticeTimer.current = setTimeout(() => setNotice(null), 1_800);
    };
    const handlePowerUp = (payload: PowerUpActivatedPayload) => {
      setHud((current) => ({ ...current, activeBonus: payload.title }));
    };
    const handlePause = (payload: PauseChangedPayload) => {
      setPaused(payload.paused);
    };
    const handleVictory = (payload: LevelCompletedPayload) => {
      setResultState({ outcome: 'victory', result: payload.result });
    };
    const handleDefeat = (payload: GameOverPayload) => {
      setResultState({ outcome: 'defeat', result: payload.result });
    };

    game.events.on(GAME_EVENTS.GAME_STARTED, handleStarted);
    game.events.on(GAME_EVENTS.SCORE_CHANGED, handleScore);
    game.events.on(GAME_EVENTS.COFFEE_CHANGED, handleCoffee);
    game.events.on(GAME_EVENTS.COFFEE_CONSUMED, handleCoffeeConsumed);
    game.events.on(GAME_EVENTS.POWER_UP_ACTIVATED, handlePowerUp);
    game.events.on(GAME_EVENTS.PAUSE_CHANGED, handlePause);
    game.events.on(GAME_EVENTS.LEVEL_COMPLETED, handleVictory);
    game.events.on(GAME_EVENTS.GAME_OVER, handleDefeat);

    return () => {
      game.events.off(GAME_EVENTS.GAME_STARTED, handleStarted);
      game.events.off(GAME_EVENTS.SCORE_CHANGED, handleScore);
      game.events.off(GAME_EVENTS.COFFEE_CHANGED, handleCoffee);
      game.events.off(GAME_EVENTS.COFFEE_CONSUMED, handleCoffeeConsumed);
      game.events.off(GAME_EVENTS.POWER_UP_ACTIVATED, handlePowerUp);
      game.events.off(GAME_EVENTS.PAUSE_CHANGED, handlePause);
      game.events.off(GAME_EVENTS.LEVEL_COMPLETED, handleVictory);
      game.events.off(GAME_EVENTS.GAME_OVER, handleDefeat);

      if (noticeTimer.current) {
        clearTimeout(noticeTimer.current);
      }
    };
  }, [game]);

  const restartLevel = () => {
    game.events.emit(GAME_COMMANDS.RESTART_LEVEL);
  };

  const togglePause = () => {
    game.events.emit(GAME_COMMANDS.TOGGLE_PAUSE);
  };

  return (
    <>
      <aside className={styles.hud} aria-label="Игровая статистика">
        <div className={styles.levelChip}>
          <span>Уровень</span>
          <strong>{hud.levelTitle}</strong>
        </div>
        <div className={styles.statChip}>
          <span>Очки</span>
          <strong>{hud.score.toLocaleString('ru-RU')}</strong>
        </div>
        <div className={styles.statChip}>
          <span>Свободно</span>
          <strong>{formatFreedTime(hud.freedMinutes)}</strong>
        </div>
        <div className={styles.statChip}>
          <span>Комбо</span>
          <strong>
            ×{hud.combo} · {hud.multiplier.toFixed(2)}
          </strong>
        </div>
        <div className={styles.statChip}>
          <span>Кофе</span>
          <strong aria-label={`${hud.coffeeCups} чашки кофе`}>
            {hud.coffeeCups > 0 ? '☕'.repeat(hud.coffeeCups) : '—'}
          </strong>
        </div>
        <div className={styles.statChip}>
          <span>Бонус</span>
          <strong>{hud.activeBonus}</strong>
        </div>
        <button
          type="button"
          className={styles.pauseButton}
          onClick={togglePause}
        >
          {paused ? 'Продолжить' : 'Пауза'}
        </button>
      </aside>

      {notice && (
        <div className={styles.coffeeNotice} role="status">
          {notice}
        </div>
      )}

      {resultState && (
        <GameResultOverlay
          outcome={resultState.outcome}
          result={resultState.result}
          onRestart={restartLevel}
          onExit={onExitToMenu}
        />
      )}

      {paused && !resultState && (
        <PauseMenu
          onResume={togglePause}
          onRestart={restartLevel}
          onExit={onExitToMenu}
        />
      )}
    </>
  );
}
