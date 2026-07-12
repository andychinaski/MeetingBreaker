import { Modal } from './Modal';
import styles from './SettingsModal.module.css';
import type { Language } from '../services/storageService';
import { t } from '../services/i18n';

export function InfoScreen({ onTutorial, onClose, language }: { onTutorial: () => void; onClose: () => void; language: Language }) {
  return <Modal title={t(language, 'info.title')} closeLabel={t(language, 'common.close')} onClose={onClose}>
    <p className={styles.kicker}>Meeting Breaker · v0.2.0</p>
    <p>{t(language, 'info.description')}</p>
    <h3>{t(language, 'info.modesTitle')}</h3><p>{t(language, 'info.modes')}</p>
    <h3>{t(language, 'info.authorTitle')}</h3><p>{t(language, 'info.author')} <a href="https://github.com/" target="_blank" rel="noreferrer">{t(language, 'info.repository')}</a>.</p>
    <div className={styles.actions}><button type="button" className={styles.primary} onClick={onTutorial}>{t(language, 'info.tutorial')}</button></div>
  </Modal>;
}
