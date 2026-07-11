import Phaser from 'phaser';
import {
  BALL_RADIUS,
  BALL_TEXTURE,
  PADDLE_HEIGHT,
} from '../config/gameplay';
import type { Paddle } from './Paddle';
import {
  MAX_BALL_SPEED,
  stabilizeVelocity,
  type HorizontalDirection,
  type Velocity,
} from '../systems/ballPhysics';

export class Ball extends Phaser.Physics.Arcade.Sprite {
  private readonly taskLabel: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, BALL_TEXTURE);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCircle(BALL_RADIUS);
    this.setBounce(1, 1);
    this.setCollideWorldBounds(true, 1, 1);
    this.setMaxVelocity(MAX_BALL_SPEED, MAX_BALL_SPEED);
    this.setDepth(4);

    this.taskLabel = scene.add
      .text(x, y, 'TASK', {
        color: '#0b1120',
        fontFamily: 'Arial, sans-serif',
        fontSize: '9px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(5);
  }

  resetOnPaddle(paddle: Paddle): void {
    this.enableBody(
      true,
      paddle.x,
      paddle.y - PADDLE_HEIGHT / 2 - BALL_RADIUS - 3,
      true,
      true,
    );
    this.setVelocity(0, 0);
    this.syncLabel();
  }

  attachToPaddle(paddle: Paddle): void {
    this.setPosition(
      paddle.x,
      paddle.y - PADDLE_HEIGHT / 2 - BALL_RADIUS - 3,
    );
    this.syncLabel();
    this.body?.updateFromGameObject();
  }

  launch(velocity: Velocity): void {
    this.setSafeVelocity(velocity);
  }

  setSafeVelocity(
    velocity: Velocity,
    fallbackDirection: HorizontalDirection = 1,
  ): void {
    const safeVelocity = stabilizeVelocity(velocity, fallbackDirection);
    this.setVelocity(safeVelocity.x, safeVelocity.y);
  }

  getVelocity(): Velocity {
    return {
      x: this.body?.velocity.x ?? 0,
      y: this.body?.velocity.y ?? 0,
    };
  }

  hideForReset(): void {
    this.disableBody(true, true);
    this.taskLabel.setVisible(false);
  }

  syncLabel(): void {
    this.taskLabel.setPosition(this.x, this.y).setVisible(this.visible);
  }

  override destroy(fromScene?: boolean): void {
    this.taskLabel.destroy(fromScene);
    super.destroy(fromScene);
  }
}
