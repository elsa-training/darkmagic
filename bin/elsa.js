#!/usr/bin/env node
const path = require('path');
const cwd = path.join(__dirname, '..');
process.chdir(cwd);
require('ts-node').register({ transpileOnly: true });
require(path.resolve(__dirname, '../src/index.ts')).main();
