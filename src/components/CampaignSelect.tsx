import type { LevelConfig } from '../game/types/level';
import type { PlayerProgress } from '../services/storageService';
import styles from './MainMenu.module.css';
import type { Language } from '../services/storageService';
import { t, translateLevelTitle } from '../services/i18n';

export function CampaignSelect({ levels, progress, selectedLevelId, onSelectLevel, onStart, onBack, language }: { levels: readonly LevelConfig[]; progress: PlayerProgress; selectedLevelId: string; onSelectLevel: (id: string) => void; onStart: () => void; onBack: () => void; language: Language }) {
  return <section className={styles.menuCard} aria-label={t(language, 'campaign.heading')}>
    <div><p className={styles.kicker}>{t(language, 'campaign.heading')}</p><p className={styles.description}>{t(language, 'campaign.description')}</p></div>
    <label className={styles.levelSelect}><span>{t(language, 'campaign.level')}</span><select value={selectedLevelId} onChange={(event) => onSelectLevel(event.target.value)}>{levels.map((level) => <option key={level.id} value={level.id} disabled={!progress.unlockedLevelIds.includes(level.id)}>{translateLevelTitle(language, level.id, level.title)}</option>)}</select></label>
    <div className={styles.menuActions}><button type="button" className={styles.startButton} onClick={onStart}>{t(language, 'campaign.start')}</button><button type="button" className={styles.settingsButton} onClick={onBack}>{t(language, 'campaign.back')}</button></div>
  </section>;
}
