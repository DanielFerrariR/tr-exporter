import { Subscription } from './Subscription';

export interface SplitMessage {
  command: string;
  jsonPayload?: object;
  subscription?: Subscription;
}
