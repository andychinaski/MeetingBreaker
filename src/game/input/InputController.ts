import Phaser from 'phaser';
import type { ControlScheme } from '../../services/storageService';

export const CONTROL_SCHEME_REGISTRY_KEY = 'meeting-breaker-control-scheme';

export interface InputController {
  enable(): void;
  disable(): void;
  destroy(): void;
  update(delta: number): void;
}

export interface InputCallbacks {
  moveBy: (distance: number) => void;
  moveTo: (x: number) => void;
  launch: () => void;
}

export class KeyboardInputController implements InputController {
  private readonly cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private readonly leftKey: Phaser.Input.Keyboard.Key;
  private readonly rightKey: Phaser.Input.Keyboard.Key;
  private readonly launchKey: Phaser.Input.Keyboard.Key;
  private enabled = false;

  constructor(
    keyboard: Phaser.Input.Keyboard.KeyboardPlugin,
    private readonly callbacks: InputCallbacks,
    private readonly speed: number,
  ) {
    this.cursors = keyboard.createCursorKeys();
    this.leftKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.rightKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.launchKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  enable(): void { this.enabled = true; }
  disable(): void { this.enabled = false; }

  update(delta: number): void {
    if (!this.enabled) return;
    const direction = Number(this.rightKey.isDown || this.cursors.right.isDown)
      - Number(this.leftKey.isDown || this.cursors.left.isDown);
    if (direction !== 0) this.callbacks.moveBy(direction * this.speed * delta / 1000);
    if (Phaser.Input.Keyboard.JustDown(this.launchKey)) this.callbacks.launch();
  }

  destroy(): void {
    this.disable();
    this.leftKey.destroy();
    this.rightKey.destroy();
    this.launchKey.destroy();
    Object.values(this.cursors).forEach((key) => key?.destroy());
  }
}

export class MouseInputController implements InputController {
  private enabled = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly callbacks: InputCallbacks,
  ) {}

  enable(): void {
    if (this.enabled) return;
    this.enabled = true;
    this.scene.input.on(Phaser.Input.Events.POINTER_MOVE, this.handleMove);
    this.scene.input.on(Phaser.Input.Events.POINTER_DOWN, this.handleDown);
  }

  disable(): void {
    if (!this.enabled) return;
    this.enabled = false;
    this.scene.input.off(Phaser.Input.Events.POINTER_MOVE, this.handleMove);
    this.scene.input.off(Phaser.Input.Events.POINTER_DOWN, this.handleDown);
  }

  update(): void {}
  destroy(): void { this.disable(); }

  private readonly handleMove = (pointer: Phaser.Input.Pointer): void => this.callbacks.moveTo(pointer.x);

  private readonly handleDown = (pointer: Phaser.Input.Pointer): void => {
    if (pointer.leftButtonDown()) this.callbacks.launch();
  };
}

export function createInputController(
  scheme: ControlScheme,
  scene: Phaser.Scene,
  callbacks: InputCallbacks,
  speed: number,
): InputController {
  if (scheme === 'mouse') return new MouseInputController(scene, callbacks);
  if (!scene.input.keyboard) throw new Error('Keyboard input is not available');
  return new KeyboardInputController(scene.input.keyboard, callbacks, speed);
}
