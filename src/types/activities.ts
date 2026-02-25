import { ACTIVITY_EVENT_TYPE } from '@/constants';

export interface ActivityAction {
  type: 'timelineDetail';
  payload: string;
}

export interface Activity {
  id: string;
  timestamp: string;
  title: string;
  icon: string;
  subtitle: string | null;
  action: ActivityAction | null;
  eventType?: ACTIVITY_EVENT_TYPE; // We are replacing TR provided ones for better readability
}

export interface ActivityPayload {
  after?: string;
}

export interface ActivityResponse {
  items: Activity[];
  cursors: {
    after: string;
    before: string;
  };
}
