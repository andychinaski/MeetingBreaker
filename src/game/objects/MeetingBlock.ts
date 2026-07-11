import Phaser from 'phaser';
import { PARTICLE_TEXTURE } from '../config/gameplay';
import {
  GAME_EVENTS,
  type MeetingDestroyedPayload,
  type MeetingBehaviorActionPayload,
} from '../events/gameEvents';
import {
  formatCalendarTime,
} from '../systems/calendarLayout';
import {
  MeetingDurability,
  type DamageResult,
} from '../systems/meetingDurability';
import type { MeetingRectangle } from '../types/calendar';
import type {
  MeetingBlockConfig,
  MeetingType,
} from '../types/meeting';
import {
  createMeetingBehaviors,
  type MeetingBehavior,
  type MeetingBehaviorContext,
} from '../behaviors/MeetingBehavior';
import { DEFAULT_SETTINGS, SETTINGS_REGISTRY_KEY, type UserSettings } from '../../services/storageService';

type VisualDamageState = 'normal' | 'damaged' | 'severely-damaged';

export class MeetingBlock extends Phaser.GameObjects.Container {
  readonly collisionZone: Phaser.GameObjects.Zone;
  private readonly background: Phaser.GameObjects.Graphics;
  private readonly cracks: Phaser.GameObjects.Graphics;
  private readonly durability: MeetingDurability;
  private readonly blockColor: number;
  private readonly blockWidth: number;
  private readonly blockHeight: number;
  private destructionStarted = false;
  private shielded = false;
  private readonly behaviors: MeetingBehavior[];
  private readonly behaviorContext: MeetingBehaviorContext;

  constructor(
    scene: Phaser.Scene,
    readonly config: MeetingBlockConfig,
    readonly meetingType: MeetingType,
    rectangle: MeetingRectangle,
  ) {
    super(
      scene,
      rectangle.x + rectangle.width / 2,
      rectangle.y + rectangle.height / 2,
    );

    this.blockWidth = rectangle.width;
    this.blockHeight = rectangle.height;
    const settings = (scene.game.registry.get(SETTINGS_REGISTRY_KEY) as UserSettings | undefined) ?? DEFAULT_SETTINGS;
    const baseColor = Number.parseInt(meetingType.color.slice(1), 16);
    this.blockColor = settings.meetingPalette === 'pastel'
      ? Phaser.Display.Color.ValueToColor(baseColor).lighten(28).color
      : settings.meetingPalette === 'high-contrast'
        ? Phaser.Display.Color.ValueToColor(baseColor).saturate(55).brighten(18).color
        : baseColor;
    this.durability = new MeetingDurability(
      config.customHp ?? meetingType.maxHp,
    );
    // HOTFIX 2: post-MVP behaviors are intentionally disabled until their
    // mechanics can be introduced progressively and explained to the player.
    this.behaviors = createMeetingBehaviors([]);
    this.behaviorContext = {
      scene,
      block: this,
      config,
      meetingType,
      isDestroyed: () => this.destroyed,
      setShielded: (shielded) => {
        this.shielded = shielded;
        this.drawVisualState(this.getDamageState());
      },
      setBlinking: (active) => this.setAlpha(active ? 0.48 : 1),
      moveBy: (x, y) => {
        this.x += x;
        this.y += y;
        this.collisionZone.setPosition(this.x, this.y);
        (this.collisionZone.body as Phaser.Physics.Arcade.StaticBody).updateFromGameObject();
      },
      emitAction: (action) => {
        const payload: MeetingBehaviorActionPayload = { action, meetingId: config.id, typeId: meetingType.id, config: meetingType.behaviorConfig ?? {}, x: this.x, y: this.y };
        scene.game.events.emit(GAME_EVENTS.MEETING_BEHAVIOR_ACTION, payload);
      },
    };

    scene.add.existing(this);
    this.setSize(this.blockWidth, this.blockHeight);
    this.setDepth(2);

    this.collisionZone = scene.add.zone(
      this.x,
      this.y,
      this.blockWidth,
      this.blockHeight,
    );
    scene.physics.add.existing(this.collisionZone, true);

    this.background = scene.add.graphics();
    this.cracks = scene.add.graphics();
    this.add([this.background, this.cracks]);
    this.drawVisualState('normal');
    this.createContent();
    this.behaviors.forEach((behavior) => behavior.onCreate?.(this.behaviorContext));
  }

  get currentHp(): number {
    return this.durability.currentHp;
  }

  get destroyed(): boolean {
    return this.durability.destroyed;
  }

  takeDamage(amount = 1): DamageResult {
    this.behaviors.forEach((behavior) => behavior.onBallCollision?.(this.behaviorContext));
    if (this.shielded) {
      this.scene.tweens.add({ targets: this, alpha: 0.55, duration: 55, yoyo: true });
      return this.durability.damage(0);
    }
    const result = this.durability.damage(amount);

    if (result.previousHp === result.currentHp) {
      return result;
    }

    if (result.destroyedNow) {
      this.startDestruction();
    } else {
      this.drawVisualState(this.getDamageState());
      this.playHitAnimation();
    }
    this.behaviors.forEach((behavior) => behavior.onHit?.(this.behaviorContext));

    return result;
  }

  updateBehavior(delta: number): void {
    if (!this.destructionStarted) {
      this.behaviors.forEach((behavior) => behavior.onUpdate?.(this.behaviorContext, delta));
    }
  }

  removeShield(): void {
    if (this.shielded) {
      this.shielded = false;
      this.drawVisualState(this.getDamageState());
    }
  }

  private createContent(): void {
    const left = -this.blockWidth / 2 + 10;
    const top = -this.blockHeight / 2;
    const compact = this.blockHeight < 30;
    const medium = this.blockHeight < 58;
    const title = compact ? this.meetingType.shortTitle : this.config.title;
    const titleSize = compact ? 10 : 11;
    const titleY = compact ? top + 3 : top + 6;

    const titleText = this.scene.add.text(left, titleY, title, {
      color: '#f8fafc',
      fontFamily: 'Arial, sans-serif',
      fontSize: `${titleSize}px`,
      fontStyle: 'bold',
      wordWrap: { width: this.blockWidth - 18, useAdvancedWrap: false },
    });
    titleText.setCrop(0, 0, this.blockWidth - 18, compact ? 13 : 29);
    this.add(titleText);

    if (compact) {
      return;
    }

    const endMinutes = this.config.startMinutes + this.config.durationMinutes;
    const timeText = `${formatCalendarTime(
      this.config.startMinutes,
    )}–${formatCalendarTime(endMinutes)} · ${this.config.durationMinutes} мин`;
    const details = this.scene.add.text(
      left,
      top + (medium ? 27 : 36),
      timeText,
      {
        color: '#cbd5e1',
        fontFamily: 'Arial, sans-serif',
        fontSize: medium ? '9px' : '10px',
      },
    );
    details.setCrop(0, 0, this.blockWidth - 18, 13);
    this.add(details);

    if (!medium && this.config.attendeeCount !== undefined) {
      const attendees = this.scene.add.text(
        left,
        top + 52,
        `${this.config.attendeeCount} участников`,
        {
          color: '#94a3b8',
          fontFamily: 'Arial, sans-serif',
          fontSize: '9px',
        },
      );
      this.add(attendees);
    }
  }

  private getDamageState(): VisualDamageState {
    const hpRatio = this.currentHp / this.durability.maxHp;

    if (hpRatio <= 0.34) {
      return 'severely-damaged';
    }

    if (hpRatio < 1) {
      return 'damaged';
    }

    return 'normal';
  }

  private drawVisualState(state: VisualDamageState): void {
    const left = -this.blockWidth / 2;
    const top = -this.blockHeight / 2;
    const alpha = state === 'normal' ? 0.92 : state === 'damaged' ? 0.7 : 0.48;

    this.background.clear();
    this.background.fillStyle(0x172033, 0.97);
    this.background.fillRoundedRect(
      left,
      top,
      this.blockWidth,
      this.blockHeight,
      6,
    );
    this.background.fillStyle(this.blockColor, alpha);
    this.background.fillRoundedRect(
      left + 2,
      top + 2,
      this.blockWidth - 4,
      this.blockHeight - 4,
      5,
    );
    this.background.fillStyle(0x0f172a, 0.25);
    this.background.fillRect(left + 6, top + 2, 4, this.blockHeight - 4);
    this.background.lineStyle(1, 0xffffff, state === 'normal' ? 0.2 : 0.1);
    this.background.strokeRoundedRect(
      left + 1,
      top + 1,
      this.blockWidth - 2,
      this.blockHeight - 2,
      6,
    );
    if (this.shielded) {
      this.background.lineStyle(3, 0x67e8f9, 0.95);
      this.background.strokeRoundedRect(left - 2, top - 2, this.blockWidth + 4, this.blockHeight + 4, 8);
    }

    this.cracks.clear();

    if (state !== 'normal') {
      this.drawCrack(state === 'severely-damaged' ? 2 : 1);
    }
  }

  private drawCrack(branches: number): void {
    const startX = this.blockWidth * 0.2;
    const startY = -this.blockHeight / 2 + 3;
    this.cracks.lineStyle(1.5, 0x0f172a, 0.65);

    for (let index = 0; index < branches; index += 1) {
      const offset = index * 11;
      this.cracks.beginPath();
      this.cracks.moveTo(startX - offset, startY);
      this.cracks.lineTo(startX - 6 - offset, startY + this.blockHeight * 0.35);
      this.cracks.lineTo(startX + 2 - offset, startY + this.blockHeight * 0.58);
      this.cracks.lineTo(startX - 4 - offset, startY + this.blockHeight - 6);
      this.cracks.strokePath();
    }
  }

  private playHitAnimation(): void {
    this.scene.tweens.killTweensOf(this);
    this.scene.tweens.add({
      targets: this,
      scaleX: 1.035,
      scaleY: 1.06,
      duration: 55,
      yoyo: true,
      ease: 'Sine.Out',
    });
  }

  private startDestruction(): void {
    if (this.destructionStarted) {
      return;
    }

    this.destructionStarted = true;
    this.behaviors.forEach((behavior) => behavior.onDestroy?.(this.behaviorContext));
    const body = this.collisionZone.body as Phaser.Physics.Arcade.StaticBody;
    body.enable = false;
    this.emitDestructionEvent();
    this.createDestructionEffects();

    if (this.meetingType.category === 'all-hands') {
      this.scene.cameras.main.shake(90, 0.0025);
    }

    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 1.12,
      scaleY: 0.75,
      duration: 190,
      ease: 'Quad.In',
      onComplete: () => this.destroy(),
    });
  }

  private emitDestructionEvent(): void {
    const payload: MeetingDestroyedPayload = {
      meetingId: this.config.id,
      typeId: this.meetingType.id,
      score: Math.round(this.meetingType.score * (this.config.scoreMultiplier ?? 1)),
      freedMinutes: Math.round(this.meetingType.freedMinutes * (this.config.scoreMultiplier ?? 1)),
      required: this.config.required ?? true,
      dropChance: this.meetingType.dropChance,
      x: this.x,
      y: this.y,
    };
    this.scene.game.events.emit(GAME_EVENTS.MEETING_DESTROYED, payload);
  }

  private createDestructionEffects(): void {
    const particles = this.scene.add.particles(
      this.x,
      this.y,
      PARTICLE_TEXTURE,
      {
        lifespan: 430,
        speed: { min: 55, max: 165 },
        angle: { min: 190, max: 350 },
        gravityY: 180,
        scale: { start: 0.9, end: 0 },
        tint: this.blockColor,
        emitting: false,
      },
    );
    particles.setDepth(8);
    particles.explode(12);
    this.scene.time.delayedCall(500, () => particles.destroy());

    const freedTime = this.scene.add
      .text(this.x, this.y, `+${this.meetingType.freedMinutes} мин`, {
        color: '#f8fafc',
        fontFamily: 'Arial, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        stroke: '#0f172a',
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(9);

    this.scene.tweens.add({
      targets: freedTime,
      y: freedTime.y - 42,
      alpha: 0,
      duration: 650,
      ease: 'Cubic.Out',
      onComplete: () => freedTime.destroy(),
    });
  }

  override destroy(fromScene?: boolean): void {
    this.behaviors.forEach((behavior) => behavior.dispose?.());
    if (this.collisionZone.active) {
      this.collisionZone.destroy(fromScene);
    }
    super.destroy(fromScene);
  }
}
