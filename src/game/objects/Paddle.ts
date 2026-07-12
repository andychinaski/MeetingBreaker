import Phaser from 'phaser';
import {
  PADDLE_HEIGHT,
  PADDLE_TEXTURE,
  PADDLE_WIDTH,
} from '../config/gameplay';

export class Paddle extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, PADDLE_TEXTURE);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setImmovable(true);
    this.setSize(PADDLE_WIDTH, PADDLE_HEIGHT);
    this.setDepth(2);

    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);

  }

  moveTo(x: number, minimumX: number, maximumX: number): void {
    this.x = Phaser.Math.Clamp(x, minimumX, maximumX);
    this.body?.updateFromGameObject();
  }

  setEspressoActive(active: boolean): void {
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      scaleX: active ? 1.45 : 1,
      duration: 280,
      ease: 'Sine.InOut',
      onUpdate: () => {
        this.body?.updateFromGameObject();
      },
    });
  }
}
