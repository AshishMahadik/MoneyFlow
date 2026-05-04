export type ExpenseCategory = 'Food' | 'Travel' | 'Utilities' | 'Shopping' | 'Entertainment' | 'Other';

export type PaymentType = 'Cash' | 'Credit Card' | 'Debit Card' | 'UPI' | 'Net Banking';

export interface PaymentInstrument {
  id: string;
  name: string; // e.g., 'Amazon Pay ICICI', 'PhonePe (SBI)'
  type: PaymentType;
  accountName?: string; // e.g., 'HDFC Bank', 'ICICI Bank'
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: number;
  account?: string; // e.g., 'HDFC Bank'
  paymentType?: PaymentType;
  instrumentId?: string; // ID of the personalized instrument
  paymentMethodName?: string; // Display name of the instrument (e.g. 'PhonePe (SBI)')
}
