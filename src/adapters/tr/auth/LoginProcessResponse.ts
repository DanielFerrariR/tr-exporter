import { LoginProcessStatus } from './LoginProcessStatus';

export interface LoginProcessResponse {
  status: LoginProcessStatus;
  requiredAction: 'AUTHENTICATOR_VERIFICATION' | null;
  expiresAt: string | null;
}
