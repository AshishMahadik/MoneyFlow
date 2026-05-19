import { Injectable, signal, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Todo } from '../models/todo';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TodoService {
  private readonly API_URL = 'https://moneyflowbe.ashishmahadik.in/todos';
  private readonly STORAGE_KEY = 'moneyflow_tasks';
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly http = inject(HttpClient);
  
  private readonly _todos = signal<Todo[]>([]);
  public readonly todos = this._todos.asReadonly();

  public readonly activeCount = signal<number>(0);
  public readonly completedCount = signal<number>(0);

  constructor() {
    if (this.isBrowser) {
      this.loadFromStorage();
      this.loadFromApi();
      
      effect(() => {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._todos()));
        this.updateCounts();
      });
    }
  }

  private async loadFromApi() {
    try {
      const apiTodos = await firstValueFrom(this.http.get<Todo[]>(this.API_URL));
      const localTodos = this._todos();
      
      const missingInApi = localTodos.filter(local => !apiTodos.some(api => api.id === local.id));
      
      for (const todo of missingInApi) {
        try {
          await firstValueFrom(this.http.post(this.API_URL + '/', todo));
          apiTodos.push(todo);
        } catch (e) {
          console.error('Failed to sync offline todo to API', e);
          apiTodos.push(todo);
        }
      }

      this._todos.set(apiTodos.sort((a, b) => b.createdAt - a.createdAt));
    } catch (e) {
      console.error('Failed to load todos from API', e);
    }
  }

  private loadFromStorage() {
    if (!this.isBrowser) return;
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (data) {
      try {
        this._todos.set(JSON.parse(data));
      } catch (e) {
        console.error('Failed to load todos', e);
        this._todos.set([]);
      }
    }
  }

  private updateCounts() {
    const todos = this._todos();
    this.activeCount.set(todos.filter(t => !t.completed).length);
    this.completedCount.set(todos.filter(t => t.completed).length);
  }

  async addTodo(title: string) {
    if (!title.trim()) return;
    
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      title: title.trim(),
      completed: false,
      createdAt: Date.now()
    };

    try {
      await firstValueFrom(this.http.post(this.API_URL + '/', newTodo));
      this._todos.update(todos => [newTodo, ...todos]);
    } catch (e) {
      console.error('Failed to add todo', e);
      this._todos.update(todos => [newTodo, ...todos]);
    }
  }

  async toggleTodo(id: string) {
    const todo = this._todos().find(t => t.id === id);
    if (!todo) return;

    const updatedTodo = { ...todo, completed: !todo.completed };

    try {
      await firstValueFrom(this.http.put(`${this.API_URL}/${id}`, updatedTodo));
      this._todos.update(todos =>
        todos.map(t => t.id === id ? updatedTodo : t)
      );
    } catch (e) {
      console.error('Failed to toggle todo', e);
      this._todos.update(todos =>
        todos.map(t => t.id === id ? updatedTodo : t)
      );
    }
  }

  async removeTodo(id: string) {
    try {
      await firstValueFrom(this.http.delete(`${this.API_URL}/${id}`));
      this._todos.update(todos => todos.filter(t => t.id !== id));
    } catch (e) {
      console.error('Failed to remove todo', e);
      this._todos.update(todos => todos.filter(t => t.id !== id));
    }
  }

  async clearCompleted() {
    const completed = this._todos().filter(t => t.completed);
    for (const todo of completed) {
      await this.removeTodo(todo.id);
    }
  }

  async updateTodo(id: string, title: string) {
    const todo = this._todos().find(t => t.id === id);
    if (!todo) return;

    const updatedTodo = { ...todo, title: title.trim() };

    try {
      await firstValueFrom(this.http.put(`${this.API_URL}/${id}`, updatedTodo));
      this._todos.update(todos =>
        todos.map(t => t.id === id ? updatedTodo : t)
      );
    } catch (e) {
      console.error('Failed to update todo', e);
      this._todos.update(todos =>
        todos.map(t => t.id === id ? updatedTodo : t)
      );
    }
  }
}
