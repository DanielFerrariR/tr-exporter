export class TradeRepublicApiError extends Error {
  public responseData: unknown;

  constructor(message: string, responseData?: unknown) {
    super(message);
    this.name = 'TradeRepublicApiError';
    this.responseData = responseData;
  }
}
