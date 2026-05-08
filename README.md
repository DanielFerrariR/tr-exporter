# TR Exporter

Export your full transaction history from Trade Republic to use in the portfolio tracker of your choice.

> This project is not affiliated with Trade Republic Bank GmbH.

## How it works

The tool runs as an interactive CLI with three steps:

1. **Download** — connects to the Trade Republic API, fetches all transactions and activities, and saves them locally to `build/{phoneNumber}/transactions.json`
2. **Build portfolio** — maps the raw transactions into a normalised portfolio format saved to `build/{phoneNumber}/portfolioData.json`
3. **Export** — converts the portfolio data into the CSV format required by your tracker (currently Snowball Analytics)

Steps 2 and 3 work offline from locally saved files, so you only need to connect to Trade Republic when downloading.

## Requirements

- Node.js 20+
- A Trade Republic account with phone number and PIN

## Installation

```bash
# Clone the repository
git clone https://github.com/DanielFerrariR/tr-exporter.git
cd tr-exporter

# Install dependencies
npm install
# or
pnpm install

# Start the tool
npm start
# or
pnpm start
```

On first run you will be prompted for your Trade Republic phone number (including country code, e.g. `+4915...`).

## Menu options

### 1 · Download Transactions

Authenticates with Trade Republic, downloads all transactions and activity history, and saves them to `build/{phoneNumber}/transactions.json`. You will need to:

- Enter your 4-digit PIN
- Approve the login request in the Trade Republic app

### 2 · Convert Transactions to Portfolio Data

Reads `build/{phoneNumber}/transactions.json` and builds `build/{phoneNumber}/portfolioData.json`. Useful when you want to regenerate portfolio data after updating transaction processing logic, without re-downloading from Trade Republic.

### 3 · Convert Portfolio Data to Export Format

Reads `build/{phoneNumber}/portfolioData.json` and converts it to the export format of your chosen tracker. Currently supports:

- **Snowball Analytics** — generates `build/{phoneNumber}/snowballTransactions.csv`

### 4 · Connect to WebSocket

Opens a raw WebSocket connection to the Trade Republic API for debugging. Supported commands:

| Command                                            | Description                                     |
| -------------------------------------------------- | ----------------------------------------------- |
| `{"type": "timelineTransactions", "after": "..."}` | List transactions (omit `after` for first page) |
| `{"type": "timelineDetailV2", "id": "..."}`        | Get details for a specific transaction          |
| `{"type": "timelineActivityLog", "after": "..."}`  | List activities (omit `after` for first page)   |
| `{"type": "cash"}`                                 | Account ID, currency, and cash balance          |

For additional commands see the [pytr repository](https://github.com/pytr-org/pytr/blob/master/pytr/api.py).

### 5 · Change Phone Number

Updates the phone number used for authentication in the current session.

## Output files

All files are written to `build/{phoneNumber}/`:

| File                       | Created by      | Description                               |
| -------------------------- | --------------- | ----------------------------------------- |
| `transactions.json`        | Download        | Raw enriched transactions from the TR API |
| `activities.json`          | Download        | Raw activity feed from the TR API         |
| `accountInformation.json`  | Download        | Account metadata                          |
| `portfolioData.json`       | Build portfolio | Normalised portfolio ready for export     |
| `snowballTransactions.csv` | Export          | Snowball Analytics import file            |
| `remapIsins.json`          | Export          | ISIN → exchange/currency cache (editable) |

## Supported transactions

| Type                                 | Exported |
| ------------------------------------ | -------- |
| Trades (buy/sell, limit orders)      | ✅       |
| Savings plans                        | ✅       |
| Roundups                             | ✅       |
| Cashback (Saveback)                  | ✅       |
| Dividends                            | ✅       |
| Interest                             | ✅       |
| Tax corrections                      | ✅       |
| Welcome stock gift                   | ✅       |
| Received gift (from a friend)        | ✅       |
| Give away gift (from Trade Republic) | ✅       |
| Corporate actions (splits)           | ✅       |
| Sent gift                            | ❌       |
| Money transfers                      | ❌       |
| Card payments                        | ❌       |
| Savings plan for children            | ❌       |

## Snowball Analytics configuration

### Custom holdings

You can include holdings from outside Trade Republic (e.g. crypto) by creating `build/{phoneNumber}/customHoldings.json` with the same format as `portfolioData.json`. These will be merged into the CSV during export.

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

### ISIN remapping

`build/{phoneNumber}/remapIsins.json` is created automatically on first export and caches each ISIN's exchange and currency. Edit it manually when:

- An ISIN changed after a stock split and Snowball Analytics only recognises the new one
- A custom holding (like crypto) needs a specific exchange identifier

After editing, run the export again to regenerate the CSV.

```json
[
  {
    "isin": "BITCOIN",
    "currency": "EUR",
    "exchange": "CUSTOM_HOLDING"
  }
]
```

## License

MIT — see [LICENSE](https://github.com/DanielFerrariR/tr2sa/blob/master/LICENSE).
