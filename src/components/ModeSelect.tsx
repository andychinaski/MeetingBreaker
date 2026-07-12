import type { GameModeId } from '../game/types/mode';
import styles from './MainMenu.module.css';
import type { Language } from '../services/storageService';
import { t, type TranslationKey } from '../services/i18n';
const modes: { id: GameModeId; title: TranslationKey; text: TranslationKey }[] = [
  { id: 'campaign', title: 'modes.campaign.title', text: 'modes.campaign.description' },
  { id: 'relax', title: 'modes.relax.title', text: 'modes.relax.description' },
  { id: 'hard', title: 'modes.hard.title', text: 'modes.hard.description' },
];
export function ModeSelect({ onSelect, onBack, language }: { onSelect: (mode: GameModeId) => void; onBack: () => void; language: Language }) { return <section className={styles.menuCard} aria-label={t(language, 'modes.heading')}><div><p className={styles.kicker}>{t(language, 'modes.heading')}</p><p className={styles.description}>{t(language, 'modes.description')}</p></div><div className={styles.modeGrid}>{modes.map((mode) => <button className={styles.modeCard} key={mode.id} onClick={() => onSelect(mode.id)}><strong>{t(language, mode.title)}</strong><span>{t(language, mode.text)}</span></button>)}</div><button type="button" className={styles.settingsButton} onClick={onBack}>{t(language, 'common.back')}</button></section>; }
