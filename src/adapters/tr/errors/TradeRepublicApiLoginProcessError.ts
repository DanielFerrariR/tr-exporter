import { TradeRepublicApiError } from './TradeRepublicApiError';

export class TradeRepublicApiLoginProcessError extends TradeRepublicApiError {
  constructor(message: string, responseData?: unknown) {
    super(message, responseData);
    this.name = 'TradeRepublicApiLoginProcessError';
  }
}
