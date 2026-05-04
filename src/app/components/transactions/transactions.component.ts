import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ExpenseService, Currency } from '../../services/expense.service';
import { ThemeService } from '../../services/theme.service';
import { ExpenseCategory, Expense, PaymentType } from '../../models/expense';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.css'
})
export class TransactionsComponent {
  private readonly expenseService = inject(ExpenseService);
  public readonly themeService = inject(ThemeService);
  
  public readonly categories: ExpenseCategory[] = ['Food', 'Travel', 'Utilities', 'Shopping', 'Entertainment', 'Other'];
  public readonly currencies: Currency[] = ['USD', 'EUR', 'GBP', 'INR'];
  public readonly accounts = this.expenseService.accounts;
  public readonly paymentTypes = this.expenseService.paymentTypes;
  
  public readonly expenses = this.expenseService.expenses;
  public readonly currentCurrency = this.expenseService.currency;
  public readonly uniqueDescriptions = this.expenseService.uniqueDescriptions;

  // Form State
  public description = '';
  public amount: number | null = null;
  public category: ExpenseCategory = 'Food';
  public account = 'Cash';
  public paymentType: PaymentType = 'Cash';
  public date = new Date().toISOString().split('T')[0];
  public editingId = signal<string | null>(null);
  
  // Search and Filter
  public searchQuery = signal('');
  public categoryFilter = signal<string>('All');

  public filteredExpenses = computed(() => {
    let list = this.expenses();
    const query = this.searchQuery().toLowerCase();
    const cat = this.categoryFilter();

    if (query) {
      list = list.filter(e => e.description.toLowerCase().includes(query));
    }

    if (cat !== 'All') {
      list = list.filter(e => e.category === cat);
    }

    return list;
  });

  addOrUpdateExpense() {
    if (this.description.trim() && this.amount && this.amount > 0) {
      const id = this.editingId();
      const expenseDate = new Date(this.date).getTime();

      if (id) {
        this.expenseService.updateExpense(id, this.description, this.amount, this.category, expenseDate, this.account, this.paymentType);
      } else {
        this.expenseService.addExpense(this.description, this.amount, this.category, expenseDate, this.account, this.paymentType);
      }
      this.resetForm();
    }
  }

  setCurrency(c: Currency) {
    this.expenseService.setCurrency(c);
  }

  editExpense(expense: Expense) {
    this.editingId.set(expense.id);
    this.description = expense.description;
    this.amount = expense.amount;
    this.category = expense.category;
    this.account = expense.account || 'Cash';
    this.paymentType = expense.paymentType || 'Cash';
    this.date = new Date(expense.date).toISOString().split('T')[0];
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  removeExpense(id: string) {
    if (confirm('Are you sure you want to delete this transaction?')) {
      this.expenseService.removeExpense(id);
      if (this.editingId() === id) this.resetForm();
    }
  }

  resetForm() {
    this.editingId.set(null);
    this.description = '';
    this.amount = null;
    this.category = 'Food';
    this.account = 'Cash';
    this.paymentType = 'Cash';
    this.date = new Date().toISOString().split('T')[0];
  }

  getCurrencySymbol(c: Currency): string {
    const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', INR: '₹' };
    return symbols[c] || c;
  }
}
