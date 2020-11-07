import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private darkThemeSubject = new BehaviorSubject<boolean>(false)
  darkTheme$ = this.darkThemeSubject.asObservable()

  toggleTheme(): void{
    this.darkThemeSubject.next(!this.darkThemeSubject.value)
  }
}
