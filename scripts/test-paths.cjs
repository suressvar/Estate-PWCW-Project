/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS bridge for Playwright's config loader and native ESM test scripts. */
const path = require('node:path');
const net = require('node:net');
const testRoot = path.resolve(__dirname, '..');
const directory = process.env.TEST_APP_DIR || '.integration-app';
if (!['.integration-app', '.black-box-app'].includes(directory)) throw new Error('Use a supported disposable test directory.');
const rawPort = process.env.TEST_SERVER_PORT || '3107';
if (!/^\d+$/.test(rawPort) || Number(rawPort) < 1024 || Number(rawPort) > 65535) throw new Error('Invalid test server port.');
const testPort = Number(rawPort);
exports.testRoot = testRoot;
exports.testPort = testPort;
exports.testAppDir = path.join(testRoot, directory);
exports.testBaseURL = `http://localhost:${testPort}`;
exports.assertTestServerStopped = async function assertTestServerStopped() {
  const busy = await new Promise(resolve => {
    const socket = net.createConnection({ host: 'localhost', port: testPort });
    const finish = value => { socket.destroy(); resolve(value); };
    socket.once('connect', () => finish(true));
    socket.once('error', () => finish(false));
    socket.setTimeout(1000, () => finish(true));
  });
  if (busy) throw new Error(`Test port ${testPort} is in use. Stop that test server or choose a separate TEST_APP_DIR and TEST_SERVER_PORT before preparing data.`);
};
