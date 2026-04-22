export type Direction = 'debit' | 'credit';
export type TransactionSource = 'manual' | 'sms' | 'email' | 'pdf';

export type Category = {
  id: string;
  user_id: string | null;
  name: string;
  icon: string | null;
  color: string | null;
  is_system: boolean;
  created_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  amount: number;
  direction: Direction;
  merchant: string | null;
  account_last4: string | null;
  category_id: string | null;
  occurred_at: string;
  source: TransactionSource;
  raw_text: string | null;
  notes: string | null;
  created_at: string;
};

export type TransactionWithCategory = Transaction & {
  category: Pick<Category, 'id' | 'name' | 'icon' | 'color'> | null;
};

export type Budget = {
  id: string;
  user_id: string;
  category_id: string;
  monthly_limit: number;
  created_at: string;
  updated_at: string;
};
