export class TradeRepublicApiError extends Error {
  public responseData: unknown;

  constructor(message: string, responseData?: unknown) {
    super(message);
    this.name = 'TradeRepublicApiError';
    this.responseData = responseData;
  }
}

export class TradeRepublicApiLoginError extends TradeRepublicApiError {
  constructor(message: string, responseData?: unknown) {
    super(message, responseData);
    this.name = 'TradeRepublicApiLoginError';
  }
}

export class TradeRepublicApiLoginProcessError extends TradeRepublicApiError {
  constructor(message: string, responseData?: unknown) {
    super(message, responseData);
    this.name = 'TradeRepublicApiLoginProcessError';
  }
}
