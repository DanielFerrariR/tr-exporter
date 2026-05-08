import { LoginProcessStatus } from './LoginProcessStatus';

export interface LoginProcessResponse {
  status: LoginProcessStatus;
  requiredAction: string | null;
}
