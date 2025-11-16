import { ACTIVITY_EVENT_TYPE } from '../constants';
import { Activity } from '../types';

export const identifyActivityEventType = (
  activity: Activity,
): ACTIVITY_EVENT_TYPE | null => {
  // Stock Gift
  if (activity.title === 'Stock Gift' && activity.subtitle === 'Accepted') {
    return ACTIVITY_EVENT_TYPE.GIFT;
  }

  // Stock Perk
  if (activity.title === 'Stock Perk' && activity.subtitle === 'Redeemed') {
    return ACTIVITY_EVENT_TYPE.STOCK_PERK;
  }

  return null;
};
