# TR Exporter: Export Trade Republic Transactions History

Export all your transactions from Trade Republic to be used in your portfolio tracker of your preference.

This project is not affiliated with Trade Republic Bank GmbH.

Currently supported transactions:

- trades
- savings plans
- roundups
- 15 euros per month bonus
- dividends
- interests
- tax corrections
- received stock gift (when opening an account and from a friend)

## Features

- Download transactions
- Convert Downloaded Transactions for (please request support for unsupported trackers):
  - Snowball Analytics
- Connect to WebSocket (interact via prompt)
  - Known supported commands:
    - Transactions: {"type": "timelineTransactions", after: '...' } // list of transactions with optional 'after' option to get the next list of transactions (after needs the hash from the previous call)
    - Transaction Details: {"type": "timelineDetailV2", "id": timeline_id } // extra details of a transactions with required timeline_id that is id of a transaction
    - Activity Log: {"type": "timelineActivityLog", after: '...' } // list of activies with optional 'after' option to get the next list of activities (after needs the hash from the previous call)
    - Cash: {"type": "cash" } // Cash balance
    - Can get more of options from https://github.com/pytr-org/pytr/blob/master/pytr/api.py code, but this project isn't supporting and explaining how to use the others for now

## Steps

1 - Install Node 20.19.0 (use the exact version to avoid errors)

2 - Install pnpm (if not already installed): `npm install -g pnpm`

3 - pnpm install

4 - pnpm start

## Tip

If you liked this project and want me to keep it updated. Consider to tip any amount to:
https://streamlabs.com/danielferrarir/tip

## License

This project is licensed under the MIT License. See the [LICENSE](https://github.com/DanielFerrariR/tr2sa/blob/master/LICENSE) file for details.
