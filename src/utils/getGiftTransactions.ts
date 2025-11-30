import { ACTIVITY_EVENT_TYPE, TRANSACTION_EVENT_TYPE } from '@/constants';
import { Activity, Transaction } from '@/types';

// Creating received gift transactions from activities as transactions list doesn't include received gifts
export const getGiftTransactions = (activities: Activity[]): Transaction[] =>
  activities
    .filter(
      (activity) =>
        !!activity.eventType &&
        [
          ACTIVITY_EVENT_TYPE.RECEIVED_GIFT,
          ACTIVITY_EVENT_TYPE.WELCOME_STOCK_GIFT,
          ACTIVITY_EVENT_TYPE.GIVE_AWAY_GIFT,
        ].includes(activity.eventType),
    )
    .map((activity) => ({
      id: activity.id,
      timestamp: activity.timestamp,
      title: activity.title,
      icon: activity.icon,
      badge: null,
      subtitle: activity.subtitle,
      amount: null,
      subAmount: null,
      status: 'EXECUTED',
      action: {
        type: 'timelineDetail',
        payload: activity.id,
      },
      eventType: (() => {
        if (activity.eventType === ACTIVITY_EVENT_TYPE.RECEIVED_GIFT) {
          return TRANSACTION_EVENT_TYPE.RECEIVED_GIFT;
        }
        if (activity.eventType === ACTIVITY_EVENT_TYPE.WELCOME_STOCK_GIFT) {
          return TRANSACTION_EVENT_TYPE.WELCOME_STOCK_GIFT;
        }
        // Give away is the default case
        return TRANSACTION_EVENT_TYPE.GIVE_AWAY_GIFT;
      })(),
      cashAccountNumber: null,
      hidden: false,
      deleted: false,
    }));
