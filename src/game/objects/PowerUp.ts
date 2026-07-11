import Phaser from 'phaser';
import { POWER_UP_TEXTURE } from '../config/gameplay';
import {
  POWER_UP_DEFINITIONS,
  type PowerUpType,
} from '../types/powerUp';

export class PowerUp extends Phaser.Physics.Arcade.Sprite {
  private readonly label: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    readonly powerUpType: PowerUpType,
  ) {
    super(scene, x, y, POWER_UP_TEXTURE);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const definition = POWER_UP_DEFINITIONS[powerUpType];
    this.setTint(definition.color);
    this.setDepth(7);
    this.setVelocityY(155);
    this.setCircle(14);

    this.label = scene.add
      .text(x, y, definition.shortLabel, {
        color: '#07111f',
        fontFamily: 'Arial, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(8);
  }

  syncLabel(): void {
    this.label.setPosition(this.x, this.y).setVisible(this.visible);
  }

  override destroy(fromScene?: boolean): void {
    this.label.destroy(fromScene);
    super.destroy(fromScene);
  }
}
