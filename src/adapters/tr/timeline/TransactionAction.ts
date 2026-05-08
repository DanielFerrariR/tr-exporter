export interface TransactionAction {
  type: string;
  payload: string | object;
  overrideAction?: unknown;
}
