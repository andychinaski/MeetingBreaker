import { GameCanvas } from '../components/GameCanvas';
import styles from './App.module.css';

export function App() {
  return (
    <main className={styles.appShell}>
      <header className={styles.header}>
        <p className={styles.eyebrow}>Дай календарю пизды</p>
        <h1>Meeting Breaker</h1>
        <p className={styles.subtitle}>
          Освобождайте фокус-время — по одной встрече за раз.
        </p>
      </header>

      <GameCanvas />
    </main>
  );
}
