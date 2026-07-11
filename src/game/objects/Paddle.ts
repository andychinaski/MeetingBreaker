import Phaser from 'phaser';
import {
  PADDLE_HEIGHT,
  PADDLE_TEXTURE,
  PADDLE_WIDTH,
} from '../config/gameplay';

export class Paddle extends Phaser.Physics.Arcade.Sprite {
  private readonly focusLabel: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, PADDLE_TEXTURE);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setImmovable(true);
    this.setSize(PADDLE_WIDTH, PADDLE_HEIGHT);
    this.setDepth(2);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);

    this.focusLabel = scene.add
      .text(x, y, 'FOCUS TIME', {
        color: '#0b1120',
        fontFamily: 'Arial, sans-serif',
        fontSize: '13px',
        fontStyle: 'bold',
      })
      .setOrigin(0.5)
      .setDepth(3);
  }

  moveTo(x: number, minimumX: number, maximumX: number): void {
    this.x = Phaser.Math.Clamp(x, minimumX, maximumX);
    this.focusLabel.setPosition(this.x, this.y);
    this.body?.updateFromGameObject();
  }

  override destroy(fromScene?: boolean): void {
    this.focusLabel.destroy(fromScene);
    super.destroy(fromScene);
  }
}
