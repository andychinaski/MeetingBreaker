import { describe, expect, it } from 'vitest';
import { t } from './i18n';
describe('i18n', () => { it('switches stable keys without display text ids', () => { expect(t('ru', 'menu.play')).toBe('Играть'); expect(t('en', 'menu.play')).toBe('Play'); }); it('falls back to Russian for an unsupported locale', () => { expect(t('de' as 'ru', 'menu.play')).toBe('Играть'); }); });
