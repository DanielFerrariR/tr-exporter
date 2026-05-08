import { randomBytes } from 'crypto';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import os from 'os';

const DEVICE_ID_FILE = join(os.homedir(), '.tr-exporter-device-id');

export function getOrCreateDeviceId(): string {
  if (existsSync(DEVICE_ID_FILE)) {
    return readFileSync(DEVICE_ID_FILE, 'utf8').trim();
  }
  const id = randomBytes(64).toString('hex');
  writeFileSync(DEVICE_ID_FILE, id, 'utf8');
  return id;
}
