export function getStepBricks(step) {
  const bricks = step?.bricks ?? step?.bricksUsed;
  return Array.isArray(bricks) ? bricks : [];
}

export function getAssemblyFrame(steps, index) {
  const selected = Math.max(0, Math.min(index, steps.length - 1));
  return {
    current: getStepBricks(steps[selected]),
    placed: steps.slice(0, selected + 1).flatMap(getStepBricks),
  };
}
