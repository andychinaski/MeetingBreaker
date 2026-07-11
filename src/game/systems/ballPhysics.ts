export interface Velocity {
  x: number;
  y: number;
}

export type HorizontalDirection = -1 | 1;

export const INITIAL_BALL_SPEED = 430;
export const MAX_BALL_SPEED = 760;
export const MIN_HORIZONTAL_SPEED = 90;
export const MIN_VERTICAL_SPEED = 220;
export const BALL_ACCELERATION_PER_SECOND = 7;

const MAX_PADDLE_BOUNCE_ANGLE = degToRad(65);
const LOOP_NUDGE_ANGLE = degToRad(7);

function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function magnitude(velocity: Velocity): number {
  return Math.hypot(velocity.x, velocity.y);
}

function directionOrFallback(
  value: number,
  fallback: HorizontalDirection,
): HorizontalDirection {
  return value < 0 ? -1 : value > 0 ? 1 : fallback;
}

export function stabilizeVelocity(
  velocity: Velocity,
  fallbackHorizontalDirection: HorizontalDirection = 1,
): Velocity {
  const minimumSafeSpeed = Math.hypot(
    MIN_HORIZONTAL_SPEED,
    MIN_VERTICAL_SPEED,
  );
  const speed = clamp(
    magnitude(velocity),
    minimumSafeSpeed,
    MAX_BALL_SPEED,
  );
  const horizontalDirection = directionOrFallback(
    velocity.x,
    fallbackHorizontalDirection,
  );
  const verticalDirection = velocity.y > 0 ? 1 : -1;

  const currentAngleFromVertical = Math.atan2(
    Math.abs(velocity.x),
    Math.abs(velocity.y),
  );
  const minimumAngleFromVertical = Math.asin(
    Math.min(MIN_HORIZONTAL_SPEED / speed, 1),
  );
  const maximumAngleFromVertical = Math.acos(
    Math.min(MIN_VERTICAL_SPEED / speed, 1),
  );
  const safeAngle = clamp(
    currentAngleFromVertical,
    minimumAngleFromVertical,
    maximumAngleFromVertical,
  );

  return {
    x: horizontalDirection * speed * Math.sin(safeAngle),
    y: verticalDirection * speed * Math.cos(safeAngle),
  };
}

export function calculatePaddleBounce(
  ballX: number,
  paddleCenterX: number,
  paddleWidth: number,
  currentSpeed: number,
  fallbackHorizontalDirection: HorizontalDirection = 1,
): Velocity {
  const relativeHitPosition = clamp(
    (ballX - paddleCenterX) / (paddleWidth / 2),
    -1,
    1,
  );
  const speed = clamp(
    currentSpeed,
    INITIAL_BALL_SPEED,
    MAX_BALL_SPEED,
  );
  const bounceAngle = relativeHitPosition * MAX_PADDLE_BOUNCE_ANGLE;

  return stabilizeVelocity(
    {
      x: speed * Math.sin(bounceAngle),
      y: -speed * Math.cos(bounceAngle),
    },
    fallbackHorizontalDirection,
  );
}

export function accelerateVelocity(
  velocity: Velocity,
  elapsedSeconds: number,
): Velocity {
  const currentSpeed = magnitude(velocity);

  if (currentSpeed === 0 || elapsedSeconds <= 0) {
    return velocity;
  }

  const targetSpeed = Math.min(
    currentSpeed + BALL_ACCELERATION_PER_SECOND * elapsedSeconds,
    MAX_BALL_SPEED,
  );
  const scale = targetSpeed / currentSpeed;

  return stabilizeVelocity({
    x: velocity.x * scale,
    y: velocity.y * scale,
  });
}

export function nudgeLoopingTrajectory(
  velocity: Velocity,
  direction: HorizontalDirection,
): Velocity {
  const angle = LOOP_NUDGE_ANGLE * direction;
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);

  return stabilizeVelocity(
    {
      x: velocity.x * cosine - velocity.y * sine,
      y: velocity.x * sine + velocity.y * cosine,
    },
    direction,
  );
}

export function hasRepeatingImpacts(
  impactOffsets: readonly number[],
  tolerance = 0.04,
): boolean {
  if (impactOffsets.length < 3) {
    return false;
  }

  const recentImpacts = impactOffsets.slice(-3);
  return Math.max(...recentImpacts) - Math.min(...recentImpacts) <= tolerance;
}
