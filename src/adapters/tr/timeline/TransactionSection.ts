import { TransactionHeaderSection } from './TransactionHeaderSection';
import { TransactionTableSection } from './TransactionTableSection';
import { TransactionNoteSection } from './TransactionNoteSection';
import { TransactionStepsSection } from './TransactionStepsSection';
import { TransactionDocumentsSection } from './TransactionDocumentsSection';
import { TransactionBannerSection } from './TransactionBannerSection';

export type TransactionSection =
  | TransactionHeaderSection
  | TransactionTableSection
  | TransactionNoteSection
  | TransactionStepsSection
  | TransactionDocumentsSection
  | TransactionBannerSection;
