import Phaser from 'phaser';
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
import { Paddle } from '../objects/Paddle';
import {
  accelerateVelocity,
  calculatePaddleBounce,
  hasRepeatingImpacts,
  INITIAL_BALL_SPEED,
  nudgeLoopingTrajectory,
  type HorizontalDirection,
} from '../systems/ballPhysics';

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

  constructor() {
    super('GameScene');
  }

  create(): void {
    this.drawBounds();
    this.configureWorld();
    this.createObjects();
    this.configureInput();
    this.configureCollisions();

    this.setCanvasState('ready');
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanupInput, this);
  }

  update(_time: number, delta: number): void {
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
    if (this.ballLaunched || this.resettingBall) {
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
  }

  private handleBallLost(): void {
    if (this.resettingBall) {
      return;
    }

    this.ballLaunched = false;
    this.resettingBall = true;
    this.ball.hideForReset();
    this.recentPaddleImpacts.length = 0;
    this.launchDirection = this.launchDirection === 1 ? -1 : 1;
    this.setCanvasState('resetting');

    this.time.delayedCall(BALL_RESET_DELAY_MS, () => {
      this.ball.resetOnPaddle(this.paddle);
      this.resettingBall = false;
      this.setCanvasState('ready');
    });
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

  private setCanvasState(state: 'ready' | 'launched' | 'resetting'): void {
    this.game.canvas.dataset.ballState = state;
    this.game.canvas.dataset.scene = this.scene.key;
    this.game.canvas.dataset.paddleX = Math.round(this.paddle.x).toString();
  }

  private cleanupInput(): void {
    this.game.canvas.removeEventListener(
      'pointermove',
      this.handleCanvasPointerMove,
    );
    this.game.canvas.removeEventListener(
      'pointerdown',
      this.handleCanvasPointerDown,
    );
    delete this.game.canvas.dataset.ballState;
    delete this.game.canvas.dataset.paddleX;
    delete this.game.canvas.dataset.scene;
  }
}
