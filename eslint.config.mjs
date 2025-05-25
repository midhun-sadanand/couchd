import nextPlugin from '@next/eslint-plugin-next';
export default [
  nextPlugin.configs.recommended,
  nextPlugin.configs['core-web-vitals']
];
