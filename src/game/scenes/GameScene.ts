import Phaser from 'phaser';
import { DEFAULT_LEVEL } from '../../data/levels';
import { getMeetingType } from '../../data/meetingTypes';
import { GAME_HEIGHT, GAME_WIDTH } from '../config/gameConfig';
import {
  BALL_RADIUS,
  BALL_RESET_DELAY_MS,
  PADDLE_SPEED,
  PADDLE_WIDTH,
  PADDLE_Y,
  WORLD_PADDING,
} from '../config/gameplay';
import { Ball } from '../objects/Ball';
import { CalendarGrid } from '../objects/CalendarGrid';
import { MeetingBlock } from '../objects/MeetingBlock';
import { Paddle } from '../objects/Paddle';
import {
  GAME_COMMANDS,
  GAME_EVENTS,
  GAME_STATE_REGISTRY_KEY,
  type CoffeeChangedPayload,
  type CoffeeConsumedPayload,
  type GameOverPayload,
  type GameStartedPayload,
  type LevelCompletedPayload,
  type MeetingDestroyedPayload,
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
import type { GameState, GameStatus } from '../types/game';

const COFFEE_LOSS_MESSAGES: string[] = [
  'Задача потеряна. Пора за кофе.',
  'Без кофе это уже не починить.',
  'Ещё одна чашка — и продолжаем.',
  'Фокус закончился. Кофе ещё есть.',
  'Небольшой перерыв у кофемашины.',
  'Продолжаем на кофеине.',
];

export class GameScene extends Phaser.Scene {
  private paddle!: Paddle;
  private ball!: Ball;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private leftKey!: Phaser.Input.Keyboard.Key;
  private rightKey!: Phaser.Input.Keyboard.Key;
  private launchKey!: Phaser.Input.Keyboard.Key;
  private ballLaunched = false;
  private resettingBall = false;
  private launchDirection: HorizontalDirection = 1;
  private loopNudgeDirection: HorizontalDirection = 1;
  private readonly recentPaddleImpacts: number[] = [];
  private readonly meetingBlocks: MeetingBlock[] = [];
  private scoreSystem!: ScoreSystem;
  private coffeeSystem!: CoffeeSystem;
  private levelProgress!: LevelProgress;
  private gameStatus: GameStatus = 'idle';

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

    this.setCanvasState('ready');
    this.publishGameStarted();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanupScene, this);
  }

  update(_time: number, delta: number): void {
    if (this.gameStatus !== 'playing') {
      return;
    }

    this.updateKeyboardMovement(delta);

    if (!this.ballLaunched) {
      if (!this.resettingBall) {
        this.ball.attachToPaddle(this.paddle);
      }
      return;
    }

    this.ball.setSafeVelocity(
      accelerateVelocity(this.ball.getVelocity(), delta / 1000),
      this.launchDirection,
    );
    this.ball.syncLabel();

    if (this.ball.y - BALL_RADIUS > GAME_HEIGHT) {
      this.handleBallLost();
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
  }

  private initializeGameState(): void {
    this.scoreSystem = new ScoreSystem();
    this.coffeeSystem = new CoffeeSystem(DEFAULT_LEVEL.initialCoffeeCups);
    this.levelProgress = new LevelProgress(
      DEFAULT_LEVEL.meetings
        .filter((meeting) => meeting.required ?? true)
        .map((meeting) => meeting.id),
    );
    this.gameStatus = 'playing';
  }

  private createCalendar(): void {
    this.meetingBlocks.length = 0;
    new CalendarGrid(this, DEFAULT_CALENDAR_LAYOUT);

    for (const meetingConfig of DEFAULT_LEVEL.meetings) {
      const meetingType = getMeetingType(meetingConfig.typeId);
      const rectangle = calculateMeetingRect(
        meetingConfig,
        DEFAULT_CALENDAR_LAYOUT,
      );
      this.meetingBlocks.push(
        new MeetingBlock(this, meetingConfig, meetingType, rectangle),
      );
    }

    this.game.canvas.dataset.calendarReady = 'true';
    this.game.canvas.dataset.meetingCount = this.meetingBlocks.length.toString();
  }

  private configureInput(): void {
    const keyboard = this.input.keyboard;

    if (!keyboard) {
      throw new Error('Keyboard input is not available');
    }

    this.cursors = keyboard.createCursorKeys();
    this.leftKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.rightKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.launchKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.game.canvas.addEventListener(
      'pointermove',
      this.handleCanvasPointerMove,
    );
    this.game.canvas.addEventListener(
      'pointerdown',
      this.handleCanvasPointerDown,
    );
  }

  private configureCollisions(): void {
    this.physics.add.collider(this.ball, this.paddle, () => {
      this.handlePaddleCollision();
    });

    for (const meetingBlock of this.meetingBlocks) {
      this.physics.add.collider(this.ball, meetingBlock.collisionZone, () => {
        meetingBlock.takeDamage();
      });
    }
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
  }

  private updateKeyboardMovement(delta: number): void {
    const movingLeft = this.leftKey.isDown || this.cursors.left.isDown;
    const movingRight = this.rightKey.isDown || this.cursors.right.isDown;
    const direction = Number(movingRight) - Number(movingLeft);

    if (direction !== 0) {
      this.movePaddleTo(
        this.paddle.x + direction * PADDLE_SPEED * (delta / 1000),
      );
    }

    if (Phaser.Input.Keyboard.JustDown(this.launchKey)) {
      this.launchBall();
    }
  }

  private readonly handleCanvasPointerMove = (event: PointerEvent): void => {
    const bounds = this.game.canvas.getBoundingClientRect();
    const worldX = ((event.clientX - bounds.left) / bounds.width) * GAME_WIDTH;
    this.movePaddleTo(worldX);
  };

  private readonly handleCanvasPointerDown = (event: PointerEvent): void => {
    if (event.button === 0) {
      this.launchBall();
    }
  };

  private movePaddleTo(x: number): void {
    const halfWidth = PADDLE_WIDTH / 2;
    this.paddle.moveTo(
      x,
      WORLD_PADDING + halfWidth,
      GAME_WIDTH - WORLD_PADDING - halfWidth,
    );
    this.game.canvas.dataset.paddleX = Math.round(this.paddle.x).toString();
  }

  private launchBall(): void {
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
    this.ballLaunched = true;
    this.setCanvasState('launched');
  }

  private handlePaddleCollision(): void {
    const currentVelocity = this.ball.getVelocity();

    if (currentVelocity.y <= 0) {
      return;
    }

    const impactOffset = Phaser.Math.Clamp(
      (this.ball.x - this.paddle.x) / (PADDLE_WIDTH / 2),
      -1,
      1,
    );
    this.recentPaddleImpacts.push(impactOffset);

    if (this.recentPaddleImpacts.length > 3) {
      this.recentPaddleImpacts.shift();
    }

    let nextVelocity = calculatePaddleBounce(
      this.ball.x,
      this.paddle.x,
      PADDLE_WIDTH,
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

    this.ball.setSafeVelocity(nextVelocity, this.launchDirection);

    if (this.scoreSystem.snapshot.combo > 0) {
      this.publishScore(this.scoreSystem.resetCombo());
    }
  }

  private handleBallLost(): void {
    if (this.gameStatus !== 'playing' || this.resettingBall) {
      return;
    }

    this.ballLaunched = false;
    this.resettingBall = true;
    this.ball.hideForReset();
    this.recentPaddleImpacts.length = 0;
    this.launchDirection = this.launchDirection === 1 ? -1 : 1;
    this.setCanvasState('resetting');

    if (this.scoreSystem.snapshot.combo > 0) {
      this.publishScore(this.scoreSystem.resetCombo());
    }

    const coffeeResult = this.coffeeSystem.consume();
    const coffeePayload: CoffeeChangedPayload = {
      coffeeCups: coffeeResult.coffeeCups,
      initialCoffeeCups: this.coffeeSystem.initialCoffeeCups,
    };
    const consumedPayload: CoffeeConsumedPayload = {
      ...coffeePayload,
      message: Phaser.Utils.Array.GetRandom(COFFEE_LOSS_MESSAGES),
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

    this.publishScore(this.scoreSystem.registerMeetingDestroyed(payload));
    const completedNow = this.levelProgress.registerDestroyed(
      payload.meetingId,
      payload.required,
    );
    this.game.canvas.dataset.requiredMeetings =
      this.levelProgress.remainingRequired.toString();

    if (completedNow) {
      this.finishWithVictory();
    }
  };

  private readonly handleRestartLevel = (): void => {
    this.scene.restart();
  };

  private finishWithVictory(): void {
    this.gameStatus = 'won';
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
    this.ball.hideForReset();
    this.physics.pause();
    this.setCanvasState(state);
    this.game.canvas.dataset.gameOutcome = this.gameStatus;
  }

  private publishGameStarted(): void {
    const payload: GameStartedPayload = {
      levelId: DEFAULT_LEVEL.id,
      levelTitle: DEFAULT_LEVEL.title,
      score: this.scoreSystem.snapshot,
      coffeeCups: this.coffeeSystem.coffeeCups,
      initialCoffeeCups: this.coffeeSystem.initialCoffeeCups,
    };
    this.updateRegistryState();
    this.game.events.emit(GAME_EVENTS.GAME_STARTED, payload);
  }

  private publishScore(score: ScoreChangedPayload): void {
    this.updateRegistryState();
    this.game.events.emit(GAME_EVENTS.SCORE_CHANGED, score);
  }

  private updateRegistryState(): void {
    const state: GameState = {
      ...this.scoreSystem.snapshot,
      coffeeCups: this.coffeeSystem.coffeeCups,
      initialCoffeeCups: this.coffeeSystem.initialCoffeeCups,
      activePowerUps: [],
      status: this.gameStatus,
    };
    this.game.registry.set(GAME_STATE_REGISTRY_KEY, state);
    this.game.canvas.dataset.score = state.score.toString();
    this.game.canvas.dataset.freedMinutes = state.freedMinutes.toString();
    this.game.canvas.dataset.combo = state.combo.toString();
  }

  private drawBounds(): void {
    const graphics = this.add.graphics();
    graphics.lineStyle(2, 0x334155, 0.9);
    graphics.beginPath();
    graphics.moveTo(WORLD_PADDING, GAME_HEIGHT);
    graphics.lineTo(WORLD_PADDING, WORLD_PADDING);
    graphics.lineTo(GAME_WIDTH - WORLD_PADDING, WORLD_PADDING);
    graphics.lineTo(GAME_WIDTH - WORLD_PADDING, GAME_HEIGHT);
    graphics.strokePath();
  }

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
  }

  private cleanupScene(): void {
    this.game.canvas.removeEventListener(
      'pointermove',
      this.handleCanvasPointerMove,
    );
    this.game.canvas.removeEventListener(
      'pointerdown',
      this.handleCanvasPointerDown,
    );
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
    delete this.game.canvas.dataset.ballState;
    delete this.game.canvas.dataset.calendarReady;
    delete this.game.canvas.dataset.meetingCount;
    delete this.game.canvas.dataset.paddleX;
    delete this.game.canvas.dataset.coffeeCups;
    delete this.game.canvas.dataset.combo;
    delete this.game.canvas.dataset.freedMinutes;
    delete this.game.canvas.dataset.gameOutcome;
    delete this.game.canvas.dataset.requiredMeetings;
    delete this.game.canvas.dataset.score;
    delete this.game.canvas.dataset.scene;
  }
}
