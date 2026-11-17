import fs from 'node:fs';
import path from 'node:path';
import { randomBytes, scryptSync } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const envFile = path.join(root, '.env.local');
let content = fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf8') : '';
if (!/^ESTATE_ADMIN_PASSWORD_HASH=/m.test(content)) {
  const password = randomBytes(24).toString('base64url');
  const salt = randomBytes(16).toString('hex');
  content += `\nESTATE_ADMIN_USERNAME=Admin\nESTATE_ADMIN_PASSWORD_HASH=${salt}:${scryptSync(password, salt, 64).toString('hex')}\n`;
  fs.mkdirSync(path.join(root, '.auth'), { recursive: true });
  fs.writeFileSync(path.join(root, '.auth', 'INITIAL_LOGIN.txt'), `Username: Admin\nPassword: ${password}\n\nKeep this file private. Authentication settings are in .env.local.\n`, { mode: 0o600 });
}
if (!/^ESTATE_SESSION_SECRET=/m.test(content)) content += `ESTATE_SESSION_SECRET=${randomBytes(48).toString('hex')}\n`;
fs.writeFileSync(envFile, content, { mode: 0o600 });
console.log('Server authentication configured. Private initial login saved in .auth/INITIAL_LOGIN.txt.');
