import { ACTIVITY_EVENT_TYPE, TRANSACTION_EVENT_TYPE } from '../constants';
import { Activity, Transaction } from '../types';

// Creating received gift transactions from activities as transactions list doesn't include received gifts
export const getGiftTransactions = (activities: Activity[]): Transaction[] =>
  activities
    .filter(
      (activity) =>
        !!activity.eventType &&
        [
          ACTIVITY_EVENT_TYPE.RECEIVED_GIFT,
          ACTIVITY_EVENT_TYPE.STOCK_PERK,
        ].includes(activity.eventType),
    )
    .map((activity) => ({
      id: activity.id,
      timestamp: activity.timestamp,
      title: activity.title,
      icon: activity.icon,
      badge: null,
      subtitle: activity.subtitle,
      // Only a placeholder value as the value only exists inside the transaction sections field
      // Do not use the amount value for any calculations
      amount: {
        currency: 'EUR',
        value: -1,
        fractionDigits: 2,
      },
      subAmount: null,
      status: 'EXECUTED',
      action: {
        type: 'timelineDetail',
        payload: activity.id,
      },
      eventType:
        activity.eventType === ACTIVITY_EVENT_TYPE.RECEIVED_GIFT
          ? TRANSACTION_EVENT_TYPE.RECEIVED_GIFT
          : TRANSACTION_EVENT_TYPE.STOCK_PERK,
      cashAccountNumber: null,
      hidden: false,
      deleted: false,
    }));
