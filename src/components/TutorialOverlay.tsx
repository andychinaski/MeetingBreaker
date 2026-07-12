import { useEffect, useRef, useState } from 'react';
import { GAME_COMMANDS, GAME_EVENTS, TUTORIAL_STATE_REGISTRY_KEY, type TutorialChangedPayload } from '../game/events/gameEvents';
import type { ControlScheme, Language } from '../services/storageService';
import { t, type TranslationKey } from '../services/i18n';
import styles from './TutorialOverlay.module.css';
import type { GameBridge } from './GameBridge';

interface TutorialOverlayProps {
  bridge: GameBridge;
  language: Language;
  controlScheme: ControlScheme;
  onCompleted: () => void;
}

export function TutorialOverlay({ bridge, language, controlScheme, onCompleted }: TutorialOverlayProps) {
  const [state, setState] = useState<TutorialChangedPayload | undefined>(() => bridge.getRegistry<TutorialChangedPayload>(TUTORIAL_STATE_REGISTRY_KEY));
  const [confirmSkip, setConfirmSkip] = useState(false);
  const completionReported = useRef(false);

  useEffect(() => {
    const handleChange = (payload: TutorialChangedPayload) => { setState(payload); setConfirmSkip(false); };
    bridge.on(GAME_EVENTS.TUTORIAL_CHANGED, handleChange);
    setState(bridge.getRegistry<TutorialChangedPayload>(TUTORIAL_STATE_REGISTRY_KEY));
    return () => { bridge.off(GAME_EVENTS.TUTORIAL_CHANGED, handleChange); };
  }, [bridge]);

  useEffect(() => {
    if (state?.phase === 'completed' && !completionReported.current) {
      completionReported.current = true;
      onCompleted();
    }
  }, [onCompleted, state?.phase]);

  if (!state?.step || state.phase === 'completed') return null;
  const { step } = state;
  let messageKey: TranslationKey = step.messageKey;
  if (state.phase === 'action' && step.id === 'paddle') messageKey = controlScheme === 'mouse' ? 'tutorial.moveMouse' : 'tutorial.moveKeyboard';
  else if (state.phase === 'action' && step.id === 'ball') messageKey = controlScheme === 'mouse' ? 'tutorial.launchMouse' : 'tutorial.launchKeyboard';
  else if (state.phase === 'action' && step.actionMessageKey) messageKey = step.actionMessageKey;

  const skip = () => {
    if (!confirmSkip) { setConfirmSkip(true); return; }
    bridge.emit(GAME_COMMANDS.TUTORIAL_SKIP);
  };

  return <section className={`${styles.overlay} ${state.phase === 'action' ? styles.action : styles.explanation}`} aria-live="polite">
    {step.spotlightTarget && <div className={`${styles.spotlight} ${styles[step.spotlightTarget]}`} data-tutorial-target={step.spotlightTarget} />}
    <div className={styles.card}>
      <p className={styles.counter}>{state.index + 1} / 8</p>
      <p className={styles.message}>{confirmSkip ? t(language, 'tutorial.skipTitle') : t(language, messageKey)}</p>
      <div className={styles.actions}>
        {state.phase === 'explanation' && !confirmSkip && <button type="button" className={styles.primary} onClick={() => bridge.emit(GAME_COMMANDS.TUTORIAL_CONTINUE)}>{t(language, 'tutorial.continue')}</button>}
        <button type="button" className={styles.secondary} onClick={skip}>{t(language, confirmSkip ? 'tutorial.skipConfirm' : 'tutorial.skip')}</button>
        {confirmSkip && <button type="button" className={styles.secondary} onClick={() => setConfirmSkip(false)}>{t(language, 'common.back')}</button>}
      </div>
    </div>
  </section>;
}
