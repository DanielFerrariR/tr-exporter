import { ACTIVITY_EVENT_TYPE } from '@/domain/constants';
import { Activity } from '@/adapters/tr';

export interface EnrichedActivity extends Activity {
  eventType: ACTIVITY_EVENT_TYPE;
}
