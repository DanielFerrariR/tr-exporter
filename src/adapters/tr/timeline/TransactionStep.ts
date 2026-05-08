export interface TransactionStep {
  leading: {
    avatar: {
      status: string;
      type: string;
    };
    connection: {
      order: string;
    };
  };
  content: {
    title: string;
    subtitle: string | null;
    timestamp: string;
    cta: unknown;
  };
}
