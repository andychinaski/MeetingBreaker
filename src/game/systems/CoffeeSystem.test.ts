import { describe, expect, it } from 'vitest';
import { CoffeeSystem } from './CoffeeSystem';

describe('CoffeeSystem', () => {
  it('consumes one cup after a lost ball', () => {
    const coffee = new CoffeeSystem(3);

    expect(coffee.consume().coffeeCups).toBe(2);
  });

  it('never becomes negative', () => {
    const coffee = new CoffeeSystem(1);

    coffee.consume();
    coffee.consume();

    expect(coffee.coffeeCups).toBe(0);
  });

  it('allows another launch while coffee remains', () => {
    const coffee = new CoffeeSystem(2);

    expect(coffee.consume().empty).toBe(false);
  });

  it('reports defeat after the final cup', () => {
    const coffee = new CoffeeSystem(1);

    expect(coffee.consume().empty).toBe(true);
  });
});
