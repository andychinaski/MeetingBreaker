import { describe, expect, it, vi } from 'vitest';
import type { InputController } from './InputController';
import { InputControllerManager } from './InputControllerManager';

function mockController(): InputController {
  return { enable: vi.fn(), disable: vi.fn(), destroy: vi.fn(), update: vi.fn() };
}

describe('InputControllerManager', () => {
  it('disables and destroys the old scheme before enabling the new one', () => {
    const manager = new InputControllerManager();
    const keyboard = mockController();
    const mouse = mockController();
    manager.use(keyboard);
    manager.use(mouse);
    expect(keyboard.disable).toHaveBeenCalledOnce();
    expect(keyboard.destroy).toHaveBeenCalledOnce();
    expect(mouse.enable).toHaveBeenCalledOnce();
  });
});
