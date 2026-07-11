import { useState } from 'react';
import type { UserSettings } from '../services/storageService';
import styles from './SettingsModal.module.css';

interface SettingsModalProps {
  settings: UserSettings;
  onSave: (settings: UserSettings) => void;
  onClose: () => void;
}

export function SettingsModal({ settings, onSave, onClose }: SettingsModalProps) {
  const [draft, setDraft] = useState(settings);

  return (
    <div className={styles.backdrop} role="dialog" aria-modal="true">
      <section className={styles.modal}>
        <p className={styles.kicker}>Локальные настройки</p>
        <h2>Настройки</h2>

        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={draft.soundEnabled}
            onChange={(event) =>
              setDraft({ ...draft, soundEnabled: event.target.checked })
            }
          />
          <span>Звук включён</span>
        </label>

        <label className={styles.field}>
          <span>Громкость: {Math.round(draft.volume * 100)}%</span>
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

        <label className={styles.field}>
          <span>Тема</span>
          <select
            value={draft.theme}
            onChange={(event) =>
              setDraft({
                ...draft,
                theme: event.target.value as UserSettings['theme'],
              })
            }
          >
            <option value="dark">Тёмная</option>
            <option value="light">Светлая</option>
          </select>
        </label>

        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={onClose}>
            Отмена
          </button>
          <button
            type="button"
            className={styles.primary}
            onClick={() => onSave(draft)}
          >
            Сохранить
          </button>
        </div>
      </section>
    </div>
  );
}
