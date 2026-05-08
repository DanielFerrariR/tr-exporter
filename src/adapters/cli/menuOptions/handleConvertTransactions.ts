import fs from 'fs';
import { EXPORTERS, getExporterById } from '@/adapters/exporters';
import { Portfolio } from '@/domain/portfolio';
import { getPhoneNumber } from '@/adapters/cli/phoneNumberStorage';
import { consola } from 'consola';
import inquirer from 'inquirer';

const loadPortfolio = async (): Promise<{
  portfolioData: Portfolio;
  phoneNumber: string;
} | null> => {
  const phoneNumber = getPhoneNumber();

  if (!phoneNumber) {
    consola.error('Error: Phone number not set.');
    consola.error('Please set your phone number first.');
    return null;
  }

  const portfolioDataPath = `build/${phoneNumber}/portfolioData.json`;
  if (!fs.existsSync(portfolioDataPath)) {
    consola.error(`Error: ${portfolioDataPath} not found.`);
    consola.error(
      'Please convert transactions to portfolio data first using option 2.',
    );
    return null;
  }

  try {
    const portfolioData = JSON.parse(
      fs.readFileSync(portfolioDataPath, 'utf8'),
    );
    return { portfolioData, phoneNumber };
  } catch (error) {
    consola.error(`Error reading ${portfolioDataPath}:`, error);
    return null;
  }
};

const loadCustomHoldings = async (
  phoneNumber: string,
): Promise<{
  customHoldings: Portfolio;
  phoneNumber: string;
} | null> => {
  const customHoldingsPath = `build/${phoneNumber}/customHoldings.json`;

  try {
    const customHoldings = JSON.parse(
      fs.readFileSync(customHoldingsPath, 'utf8'),
    );
    return { customHoldings, phoneNumber };
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return null;
    }
    consola.error(`Error reading ${customHoldingsPath}:`, error);
    throw error;
  }
};

export const handleConvertTransactions = async (): Promise<void> => {
  try {
    const result = await loadPortfolio();
    if (!result) return;

    const { portfolioData, phoneNumber } = result;

    const customHoldingsResult = await loadCustomHoldings(phoneNumber);

    const { exporterId } = await inquirer.prompt([
      {
        type: 'list',
        name: 'exporterId',
        message: 'Select an exporter:',
        choices: [
          ...EXPORTERS.map((exporter) => ({
            name: `${exporter.name}`,
            value: exporter.id,
          })),
          {
            name: 'Back to main menu',
            value: 'back',
          },
        ],
      },
    ]);

    if (exporterId === 'back') return;

    const exporter = getExporterById(exporterId);
    if (!exporter) {
      consola.error(`Error: Exporter with id "${exporterId}" not found.`);
      return;
    }

    await exporter.convert(
      [...portfolioData, ...(customHoldingsResult?.customHoldings ?? [])],
      phoneNumber,
    );
    consola.info(`Conversion to ${exporter.name} completed successfully.`);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'ExitPromptError') {
      console.log('\n\nGracefully shutting down...');
      process.exit(0);
    }

    consola.error('Error converting transactions:', error);
  }
};
