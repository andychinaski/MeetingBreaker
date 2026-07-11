import { useState } from 'react';
import { normalizePlayerName, type ControlScheme, type PlayerPreferences } from '../services/storageService';
import styles from './SettingsModal.module.css';

export function OnboardingModal({ preferences, onComplete, onClose }: { preferences: PlayerPreferences; onComplete: (value: PlayerPreferences, startTutorial: boolean) => void; onClose: () => void }) {
  const [step, setStep] = useState(preferences.playerName ? 1 : 0);
  const [name, setName] = useState(preferences.playerName ?? '');
  const [tutorial, setTutorial] = useState(!preferences.tutorialCompleted);
  const [skipTutorialPrompt, setSkipTutorialPrompt] = useState(preferences.skipTutorialPrompt);
  const [controlScheme, setControlScheme] = useState<ControlScheme>(preferences.controlScheme);
  const [skipControlPrompt, setSkipControlPrompt] = useState(preferences.skipControlPrompt);
  const validName = normalizePlayerName(name);
  const finish = () => validName && onComplete({ playerName: validName, controlScheme, tutorialCompleted: preferences.tutorialCompleted, skipTutorialPrompt, skipControlPrompt }, tutorial);
  return <div className={styles.backdrop} role="dialog" aria-modal="true" aria-label="Первый запуск"><section className={styles.modal}>
    <p className={styles.kicker}>Первый запуск · {step + 1}/3</p>
    {step === 0 && <><h2>Как тебя зовут?</h2><label className={styles.field}><span>Имя игрока (2–24 символа)</span><input autoFocus maxLength={24} value={name} onChange={(e) => setName(e.target.value)} /></label></>}
    {step === 1 && <><h2>Пройти обучение?</h2><label className={styles.checkboxRow}><input type="radio" checked={tutorial} onChange={() => setTutorial(true)} /> Да, покажите механику</label><label className={styles.checkboxRow}><input type="radio" checked={!tutorial} onChange={() => setTutorial(false)} /> Нет, сразу в календарь</label><label className={styles.checkboxRow}><input type="checkbox" checked={skipTutorialPrompt} onChange={(e) => setSkipTutorialPrompt(e.target.checked)} /> Больше не показывать</label></>}
    {step === 2 && <><h2>Выбери управление</h2>{(['keyboard', 'mouse'] as const).map((control) => <label className={styles.checkboxRow} key={control}><input type="radio" checked={controlScheme === control} onChange={() => setControlScheme(control)} /> {control === 'keyboard' ? 'Клавиатура' : 'Мышь'}</label>)}<label className={styles.checkboxRow}><input type="checkbox" checked={skipControlPrompt} onChange={(e) => setSkipControlPrompt(e.target.checked)} /> Больше не показывать</label></>}
    <div className={styles.actions}><button className={styles.secondary} onClick={onClose}>Отмена</button>{step > 0 && <button className={styles.secondary} onClick={() => setStep(step - 1)}>Назад</button>}{step < 2 ? <button className={styles.primary} disabled={step === 0 && !validName} onClick={() => setStep(step + 1)}>Далее</button> : <button className={styles.primary} onClick={finish}>Готово</button>}</div>
  </section></div>;
}
