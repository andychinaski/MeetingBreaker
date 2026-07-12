import type { InputController } from './InputController';

export class InputControllerManager {
  private active?: InputController;

  use(controller: InputController): void {
    this.active?.disable();
    this.active?.destroy();
    this.active = controller;
    this.active.enable();
  }

  update(delta: number): void { this.active?.update(delta); }
  destroy(): void { this.active?.destroy(); this.active = undefined; }
}
