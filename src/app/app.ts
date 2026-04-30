// src/app/app.component.ts

import { Component } from '@angular/core';
import { WeatherWidgetComponent } from './components/weather-widget/weather-widget';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [WeatherWidgetComponent],
  template: `<app-weather-widget />`,
})
export class App {}
