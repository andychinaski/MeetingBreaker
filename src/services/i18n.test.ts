import { describe, expect, it } from 'vitest';
import { t } from './i18n';
describe('i18n', () => { it('switches stable keys without display text ids', () => { expect(t('ru', 'menu.play')).toBe('Играть'); expect(t('en', 'menu.play')).toBe('Play'); }); });
