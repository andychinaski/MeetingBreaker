export interface CoffeeConsumptionResult {
  previousCoffeeCups: number;
  coffeeCups: number;
  consumed: boolean;
  empty: boolean;
}

export class CoffeeSystem {
  private cups: number;

  constructor(readonly initialCoffeeCups: number) {
    if (!Number.isInteger(initialCoffeeCups) || initialCoffeeCups <= 0) {
      throw new Error('Initial coffee cups must be a positive integer');
    }

    this.cups = initialCoffeeCups;
  }

  get coffeeCups(): number {
    return this.cups;
  }

  get coffeeSpent(): number {
    return this.initialCoffeeCups - this.cups;
  }

  consume(): CoffeeConsumptionResult {
    const previousCoffeeCups = this.cups;
    this.cups = Math.max(0, this.cups - 1);

    return {
      previousCoffeeCups,
      coffeeCups: this.cups,
      consumed: previousCoffeeCups > this.cups,
      empty: this.cups === 0,
    };
  }
}
