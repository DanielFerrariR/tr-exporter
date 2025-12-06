import fs from 'fs';
import { EXPORTERS, getExporterById } from '@/exporters';
import { PortfolioData } from '@/types';
import { getPhoneNumber } from '@/utils/phoneNumberStorage';
import inquirer from 'inquirer';

const loadPortfolioData = async (): Promise<{
  portfolioData: PortfolioData;
  phoneNumber: string;
} | null> => {
  const phoneNumber = getPhoneNumber();

  if (!phoneNumber) {
    console.error('Error: Phone number not set.');
    console.error('Please set your phone number first.');
    return null;
  }

  const portfolioDataPath = `build/${phoneNumber}/portfolioData.json`;
  if (!fs.existsSync(portfolioDataPath)) {
    console.error(`Error: ${portfolioDataPath} not found.`);
    console.error(
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
    console.error(`Error reading ${portfolioDataPath}:`, error);
    return null;
  }
};

const loadCustomHoldings = async (
  phoneNumber: string,
): Promise<{
  customHoldings: PortfolioData;
  phoneNumber: string;
} | null> => {
  if (!phoneNumber) {
    console.error('Error: Phone number not set.');
    console.error('Please set your phone number first.');
    return null;
  }

  const customHoldingsPath = `build/${phoneNumber}/customHoldings.json`;

  try {
    const customHoldings = JSON.parse(
      fs.readFileSync(customHoldingsPath, 'utf8'),
    );
    return { customHoldings, phoneNumber };
  } catch (error: unknown) {
    // Ignore file not found errors (file doesn't exist)
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return null;
    }
    // Throw error if file exists but parsing fails
    console.error(`Error reading ${customHoldingsPath}:`, error);
    throw error;
  }
};

export const handleConvertTransactions = async (): Promise<void> => {
  try {
    const result = await loadPortfolioData();
    if (!result) return;

    const { portfolioData, phoneNumber } = result;

    const customHoldingsResult = await loadCustomHoldings(phoneNumber);

    // Show available exporters
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
      console.error(`Error: Exporter with id "${exporterId}" not found.`);
      return;
    }

    await exporter.convert(
      [...portfolioData, ...(customHoldingsResult?.customHoldings ?? [])],
      phoneNumber,
    );
    console.log(`Conversion to ${exporter.name} completed successfully.`);
  } catch (error: unknown) {
    // Handle Ctrl+C (SIGINT) gracefully
    if (error instanceof Error && error.name === 'ExitPromptError') {
      console.log('\n\nGracefully shutting down...');
      process.exit(0);
    }

    console.error('Error converting transactions:', error);
  }
};
