import { ACTIVITY_EVENT_TYPE, TRANSACTION_EVENT_TYPE } from '@/constants';
import { Activity, Transaction } from '@/types';

// Creating corporate action transactions from activities as transactions list doesn't include them
export const getCorporateActionsTransactions = (
  activities: Activity[],
): Transaction[] =>
  activities
    .filter(
      (activity) =>
        !!activity.eventType &&
        [ACTIVITY_EVENT_TYPE.CORPORATE_ACTION].includes(activity.eventType),
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
      eventType: TRANSACTION_EVENT_TYPE.CORPORATE_ACTION,
      cashAccountNumber: null,
      hidden: false,
      deleted: false,
    }));
