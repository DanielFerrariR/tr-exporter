import { TradeRepublicApiError } from './TradeRepublicApiError';

export class TradeRepublicApiLoginError extends TradeRepublicApiError {
  constructor(message: string, responseData?: unknown) {
    super(message, responseData);
    this.name = 'TradeRepublicApiLoginError';
  }
}
