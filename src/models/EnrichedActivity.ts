import { ACTIVITY_EVENT_TYPE } from '@/constants';
import { Activity } from '@/tr';

export interface EnrichedActivity extends Activity {
  eventType: ACTIVITY_EVENT_TYPE;
}
