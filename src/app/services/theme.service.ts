import { Injectable, signal, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly STORAGE_KEY = 'moneyflow_theme';

  public isDarkMode = signal<boolean>(true);

  constructor() {
    if (this.isBrowser) {
      const savedTheme = localStorage.getItem(this.STORAGE_KEY);
      if (savedTheme === 'light') {
        this.isDarkMode.set(false);
        document.documentElement.classList.add('light-mode');
      }

      effect(() => {
        const dark = this.isDarkMode();
        if (dark) {
          document.documentElement.classList.remove('light-mode');
          localStorage.setItem(this.STORAGE_KEY, 'dark');
        } else {
          document.documentElement.classList.add('light-mode');
          localStorage.setItem(this.STORAGE_KEY, 'light');
        }
      });
    }
  }

  toggleTheme() {
    this.isDarkMode.update(d => !d);
  }
}
