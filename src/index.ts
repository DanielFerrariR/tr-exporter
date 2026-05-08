import { consola } from 'consola';
import { isDebugMode } from '@/debugMode';
import { run } from '@/adapters/cli';

consola.level = isDebugMode ? 4 : 3;

(async () => {
  await run();
})();
