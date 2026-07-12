import { useEffect, useId, useRef } from 'react';
import styles from './Modal.module.css';

interface ModalProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  closable?: boolean;
  closeLabel?: string;
}

export function Modal({ title, children, onClose, closable = true, closeLabel = 'Закрыть' }: ModalProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    const opener = openerRef.current ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    openerRef.current = opener;
    const focusable = () => [...(dialog?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])') ?? [])];
    focusable()[0]?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closable) { event.preventDefault(); onClose(); return; }
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0]!;
      const last = items[items.length - 1]!;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => { document.removeEventListener('keydown', handleKeyDown); opener?.focus(); };
  }, [closable, onClose]);

  return <div className={styles.backdrop} onMouseDown={(event) => { if (closable && event.target === event.currentTarget) onClose(); }}>
    <section ref={dialogRef} className={styles.modal} role="dialog" aria-modal="true" aria-labelledby={titleId}>
      <header className={styles.header}><h2 id={titleId}>{title}</h2>{closable && <button type="button" className={styles.closeButton} aria-label={closeLabel} onClick={onClose}>×</button>}</header>
      {children}
    </section>
  </div>;
}
