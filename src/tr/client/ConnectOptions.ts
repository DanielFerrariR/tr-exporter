import { CloseEvent, ErrorEvent } from 'ws';
import { SplitMessage } from '../protocol/SplitMessage';

export interface ConnectOptions {
  onOpen?: () => void;
  onClose?: (event: CloseEvent) => void;
  onConnected?: (message: string) => void;
  onMessage?: (message: string, splitMessage: SplitMessage) => void;
  onError?: (event: ErrorEvent) => void;
}
