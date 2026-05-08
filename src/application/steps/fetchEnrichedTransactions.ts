import fs from 'fs';
import path from 'path';
import { EnrichedActivity, EnrichedTransaction } from '@/domain/models';
import { TradeRepublicAPI } from '@/adapters/tr';
import {
  ACTIVITY_EVENT_TYPE,
  TRANSACTION_EVENT_TYPE,
} from '@/domain/constants';
import { identifyActivityEventType } from '@/domain/classification/identifyActivityEventType';
import { identifyTransactionEventType } from '@/domain/classification/identifyTransactionEventType';

class FetchEnrichedTransactions {
  constructor(private readonly phoneNumber: string) {}

  private getGiftTransactions(
    activities: EnrichedActivity[],
  ): EnrichedTransaction[] {
    return activities
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
        action: { type: 'timelineDetail', payload: activity.id },
        eventType: (() => {
          if (activity.eventType === ACTIVITY_EVENT_TYPE.RECEIVED_GIFT)
            return TRANSACTION_EVENT_TYPE.RECEIVED_GIFT;
          if (activity.eventType === ACTIVITY_EVENT_TYPE.WELCOME_STOCK_GIFT)
            return TRANSACTION_EVENT_TYPE.WELCOME_STOCK_GIFT;
          return TRANSACTION_EVENT_TYPE.GIVE_AWAY_GIFT;
        })(),
        cashAccountNumber: null,
        hidden: false,
        deleted: false,
      }));
  }

  private getCorporateActionsTransactions(
    activities: EnrichedActivity[],
  ): EnrichedTransaction[] {
    return activities
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
        action: { type: 'timelineDetail', payload: activity.id },
        eventType: TRANSACTION_EVENT_TYPE.CORPORATE_ACTION,
        cashAccountNumber: null,
        hidden: false,
        deleted: false,
      }));
  }

  async execute(): Promise<EnrichedTransaction[]> {
    const api = TradeRepublicAPI.getInstance();

    console.log('Fetching account data from Trade Republic...');
    const {
      accountInformation,
      activities,
      transactions: rawTransactions,
    } = await api.fetchAccountData();
    console.log(
      `Fetched ${activities.length} activities and ${rawTransactions.length} transactions.`,
    );

    const accountInfoPath = path.join(
      process.cwd(),
      'build',
      this.phoneNumber,
      'accountInformation.json',
    );
    fs.mkdirSync(path.dirname(accountInfoPath), { recursive: true });
    fs.writeFileSync(
      accountInfoPath,
      JSON.stringify(accountInformation, null, 2),
    );

    const enrichedActivities: EnrichedActivity[] = activities.map(
      (activity) => ({
        ...activity,
        eventType: identifyActivityEventType(activity),
      }),
    );

    console.log('All activities fetched.');
    const activitiesPath = path.join(
      process.cwd(),
      'build',
      this.phoneNumber,
      'activities.json',
    );
    fs.mkdirSync(path.dirname(activitiesPath), { recursive: true });
    fs.writeFileSync(
      activitiesPath,
      JSON.stringify(enrichedActivities, null, 2),
    );

    const classifiedTransactions: EnrichedTransaction[] = rawTransactions.map(
      (t) => ({
        ...t,
        eventType: identifyTransactionEventType(t),
      }),
    );

    const syntheticTransactions: EnrichedTransaction[] = [
      ...this.getGiftTransactions(enrichedActivities),
      ...this.getCorporateActionsTransactions(enrichedActivities),
    ];

    const allTransactions = [
      ...classifiedTransactions,
      ...syntheticTransactions,
    ];
    const allIds = allTransactions.map((t) => t.id);

    console.log(`Fetching details for ${allIds.length} transactions...`);
    const detailsMap = await api.fetchTransactionDetails(allIds);

    const enrichedTransactions: EnrichedTransaction[] = allTransactions
      .map((t) => ({
        ...t,
        sections: detailsMap[t.id]?.sections ?? t.sections,
      }))
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

    console.log('All transaction details fetched.');
    const transactionsPath = path.join(
      process.cwd(),
      'build',
      this.phoneNumber,
      'transactions.json',
    );
    fs.mkdirSync(path.dirname(transactionsPath), { recursive: true });
    fs.writeFileSync(
      transactionsPath,
      JSON.stringify(enrichedTransactions, null, 2),
    );

    return enrichedTransactions;
  }
}

export const fetchEnrichedTransactions =
  (phoneNumber: string) => (): Promise<EnrichedTransaction[]> =>
    new FetchEnrichedTransactions(phoneNumber).execute();
