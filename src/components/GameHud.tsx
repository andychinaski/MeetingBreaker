import { useEffect, useRef, useState } from 'react';
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
  type WaveChangedPayload,
} from '../game/events/gameEvents';
import { formatFreedTime } from '../game/systems/ScoreSystem';
import type { GameState, LevelResult } from '../game/types/game';
import {
  GameResultOverlay,
  type GameOutcome,
} from './GameResultOverlay';
import { PauseMenu } from './PauseMenu';
import styles from './GameHud.module.css';
import type { GameModeId } from '../game/types/mode';
import type { Language } from '../services/storageService';
import { t } from '../services/i18n';
import { getHudConfig } from '../game/systems/hudConfig';
import type { GameBridge } from './GameBridge';

interface GameHudProps {
  bridge: GameBridge;
  onExitToMenu: () => void;
  onLevelResult: (result: LevelResult) => void;
  onNextLevel: () => void;
  mode: GameModeId;
  language: Language;
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
  coffeeEnabled: boolean;
  wave: number;
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
  activeBonus: '',
  coffeeEnabled: true,
  wave: 1,
};

export function GameHud({
  bridge,
  onExitToMenu,
  onLevelResult,
  onNextLevel,
  mode,
  language,
}: GameHudProps) {
  const hudConfig = getHudConfig(mode);
  const [hud, setHud] = useState(() => ({ ...INITIAL_HUD_STATE, activeBonus: t(language, 'game.none') }));
  const [notice, setNotice] = useState<string | null>(null);
  const [resultState, setResultState] = useState<ResultState | null>(null);
  const [paused, setPaused] = useState(false);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const registryState = bridge.getRegistry<GameState>(
      GAME_STATE_REGISTRY_KEY,
    );

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
        activeBonus: t(language, 'game.none'),
        coffeeEnabled: payload.coffeeEnabled ?? true,
        wave: payload.wave,
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
      setHud((current) => ({
        ...current,
        activeBonus:
          payload.activePowerUps.length > 0
            ? payload.activePowerUps.join(', ')
            : payload.title,
      }));
    };
    const handlePause = (payload: PauseChangedPayload) => {
      setPaused(payload.paused);
    };
    const handleWave = (payload: WaveChangedPayload) => setHud((current) => ({ ...current, wave: payload.wave }));
    const handleVictory = (payload: LevelCompletedPayload) => {
      setResultState({ outcome: 'victory', result: payload.result });
      onLevelResult(payload.result);
    };
    const handleDefeat = (payload: GameOverPayload) => {
      setResultState({ outcome: 'defeat', result: payload.result });
      onLevelResult(payload.result);
    };

    bridge.on(GAME_EVENTS.GAME_STARTED, handleStarted);
    bridge.on(GAME_EVENTS.SCORE_CHANGED, handleScore);
    bridge.on(GAME_EVENTS.COFFEE_CHANGED, handleCoffee);
    bridge.on(GAME_EVENTS.COFFEE_CONSUMED, handleCoffeeConsumed);
    bridge.on(GAME_EVENTS.POWER_UP_ACTIVATED, handlePowerUp);
    bridge.on(GAME_EVENTS.PAUSE_CHANGED, handlePause);
    bridge.on(GAME_EVENTS.LEVEL_COMPLETED, handleVictory);
    bridge.on(GAME_EVENTS.GAME_OVER, handleDefeat);
    bridge.on(GAME_EVENTS.WAVE_CHANGED, handleWave);

    return () => {
      bridge.off(GAME_EVENTS.GAME_STARTED, handleStarted);
      bridge.off(GAME_EVENTS.SCORE_CHANGED, handleScore);
      bridge.off(GAME_EVENTS.COFFEE_CHANGED, handleCoffee);
      bridge.off(GAME_EVENTS.COFFEE_CONSUMED, handleCoffeeConsumed);
      bridge.off(GAME_EVENTS.POWER_UP_ACTIVATED, handlePowerUp);
      bridge.off(GAME_EVENTS.PAUSE_CHANGED, handlePause);
      bridge.off(GAME_EVENTS.LEVEL_COMPLETED, handleVictory);
      bridge.off(GAME_EVENTS.GAME_OVER, handleDefeat);
      bridge.off(GAME_EVENTS.WAVE_CHANGED, handleWave);

      if (noticeTimer.current) {
        clearTimeout(noticeTimer.current);
      }
    };
  }, [bridge, language, onLevelResult]);

  const restartLevel = () => {
    bridge.emit(GAME_COMMANDS.RESTART_LEVEL);
  };

  const togglePause = () => {
    bridge.emit(GAME_COMMANDS.TOGGLE_PAUSE);
  };

  return (
    <>
      <aside className={styles.hud} aria-label={t(language, 'game.statsAria')}>
        <div className={styles.levelChip}>
          <span>{t(language, hudConfig.context === 'level' ? 'game.level' : 'game.wave')}</span>
          <strong>{hudConfig.context === 'level' ? hud.levelTitle : hud.wave}</strong>
        </div>
        <div className={styles.statChip} data-tutorial-anchor="score">
          <span>{t(language, 'game.score')}</span>
          <strong>{hud.score.toLocaleString(language === 'ru' ? 'ru-RU' : 'en-US')}</strong>
        </div>
        <div className={styles.statChip}>
          <span>{t(language, 'game.freedTime')}</span>
          <strong>{formatFreedTime(hud.freedMinutes, language)}</strong>
        </div>
        <div className={styles.statChip}>
          <span>{t(language, 'game.combo')}</span>
          <strong>
            ×{hud.combo} · {hud.multiplier.toFixed(2)}
          </strong>
        </div>
        {hudConfig.showCoffee && hud.coffeeEnabled && <div className={styles.statChip} data-tutorial-anchor="coffee">
          <span>{t(language, 'game.coffee')}</span>
          <strong aria-label={`${t(language, 'game.coffee')}: ${hud.coffeeCups}`}>
            {hud.coffeeCups > 0 ? '☕'.repeat(hud.coffeeCups) : '—'}
          </strong>
        </div>}
        <div className={styles.statChip} data-tutorial-anchor="bonus">
          <span>{t(language, 'game.bonus')}</span>
          <strong>{hud.activeBonus}</strong>
        </div>
        <button
          type="button"
          className={styles.pauseButton}
          data-tutorial-anchor="pause"
          onClick={togglePause}
        >
          {t(language, paused ? 'common.continue' : 'game.pause')}
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
          onNextLevel={onNextLevel}
          language={language}
        />
      )}

      {paused && !resultState && (
        <PauseMenu
          onResume={togglePause}
          onRestart={restartLevel}
          onExit={onExitToMenu}
          language={language}
        />
      )}
    </>
  );
}
