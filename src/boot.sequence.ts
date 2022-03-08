import { jsonLoader, moduleLoader } from '@steffy/core';

export const boot = async () => {
  await jsonLoader('./src/configs', 'config');
  await moduleLoader('./middlewares', 'middleware');
  await moduleLoader('./plugins', 'plugin');
  await moduleLoader('./models/repositories', 'customRepository');
  await moduleLoader('./factories', 'factory');
  await moduleLoader('./controllers', 'controller');
  await moduleLoader('./services', 'service');
};
