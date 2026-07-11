import { Modal } from './Modal';
import styles from './SettingsModal.module.css';

export function InfoScreen({ onTutorial, onClose }: { onTutorial: () => void; onClose: () => void }) {
  return <Modal title="О проекте" onClose={onClose}>
    <p className={styles.kicker}>Meeting Breaker · v0.2.0</p>
    <p>Аркада о защите фокус-времени. Двигайте платформу, разбивайте встречи, собирайте бонусы и не тратьте весь кофе.</p>
    <h3>Режимы</h3><p>Прохождение открывает недели месяца. Relax и Hard создают бесконечные волны встреч с разными правилами.</p>
    <h3>Автор и исходный код</h3><p>Создано как независимый web-проект. <a href="https://github.com/" target="_blank" rel="noreferrer">Репозиторий</a>. Используются React, Phaser, Vite и их открытые лицензии.</p>
    <div className={styles.actions}><button type="button" className={styles.primary} onClick={onTutorial}>Запустить обучение</button></div>
  </Modal>;
}
