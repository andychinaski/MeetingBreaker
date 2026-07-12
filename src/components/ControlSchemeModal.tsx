import type { ControlScheme } from '../services/storageService';
import { Modal } from './Modal';
import menuStyles from './MainMenu.module.css';
import type { Language } from '../services/storageService';
import { t } from '../services/i18n';

export function ControlSchemeModal({ onSelect, language }: { onSelect: (scheme: ControlScheme) => void; language: Language }) {
  return <Modal title={t(language, 'controls.title')} onClose={() => undefined} closable={false}>
    <p>{t(language, 'controls.required')}</p>
    <div className={menuStyles.modeGrid}>
      <button type="button" className={menuStyles.modeCard} onClick={() => onSelect('keyboard')}><strong>{t(language, 'controls.keyboard')}</strong><span>{t(language, 'controls.keyboardHint')}</span></button>
      <button type="button" className={menuStyles.modeCard} onClick={() => onSelect('mouse')}><strong>{t(language, 'controls.mouse')}</strong><span>{t(language, 'controls.mouseHint')}</span></button>
    </div>
  </Modal>;
}
