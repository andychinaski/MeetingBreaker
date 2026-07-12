import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
  const overlayRef = useRef<HTMLElement>(null);
  const [spotlightRect, setSpotlightRect] = useState<{ left: number; top: number; width: number; height: number }>();

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

  useLayoutEffect(() => {
    const overlay = overlayRef.current;
    const target = state?.step?.spotlightTarget;
    if (!overlay || !target) { setSpotlightRect(undefined); return; }
    const update = () => {
      const overlayBounds = overlay.getBoundingClientRect();
      const canvas = overlay.parentElement?.querySelector('canvas');
      const worldRect = state?.spotlight;
      if (worldRect && canvas) {
        const canvasBounds = canvas.getBoundingClientRect();
        const scaleX = canvasBounds.width / 1280;
        const scaleY = canvasBounds.height / 720;
        const padding = 9;
        setSpotlightRect({
          left: canvasBounds.left - overlayBounds.left + worldRect.x * scaleX - padding,
          top: canvasBounds.top - overlayBounds.top + worldRect.y * scaleY - padding,
          width: worldRect.width * scaleX + padding * 2,
          height: worldRect.height * scaleY + padding * 2,
        });
        return;
      }
      const anchor = overlay.parentElement?.querySelector<HTMLElement>(`[data-tutorial-anchor="${target}"]`);
      if (!anchor) { setSpotlightRect(undefined); return; }
      const bounds = anchor.getBoundingClientRect();
      setSpotlightRect({ left: bounds.left - overlayBounds.left - 4, top: bounds.top - overlayBounds.top - 4, width: bounds.width + 8, height: bounds.height + 8 });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(overlay);
    if (overlay.parentElement) observer.observe(overlay.parentElement);
    window.addEventListener('resize', update);
    return () => { observer.disconnect(); window.removeEventListener('resize', update); };
  }, [state?.spotlight, state?.step?.spotlightTarget]);

  if (!state?.step || state.phase === 'completed') return null;
  const { step } = state;
  let messageKey: TranslationKey = step.messageKey;
  if (state.phase === 'success') messageKey = 'tutorial.success';
  else if (state.phase === 'action' && step.id === 'paddle') messageKey = controlScheme === 'mouse' ? 'tutorial.moveMouse' : 'tutorial.moveKeyboard';
  else if (state.phase === 'action' && step.id === 'ball') messageKey = controlScheme === 'mouse' ? 'tutorial.launchMouse' : 'tutorial.launchKeyboard';
  else if (state.phase === 'action' && step.actionMessageKey) messageKey = step.actionMessageKey;

  const skip = () => {
    if (!confirmSkip) { setConfirmSkip(true); return; }
    bridge.emit(GAME_COMMANDS.TUTORIAL_SKIP);
  };

  return <section ref={overlayRef} className={`${styles.overlay} ${state.phase === 'explanation' ? styles.explanation : styles.action} ${state.phase === 'success' ? styles.success : ''}`} aria-live="polite">
    {spotlightRect && <div className={`${styles.spotlight} ${step.spotlightTarget === 'ball' || step.spotlightTarget === 'bonus' ? styles.round : ''}`} style={spotlightRect} data-tutorial-target={step.spotlightTarget} />}
    <div className={styles.card}>
      <p className={styles.counter}>{state.index + 1} / 8</p>
      <p className={styles.message}>{confirmSkip ? t(language, 'tutorial.skipTitle') : t(language, messageKey)}</p>
      <div className={styles.actions}>
        {state.phase === 'explanation' && !confirmSkip && <button type="button" className={styles.primary} onClick={() => bridge.emit(GAME_COMMANDS.TUTORIAL_CONTINUE)}>{t(language, 'tutorial.continue')}</button>}
        {state.phase !== 'success' && <button type="button" className={styles.secondary} onClick={skip}>{t(language, confirmSkip ? 'tutorial.skipConfirm' : 'tutorial.skip')}</button>}
        {confirmSkip && <button type="button" className={styles.secondary} onClick={() => setConfirmSkip(false)}>{t(language, 'common.back')}</button>}
      </div>
    </div>
  </section>;
}
