import { saveFile } from '@/utils/saveFile';
import { EnrichedActivity, EnrichedTransaction } from '@/models';
import { TradeRepublicAPI } from '@/tr';
import { identifyActivityEventType } from '@/classification/identifyActivityEventType';
import { identifyTransactionEventType } from '@/classification/identifyTransactionEventType';
import { getGiftTransactions } from './getGiftTransactions';
import { getCorporateActionsTransactions } from './getCorporateActionsTransactions';

const OUTPUT_DIRECTORY = 'build';

export const fetchEnrichedTransactions =
  (phoneNumber: string) => async (): Promise<EnrichedTransaction[]> => {
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

    saveFile(
      JSON.stringify(accountInformation, null, 2),
      'accountInformation.json',
      `${OUTPUT_DIRECTORY}/${phoneNumber}`,
    );

    const enrichedActivities: EnrichedActivity[] = activities.map(
      (activity) => ({
        ...activity,
        eventType: identifyActivityEventType(activity),
      }),
    );

    console.log('All activities fetched.');
    saveFile(
      JSON.stringify(enrichedActivities, null, 2),
      'activities.json',
      `${OUTPUT_DIRECTORY}/${phoneNumber}`,
    );

    const classifiedTransactions: EnrichedTransaction[] = rawTransactions.map(
      (t) => ({
        ...t,
        eventType: identifyTransactionEventType(t),
      }),
    );

    const syntheticTransactions: EnrichedTransaction[] = [
      ...getGiftTransactions(enrichedActivities),
      ...getCorporateActionsTransactions(enrichedActivities),
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
    saveFile(
      JSON.stringify(enrichedTransactions, null, 2),
      'transactions.json',
      `${OUTPUT_DIRECTORY}/${phoneNumber}`,
    );

    return enrichedTransactions;
  };
