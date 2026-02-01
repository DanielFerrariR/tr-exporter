# TR Exporter: Export Trade Republic Transactions History

Export all your transactions from Trade Republic to be used in your portfolio tracker of your preference.

This project is not affiliated with Trade Republic Bank GmbH.

## Supported Transactions

The following transaction types are fully supported and will be exported:

- **Trades** - Buy and sell orders (including limit orders)
- **Savings Plans** - Automated savings plan executions
- **Roundups** - Roundup transactions
- **Cashback** - 15 euros per month bonus (Saveback)
- **Dividends** - Cash dividends
- **Interest** - Interest payments
- **Tax Corrections** - Tax correction transactions
- **Welcome Stock Gift** - Welcome stock gifts when opening an account
- **Received Gift** - Received stock gifts from a friend
- **Give Away Gift** - Received stock gifts from Trade Republic
- **Corporate Actions** - Splits

## Not Supported Transactions

The following transaction types are downloaded to `transactions.json` but are **not processed** into `portfolioData.json` or exported to portfolio trackers (e.g., Snowball Analytics):

- **Sent Gift** - Sent stock gifts to a friend
- **Transfer** - Money transfers between accounts
- **Card Payment** - Merchant card payments
- **Status Indicator** - Declined, cancelled, or verification transactions
- **Savings Plan for Children** - Savings plan for children

## CLI Options

When you run `pnpm start`, you'll be prompted for your phone number (if not already set), and then you'll see an interactive menu with the following options:

1. **Download Transactions** - Fetches all transactions from Trade Republic API and saves them to `build/transactions.json`
2. **Convert Transactions to Portfolio Data** - Converts existing `build/transactions.json` to `build/portfolioData.json` (useful if you've updated transaction processing logic and want to regenerate portfolio data without refetching)
3. **Convert Portfolio Data to Export Format** - Converts `build/portfolioData.json` to your preferred export format (e.g., Snowball Analytics CSV)
4. **Connect to WebSocket (interact via prompt)** - Interactive WebSocket connection for debugging and testing

   **Supported Commands:**
   - `{"type": "timelineTransactions", "after": "..."}` - List transactions (optional `after` parameter for pagination using hash from previous call)
   - `{"type": "timelineDetailV2", "id": "timeline_id"}` - Get detailed information for a specific transaction (requires `timeline_id`)
   - `{"type": "timelineActivityLog", "after": "..."}` - List activities (optional `after` parameter for pagination using hash from previous call)
   - `{"type": "cash"}` - Get account information (Account ID, Currency, and Cash Balance)

   For additional commands, refer to the [pytr repository](https://github.com/pytr-org/pytr/blob/master/pytr/api.py).

5. **Change Phone Number** - Update your phone number used for authentication
6. **Exit** - Exit the application

**Note:** Your current phone number is displayed at the top of the menu each time it's shown.

## Features

- Download transactions from Trade Republic API
- Convert transactions to portfolio data (regenerate portfolio data from existing transactions.json)
- Convert portfolio data to export formats (please request support for unsupported trackers):
  - Snowball Analytics
    - You can create a `customHoldings.json` file with the same format as `portfolioData` in `build/{phoneNumber}/customHoldings.json` and it will be included in portfolio data during CSV generation. This is useful for things like crypto transactions outside of Trade Republic.

      Example:

      ```json
      [
        {
          "title": "Bitcoin",
          "date": "2025-10-30",
          "eventType": "Trade",
          "type": "Buy",
          "isin": "BITCOIN",
          "price": "92887.90",
          "quantity": "0.0005383",
          "currency": "EUR",
          "feeTax": "0.125",
          "exchange": "CUSTOM_HOLDING",
          "feeCurrency": "EUR"
        }
      ]
      ```

    - After creation of snowballTransactions.csv, you can modify `build/{phoneNumber}/remapIsins.json` (automatically created after first run) to remap isins, currency and exchange that are shouldn't follow the current defaults. Please generate the csv again after changing `remapIsins.json`. The reason for this file is that isins can change after splits and Snowball Analytics doesn't cover all of them, so you need to use the most updated isin that is findable in their search results. Additionally, you also need to modify this file for keeping the custom transactions (like crypto ones) using their own exchange and currency.

    Example:

    ```json
    [
      {
        "isin": "BITCOIN",
        "currency": "EUR",
        "exchange": "CUSTOM_HOLDING"
      }
    ]
    ```

## Installation & Setup

1. Install Node 20.19.0 (use the exact version to avoid errors)

2. Install pnpm (if not already installed): `npm install -g pnpm`

3. Install dependencies: `pnpm install`

4. Run the application: `pnpm start`

## Tip

If you liked this project and want me to keep it updated. Consider to tip any amount to:
https://streamlabs.com/danielferrarir/tip

## License

This project is licensed under the MIT License. See the [LICENSE](https://github.com/DanielFerrariR/tr2sa/blob/master/LICENSE) file for details.
