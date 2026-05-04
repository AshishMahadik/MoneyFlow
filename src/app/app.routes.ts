import { Routes } from '@angular/router';
import { ExpenseTrackerComponent } from './components/expense-tracker/expense-tracker.component';
import { TodoComponent } from './components/todo/todo.component';
import { TransactionsComponent } from './components/transactions/transactions.component';

export const routes: Routes = [
  { path: '', component: ExpenseTrackerComponent },
  { path: 'todos', component: TodoComponent },
  { path: 'transactions', component: TransactionsComponent },
  { path: '**', redirectTo: '' }
];
