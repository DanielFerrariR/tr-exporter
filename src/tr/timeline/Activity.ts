import { ActivityAction } from './ActivityAction';

export interface Activity {
  id: string;
  timestamp: string;
  title: string;
  icon: string;
  subtitle: string | null;
  action: ActivityAction | null;
  eventType: string | null;
}
