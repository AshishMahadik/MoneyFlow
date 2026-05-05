import { Component, signal, computed, inject, effect, OnDestroy, PLATFORM_ID } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ExpenseService, Currency } from '../../services/expense.service';
import { ThemeService } from '../../services/theme.service';
import { ExpenseCategory, Expense, PaymentType, PaymentInstrument } from '../../models/expense';
import { COMMON_EXPENSES } from '../../models/expense-suggestions';
import { Chart, ChartConfiguration, ChartData, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-expense-tracker',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, BaseChartDirective],
  templateUrl: './expense-tracker.component.html',
  styleUrl: './expense-tracker.component.css'
})
export class ExpenseTrackerComponent implements OnDestroy {
  private readonly expenseService = inject(ExpenseService);
  public readonly themeService = inject(ThemeService);
  private readonly platformId = inject(PLATFORM_ID);
  
  public readonly categories: ExpenseCategory[] = ['Food', 'Travel', 'Utilities', 'Shopping', 'Entertainment', 'Other'];
  public readonly currencies: Currency[] = ['USD', 'EUR', 'GBP', 'INR'];
  public readonly accounts = this.expenseService.accounts;
  public readonly paymentTypes = this.expenseService.paymentTypes;
  public readonly paymentInstruments = this.expenseService.paymentInstruments;
  
  public readonly expenses = this.expenseService.expenses;
  public readonly totalAmount = this.expenseService.totalAmount;
  public readonly monthlySpent = this.expenseService.monthlySpent;
  public readonly currentCurrency = this.expenseService.currency;
  
  // Budget Signals
  public readonly monthlyLimit = this.expenseService.monthlyLimit;
  public readonly dailyLimit = this.expenseService.dailyLimit;
  public readonly availableToday = this.expenseService.availableToday;
  public readonly savingsThisMonth = this.expenseService.savingsThisMonth;
  public readonly savingsBreakdown = this.expenseService.savingsBreakdown;
  public readonly uniqueDescriptions = this.expenseService.uniqueDescriptions;

  // Chart Configuration
  public readonly chartPeriod = signal<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  
  public readonly periodTotal = computed(() => {
    this.expenses(); 
    const period = this.chartPeriod();
    const periodData = this.expenseService.getAggregatedData(period);
    return periodData.data.reduce((sum, val) => sum + (val || 0), 0);
  });

  public readonly categoryStats = computed(() => {
    const expenses = this.expenses();
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);
    const groups: Record<string, { amount: number, count: number }> = {};
    
    expenses.forEach(e => {
      if (!groups[e.category]) groups[e.category] = { amount: 0, count: 0 };
      groups[e.category].amount += e.amount;
      groups[e.category].count += 1;
    });

    return Object.entries(groups).map(([name, data]) => ({
      name,
      amount: data.amount,
      count: data.count,
      percentage: total > 0 ? (data.amount / total) * 100 : 0,
      color: this.getCategoryColor(name as ExpenseCategory)
    })).sort((a, b) => b.amount - a.amount);
  });

  public readonly categoryInsights = computed(() => {
    const expenses = this.expenses();
    if (expenses.length === 0) return null;

    const counts: Record<string, number> = {};
    expenses.forEach(e => {
      counts[e.category] = (counts[e.category] || 0) + 1;
    });

    const mostFrequentName = Object.entries(counts).reduce((a, b) => a[1] > b[1] ? a : b)[0];
    const highestSpent = this.categoryStats()[0];

    return {
      highest: highestSpent,
      frequent: {
        name: mostFrequentName,
        count: counts[mostFrequentName],
        color: this.getCategoryColor(mostFrequentName as ExpenseCategory)
      }
    };
  });

  public readonly smartInsights = computed(() => {
    const expenses = this.expenses();
    if (expenses.length === 0) return null;

    const monthlySpent = this.monthlySpent();
    const avgDaily = monthlySpent / (new Date().getDate() || 1);
    const highestTx = expenses.reduce((max, e) => e.amount > max.amount ? e : max, expenses[0]);
    
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayCounts = expenses.reduce((acc, e) => {
      const day = new Date(e.date).getDay();
      acc[day] = (acc[day] || 0) + e.amount;
      return acc;
    }, {} as Record<number, number>);
    
    let maxDay = 0;
    let maxDayAmount = 0;
    Object.entries(dayCounts).forEach(([day, amount]) => {
      if (amount > maxDayAmount) {
        maxDayAmount = amount;
        maxDay = parseInt(day);
      }
    });

    return {
      highestTx,
      avgDaily,
      topDay: days[maxDay] || 'None',
      totalCount: expenses.length
    };
  });

  public readonly methodUsageSummary = computed(() => {
    const expenses = this.expenses();
    const instruments = this.paymentInstruments();
    if (instruments.length === 0) return null;

    const counts: Record<string, number> = {};
    expenses.forEach(e => {
      const name = e.paymentMethodName || 'Cash';
      counts[name] = (counts[name] || 0) + 1;
    });

    const mostUsedName = Object.entries(counts).reduce((a, b) => a[1] > b[1] ? a : b, ['None', 0])[0];
    const mostUsed = instruments.find(i => i.name === mostUsedName) || instruments[0];

    return {
      totalCount: instruments.length,
      mostUsed: mostUsedName !== 'None' ? mostUsed : null,
      usageCount: counts[mostUsedName] || 0
    };
  });

  getCategoryColor(cat: ExpenseCategory): string {
    const colors: Record<ExpenseCategory, string> = {
      'Food': '#818cf8',
      'Travel': '#6366f1',
      'Utilities': '#a5b4fc',
      'Shopping': '#4f46e5',
      'Entertainment': '#c7d2fe',
      'Other': '#3730a3'
    };
    return colors[cat] || '#818cf8';
  }

  getCategoryIcon(cat: string): string {
    const icons: Record<string, string> = {
      'Food': 'M11,9H9V2H7V9H5V2H3V9C3,11.12 4.66,12.84 6.75,12.97V22H9.25V12.97C11.34,12.84 13,11.12 13,9V2H11V9M16,6V14H18.5V22H21V2C18.24,2 16,4.24 16,6Z',
      'Travel': 'M21,16.5C21,16.88 20.79,17.21 20.47,17.38L12.57,21.82C12.41,21.94 12.21,22 12,22C11.79,22 11.59,21.94 11.43,21.82L3.53,17.38C3.21,17.21 3,16.88 3,16.5V7.5C3,7.12 3.21,6.79 3.53,6.62L11.43,2.18C11.59,2.06 11.79,2 12,2C12.21,2 12.41,2.06 12.57,2.18L20.47,6.62C20.79,6.79 21,7.12 21,7.5V16.5Z',
      'Utilities': 'M12,2L4.5,20.29L5.21,21L12,18L18.79,21L19.5,20.29L12,2Z',
      'Shopping': 'M17,18A2,2 0 0,1 19,20A2,2 0 0,1 17,22C15.89,22 15,21.1 15,20C15,18.89 15.89,18 17,18M1,2H4.27L5.21,4H20A1,1 0 0,1 21,5C21,5.17 20.95,5.34 20.88,5.5L17.3,12C16.94,12.62 16.27,13 15.55,13H8.1L7.2,14.63L7.17,14.75A0.25,0.25 0 0,0 7.42,15H19V17H7A2,2 0 0,1 5,15C5,14.65 5.07,14.31 5.24,14L6.6,11.59L3,4H1V2M7,18A2,2 0 0,1 9,20A2,2 0 0,1 7,22C5.89,22 5,21.1 5,20C5,18.89 5.89,18 7,18M16,11L18.78,6H6.14L8.5,11H16Z',
      'Entertainment': 'M18,3V5H15V3H9V5H6V3H4V21H6V19H9V21H15V19H18V21H20V3H18M6,17H4V15H6V17M6,13H4V11H6V13M6,9H4V7H6V9M11,19H9V17H11V19M11,15H9V13H11V15M11,11H9V9H11V11M11,7H9V5H11V7M15,19H13V17H15V19M15,15H13V13H15V15M15,11H13V9H15V11M15,7H13V5H15V7M20,17H18V15H20V17M20,13H18V11H20V13M20,9H18V7H20V9Z'
    };
    return icons[cat] || 'M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z';
  }

  // Spending Trends Chart
  public barChartData: ChartData<'line'> = { labels: [], datasets: [] };
  public get barChartOptions(): ChartConfiguration<'line'>['options'] {
    const isDark = this.themeService.isDarkMode();
    const tickColor = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
    const gridColor = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)';
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { 
        legend: { display: false },
        tooltip: {
          mode: 'index',
          intersect: false,
          backgroundColor: isDark ? 'rgba(10, 10, 18, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          titleColor: '#818cf8',
          titleFont: { family: 'Raleway', size: 13, weight: 'bold' },
          bodyColor: isDark ? '#fff' : '#000',
          bodyFont: { family: 'Raleway', size: 16, weight: 900 },
          padding: 15,
          borderColor: 'rgba(129, 140, 248, 0.5)',
          borderWidth: 1,
          cornerRadius: 12,
          displayColors: false,
          callbacks: {
            label: (context) => ` ${this.getCurrencySymbol(this.currentCurrency())}${(context.parsed.y ?? 0).toLocaleString()}`
          }
        }
      },
      interaction: {
        mode: 'nearest',
        axis: 'x',
        intersect: false
      },
      scales: { 
        y: { 
          display: true, 
          position: 'right',
          grid: { color: gridColor, drawTicks: false },
          border: { display: false },
          ticks: { 
            color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)', 
            font: { family: 'Raleway', size: 10, weight: 'bold' },
            callback: (value) => this.getCurrencySymbol(this.currentCurrency()) + value
          }
        },
        x: { 
          grid: { display: false }, 
          border: { display: false },
          ticks: { 
            color: tickColor, 
            font: { family: 'Raleway', size: 11, weight: 800 },
            padding: 10
          } 
        }
      },
      elements: {
        line: { tension: 0.5 },
        point: {
          radius: 0,
          hoverRadius: 8,
          hitRadius: 20,
          backgroundColor: '#fff',
          borderWidth: 4,
          borderColor: '#818cf8',
          hoverBorderWidth: 4
        }
      }
    };
  }

  // Doughnut Chart (Categories)
  public doughnutChartData: ChartData<'doughnut'> = { labels: [], datasets: [] };
  public get doughnutChartOptions(): ChartConfiguration<'doughnut'>['options'] {
    const isDark = this.themeService.isDarkMode();
    return {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '0%',
      layout: { padding: 30 },
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 2500,
        easing: 'easeOutElastic'
      },
      plugins: { 
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? 'rgba(10, 10, 20, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          titleColor: isDark ? '#fff' : '#000',
          bodyColor: isDark ? '#fff' : '#000',
          titleFont: { family: 'Raleway', size: 13, weight: 'bold' },
          bodyFont: { family: 'Raleway', size: 14, weight: 900 },
          padding: 12,
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          displayColors: true,
          boxPadding: 8
        }
      }
    };
  }

  // Account Analysis Chart
  public accountChartData: ChartData<'polarArea'> = { labels: [], datasets: [] };
  public get accountChartOptions(): ChartConfiguration<'polarArea'>['options'] {
    const isDark = this.themeService.isDarkMode();
    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          display: false,
          ticks: { display: false },
          grid: { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? 'rgba(10, 10, 20, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          titleColor: isDark ? '#fff' : '#000',
          bodyColor: isDark ? '#fff' : '#000',
          padding: 12,
          cornerRadius: 10,
          bodyFont: { family: 'Raleway', weight: 'bold' }
        }
      }
    };
  }

  // Payment Method Chart
  public methodChartData: ChartData<'bar'> = { labels: [], datasets: [] };
  public get methodChartOptions(): ChartConfiguration<'bar'>['options'] {
    const isDark = this.themeService.isDarkMode();
    return {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? 'rgba(10, 10, 20, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          titleColor: isDark ? '#fff' : '#000',
          bodyColor: isDark ? '#fff' : '#000',
          padding: 12,
          cornerRadius: 10
        }
      },
      scales: {
        x: { 
          display: false,
          grid: { display: false } 
        },
        y: {
          grid: { display: false },
          ticks: { 
            color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
            font: { family: 'Raleway', weight: 'bold', size: 11 }
          }
        }
      }
    };
  }

  // Form State
  public description = signal('');
  public amount: number | null = null;
  public category: ExpenseCategory = 'Food';
  public selectedInstrumentId = signal<string>('1'); // Default to Cash
  public date = new Date().toISOString().split('T')[0];
  public editingId = signal<string | null>(null);
  
  public isMobileMenuOpen = signal(false);
  public isCategoryOpen = signal(false);
  public isInstrumentOpen = signal(false);
  public isDescOpen = signal(false);
  public isInstrumentModalOpen = signal(false);
  public editingInstrumentId = signal<string | null>(null);
  
  public isModalTypeOpen = signal(false);
  public isModalAccountOpen = signal(false);
  
  public selectedSuggestionIndex = signal(-1);

  // New Instrument Form
  public newInstrument = {
    name: '',
    type: 'UPI' as PaymentType,
    accountName: undefined as string | undefined
  };

  // Autocomplete Logic
  public filteredSuggestions = computed(() => {
    const query = this.description().toLowerCase().trim();
    const unique = this.expenseService.uniqueDescriptions();
    const all = Array.from(new Set([...COMMON_EXPENSES, ...unique]));
    if (!query) return all.slice(0, 15);
    const startsWith = all.filter(s => s.toLowerCase().startsWith(query));
    const contains = all.filter(s => s.toLowerCase().includes(query) && !s.toLowerCase().startsWith(query));
    return [...startsWith, ...contains].slice(0, 20);
  });

  public limitInput: number | null = null;

  constructor() {
    Chart.register(...registerables);
    this.limitInput = this.monthlyLimit();
    effect(() => {
      this.expenses();
      this.updateCharts();
    });
    effect(() => {
      this.filteredSuggestions();
      this.selectedSuggestionIndex.set(-1);
    });
  }

  selectCategory(cat: ExpenseCategory) {
    this.category = cat;
    this.isCategoryOpen.set(false);
  }

  selectInstrument(instId: string) {
    this.selectedInstrumentId.set(instId);
    this.isInstrumentOpen.set(false);
  }

  selectSuggestion(suggestion: string) {
    this.description.set(suggestion);
    this.isDescOpen.set(false);
    this.selectedSuggestionIndex.set(-1);
  }

  onKeyDown(event: KeyboardEvent) {
    const suggestions = this.filteredSuggestions();
    if (!this.isDescOpen() || suggestions.length === 0) {
      if (event.key === 'ArrowDown') this.isDescOpen.set(true);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.selectedSuggestionIndex.update(i => (i + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.selectedSuggestionIndex.update(i => (i - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === 'Enter') {
      const index = this.selectedSuggestionIndex();
      if (index >= 0) {
        event.preventDefault();
        this.selectSuggestion(suggestions[index]);
      }
    } else if (event.key === 'Escape') {
      this.isDescOpen.set(false);
    }
  }

  updateCharts() {
    const periodData = this.expenseService.getAggregatedData(this.chartPeriod());
    this.barChartData = {
      labels: periodData.labels,
      datasets: [{
        data: periodData.data,
        label: 'Expenses',
        fill: true,
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          if (!chartArea) return undefined;
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(129, 140, 248, 0.5)');
          gradient.addColorStop(0.5, 'rgba(236, 72, 153, 0.1)');
          gradient.addColorStop(1, 'rgba(129, 140, 248, 0)');
          return gradient;
        },
        borderColor: '#818cf8',
        borderWidth: 4,
        pointBackgroundColor: '#fff',
        pointBorderColor: '#818cf8',
        pointHoverRadius: 8,
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#ec4899',
        spanGaps: true,
      }]
    };

    const catData = this.expenseService.getCategoryData();
    this.doughnutChartData = {
      labels: catData.labels,
      datasets: [{
        data: catData.data,
        backgroundColor: catData.labels.map(l => {
          const color = this.getCategoryColor(l as ExpenseCategory);
          return color + 'bb';
        }),
        borderColor: 'transparent',
        borderWidth: 0,
        hoverOffset: 20,
        hoverBorderColor: 'transparent',
        hoverBorderWidth: 0
      }]
    };

    const accData = this.expenseService.getAccountData();
    this.accountChartData = {
      labels: accData.labels,
      datasets: [{
        data: accData.data,
        backgroundColor: [
          '#818cf8bb', '#6366f1bb', '#4f46e5bb', '#3730a3bb', 
          '#a5b4fcbb', '#c7d2febb', '#e0e7ffbb'
        ],
        borderWidth: 0
      }]
    };

    const payData = this.expenseService.getPaymentTypeData();
    this.methodChartData = {
      labels: payData.labels,
      datasets: [{
        data: payData.data,
        backgroundColor: '#818cf8',
        borderRadius: 8,
        barThickness: 12,
      }]
    };
  }

  async addOrUpdateExpense() {
    if (this.description().trim() && this.amount && this.amount > 0) {
      const id = this.editingId();
      const expenseDate = new Date(this.date).getTime();
      const inst = this.paymentInstruments().find(i => i.id === this.selectedInstrumentId());
      
      if (id) {
        await this.expenseService.updateExpense(id, this.description(), this.amount, this.category, expenseDate, inst?.accountName, inst?.type, inst?.id, inst?.name);
      } else {
        await this.expenseService.addExpense(this.description(), this.amount, this.category, expenseDate, inst?.accountName, inst?.type, inst?.id, inst?.name);
      }
      this.resetForm();
    }
  }

  async addPersonalizedInstrument() {
    if (this.newInstrument.name.trim()) {
      const id = this.editingInstrumentId();
      if (id) {
        await this.expenseService.updatePaymentInstrument(
          id,
          this.newInstrument.name.trim(),
          this.newInstrument.type,
          this.newInstrument.accountName
        );
      } else {
        const inst = await this.expenseService.addPaymentInstrument(
          this.newInstrument.name.trim(),
          this.newInstrument.type,
          this.newInstrument.accountName
        );
        this.selectedInstrumentId.set(inst.id);
      }
      this.closeInstrumentModal();
    }
  }

  editInstrument(inst: PaymentInstrument) {
    this.editingInstrumentId.set(inst.id);
    this.newInstrument = {
      name: inst.name,
      type: inst.type,
      accountName: inst.accountName
    };
    this.isInstrumentModalOpen.set(true);
  }

  async removeInstrument(id: string, event: Event) {
    event.stopPropagation();
    if (id === '1') return; // Cannot delete Cash
    if (confirm('Delete this payment method?')) {
      await this.expenseService.removePaymentInstrument(id);
      if (this.selectedInstrumentId() === id) {
        this.selectedInstrumentId.set('1'); // Fallback to Cash
      }
    }
  }

  closeInstrumentModal() {
    this.isInstrumentModalOpen.set(false);
    this.editingInstrumentId.set(null);
    this.isModalTypeOpen.set(false);
    this.isModalAccountOpen.set(false);
    this.newInstrument = {
      name: '',
      type: 'UPI' as PaymentType,
      accountName: undefined
    };
  }

  updateLimit() {
    if (this.limitInput !== null && this.limitInput >= 0) {
      this.expenseService.setMonthlyLimit(this.limitInput);
    }
  }

  editExpense(expense: Expense) {
    this.editingId.set(expense.id);
    this.description.set(expense.description);
    this.amount = expense.amount;
    this.category = expense.category;
    this.selectedInstrumentId.set(expense.instrumentId || '1');
    this.date = new Date(expense.date).toISOString().split('T')[0];
  }

  async removeExpense(id: string) {
    if (confirm('Delete this transaction?')) {
      await this.expenseService.removeExpense(id);
      if (this.editingId() === id) this.resetForm();
    }
  }

  resetForm() {
    this.editingId.set(null);
    this.description.set('');
    this.amount = null;
    this.category = 'Food';
    this.selectedInstrumentId.set('1');
    this.date = new Date().toISOString().split('T')[0];
  }

  setPeriod(p: 'daily' | 'weekly' | 'monthly' | 'yearly') {
    this.chartPeriod.set(p);
  }

  setCurrency(c: Currency) {
    this.expenseService.setCurrency(c);
  }

  getCurrencySymbol(c: Currency): string {
    const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', INR: '₹' };
    return symbols[c] || c;
  }

  getInstrumentName(id: string): string {
    return this.paymentInstruments().find(i => i.id === id)?.name || 'Select Method';
  }

  getAccountColor(index: number): any {
    const bg = this.accountChartData.datasets[0]?.backgroundColor;
    if (Array.isArray(bg)) {
      return bg[index % bg.length];
    }
    return bg || '#818cf8';
  }

  getMethodDataValue(index: number): number {
    const data = this.methodChartData.datasets[0]?.data;
    if (!data) return 0;
    const val = data[index];
    if (typeof val === 'number') return val;
    if (Array.isArray(val)) return val[0] || 0;
    return 0;
  }

  ngOnDestroy() {}
}
