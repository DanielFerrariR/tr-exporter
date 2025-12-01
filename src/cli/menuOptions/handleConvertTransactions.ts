import fs from 'fs';
import { EXPORTERS, getExporterById } from '@/exporters';
import { PortfolioData } from '@/types';
import { getAccountNumber } from '@/utils';
import inquirer from 'inquirer';

const loadPortfolioData = async (): Promise<{
  portfolioData: PortfolioData;
  accountNumber: string;
} | null> => {
  // Get account number (with user selection if multiple exist)
  const accountNumber = await getAccountNumber();

  if (!accountNumber) {
    console.error('Error: Account number not found.');
    console.error(
      'Please download transactions first using option 1 before converting.',
    );
    return null;
  }

  const portfolioDataPath = `build/${accountNumber}/portfolioData.json`;
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
    return { portfolioData, accountNumber };
  } catch (error) {
    console.error(`Error reading ${portfolioDataPath}:`, error);
    return null;
  }
};

const loadCustomHoldings = async (
  accountNumber: string,
): Promise<{
  customHoldings: PortfolioData;
  accountNumber: string;
} | null> => {
  if (!accountNumber) {
    console.error('Error: Account number not found.');
    console.error(
      'Please download transactions first using option 1 before converting.',
    );
    return null;
  }

  const customHoldingsPath = `build/${accountNumber}/customHoldings.json`;

  try {
    const customHoldings = JSON.parse(
      fs.readFileSync(customHoldingsPath, 'utf8'),
    );
    return { customHoldings, accountNumber };
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

    const { portfolioData, accountNumber } = result;

    const customHoldingsResult = await loadCustomHoldings(accountNumber);

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
      accountNumber,
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
