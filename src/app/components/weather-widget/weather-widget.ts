import { Component, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { WeatherService } from '../../services/weather';
import {
  WeatherCurrent,
  WeatherForecast,
  CachedSearch,
  GeoCity,
} from '../../models/weather.models';
import { KelvinToCelsiusPipe } from '../../pipes/kelvin-to-celsius-pipe';

@Component({
  selector: 'app-weather-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, KelvinToCelsiusPipe],
  providers: [KelvinToCelsiusPipe],
  templateUrl: './weather-widget.html',
  styleUrl: './weather-widget.scss',
})
export class WeatherWidgetComponent implements OnInit {
  searchQuery = '';
  isLoading = false;
  errorMessage = '';
  showSuggestions = false;

  currentWeather: WeatherCurrent | null = null;
  forecast: WeatherForecast | null = null;
  recentSearches: CachedSearch[] = [];

  citySuggestions: GeoCity[] = [];
  private searchTimeout: any = null;

  constructor(
    private weatherService: WeatherService,
    private kelvinPipe: KelvinToCelsiusPipe,
    private eRef: ElementRef,
  ) {}

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    const wrapper = this.eRef.nativeElement.querySelector('.search-wrapper');
    if (wrapper && !wrapper.contains(event.target as Node)) {
      this.citySuggestions = [];
    }
  }

  ngOnInit(): void {
    this.recentSearches = this.weatherService.getRecentSearches();
  }

  onSearch(): void {
    const city = this.searchQuery.trim();
    if (!city) return;
    this.citySuggestions = [];
    this.fetchWeather(city);
  }

  onInputChange(): void {
    const query = this.searchQuery.trim();
    this.citySuggestions = [];

    if (query.length < 2) return;

    // Debounce manual: espera 350ms después de que el usuario deje de escribir
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.weatherService.searchCities(query).subscribe({
        next: (cities) => (this.citySuggestions = cities),
        error: () => (this.citySuggestions = []),
      });
    }, 350);
  }

  fetchWeather(city: string): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.currentWeather = null;
    this.forecast = null;
    this.searchQuery = city;

    // forkJoin hace las dos peticiones en paralelo
    forkJoin({
      current: this.weatherService.getCurrentWeather(city),
      forecast: this.weatherService.getForecast(city),
    }).subscribe({
      next: ({ current, forecast }) => {
        this.currentWeather = current;
        this.forecast = forecast;
        this.weatherService.addToCache(city);
        this.recentSearches = this.weatherService.getRecentSearches();
        this.isLoading = false;
      },
      error: (err: Error) => {
        this.errorMessage = err.message;
        this.isLoading = false;
      },
    });
  }

  onInputFocus(): void {
    // Mostrar caché solo si no hay sugerencias activas y no hay texto
    if (!this.searchQuery.trim()) {
      this.showSuggestions = this.recentSearches.length > 0;
    }
  }

  onInputBlur(): void {
    setTimeout(() => {
      this.showSuggestions = false;
      this.citySuggestions = [];
    }, 200);
  }

  selectCity(city: GeoCity): void {
    const cityName = `${city.name},${city.country}`;
    this.searchQuery = city.name;
    this.citySuggestions = [];
    this.fetchWeather(cityName);
  }

  selectSuggestion(city: string): void {
    this.searchQuery = city;
    this.fetchWeather(city);
  }

  clearCache(): void {
    this.weatherService.clearCache();
    this.recentSearches = [];
  }

  getWeatherIcon(iconCode: string): string {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  }

  getDayName(dt_txt: string): string {
    const date = new Date(dt_txt);
    return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
  }

  // Agregar en weather-widget.component.ts

  get detailItems() {
    if (!this.currentWeather) return [];
    const w = this.currentWeather;

    return [
      {
        icon: 'fa-solid fa-temperature-half',
        label: 'Sensación Térmica',
        value: this.kelvinPipe.transform(w.main.feels_like),
        sub: this.getFeelsLikeDesc(w.main.feels_like, w.main.temp),
      },
      {
        icon: 'fa-solid fa-droplet',
        label: 'Humedad Relativa',
        value: `${w.main.humidity} %`,
        sub: this.getHumidityDesc(w.main.humidity),
      },
      {
        icon: 'fa-solid fa-wind',
        label: `Viento del ${this.getWindDir(w.wind?.deg)}`,
        value: `${w.wind?.speed?.toFixed(2)} m/s`,
        sub: this.getWindDesc(w.wind?.speed),
      },
      {
        icon: 'fa-solid fa-eye',
        label: 'Visibilidad',
        value: `${(w.visibility / 1000).toFixed(1)} km`,
        sub: this.getVisibilityDesc(w.visibility),
      },
    ];
  }

  getSunTime(unix: number): string {
    if (!unix) return '--:--';
    return new Date(unix * 1000).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getSunPosition(): number {
    if (!this.currentWeather) return 50;
    const now = Date.now() / 1000;
    const { sunrise, sunset } = this.currentWeather.sys;
    if (now <= sunrise) return 0;
    if (now >= sunset) return 100;
    return Math.round(((now - sunrise) / (sunset - sunrise)) * 100);
  }

  private getFeelsLikeDesc(feels: number, actual: number): string {
    const diff = feels - actual;
    if (diff > 2) return 'Más cálido de lo que marca';
    if (diff < -2) return 'Levemente más fresco';
    return 'Similar a la temperatura real';
  }

  private getHumidityDesc(h: number): string {
    if (h < 30) return 'Ambiente seco';
    if (h < 60) return 'Confort moderado';
    if (h < 80) return 'Algo húmedo';
    return 'Muy húmedo';
  }

  private getWindDir(deg: number): string {
    if (deg == null) return '';
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
    return dirs[Math.round(deg / 45) % 8];
  }

  private getWindDesc(speed: number): string {
    if (speed < 1) return 'Calma';
    if (speed < 4) return 'Brisa apacible';
    if (speed < 8) return 'Brisa moderada';
    if (speed < 14) return 'Viento fuerte';
    return 'Vendaval';
  }

  private getVisibilityDesc(v: number): string {
    if (v >= 10000) return 'Horizonte despejado';
    if (v >= 5000) return 'Visibilidad aceptable';
    if (v >= 1000) return 'Neblina ligera';
    return 'Niebla densa';
  }
}
