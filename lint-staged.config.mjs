export default {
  '**/*.{ts,tsx}': [() => 'yarn typecheck', 'yarn lint:check'],
  '**/*': 'yarn format:check',
};
