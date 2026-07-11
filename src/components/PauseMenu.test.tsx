import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PauseMenu } from './PauseMenu';

describe('PauseMenu', () => {
  it('renders resume, restart and exit actions', () => {
    const html = renderToStaticMarkup(
      <PauseMenu
        onResume={() => undefined}
        onRestart={() => undefined}
        onExit={() => undefined}
      />,
    );

    expect(html).toContain('Продолжить');
    expect(html).toContain('Начать заново');
    expect(html).toContain('Закончить рабочий день');
  });
});
