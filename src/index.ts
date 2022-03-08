import { storage } from '@steffy/di';
import { Application } from './application';
import { boot } from './boot.sequence';
import { config } from 'dotenv';
import { moduleLoader } from '@steffy/core';

config();

export async function main() {
  await moduleLoader('./src/configs', 'builder');
  await boot();
  const app = storage.get(Application);
  await app.start();
}

