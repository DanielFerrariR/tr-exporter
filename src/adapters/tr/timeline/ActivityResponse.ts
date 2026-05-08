import { Activity } from './Activity';

export interface ActivityResponse {
  items: Activity[];
  cursors: {
    after: string;
    before: string;
  };
}
