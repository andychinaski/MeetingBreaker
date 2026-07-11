import { useState } from 'react';
import type { PlayerPreferences, UserSettings } from '../services/storageService';
import styles from './SettingsModal.module.css';

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

        <label className={styles.checkboxRow}><input type="checkbox" checked={draft.musicEnabled} onChange={(event) => setDraft({ ...draft, musicEnabled: event.target.checked })} /><span>Музыка включена</span></label>
        <label className={styles.field}><span>Громкость музыки: {Math.round(draft.musicVolume * 100)}%</span><input type="range" min="0" max="1" step="0.05" value={draft.musicVolume} disabled={!draft.musicEnabled} onChange={(event) => setDraft({ ...draft, musicVolume: Number(event.target.value) })} /></label>

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
        <label className={styles.field}><span>Управление</span><select value={preferencesDraft.controlScheme} onChange={(event) => setPreferencesDraft({ ...preferencesDraft, controlScheme: event.target.value as PlayerPreferences['controlScheme'] })}><option value="keyboard">Клавиатура</option><option value="mouse">Мышь</option></select></label>
        <label className={styles.field}><span>Язык</span><select value={draft.language} onChange={(event) => setDraft({ ...draft, language: event.target.value as UserSettings['language'] })}><option value="ru">Русский</option><option value="en">English</option></select></label>
        <label className={styles.field}><span>Палитра встреч</span><select value={draft.meetingPalette} onChange={(event) => setDraft({ ...draft, meetingPalette: event.target.value as UserSettings['meetingPalette'] })}><option value="default">Стандартная</option><option value="pastel">Пастельная</option><option value="high-contrast">Высокий контраст</option></select></label>
        <label className={styles.field}><span>Имя игрока</span><input maxLength={24} value={preferencesDraft.playerName ?? ''} onChange={(event) => setPreferencesDraft({ ...preferencesDraft, playerName: event.target.value })} /></label>
        <button type="button" className={styles.secondary} onClick={onTutorial}>Повторить обучение</button>

        <div className={styles.actions}>
          <button type="button" className={styles.secondary} onClick={onClose}>
            Отмена
          </button>
          <button
            type="button"
            className={styles.primary}
            onClick={() => onSave(draft, preferencesDraft)}
          >
            Сохранить
          </button>
        </div>
      </section>
    </div>
  );
}
