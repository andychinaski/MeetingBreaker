import Phaser from 'phaser';
import { DEFAULT_LEVEL, LEVELS, TUTORIAL_LEVEL } from '../../data/levels';
import { getMeetingType } from '../../data/meetingTypes';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import {
  BALL_RADIUS,
  BALL_RESET_DELAY_MS,
  PADDLE_SPEED,
  PADDLE_Y,
  WORLD_PADDING,
} from '../config/gameplay';
import { Ball } from '../objects/Ball';
import { CalendarGrid } from '../objects/CalendarGrid';
import { MeetingBlock } from '../objects/MeetingBlock';
import { Paddle } from '../objects/Paddle';
import { PowerUp } from '../objects/PowerUp';
import {
  GAME_COMMANDS,
  GAME_EVENTS,
  GAME_STATE_REGISTRY_KEY,
  TUTORIAL_STATE_REGISTRY_KEY,
  type CoffeeChangedPayload,
  type CoffeeConsumedPayload,
  type GameOverPayload,
  type GameStartedPayload,
  type LevelCompletedPayload,
  type MeetingDestroyedPayload,
  type MeetingBehaviorActionPayload,
  type PauseChangedPayload,
  type ScoreChangedPayload,
} from '../events/gameEvents';
import {
  accelerateVelocity,
  calculatePaddleBounce,
  hasRepeatingImpacts,
  INITIAL_BALL_SPEED,
  nudgeLoopingTrajectory,
  type HorizontalDirection,
} from '../systems/ballPhysics';
import {
  calculateMeetingRect,
  DEFAULT_CALENDAR_LAYOUT,
} from '../systems/calendarLayout';
import { CoffeeSystem } from '../systems/CoffeeSystem';
import { LevelProgress } from '../systems/LevelProgress';
import { ScoreSystem } from '../systems/ScoreSystem';
import { EndlessMeetingGenerator } from '../systems/EndlessMeetingGenerator';
import {
  ESPRESSO_DURATION_MS,
  PowerUpSystem,
} from '../systems/PowerUpSystem';
import type { GameState, GameStatus } from '../types/game';
import {
  POWER_UP_DEFINITIONS,
  POWER_UP_TYPES,
  type PowerUpType,
} from '../types/powerUp';
import { SoundSystem } from '../../services/SoundSystem';
import {
  DEFAULT_SETTINGS,
  SETTINGS_REGISTRY_KEY,
  type UserSettings,
  type Language,
  type ControlScheme,
} from '../../services/storageService';
import { GAME_MODES, LEVEL_REGISTRY_KEY, MODE_REGISTRY_KEY, TUTORIAL_REGISTRY_KEY, type GameModeConfig } from '../types/mode';
import type { MeetingBlockConfig, MeetingType, WorkDay } from '../types/meeting';
import type { LevelConfig } from '../types/level';
import { TutorialController, type TutorialEvent, type TutorialSpotlightRect, type TutorialTarget } from '../systems/TutorialController';
import { GAME_THEME_REGISTRY_KEY, getGameTheme, type GameTheme } from '../config/theme';
import {
  CONTROL_SCHEME_REGISTRY_KEY,
  createInputController,
} from '../input/InputController';
import { InputControllerManager } from '../input/InputControllerManager';
import { coffeeLossMessages, t, translateLevelTitle, translateMeetingTitle } from '../../services/i18n';

export class GameScene extends Phaser.Scene {
  private paddle!: Paddle;
  private ball!: Ball;
  private readonly activeBalls: Ball[] = [];
  private readonly powerUps: PowerUp[] = [];
  private readonly inputController = new InputControllerManager();
  private ballLaunched = false;
  private resettingBall = false;
  private launchDirection: HorizontalDirection = 1;
  private loopNudgeDirection: HorizontalDirection = 1;
  private readonly recentPaddleImpacts: number[] = [];
  private readonly meetingBlocks: MeetingBlock[] = [];
  private scoreSystem!: ScoreSystem;
  private coffeeSystem!: CoffeeSystem;
  private levelProgress!: LevelProgress;
  private powerUpSystem!: PowerUpSystem;
  private espressoTimer?: Phaser.Time.TimerEvent;
  private soundSystem!: SoundSystem;
  private gameStatus: GameStatus = 'idle';
  private mode: GameModeConfig = GAME_MODES.campaign;
  private level: LevelConfig = DEFAULT_LEVEL;
  private endlessGenerator?: EndlessMeetingGenerator;
  private waveTimer?: Phaser.Time.TimerEvent;
  private createdMeetingCount = 0;
  private wave = 1;
  private tutorialController?: TutorialController;
  private tutorialTransitionTimer?: number;
  private lastTutorialSpotlight?: TutorialSpotlightRect;
  private lastTutorialSpotlightStepId?: string;
  private sessionMeetings: MeetingBlockConfig[] = [];
  private calendarGrid?: CalendarGrid;
  private boundsGraphics?: Phaser.GameObjects.Graphics;
  private theme!: GameTheme;
  private language: Language = 'ru';

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.initializeGameState();
    this.drawBounds();
    this.configureWorld();
    this.createCalendar();
    this.createObjects();
    this.configureInput();
    this.configureCollisions();
    this.configureGameEvents();
    this.applyTheme(this.game.registry.get(GAME_THEME_REGISTRY_KEY) as UserSettings['theme'] | undefined ?? 'dark');

    this.setCanvasState('ready');
    this.publishGameStarted();
    if (this.tutorialController) this.publishTutorialStep();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanupScene, this);
  }

  update(_time: number, delta: number): void {
    if (this.gameStatus !== 'playing') {
      return;
    }

    this.inputController.update(delta);
    this.meetingBlocks.forEach((block) => block.updateBehavior(delta));
    if (this.mode.endless) this.scheduleEndlessWave();

    for (const powerUp of [...this.powerUps]) {
      powerUp.syncLabel();
      if (powerUp.y > GAME_HEIGHT + 30) {
        this.removePowerUp(powerUp);
      }
    }

    if (!this.ballLaunched) {
      if (!this.resettingBall) {
        this.ball.attachToPaddle(this.paddle);
      }
      return;
    }

    for (const ball of [...this.activeBalls]) {
      ball.setSafeVelocity(
        this.mode.ballAccelerationEnabled ? accelerateVelocity(ball.getVelocity(), delta / 1000) : ball.getVelocity(),
        this.launchDirection,
      );
      ball.syncLabel();

      if (ball.y - BALL_RADIUS > GAME_HEIGHT) {
        this.handleSingleBallLost(ball);
      }
    }

  }

  private configureWorld(): void {
    this.physics.resume();
    this.physics.world.setBounds(
      WORLD_PADDING,
      WORLD_PADDING,
      GAME_WIDTH - WORLD_PADDING * 2,
      GAME_HEIGHT,
    );
    this.physics.world.setBoundsCollision(true, true, true, false);
  }

  private createObjects(): void {
    this.paddle = new Paddle(this, GAME_WIDTH / 2, PADDLE_Y);
    this.ball = new Ball(this, GAME_WIDTH / 2, PADDLE_Y - 48);
    this.ball.resetOnPaddle(this.paddle);
    this.activeBalls.length = 0;
    this.activeBalls.push(this.ball);
  }

  private initializeGameState(): void {
    const modeId = this.game.registry.get(MODE_REGISTRY_KEY) as GameModeConfig['id'] | undefined;
    this.mode = GAME_MODES[modeId ?? 'campaign'];
    const tutorialEnabled = Boolean(this.game.registry.get(TUTORIAL_REGISTRY_KEY));
    this.language = ((this.game.registry.get(SETTINGS_REGISTRY_KEY) as UserSettings | undefined) ?? DEFAULT_SETTINGS).language;
    this.tutorialController = tutorialEnabled ? new TutorialController() : undefined;
    const levelId = this.game.registry.get(LEVEL_REGISTRY_KEY) as string | undefined;
    this.level = tutorialEnabled ? TUTORIAL_LEVEL : LEVELS.find((level) => level.id === levelId) ?? DEFAULT_LEVEL;
    this.endlessGenerator = this.mode.endless ? new EndlessMeetingGenerator(this.mode) : undefined;
    const generatedMeetings = this.endlessGenerator?.createWave([]).meetings;
    this.sessionMeetings = (generatedMeetings ?? this.level.meetings).map((meeting) => ({ ...meeting, title: translateMeetingTitle(this.language, meeting.typeId, getMeetingType(meeting.typeId).title) }));
    this.scoreSystem = new ScoreSystem(this.mode.scoreMultiplier);
    this.coffeeSystem = new CoffeeSystem(this.mode.coffeeEnabled ? (this.mode.initialCoffeeCups ?? this.level.initialCoffeeCups) : 1);
    this.levelProgress = new LevelProgress(
      this.sessionMeetings
        .filter((meeting) => meeting.required ?? true)
        .map((meeting) => meeting.id),
    );
    this.powerUpSystem = new PowerUpSystem();
    this.soundSystem = new SoundSystem(() =>
      (this.game.registry.get(SETTINGS_REGISTRY_KEY) as UserSettings | undefined) ??
      DEFAULT_SETTINGS,
    );
    this.powerUps.length = 0;
    this.createdMeetingCount = 0;
    this.wave = 1;
    this.gameStatus = 'playing';
  }

  private createCalendar(): void {
    this.meetingBlocks.length = 0;
    this.calendarGrid = new CalendarGrid(this, DEFAULT_CALENDAR_LAYOUT);

    for (const meetingConfig of this.sessionMeetings) {
      const meetingType = this.localizedMeetingType(meetingConfig.typeId);
      const rectangle = calculateMeetingRect(
        meetingConfig,
        DEFAULT_CALENDAR_LAYOUT,
      );
      this.meetingBlocks.push(
        new MeetingBlock(this, meetingConfig, meetingType, rectangle),
      );
      this.createdMeetingCount += 1;
    }

    this.game.canvas.dataset.calendarReady = 'true';
    this.game.canvas.dataset.meetingCount = this.meetingBlocks.length.toString();
    this.game.canvas.dataset.meetingLayout = this.sessionMeetings.map((meeting) => `${meeting.day}:${meeting.startMinutes}:${meeting.typeId}`).join('|');
    this.game.canvas.dataset.gameMode = this.mode.id;
    this.game.canvas.dataset.ballAcceleration = String(this.mode.ballAccelerationEnabled);
    this.game.canvas.dataset.coffeeEnabled = String(this.mode.coffeeEnabled);
    this.game.canvas.dataset.locale = this.language;
  }

  private localizedMeetingType(typeId: string): MeetingType {
    const type = getMeetingType(typeId);
    return {
      ...type,
      title: translateMeetingTitle(this.language, type.id, type.title),
      shortTitle: translateMeetingTitle(this.language, type.id, type.shortTitle, true),
    };
  }

  private configureInput(): void {
    const scheme = (this.game.registry.get(CONTROL_SCHEME_REGISTRY_KEY) as ControlScheme | undefined) ?? 'keyboard';
    this.inputController.use(createInputController(scheme, this, {
      moveBy: (distance) => this.movePaddleTo(this.paddle.x + distance),
      moveTo: (x) => this.movePaddleTo(x),
      launch: () => this.launchBall(),
    }, PADDLE_SPEED));
    this.game.canvas.dataset.controlScheme = scheme;
    window.addEventListener('keydown', this.handleWindowKeyDown);
  }

  private configureCollisions(): void {
    this.configureBallCollisions(this.ball);
  }

  private configureBallCollisions(ball: Ball): void {
    this.physics.add.collider(ball, this.paddle, () => {
      this.handlePaddleCollision(ball);
    });

    for (const meetingBlock of this.meetingBlocks) {
      this.configureMeetingCollision(ball, meetingBlock);
    }
  }

  private configureMeetingCollision(ball: Ball, meetingBlock: MeetingBlock): void {
    this.physics.add.collider(ball, meetingBlock.collisionZone, () => {
      const declineUsed = this.powerUpSystem.consumeDecline();
      const damage = meetingBlock.takeDamage(declineUsed ? meetingBlock.currentHp : 1);
      this.soundSystem.play(damage.destroyedNow ? 'destroy' : 'meeting');
      if (declineUsed) this.publishActivePowerUps();
    });
  }

  private scheduleEndlessWave(): void {
    if (this.waveTimer || !this.endlessGenerator || this.createdMeetingCount >= 100) return;
    const active = this.meetingBlocks.filter((block) => !block.destroyed);
    if (active.length > 5) return;
    this.game.canvas.dataset.waveWarning = 'true';
    this.waveTimer = this.time.delayedCall(3_000, () => {
      this.waveTimer = undefined;
      if (this.gameStatus !== 'playing' || !this.endlessGenerator) return;
      const occupied = this.meetingBlocks.filter((block) => !block.destroyed).map((block) => block.config);
      const wave = this.endlessGenerator.createWave(occupied);
      const configs = wave.meetings.slice(0, 100 - this.createdMeetingCount);
      this.levelProgress.addRequired(configs.map((config) => config.id));
      for (const config of configs) {
        const meetingType = this.localizedMeetingType(config.typeId);
        config.title = meetingType.title;
        const block = new MeetingBlock(this, config, meetingType, calculateMeetingRect(config, DEFAULT_CALENDAR_LAYOUT));
        this.meetingBlocks.push(block);
        this.activeBalls.forEach((ball) => this.configureMeetingCollision(ball, block));
        this.createdMeetingCount += 1;
      }
      this.game.canvas.dataset.wave = wave.wave.toString();
      this.wave = wave.wave;
      this.game.events.emit(GAME_EVENTS.WAVE_CHANGED, { wave: this.wave });
      this.game.canvas.dataset.waveWarning = 'false';
      this.game.canvas.dataset.meetingCount = this.meetingBlocks.filter((block) => !block.destroyed).length.toString();
    });
  }

  private configureGameEvents(): void {
    this.game.events.on(
      GAME_EVENTS.MEETING_DESTROYED,
      this.handleMeetingDestroyed,
      this,
    );
    this.game.events.on(
      GAME_COMMANDS.RESTART_LEVEL,
      this.handleRestartLevel,
      this,
    );
    this.game.events.on(
      GAME_COMMANDS.TOGGLE_PAUSE,
      this.handleTogglePause,
      this,
    );
    this.game.events.on(GAME_EVENTS.MEETING_BEHAVIOR_ACTION, this.handleBehaviorAction, this);
    this.game.events.on(GAME_EVENTS.THEME_CHANGED, this.applyTheme, this);
    this.game.events.on(GAME_COMMANDS.TUTORIAL_CONTINUE, this.handleTutorialContinue, this);
    this.game.events.on(GAME_COMMANDS.TUTORIAL_SKIP, this.handleTutorialSkip, this);
  }

  private readonly handleBehaviorAction = (payload: MeetingBehaviorActionPayload): void => {
    if (this.gameStatus !== 'playing') return;
    if (payload.action === 'accelerate-ball') {
      this.activeBalls.forEach((ball) => ball.setSafeVelocity(accelerateVelocity(ball.getVelocity(), Number(payload.config.acceleration ?? 1.12) - 1)));
      return;
    }
    const source = this.meetingBlocks.find((block) => block.config.id === payload.meetingId);
    if (!source) return;
    if (payload.action === 'spawn-recurring') {
      this.spawnBehaviorMeetings(source.config.typeId, 1, source.config.generation === undefined ? 1 : source.config.generation + 1, 0.5);
    } else if (payload.action === 'spawn-children') {
      const minimum = Number(payload.config.minChildren ?? 2);
      const maximum = Number(payload.config.maxChildren ?? minimum);
      const count = Phaser.Math.Between(minimum, maximum);
      this.spawnBehaviorMeetings(String(payload.config.childTypeId ?? 'action-item'), count, 0, 1);
    }
  };

  private spawnBehaviorMeetings(typeId: string, count: number, generation: number, scoreMultiplier: number): void {
    const days: WorkDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    const occupied = this.meetingBlocks.filter((block) => !block.destroyed).map((block) => `${block.config.day}-${block.config.startMinutes}`);
    const free: Array<{ day: WorkDay; startMinutes: number }> = [];
    for (const day of days) for (let startMinutes = 540; startMinutes <= 990; startMinutes += 30) if (!occupied.includes(`${day}-${startMinutes}`)) free.push({ day, startMinutes });
    const meetingType = this.localizedMeetingType(typeId);
    free.slice(0, Math.min(count, 3)).forEach((slot, index) => {
      const config: MeetingBlockConfig = { id: `${typeId}-${this.time.now}-${index}`, typeId, title: generation > 0 ? `↻ ${meetingType.title}` : meetingType.title, ...slot, durationMinutes: 30, required: true, generation, scoreMultiplier };
      const block = new MeetingBlock(this, config, meetingType, calculateMeetingRect(config, DEFAULT_CALENDAR_LAYOUT));
      this.meetingBlocks.push(block);
      this.levelProgress.addRequired([config.id]);
      this.activeBalls.forEach((ball) => this.configureMeetingCollision(ball, block));
    });
  }

  private readonly handleWindowKeyDown = (event: KeyboardEvent): void => {
    if (event.repeat) {
      return;
    }

    if (event.code === 'Escape') {
      event.preventDefault();
      this.handleTogglePause();
    } else if (event.code === 'KeyR') {
      event.preventDefault();
      this.handleRestartLevel();
    }
  };

  private movePaddleTo(x: number): void {
    if (this.tutorialController && !this.tutorialController.allows('move') && !this.tutorialController.allows('play')) return;
    const halfWidth = this.paddle.displayWidth / 2;
    this.paddle.moveTo(
      x,
      WORLD_PADDING + halfWidth,
      GAME_WIDTH - WORLD_PADDING - halfWidth,
    );
    this.game.canvas.dataset.paddleX = Math.round(this.paddle.x).toString();
    this.advanceTutorial('paddle-moved');
  }

  private launchBall(): void {
    if (this.tutorialController && !this.tutorialController.allows('launch') && !this.tutorialController.allows('play')) return;
    if (
      this.gameStatus !== 'playing' ||
      this.ballLaunched ||
      this.resettingBall
    ) {
      return;
    }

    const horizontalSpeed = INITIAL_BALL_SPEED * 0.34 * this.launchDirection;
    const verticalSpeed = -Math.sqrt(
      INITIAL_BALL_SPEED ** 2 - horizontalSpeed ** 2,
    );

    this.ball.launch({ x: horizontalSpeed, y: verticalSpeed });
    this.activeBalls.length = 0;
    this.activeBalls.push(this.ball);
    this.ballLaunched = true;
    this.setCanvasState('launched');
    this.advanceTutorial('ball-launched');
  }

  private handlePaddleCollision(ball: Ball): void {
    const currentVelocity = ball.getVelocity();

    if (currentVelocity.y <= 0) {
      return;
    }

    const impactOffset = Phaser.Math.Clamp(
      (ball.x - this.paddle.x) / (this.paddle.displayWidth / 2),
      -1,
      1,
    );
    this.recentPaddleImpacts.push(impactOffset);

    if (this.recentPaddleImpacts.length > 3) {
      this.recentPaddleImpacts.shift();
    }

    let nextVelocity = calculatePaddleBounce(
      ball.x,
      this.paddle.x,
      this.paddle.displayWidth,
      Math.hypot(currentVelocity.x, currentVelocity.y),
      this.launchDirection,
    );

    if (hasRepeatingImpacts(this.recentPaddleImpacts)) {
      nextVelocity = nudgeLoopingTrajectory(
        nextVelocity,
        this.loopNudgeDirection,
      );
      this.loopNudgeDirection = this.loopNudgeDirection === 1 ? -1 : 1;
      this.recentPaddleImpacts.length = 0;
    }

    ball.setSafeVelocity(nextVelocity, this.launchDirection);
    this.soundSystem.play('paddle');

    if (this.scoreSystem.snapshot.combo > 0) {
      this.publishScore(this.scoreSystem.resetCombo());
    }
  }

  private handleSingleBallLost(ball: Ball): void {
    const index = this.activeBalls.indexOf(ball);
    if (index >= 0) {
      this.activeBalls.splice(index, 1);
    }
    this.game.canvas.dataset.activeBalls = this.activeBalls.length.toString();

    if (ball === this.ball) {
      ball.hideForReset();
    } else {
      ball.destroy();
    }

    if (this.activeBalls.length > 0) {
      this.publishActivePowerUps();
      return;
    }

    this.handleAllBallsLost();
  }

  private handleAllBallsLost(): void {
    if (this.gameStatus !== 'playing' || this.resettingBall) {
      return;
    }

    this.ballLaunched = false;
    this.resettingBall = true;
    this.recentPaddleImpacts.length = 0;
    this.launchDirection = this.launchDirection === 1 ? -1 : 1;
    this.setCanvasState('resetting');
    this.advanceTutorial('ball-lost');

    if (!this.mode.coffeeEnabled) {
      this.finishWithDefeat();
      return;
    }

    if (this.scoreSystem.snapshot.combo > 0) {
      this.publishScore(this.scoreSystem.resetCombo());
    }

    const coffeeResult = this.coffeeSystem.consume();
    this.soundSystem.play('lost');
    this.soundSystem.play('coffee');
    const coffeePayload: CoffeeChangedPayload = {
      coffeeCups: coffeeResult.coffeeCups,
      initialCoffeeCups: this.coffeeSystem.initialCoffeeCups,
    };
    const consumedPayload: CoffeeConsumedPayload = {
      ...coffeePayload,
      message: Phaser.Utils.Array.GetRandom([...coffeeLossMessages[this.language]]),
    };
    this.updateRegistryState();
    this.game.events.emit(GAME_EVENTS.COFFEE_CONSUMED, consumedPayload);
    this.game.events.emit(GAME_EVENTS.COFFEE_CHANGED, coffeePayload);
    this.game.canvas.dataset.coffeeCups = coffeeResult.coffeeCups.toString();

    if (coffeeResult.empty) {
      this.finishWithDefeat();
      return;
    }

    this.time.delayedCall(BALL_RESET_DELAY_MS, () => {
      if (this.gameStatus !== 'playing') {
        return;
      }
      this.ball.resetOnPaddle(this.paddle);
      this.activeBalls.length = 0;
      this.activeBalls.push(this.ball);
      this.game.canvas.dataset.activeBalls = '1';
      this.resettingBall = false;
      this.setCanvasState('ready');
    });
  }

  private readonly handleMeetingDestroyed = (
    payload: MeetingDestroyedPayload,
  ): void => {
    if (this.gameStatus !== 'playing') {
      return;
    }

    if (payload.typeId === 'incident-call' && !this.meetingBlocks.some((block) => block.meetingType.id === 'postmortem')) {
      this.spawnBehaviorMeetings('postmortem', 1, 0, 1);
    }

    this.publishScore(this.scoreSystem.registerMeetingDestroyed(payload));
    this.advanceTutorial('meeting-destroyed');
    if (Math.random() < payload.dropChance * this.mode.bonusDropMultiplier) {
      this.spawnPowerUp(payload.x, payload.y);
    }
    this.meetingBlocks.forEach((block) => {
      if (block.config.linkedMeetingIds?.includes(payload.meetingId) || (block.config.groupId && block.config.groupId === this.meetingBlocks.find((candidate) => candidate.config.id === payload.meetingId)?.config.groupId)) block.removeShield();
    });
    const completedNow = this.levelProgress.registerDestroyed(
      payload.meetingId,
      payload.required,
    );
    this.game.canvas.dataset.requiredMeetings =
      this.levelProgress.remainingRequired.toString();

    if (completedNow && this.tutorialController) {
      this.advanceTutorial('calendar-cleared');
    } else if (completedNow && !this.mode.endless) {
      this.finishWithVictory();
    } else if (completedNow) {
      this.scheduleEndlessWave();
    }
  };

  private readonly handleRestartLevel = (): void => {
    this.scene.resume();
    this.scene.restart();
  };

  private readonly handleTogglePause = (): void => {
    if (this.tutorialController && this.gameStatus === 'playing' && !this.tutorialController.allows('pause')) return;
    if (this.gameStatus === 'playing') {
      this.gameStatus = 'paused';
      this.updateRegistryState();
      this.game.canvas.dataset.paused = 'true';
      const payload: PauseChangedPayload = { paused: true };
      this.game.events.emit(GAME_EVENTS.PAUSE_CHANGED, payload);
      this.advanceTutorial('paused');
      this.scene.pause();
      return;
    }

    if (this.gameStatus === 'paused') {
      this.scene.resume();
      this.gameStatus = 'playing';
      this.updateRegistryState();
      this.game.canvas.dataset.paused = 'false';
      const payload: PauseChangedPayload = { paused: false };
      this.game.events.emit(GAME_EVENTS.PAUSE_CHANGED, payload);
    }
  };

  private spawnPowerUp(x: number, y: number): void {
    const type = Phaser.Utils.Array.GetRandom([...POWER_UP_TYPES]);
    const powerUp = new PowerUp(this, x, y, type);
    this.powerUps.push(powerUp);
    this.physics.add.overlap(powerUp, this.paddle, () => {
      this.activatePowerUp(powerUp);
    });
  }

  private activatePowerUp(powerUp: PowerUp): void {
    if (!powerUp.active) {
      return;
    }

    const type = powerUp.powerUpType;
    const activation = this.powerUpSystem.activate(type, this.time.now);
    this.removePowerUp(powerUp);
    this.soundSystem.play('bonus');

    if (activation.asyncBallRequested) {
      this.addAsyncBall();
    } else if (type === 'espresso-shot') {
      this.activateEspresso(activation.espressoRefreshed);
    }

    this.publishActivePowerUps(type);
    if (type === 'espresso-shot') this.advanceTutorial('espresso-collected');
  }

  private addAsyncBall(): void {
    const source = this.activeBalls[0];
    if (!source) {
      return;
    }

    const velocity = source.getVelocity();
    const extraBall = new Ball(this, source.x, source.y);
    extraBall.launch({
      x: velocity.x === 0 ? -INITIAL_BALL_SPEED * 0.34 : -velocity.x,
      y: velocity.y === 0 ? -INITIAL_BALL_SPEED * 0.9 : velocity.y,
    });
    this.activeBalls.push(extraBall);
    this.configureBallCollisions(extraBall);
    this.game.canvas.dataset.activeBalls = this.activeBalls.length.toString();
  }

  private activateEspresso(refreshed: boolean): void {
    if (!refreshed) {
      this.paddle.setEspressoActive(true);
      for (const ball of this.activeBalls) {
        const velocity = ball.getVelocity();
        ball.setSafeVelocity({ x: velocity.x * 0.72, y: velocity.y * 0.72 });
      }
    }

    this.espressoTimer?.remove(false);
    this.espressoTimer = this.time.delayedCall(ESPRESSO_DURATION_MS, () => {
      if (!this.powerUpSystem.expireEspresso(this.time.now)) {
        return;
      }

      this.paddle.setEspressoActive(false);
      for (const ball of this.activeBalls) {
        const velocity = ball.getVelocity();
        ball.setSafeVelocity({ x: velocity.x / 0.72, y: velocity.y / 0.72 });
      }
      this.publishActivePowerUps();
    });
  }

  private removePowerUp(powerUp: PowerUp): void {
    const index = this.powerUps.indexOf(powerUp);
    if (index >= 0) {
      this.powerUps.splice(index, 1);
    }
    powerUp.destroy();
  }

  private publishActivePowerUps(activatedType?: PowerUpType): void {
    const activeTypes = this.powerUpSystem.getActiveTypes(this.time.now);
    const activeTitles = activeTypes.map(
      (type) => POWER_UP_DEFINITIONS[type].title,
    );
    if (this.activeBalls.length > 1) {
      activeTitles.unshift('Async Mode');
    }
    const type = activatedType ?? activeTypes[0];
    this.updateRegistryState();
    this.game.events.emit(GAME_EVENTS.POWER_UP_ACTIVATED, {
      powerUpId: type ?? 'none',
      title: type ? POWER_UP_DEFINITIONS[type].title : t(this.language, 'game.none'),
      activePowerUps: activeTitles,
    });
  }

  private finishWithVictory(): void {
    this.gameStatus = 'won';
    this.soundSystem.play('victory');
    this.stopGameplay('level-completed');
    const payload: LevelCompletedPayload = {
      result: this.scoreSystem.createLevelResult(
        this.coffeeSystem.coffeeSpent,
      ),
    };
    this.updateRegistryState();
    this.game.events.emit(GAME_EVENTS.LEVEL_COMPLETED, payload);
  }

  private finishWithDefeat(): void {
    this.gameStatus = 'lost';
    this.soundSystem.play('defeat');
    this.stopGameplay('game-over');
    const payload: GameOverPayload = {
      result: this.scoreSystem.createLevelResult(
        this.coffeeSystem.coffeeSpent,
      ),
    };
    this.updateRegistryState();
    this.game.events.emit(GAME_EVENTS.GAME_OVER, payload);
  }

  private stopGameplay(state: 'level-completed' | 'game-over'): void {
    this.ballLaunched = false;
    this.resettingBall = false;
    for (const ball of this.activeBalls) {
      ball.hideForReset();
    }
    this.physics.pause();
    this.setCanvasState(state);
    this.game.canvas.dataset.gameOutcome = this.gameStatus;
  }

  private publishGameStarted(): void {
    const payload: GameStartedPayload = {
      levelId: this.level.id,
      levelTitle: this.mode.endless ? `${this.mode.id === 'hard' ? 'Hard' : 'Relax'} Endless` : translateLevelTitle(this.language, this.level.id, this.level.title),
      score: this.scoreSystem.snapshot,
      coffeeCups: this.coffeeSystem.coffeeCups,
      initialCoffeeCups: this.coffeeSystem.initialCoffeeCups,
      coffeeEnabled: this.mode.coffeeEnabled,
      wave: this.wave,
    };
    this.updateRegistryState();
    this.game.events.emit(GAME_EVENTS.GAME_STARTED, payload);
  }

  private publishScore(score: ScoreChangedPayload): void {
    this.updateRegistryState();
    this.game.events.emit(GAME_EVENTS.SCORE_CHANGED, score);
  }

  private advanceTutorial(event: TutorialEvent): void {
    const controller = this.tutorialController;
    if (!controller?.notify(event)) return;
    this.publishTutorialStep();
    if (this.tutorialTransitionTimer !== undefined) window.clearTimeout(this.tutorialTransitionTimer);
    this.tutorialTransitionTimer = window.setTimeout(() => {
      this.tutorialTransitionTimer = undefined;
      if (!controller.completeTransition()) return;
      if (this.gameStatus === 'paused') {
        this.scene.resume();
        this.gameStatus = 'playing';
        this.game.events.emit(GAME_EVENTS.PAUSE_CHANGED, { paused: false });
      }
      this.publishTutorialStep();
      if (controller.isCompleted && event === 'calendar-cleared') this.finishWithVictory();
    }, 750);
  }

  private readonly handleTutorialContinue = (): void => {
    const controller = this.tutorialController;
    if (!controller?.continue()) return;
    this.physics.resume();
    if (this.gameStatus === 'paused') {
      this.scene.resume();
      this.gameStatus = 'playing';
      this.game.events.emit(GAME_EVENTS.PAUSE_CHANGED, { paused: false });
    }
    const step = controller.current;
    if (controller.snapshot.phase !== 'action') { this.publishTutorialStep(); return; }
    if (step?.setup === 'spawn-espresso') this.spawnTutorialEspresso();
    this.publishTutorialStep();
    if (step?.setup === 'lose-ball') this.time.delayedCall(250, () => this.handleAllBallsLost());
    if (step?.id === 'independent' && this.levelProgress.remainingRequired === 0) {
      this.advanceTutorial('calendar-cleared');
    }
  };

  private readonly handleTutorialSkip = (): void => {
    if (!this.tutorialController) return;
    if (this.tutorialTransitionTimer !== undefined) window.clearTimeout(this.tutorialTransitionTimer);
    this.tutorialTransitionTimer = undefined;
    this.tutorialController.skip();
    this.physics.resume();
    if (this.gameStatus === 'paused') {
      this.scene.resume();
      this.gameStatus = 'playing';
      this.game.events.emit(GAME_EVENTS.PAUSE_CHANGED, { paused: false });
    }
    this.publishTutorialStep();
  };

  private spawnTutorialEspresso(): void {
    const powerUp = new PowerUp(this, this.paddle.x, this.paddle.y - 90, 'espresso-shot');
    this.powerUps.push(powerUp);
    this.physics.add.overlap(powerUp, this.paddle, () => this.activatePowerUp(powerUp));
  }

  private publishTutorialStep(): void {
    const baseSnapshot = this.tutorialController?.snapshot;
    const step = baseSnapshot?.step;
    this.game.canvas.dataset.tutorialStep = step?.id ?? 'completed';
    if (!baseSnapshot) return;
    const spotlight = baseSnapshot.phase === 'success' && this.lastTutorialSpotlightStepId === step?.id
      ? this.lastTutorialSpotlight
      : step?.spotlightTarget ? this.getTutorialSpotlight(step.spotlightTarget) : undefined;
    if (baseSnapshot.phase !== 'success') {
      this.lastTutorialSpotlight = spotlight;
      this.lastTutorialSpotlightStepId = step?.id;
    }
    const snapshot = { ...baseSnapshot, spotlight };
    this.game.registry.set(TUTORIAL_STATE_REGISTRY_KEY, snapshot);
    this.game.events.emit(GAME_EVENTS.TUTORIAL_CHANGED, snapshot);
    if (snapshot.phase === 'explanation' || snapshot.phase === 'success') this.physics.pause();
  }

  private getTutorialSpotlight(target: TutorialTarget): TutorialSpotlightRect | undefined {
    if (target === 'paddle') return { x: this.paddle.x - this.paddle.displayWidth / 2, y: this.paddle.y - this.paddle.displayHeight / 2, width: this.paddle.displayWidth, height: this.paddle.displayHeight };
    if (target === 'ball') return { x: this.ball.x - this.ball.displayWidth / 2, y: this.ball.y - this.ball.displayHeight / 2, width: this.ball.displayWidth, height: this.ball.displayHeight };
    if (target === 'meeting') {
      const zone = this.meetingBlocks.find((block) => !block.destroyed)?.collisionZone;
      if (zone) return { x: zone.x - zone.displayWidth / 2, y: zone.y - zone.displayHeight / 2, width: zone.displayWidth, height: zone.displayHeight };
    }
    if (target === 'calendar') return { x: DEFAULT_CALENDAR_LAYOUT.x, y: DEFAULT_CALENDAR_LAYOUT.y, width: DEFAULT_CALENDAR_LAYOUT.width, height: DEFAULT_CALENDAR_LAYOUT.height };
    if (target === 'bonus') {
      const bonus = this.powerUps.find((powerUp) => powerUp.powerUpType === 'espresso-shot');
      if (bonus) return { x: bonus.x - bonus.displayWidth / 2, y: bonus.y - bonus.displayHeight / 2, width: bonus.displayWidth, height: bonus.displayHeight };
    }
    return undefined;
  }

  private updateRegistryState(): void {
    const state: GameState = {
      ...this.scoreSystem.snapshot,
      coffeeCups: this.coffeeSystem.coffeeCups,
      initialCoffeeCups: this.coffeeSystem.initialCoffeeCups,
      activePowerUps: this.powerUpSystem
        .getActiveTypes(this.time.now)
        .map((type) => POWER_UP_DEFINITIONS[type].title),
      coffeeEnabled: this.mode.coffeeEnabled,
      status: this.gameStatus,
      wave: this.wave,
    };
    this.game.registry.set(GAME_STATE_REGISTRY_KEY, state);
    this.game.canvas.dataset.score = state.score.toString();
    this.game.canvas.dataset.freedMinutes = state.freedMinutes.toString();
    this.game.canvas.dataset.combo = state.combo.toString();
    this.game.canvas.dataset.activeBalls = this.activeBalls.length.toString();
  }

  private drawBounds(): void {
    this.boundsGraphics?.destroy();
    const graphics = this.add.graphics();
    graphics.lineStyle(2, this.theme?.bounds ?? 0x334155, 0.9);
    graphics.beginPath(); graphics.moveTo(WORLD_PADDING, GAME_HEIGHT); graphics.lineTo(WORLD_PADDING, WORLD_PADDING); graphics.lineTo(GAME_WIDTH - WORLD_PADDING, WORLD_PADDING); graphics.lineTo(GAME_WIDTH - WORLD_PADDING, GAME_HEIGHT); graphics.strokePath();
    this.boundsGraphics = graphics;
  }

  private readonly applyTheme = (themeName: UserSettings['theme'] = 'dark'): void => {
    this.theme = getGameTheme(themeName);
    this.cameras.main.setBackgroundColor(this.theme.canvas);
    this.game.canvas.style.backgroundColor = this.theme.canvasCss;
    this.calendarGrid?.setTheme(this.theme);
    this.meetingBlocks.forEach((block) => block.setTheme(this.theme));
    this.drawBounds();
    this.game.canvas.dataset.theme = themeName;
  };

  private setCanvasState(
    state:
      | 'ready'
      | 'launched'
      | 'resetting'
      | 'level-completed'
      | 'game-over',
  ): void {
    this.game.canvas.dataset.ballState = state;
    this.game.canvas.dataset.scene = this.scene.key;
    this.game.canvas.dataset.paddleX = Math.round(this.paddle.x).toString();
    this.game.canvas.dataset.coffeeCups =
      this.coffeeSystem.coffeeCups.toString();
    this.game.canvas.dataset.requiredMeetings =
      this.levelProgress.remainingRequired.toString();
    this.game.canvas.dataset.paused = (this.gameStatus === 'paused').toString();
  }

  private cleanupScene(): void {
    this.waveTimer?.remove(false);
    if (this.tutorialTransitionTimer !== undefined) window.clearTimeout(this.tutorialTransitionTimer);
    this.espressoTimer?.remove(false);
    this.soundSystem.destroy();
    this.inputController.destroy();
    window.removeEventListener('keydown', this.handleWindowKeyDown);
    this.game.events.off(
      GAME_EVENTS.MEETING_DESTROYED,
      this.handleMeetingDestroyed,
      this,
    );
    this.game.events.off(
      GAME_COMMANDS.RESTART_LEVEL,
      this.handleRestartLevel,
      this,
    );
    this.game.events.off(
      GAME_COMMANDS.TOGGLE_PAUSE,
      this.handleTogglePause,
      this,
    );
    this.game.events.off(GAME_EVENTS.MEETING_BEHAVIOR_ACTION, this.handleBehaviorAction, this);
    this.game.events.off(GAME_EVENTS.THEME_CHANGED, this.applyTheme, this);
    this.game.events.off(GAME_COMMANDS.TUTORIAL_CONTINUE, this.handleTutorialContinue, this);
    this.game.events.off(GAME_COMMANDS.TUTORIAL_SKIP, this.handleTutorialSkip, this);
    delete this.game.canvas.dataset.ballState;
    delete this.game.canvas.dataset.activeBalls;
    delete this.game.canvas.dataset.calendarReady;
    delete this.game.canvas.dataset.meetingCount;
    delete this.game.canvas.dataset.meetingLayout;
    delete this.game.canvas.dataset.gameMode;
    delete this.game.canvas.dataset.ballAcceleration;
    delete this.game.canvas.dataset.coffeeEnabled;
    delete this.game.canvas.dataset.paddleX;
    delete this.game.canvas.dataset.paused;
    delete this.game.canvas.dataset.coffeeCups;
    delete this.game.canvas.dataset.combo;
    delete this.game.canvas.dataset.freedMinutes;
    delete this.game.canvas.dataset.gameOutcome;
    delete this.game.canvas.dataset.requiredMeetings;
    delete this.game.canvas.dataset.score;
    delete this.game.canvas.dataset.scene;
    delete this.game.canvas.dataset.wave;
    delete this.game.canvas.dataset.waveWarning;
    delete this.game.canvas.dataset.tutorialStep;
    delete this.game.canvas.dataset.theme;
    delete this.game.canvas.dataset.controlScheme;
    delete this.game.canvas.dataset.locale;
  }
}
