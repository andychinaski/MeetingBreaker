import Phaser from 'phaser';
import type { CalendarLayout } from '../types/calendar';
import {
  CALENDAR_STEP_MINUTES,
  calculateCalendarColumnWidth,
  calendarMinutesToY,
  formatCalendarTime,
  WORK_DAY_LABELS,
} from '../systems/calendarLayout';

export class CalendarGrid extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, layout: CalendarLayout) {
    super(scene, 0, 0);
    scene.add.existing(this);
    this.setDepth(0);

    const graphics = scene.add.graphics();
    this.add(graphics);
    this.drawColumns(graphics, layout);
    this.drawTimeLines(graphics, layout);
    this.createLabels(layout);
  }

  private drawColumns(
    graphics: Phaser.GameObjects.Graphics,
    layout: CalendarLayout,
  ): void {
    const columnWidth = calculateCalendarColumnWidth(layout);

    for (let index = 0; index < WORK_DAY_LABELS.length; index += 1) {
      const x = layout.x + index * (columnWidth + layout.columnGap);
      graphics.fillStyle(index % 2 === 0 ? 0x111c2e : 0x142033, 0.9);
      graphics.fillRoundedRect(x, layout.y, columnWidth, layout.height, 7);
      graphics.lineStyle(1, 0x334155, 0.7);
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
        isFullHour ? 0x64748b : 0x475569,
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
        .text(x, layout.y - 27, WORK_DAY_LABELS[index] ?? '', {
          color: '#cbd5e1',
          fontFamily: 'Arial, sans-serif',
          fontSize: '14px',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);
      this.add(label);
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
            color: '#64748b',
            fontFamily: 'Arial, sans-serif',
            fontSize: '11px',
          },
        )
        .setOrigin(1, 0.5);
      this.add(label);
    }
  }
}
