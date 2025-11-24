import { showMenu } from '@/cli/menu';

// Setup graceful exit handler
const setupExitHandler = () => {
  process.on('SIGINT', () => {
    console.log('\n\nGracefully shutting down...');
    process.exit(0);
  });
};

export const run = async (): Promise<void> => {
  setupExitHandler();
  await showMenu();
};
