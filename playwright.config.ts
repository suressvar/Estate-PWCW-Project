import path from 'node:path';
import config from './playwright.integration.config';
if (path.resolve(process.cwd()) !== path.resolve(__dirname, '.integration-app')) {
  throw new Error('Use npm run test:e2e after preparing and building the isolated test copy. This prevents direct-storage tests from changing estate records.');
}
const isolatedConfig = { ...config, projects: config.projects?.filter(project => project.name === 'existing-browser') };
export default isolatedConfig;

