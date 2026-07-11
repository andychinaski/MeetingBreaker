import Phaser from 'phaser';
import {
  BALL_RADIUS,
  BALL_TEXTURE,
  PADDLE_HEIGHT,
  PADDLE_TEXTURE,
  PADDLE_WIDTH,
  PARTICLE_TEXTURE,
  POWER_UP_TEXTURE,
} from '../config/gameplay';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    this.createPaddleTexture();
    this.createBallTexture();
    this.createParticleTexture();
    this.createPowerUpTexture();
    this.scene.start('GameScene');
  }

  private createPaddleTexture(): void {
    if (this.textures.exists(PADDLE_TEXTURE)) {
      return;
    }

    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    graphics.fillStyle(0x5eead4, 1);
    graphics.fillRoundedRect(0, 0, PADDLE_WIDTH, PADDLE_HEIGHT, 10);
    graphics.lineStyle(2, 0xccfbf1, 0.9);
    graphics.strokeRoundedRect(1, 1, PADDLE_WIDTH - 2, PADDLE_HEIGHT - 2, 9);
    graphics.generateTexture(PADDLE_TEXTURE, PADDLE_WIDTH, PADDLE_HEIGHT);
    graphics.destroy();
  }

  private createBallTexture(): void {
    if (this.textures.exists(BALL_TEXTURE)) {
      return;
    }

    const diameter = BALL_RADIUS * 2;
    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    graphics.fillStyle(0xf8fafc, 1);
    graphics.fillCircle(BALL_RADIUS, BALL_RADIUS, BALL_RADIUS);
    graphics.lineStyle(3, 0x60a5fa, 1);
    graphics.strokeCircle(BALL_RADIUS, BALL_RADIUS, BALL_RADIUS - 1.5);
    graphics.generateTexture(BALL_TEXTURE, diameter, diameter);
    graphics.destroy();
  }

  private createParticleTexture(): void {
    if (this.textures.exists(PARTICLE_TEXTURE)) {
      return;
    }

    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRoundedRect(0, 0, 7, 7, 2);
    graphics.generateTexture(PARTICLE_TEXTURE, 7, 7);
    graphics.destroy();
  }

  private createPowerUpTexture(): void {
    if (this.textures.exists(POWER_UP_TEXTURE)) {
      return;
    }

    const graphics = this.make.graphics({ x: 0, y: 0 }, false);
    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(15, 15, 14);
    graphics.lineStyle(2, 0xffffff, 0.75);
    graphics.strokeCircle(15, 15, 13);
    graphics.generateTexture(POWER_UP_TEXTURE, 30, 30);
    graphics.destroy();
  }
}
