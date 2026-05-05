import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TodoService } from '../../services/todo.service';
import { ThemeService } from '../../services/theme.service';
import { ExpenseService, Currency } from '../../services/expense.service';

type FilterType = 'all' | 'active' | 'completed';

@Component({
  selector: 'app-todo',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './todo.component.html',
  styleUrl: './todo.component.css'
})
export class TodoComponent {
  private readonly todoService = inject(TodoService);
  public readonly themeService = inject(ThemeService);
  private readonly expenseService = inject(ExpenseService);
  
  public readonly currencies: Currency[] = ['USD', 'EUR', 'GBP', 'INR'];
  public readonly currentCurrency = this.expenseService.currency;

  public readonly filter = signal<FilterType>('all');
  
  public readonly filteredTodos = computed(() => {
    const todos = this.todoService.todos();
    const currentFilter = this.filter();
    
    switch (currentFilter) {
      case 'active':
        return todos.filter(t => !t.completed);
      case 'completed':
        return todos.filter(t => t.completed);
      default:
        return todos;
    }
  });

  public readonly allTodosCount = computed(() => this.todoService.todos().length);
  public readonly activeCount = this.todoService.activeCount;
  public readonly completedCount = this.todoService.completedCount;

  async addTodo(event: Event) {
    const input = event.target as HTMLInputElement;
    const title = input.value.trim();
    if (title) {
      await this.todoService.addTodo(title);
      input.value = '';
    }
  }

  async toggleTodo(id: string) {
    await this.todoService.toggleTodo(id);
  }

  async removeTodo(id: string) {
    await this.todoService.removeTodo(id);
  }

  setFilter(type: FilterType) {
    this.filter.set(type);
  }

  async clearCompleted() {
    await this.todoService.clearCompleted();
  }

  setCurrency(c: Currency) {
    this.expenseService.setCurrency(c);
  }
}
