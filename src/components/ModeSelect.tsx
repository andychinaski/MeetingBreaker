import type { GameModeId } from '../game/types/mode';
import styles from './MainMenu.module.css';
const modes: { id: GameModeId; title: string; text: string }[] = [
  { id: 'campaign', title: 'Прохождение', text: 'Пять недель, последовательное открытие и финальный All Hands.' },
  { id: 'relax', title: 'Relax Mode', text: 'Бесконечные волны, постоянная скорость и больше бонусов.' },
  { id: 'hard', title: 'Hard Mode', text: 'Без кофе: одна ошибка завершает сессию, награда ×1,75.' },
];
export function ModeSelect({ onSelect, onBack }: { onSelect: (mode: GameModeId) => void; onBack: () => void }) { return <section className={styles.menuCard} aria-label="Выбор режима"><div><p className={styles.kicker}>Игровой режим</p><p className={styles.description}>Выберите способ разобрать календарь.</p></div><div className={styles.modeGrid}>{modes.map((mode) => <button className={styles.modeCard} key={mode.id} onClick={() => onSelect(mode.id)}><strong>{mode.title}</strong><span>{mode.text}</span></button>)}</div><button type="button" className={styles.settingsButton} onClick={onBack}>Назад</button></section>; }
