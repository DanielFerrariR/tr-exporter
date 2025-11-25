import readline from 'readline';
import { TradeRepublicAPI } from '@/api';
import { CONNECTION_STATUS } from '@/constants';

export const interactiveSocketConnection = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const readlineInterface = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: 'Enter message to send: ',
    });

    let keepAliveInterval: NodeJS.Timeout | undefined;

    TradeRepublicAPI.getInstance().connect({
      onOpen: () => {
        console.log('WebSocket connection opened.');
      },
      onConnected: () => {
        console.log('\n--- WebSocket Ready ---');
        console.log('You can now type messages to send.');
        console.log(`Example: {"type":"cash"}`);
        console.log('Type "exit" to close the connection.');
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
        readlineInterface.prompt(true);

        // Start keep-alive mechanism - send a message every 25 seconds
        keepAliveInterval = setInterval(() => {
          if (
            TradeRepublicAPI.getInstance().getConnectionStatus() ===
            CONNECTION_STATUS.OPEN
          ) {
            TradeRepublicAPI.getInstance().sendMessage('echo');
          }
        }, 25000);
      },
      onMessage: (message) => {
        // Ignore echo messages
        if (message === 'echo') return;
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
        console.log('Received WebSocket message:', message);
        readlineInterface.prompt(true);
      },
      onClose: (event) => {
        // Clear keep-alive interval
        if (keepAliveInterval) {
          clearInterval(keepAliveInterval);
        }

        // Code 1000 is normal closure
        // Code 1001 is "going away"
        // Codes 1002-1015 are various error conditions
        const isNormalClosure = event.code === 1000 || event.code === 1001;

        readlineInterface.close();

        if (isNormalClosure) {
          console.log('WebSocket connection closed.');
          resolve();
        } else {
          const error = new Error(
            `WebSocket connection closed unexpectedly: Code ${event.code}, Reason: ${event.reason || 'No reason provided'}`,
          );
          console.error(error.message);
          reject(error);
        }
      },
      onError: (error) => {
        // Clear keep-alive interval
        if (keepAliveInterval) {
          clearInterval(keepAliveInterval);
        }

        console.error('WebSocket error:', error);
        readlineInterface.close();
        reject(error);
      },
    });

    readlineInterface
      .on('line', (line) => {
        if (
          TradeRepublicAPI.getInstance().getConnectionStatus() !==
          CONNECTION_STATUS.OPEN
        ) {
          console.warn('WebSocket is not open. Cannot send message.');
          readlineInterface.prompt();
          return;
        }

        const messageToSend = line;

        // Handle special case for 'exit' command
        if (messageToSend.toLowerCase() === 'exit') {
          console.log('Closing WebSocket connection...');
          if (keepAliveInterval) {
            clearInterval(keepAliveInterval);
          }
          TradeRepublicAPI.getInstance().disconnect();
          return;
        }

        TradeRepublicAPI.getInstance().sendMessage(messageToSend);
        console.log('Message sent:', messageToSend);
        readlineInterface.prompt();
      })
      .on('close', () => {
        console.log('Readline interface closed.');
        if (keepAliveInterval) {
          clearInterval(keepAliveInterval);
        }
        if (
          TradeRepublicAPI.getInstance().getConnectionStatus() ===
          CONNECTION_STATUS.OPEN
        ) {
          TradeRepublicAPI.getInstance().disconnect();
        }
      });
  });
};
