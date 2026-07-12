import { useState } from 'react';
import { normalizePlayerName, type ControlScheme, type Language, type PlayerPreferences } from '../services/storageService';
import styles from './SettingsModal.module.css';
import { t } from '../services/i18n';

export function OnboardingModal({ preferences, language, onComplete, onClose }: { preferences: PlayerPreferences; language: Language; onComplete: (value: PlayerPreferences, startTutorial: boolean) => void; onClose: () => void }) {
  const [step, setStep] = useState(preferences.playerName ? 1 : 0);
  const [name, setName] = useState(preferences.playerName ?? '');
  const [tutorial, setTutorial] = useState(!preferences.tutorialCompleted);
  const [skipTutorialPrompt, setSkipTutorialPrompt] = useState(preferences.skipTutorialPrompt);
  const [controlScheme, setControlScheme] = useState<ControlScheme>(preferences.controlScheme ?? 'keyboard');
  const [skipControlPrompt, setSkipControlPrompt] = useState(preferences.skipControlPrompt);
  const validName = normalizePlayerName(name);
  const finish = () => validName && onComplete({ playerName: validName, controlScheme, tutorialCompleted: preferences.tutorialCompleted, skipTutorialPrompt, skipControlPrompt }, tutorial);
  return <div className={styles.backdrop} role="dialog" aria-modal="true" aria-label={t(language, 'onboarding.title')}><section className={styles.modal}>
    <p className={styles.kicker}>{t(language, 'onboarding.title')} · {step + 1}/3</p>
    {step === 0 && <><h2>{t(language, 'onboarding.nameTitle')}</h2><label className={styles.field}><span>{t(language, 'onboarding.name')}</span><input autoFocus maxLength={24} value={name} onChange={(e) => setName(e.target.value)} /></label></>}
    {step === 1 && <><h2>{t(language, 'onboarding.tutorialTitle')}</h2><label className={styles.checkboxRow}><input type="radio" checked={tutorial} onChange={() => setTutorial(true)} /> {t(language, 'onboarding.tutorialYes')}</label><label className={styles.checkboxRow}><input type="radio" checked={!tutorial} onChange={() => setTutorial(false)} /> {t(language, 'onboarding.tutorialNo')}</label><label className={styles.checkboxRow}><input type="checkbox" checked={skipTutorialPrompt} onChange={(e) => setSkipTutorialPrompt(e.target.checked)} /> {t(language, 'onboarding.never')}</label></>}
    {step === 2 && <><h2>{t(language, 'onboarding.controlsTitle')}</h2>{(['keyboard', 'mouse'] as const).map((control) => <label className={styles.checkboxRow} key={control}><input type="radio" checked={controlScheme === control} onChange={() => setControlScheme(control)} /> {t(language, control === 'keyboard' ? 'controls.keyboard' : 'controls.mouse')}</label>)}<label className={styles.checkboxRow}><input type="checkbox" checked={skipControlPrompt} onChange={(e) => setSkipControlPrompt(e.target.checked)} /> {t(language, 'onboarding.never')}</label></>}
    <div className={styles.actions}><button className={styles.secondary} onClick={onClose}>{t(language, 'settings.cancel')}</button>{step > 0 && <button className={styles.secondary} onClick={() => setStep(step - 1)}>{t(language, 'common.back')}</button>}{step < 2 ? <button className={styles.primary} disabled={step === 0 && !validName} onClick={() => setStep(step + 1)}>{t(language, 'onboarding.next')}</button> : <button className={styles.primary} onClick={finish}>{t(language, 'onboarding.done')}</button>}</div>
  </section></div>;
}
