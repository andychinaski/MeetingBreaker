import { useState } from 'react';
import type { PlayerPreferences, UserSettings } from '../services/storageService';
import styles from './SettingsModal.module.css';
import { Modal } from './Modal';
import { t } from '../services/i18n';

interface SettingsModalProps {
  settings: UserSettings;
  preferences: PlayerPreferences;
  onSave: (settings: UserSettings, preferences: PlayerPreferences) => void;
  onTutorial: () => void;
  onClose: () => void;
}

export function SettingsModal({ settings, preferences, onSave, onTutorial, onClose }: SettingsModalProps) {
  const [draft, setDraft] = useState(settings);
  const [preferencesDraft, setPreferencesDraft] = useState(preferences);

  return (
    <Modal title={t(draft.language, 'settings.title')} closeLabel={t(draft.language, 'common.close')} onClose={onClose}>
        <p className={styles.kicker}>{t(draft.language, 'settings.local')}</p>

        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={draft.soundEnabled}
            onChange={(event) =>
              setDraft({ ...draft, soundEnabled: event.target.checked })
            }
          />
          <span>{t(draft.language, 'settings.sound')}</span>
        </label>

        <label className={styles.field}>
          <span>{t(draft.language, 'settings.volume')}: {Math.round(draft.volume * 100)}%</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={draft.volume}
            disabled={!draft.soundEnabled}
            onChange={(event) =>
              setDraft({ ...draft, volume: Number(event.target.value) })
            }
          />
        </label>

        <label className={styles.checkboxRow}><input type="checkbox" checked={draft.musicEnabled} onChange={(event) => setDraft({ ...draft, musicEnabled: event.target.checked })} /><span>{t(draft.language, 'settings.music')}</span></label>
        <label className={styles.field}><span>{t(draft.language, 'settings.musicVolume')}: {Math.round(draft.musicVolume * 100)}%</span><input type="range" min="0" max="1" step="0.05" value={draft.musicVolume} disabled={!draft.musicEnabled} onChange={(event) => setDraft({ ...draft, musicVolume: Number(event.target.value) })} /></label>

        <label className={styles.field}>
          <span>{t(draft.language, 'settings.theme')}</span>
          <select
            value={draft.theme}
            onChange={(event) =>
              setDraft({
                ...draft,
                theme: event.target.value as UserSettings['theme'],
              })
            }
          >
            <option value="dark">{t(draft.language, 'settings.dark')}</option>
            <option value="light">{t(draft.language, 'settings.light')}</option>
          </select>
        </label>
        <label className={styles.field}><span>{t(draft.language, 'settings.controls')}</span><select value={preferencesDraft.controlScheme ?? ''} onChange={(event) => setPreferencesDraft({ ...preferencesDraft, controlScheme: event.target.value as Exclude<PlayerPreferences['controlScheme'], null> })}><option value="" disabled>{t(draft.language, 'controls.title')}</option><option value="keyboard">{t(draft.language, 'controls.keyboard')}</option><option value="mouse">{t(draft.language, 'controls.mouse')}</option></select></label>
        <label className={styles.field}><span>{t(draft.language, 'settings.language')}</span><select value={draft.language} onChange={(event) => setDraft({ ...draft, language: event.target.value as UserSettings['language'] })}><option value="ru">Русский</option><option value="en">English</option></select></label>
        <label className={styles.field}><span>{t(draft.language, 'settings.palette')}</span><select value={draft.meetingPalette} onChange={(event) => setDraft({ ...draft, meetingPalette: event.target.value as UserSettings['meetingPalette'] })}><option value="default">{t(draft.language, 'settings.defaultPalette')}</option><option value="pastel">{t(draft.language, 'settings.pastel')}</option><option value="high-contrast">{t(draft.language, 'settings.contrast')}</option></select></label>
        <label className={styles.field}><span>{t(draft.language, 'settings.playerName')}</span><input maxLength={24} value={preferencesDraft.playerName ?? ''} onChange={(event) => setPreferencesDraft({ ...preferencesDraft, playerName: event.target.value })} /></label>
        <button type="button" className={`${styles.secondary} ${styles.repeatTutorial}`} onClick={onTutorial}>{t(draft.language, 'settings.repeatTutorial')}</button>

        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={onClose}>
            {t(draft.language, 'settings.cancel')}
          </button>
          <button
            type="button"
            className={styles.primary}
            onClick={() => onSave(draft, preferencesDraft)}
          >
            {t(draft.language, 'settings.save')}
          </button>
        </div>
    </Modal>
  );
}
