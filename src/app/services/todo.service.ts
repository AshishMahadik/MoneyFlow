import { Injectable, signal, computed, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Todo } from '../models/todo';

@Injectable({
  providedIn: 'root'
})
export class TodoService {
  private readonly STORAGE_KEY = 'moneyflow_tasks';
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  
  private readonly _todos = signal<Todo[]>([]);

  public readonly todos = this._todos.asReadonly();
  
  public readonly activeCount = computed(() => 
    this._todos().filter(t => !t.completed).length
  );
  
  public readonly completedCount = computed(() => 
    this._todos().filter(t => t.completed).length
  );

  constructor() {
    if (this.isBrowser) {
      this.loadFromStorage();
      
      // Auto-save whenever todos change
      effect(() => {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._todos()));
      });
    }
  }

  private loadFromStorage() {
    if (!this.isBrowser) return;
    
    const data = localStorage.getItem(this.STORAGE_KEY);
    if (data) {
      try {
        this._todos.set(JSON.parse(data));
      } catch (e) {
        console.error('Failed to load tasks from localStorage', e);
        this._todos.set([]);
      }
    }
  }

  addTodo(title: string) {
    if (!title.trim()) return;
    
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      title: title.trim(),
      completed: false,
      createdAt: Date.now()
    };
    
    this._todos.update(todos => [newTodo, ...todos]);
  }

  toggleTodo(id: string) {
    this._todos.update(todos => 
      todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    );
  }

  removeTodo(id: string) {
    this._todos.update(todos => todos.filter(t => t.id !== id));
  }

  clearCompleted() {
    this._todos.update(todos => todos.filter(t => !t.completed));
  }

  updateTodo(id: string, title: string) {
    this._todos.update(todos => 
      todos.map(t => t.id === id ? { ...t, title: title.trim() } : t)
    );
  }
}
