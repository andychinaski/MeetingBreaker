import Phaser from 'phaser';
import type { CalendarLayout } from '../types/calendar';
import {
  CALENDAR_STEP_MINUTES,
  calculateCalendarColumnWidth,
  calendarMinutesToY,
  formatCalendarTime,
  WORK_DAY_LABELS,
} from '../systems/calendarLayout';
import type { GameTheme } from '../config/theme';
import { getGameTheme } from '../config/theme';
import { DEFAULT_SETTINGS, SETTINGS_REGISTRY_KEY, type UserSettings } from '../../services/storageService';
import { workDayLabels } from '../../services/i18n';

export class CalendarGrid extends Phaser.GameObjects.Container {
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly labels: Phaser.GameObjects.Text[] = [];
  private readonly layout: CalendarLayout;
  private theme: GameTheme;
  private readonly dayLabels: readonly string[];
  constructor(scene: Phaser.Scene, layout: CalendarLayout) {
    super(scene, 0, 0);
    scene.add.existing(this);
    this.setDepth(0);

    this.layout = layout;
    const language = ((scene.game.registry.get(SETTINGS_REGISTRY_KEY) as UserSettings | undefined) ?? DEFAULT_SETTINGS).language;
    this.dayLabels = workDayLabels[language];
    this.theme = getGameTheme('dark');
    this.graphics = scene.add.graphics();
    this.add(this.graphics);
    this.drawColumns(this.graphics, layout);
    this.drawTimeLines(this.graphics, layout);
    this.createLabels(layout);
  }

  setTheme(theme: GameTheme): void {
    this.theme = theme;
    this.graphics.clear();
    this.drawColumns(this.graphics, this.layout);
    this.drawTimeLines(this.graphics, this.layout);
    this.labels.forEach((label, index) => label.setColor(index < WORK_DAY_LABELS.length ? theme.label : theme.mutedLabel));
  }

  private drawColumns(
    graphics: Phaser.GameObjects.Graphics,
    layout: CalendarLayout,
  ): void {
    const columnWidth = calculateCalendarColumnWidth(layout);

    for (let index = 0; index < WORK_DAY_LABELS.length; index += 1) {
      const x = layout.x + index * (columnWidth + layout.columnGap);
      graphics.fillStyle(index % 2 === 0 ? this.theme.columnOdd : this.theme.columnEven, 0.96);
      graphics.fillRoundedRect(x, layout.y, columnWidth, layout.height, 7);
      graphics.lineStyle(1, this.theme.border, 0.8);
      graphics.strokeRoundedRect(x, layout.y, columnWidth, layout.height, 7);
    }
  }

  private drawTimeLines(
    graphics: Phaser.GameObjects.Graphics,
    layout: CalendarLayout,
  ): void {
    for (
      let minutes = layout.startMinutes;
      minutes <= layout.endMinutes;
      minutes += CALENDAR_STEP_MINUTES
    ) {
      const y = calendarMinutesToY(minutes, layout);
      const isFullHour = minutes % 60 === 0;
      graphics.lineStyle(
        isFullHour ? 1.5 : 1,
        isFullHour ? this.theme.majorGrid : this.theme.minorGrid,
        isFullHour ? 0.5 : 0.25,
      );
      graphics.lineBetween(layout.x, y, layout.x + layout.width, y);
    }
  }

  private createLabels(layout: CalendarLayout): void {
    const columnWidth = calculateCalendarColumnWidth(layout);

    for (let index = 0; index < WORK_DAY_LABELS.length; index += 1) {
      const x =
        layout.x +
        index * (columnWidth + layout.columnGap) +
        columnWidth / 2;
      const label = this.scene.add
        .text(x, layout.y - 27, this.dayLabels[index] ?? '', {
          color: this.theme.label,
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      this.add(label);
      this.labels.push(label);
    }

    for (
      let minutes = layout.startMinutes;
      minutes <= layout.endMinutes;
      minutes += 60
    ) {
      const label = this.scene.add
        .text(
          layout.x - 12,
          calendarMinutesToY(minutes, layout),
          formatCalendarTime(minutes),
          {
            color: this.theme.mutedLabel,
            fontFamily: 'Arial, sans-serif',
            fontSize: '11px',
          },
        )
        .setOrigin(1, 0.5);
      this.add(label);
      this.labels.push(label);
    }
  }
}
