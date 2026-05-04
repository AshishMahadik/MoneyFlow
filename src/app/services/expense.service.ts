import { Injectable, signal, computed, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Expense, ExpenseCategory, PaymentType, PaymentInstrument } from '../models/expense';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'INR';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private readonly STORAGE_KEY = 'expense_app_data_v4';
  private readonly CURRENCY_KEY = 'expense_app_currency';
  private readonly LIMIT_KEY = 'expense_app_monthly_limit';
  private readonly ACCOUNTS_KEY = 'expense_app_accounts';
  private readonly INSTRUMENTS_KEY = 'expense_app_instruments';
  
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  
  private readonly _expenses = signal<Expense[]>([]);
  public readonly expenses = this._expenses.asReadonly();
  
  public readonly currency = signal<Currency>('USD');
  public readonly monthlyLimit = signal<number>(0);
  
  public readonly accounts = signal<string[]>([
    'HDFC Bank',
    'ICICI Bank',
    'State Bank of India (SBI)',
    'Axis Bank',
    'Kotak Mahindra Bank',
    'IndusInd Bank',
    'Yes Bank',
    'IDFC First Bank',
    'Bank of Baroda',
    'Punjab National Bank (PNB)',
    'Canara Bank',
    'Union Bank of India',
    'Federal Bank',
    'RBL Bank',
    'Bandhan Bank',
    'South Indian Bank',
    'IDBI Bank',
    'Central Bank of India',
    'Bank of India',
    'Indian Bank',
    'UCO Bank',
    'Punjab & Sind Bank',
    'Indian Overseas Bank',
    'Karnataka Bank',
    'City Union Bank',
    'Karur Vysya Bank',
    'Tamilnad Mercantile Bank',
    'DCB Bank',
    'Standard Chartered Bank',
    'Citibank',
    'HSBC Bank',
    'Deutsche Bank',
    'DBS Bank',
    'Paytm Payments Bank',
    'Airtel Payments Bank',
    'India Post Payments Bank',
    'Jio Payments Bank',
    'AU Small Finance Bank',
    'Equitas Small Finance Bank',
    'Ujjivan Small Finance Bank',
    'Wallet',
    'Cash'
  ]);
  public readonly paymentTypes: PaymentType[] = ['Cash', 'Credit Card', 'Debit Card', 'UPI', 'Net Banking'];
  
  public readonly paymentInstruments = signal<PaymentInstrument[]>([
    { id: '1', name: 'Cash', type: 'Cash' },
    { id: '2', name: 'HDFC CC', type: 'Credit Card', accountName: 'HDFC Bank' },
    { id: '3', name: 'GPay (SBI)', type: 'UPI', accountName: 'State Bank of India (SBI)' }
  ]);

  public readonly totalAmount = computed(() => 
    this._expenses().reduce((sum, e) => sum + e.amount, 0)
  );

  public readonly dailyLimit = computed(() => {
    const limit = this.monthlyLimit();
    if (limit <= 0) return 0;
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return limit / daysInMonth;
  });

  public readonly spentThisMonth = computed(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return this._expenses().filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  });

  public readonly spentToday = computed(() => {
    const now = new Date();
    const today = now.getDate();
    const month = now.getMonth();
    const year = now.getFullYear();
    return this.spentThisMonth().reduce((sum, e) => {
      const d = new Date(e.date);
      if (d.getDate() === today && d.getMonth() === month && d.getFullYear() === year) {
        return sum + e.amount;
      }
      return sum;
    }, 0);
  });

  public readonly availableToday = computed(() => {
    return this.dailyLimit() - this.spentToday();
  });

  public readonly uniqueDescriptions = computed(() => {
    const expenses = this._expenses();
    const descriptions = expenses.map(e => e.description);
    return Array.from(new Set(descriptions)).sort();
  });

  public readonly monthlySpent = computed(() => {
    return this.spentThisMonth().reduce((sum, e) => sum + e.amount, 0);
  });

  public readonly savingsThisMonth = computed(() => {
    const limit = this.monthlyLimit();
    if (limit <= 0) return 0;
    
    const now = new Date();
    const today = now.getDate();
    const daily = this.dailyLimit();
    const month = now.getMonth();
    const year = now.getFullYear();
    
    const allExpenses = this._expenses();
    if (allExpenses.length === 0) return 0;

    const firstExpenseDate = new Date(Math.min(...allExpenses.map(e => e.date)));
    
    let startDay = 1;
    if (firstExpenseDate.getMonth() === month && firstExpenseDate.getFullYear() === year) {
      startDay = firstExpenseDate.getDate();
    }
    
    const monthExpenses = this.spentThisMonth();
    let cumulativeBalance = 0;

    for (let day = startDay; day <= today; day++) {
      const daySpent = monthExpenses.reduce((sum, e) => {
        const d = new Date(e.date);
        return (d.getDate() === day && d.getMonth() === month && d.getFullYear() === year) ? sum + e.amount : sum;
      }, 0);
      
      cumulativeBalance += (daily - daySpent);
    }
    
    return cumulativeBalance;
  });

  public readonly savingsBreakdown = computed(() => {
    const limit = this.monthlyLimit();
    if (limit <= 0) return 'Set a monthly budget to see breakdown';
    
    const now = new Date();
    const today = now.getDate();
    const daily = this.dailyLimit();
    const month = now.getMonth();
    const year = now.getFullYear();
    
    const allExpenses = this._expenses();
    let startDay = 1;
    
    if (allExpenses.length > 0) {
      const firstExpenseDate = new Date(Math.min(...allExpenses.map(e => e.date)));
      if (firstExpenseDate.getMonth() === month && firstExpenseDate.getFullYear() === year) {
        startDay = firstExpenseDate.getDate();
      }
    }
    
    const elapsedDays = Math.max(0, today - startDay + 1);
    const monthExpenses = this.spentThisMonth();
    const totalSpentInElapsedDays = monthExpenses.reduce((sum, e) => {
      const d = new Date(e.date);
      return (d.getDate() >= startDay && d.getDate() <= today && d.getMonth() === month && d.getFullYear() === year) ? sum + e.amount : sum;
    }, 0);

    const symbol = this.getCurrencySymbol(this.currency());
    const savings = (daily * elapsedDays) - totalSpentInElapsedDays;
    
    return `Analysis: (${elapsedDays} days × ${symbol}${daily.toFixed(0)} limit) - ${symbol}${totalSpentInElapsedDays.toFixed(0)} spent = ${savings >= 0 ? '+' : ''}${symbol}${savings.toFixed(0)}`;
  });

  private getCurrencySymbol(c: Currency): string {
    const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', INR: '₹' };
    return symbols[c] || c;
  }

  constructor() {
    if (this.isBrowser) {
      this.loadFromStorage();
      
      effect(() => {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._expenses()));
      });
      
      effect(() => {
        localStorage.setItem(this.CURRENCY_KEY, this.currency());
      });

      effect(() => {
        localStorage.setItem(this.LIMIT_KEY, this.monthlyLimit().toString());
      });

      effect(() => {
        localStorage.setItem(this.ACCOUNTS_KEY, JSON.stringify(this.accounts()));
      });

      effect(() => {
        localStorage.setItem(this.INSTRUMENTS_KEY, JSON.stringify(this.paymentInstruments()));
      });
    }
  }

  private loadFromStorage() {
    if (!this.isBrowser) return;
    
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (data) {
      try {
        this._expenses.set(JSON.parse(data));
      } catch (e) {
        console.error('Failed to load expenses', e);
      }
    }

    const savedCurrency = localStorage.getItem(this.CURRENCY_KEY) as Currency;
    if (savedCurrency) {
      this.currency.set(savedCurrency);
    }

    const savedLimit = localStorage.getItem(this.LIMIT_KEY);
    if (savedLimit) {
      this.monthlyLimit.set(parseFloat(savedLimit));
    }

    const savedAccounts = localStorage.getItem(this.ACCOUNTS_KEY);
    if (savedAccounts) {
      try {
        const parsed = JSON.parse(savedAccounts) as string[];
        // Merge saved accounts with current default accounts to ensure new ones appear
        const currentDefaults = this.accounts();
        const merged = Array.from(new Set([...currentDefaults, ...parsed]));
        this.accounts.set(merged);
      } catch (e) {
        console.error('Failed to load accounts', e);
      }
    }

    const savedInstruments = localStorage.getItem(this.INSTRUMENTS_KEY);
    if (savedInstruments) {
      try {
        this.paymentInstruments.set(JSON.parse(savedInstruments));
      } catch (e) {
        console.error('Failed to load instruments', e);
      }
    }
  }

  setCurrency(c: Currency) {
    this.currency.set(c);
  }

  setMonthlyLimit(limit: number) {
    this.monthlyLimit.set(limit);
  }

  addAccount(account: string) {
    if (account && !this.accounts().includes(account)) {
      this.accounts.update(accs => [...accs, account]);
    }
  }

  addPaymentInstrument(name: string, type: PaymentType, accountName?: string) {
    const newInstrument: PaymentInstrument = {
      id: crypto.randomUUID(),
      name,
      type,
      accountName
    };
    this.paymentInstruments.update(inst => [...inst, newInstrument]);
    return newInstrument;
  }

  updatePaymentInstrument(id: string, name: string, type: PaymentType, accountName?: string) {
    this.paymentInstruments.update(insts => 
      insts.map(i => i.id === id ? { ...i, name, type, accountName } : i)
    );
  }

  removePaymentInstrument(id: string) {
    // Prevent removing the default Cash instrument if it's ID '1'
    if (id === '1') return;
    this.paymentInstruments.update(inst => inst.filter(i => i.id !== id));
  }

  addExpense(description: string, amount: number, category: ExpenseCategory, date?: number, account?: string, paymentType?: PaymentType, instrumentId?: string, paymentMethodName?: string) {
    const newExpense: Expense = {
      id: crypto.randomUUID(),
      description,
      amount,
      category,
      date: date || Date.now(),
      account,
      paymentType,
      instrumentId,
      paymentMethodName
    };
    this._expenses.update(ex => [newExpense, ...ex].sort((a, b) => b.date - a.date));
  }

  updateExpense(id: string, description: string, amount: number, category: ExpenseCategory, date?: number, account?: string, paymentType?: PaymentType, instrumentId?: string, paymentMethodName?: string) {
    this._expenses.update(ex => {
      const updated = ex.map(e => e.id === id ? { ...e, description, amount, category, date: date || e.date, account, paymentType, instrumentId, paymentMethodName } : e);
      return updated.sort((a, b) => b.date - a.date);
    });
  }

  removeExpense(id: string) {
    this._expenses.update(ex => ex.filter(e => e.id !== id));
  }

  getAggregatedData(period: 'daily' | 'weekly' | 'monthly' | 'yearly') {
    const expenses = this._expenses();
    const groups: Record<string, number> = {};

    expenses.forEach(e => {
      const d = new Date(e.date);
      let key = '';

      if (period === 'daily') {
        key = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      } else if (period === 'weekly') {
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        key = `Week of ${weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
      } else if (period === 'monthly') {
        key = d.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
      } else {
        key = d.getFullYear().toString();
      }

      groups[key] = (groups[key] || 0) + e.amount;
    });

    return {
      labels: Object.keys(groups).reverse(),
      data: Object.values(groups).reverse()
    };
  }

  getCategoryData() {
    const expenses = this._expenses();
    const groups: Record<string, number> = {};
    expenses.forEach(e => {
      groups[e.category] = (groups[e.category] || 0) + e.amount;
    });
    return {
      labels: Object.keys(groups),
      data: Object.values(groups)
    };
  }

  getAccountData() {
    const expenses = this._expenses();
    const groups: Record<string, number> = {};
    expenses.forEach(e => {
      const acc = e.account || 'Cash';
      groups[acc] = (groups[acc] || 0) + e.amount;
    });
    return {
      labels: Object.keys(groups),
      data: Object.values(groups)
    };
  }

  getPaymentTypeData() {
    const expenses = this._expenses();
    const groups: Record<string, number> = {};
    expenses.forEach(e => {
      const pt = e.paymentType || 'Cash';
      groups[pt] = (groups[pt] || 0) + e.amount;
    });
    return {
      labels: Object.keys(groups),
      data: Object.values(groups)
    };
  }
}
