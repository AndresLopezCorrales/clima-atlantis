import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { WeatherCurrent, WeatherForecast, CachedSearch, GeoCity } from '../models/weather.models';

@Injectable({
  providedIn: 'root',
})
export class WeatherService {
  private readonly API_KEY = '96b98a5a2c16d6e27269fa143d8c62bb';
  private readonly BASE_URL = 'https://api.openweathermap.org/data/2.5';
  private readonly CACHE_KEY = 'weather_recent_searches';
  private readonly MAX_CACHE = 5;

  constructor(private http: HttpClient) {}

  getCurrentWeather(city: string): Observable<WeatherCurrent> {
    const url = `${this.BASE_URL}/weather?q=${encodeURIComponent(city)}&appid=${this.API_KEY}&lang=es`;
    return this.http.get<WeatherCurrent>(url).pipe(catchError(this.handleError));
  }

  getForecast(city: string): Observable<WeatherForecast> {
    const url = `${this.BASE_URL}/forecast?q=${encodeURIComponent(city)}&appid=${this.API_KEY}&lang=es&cnt=40`;
    return this.http.get<WeatherForecast>(url).pipe(
      map((data) => ({
        ...data,
        list: this.filterDailyForecasts(data.list),
      })),
      catchError(this.handleError),
    );
  }

  // Filtra 1 pronóstico por día (al mediodía)
  private filterDailyForecasts(list: WeatherForecast['list']): WeatherForecast['list'] {
    const seen = new Set<string>();
    return list
      .filter((item) => {
        const date = item.dt_txt.split(' ')[0];
        if (!seen.has(date)) {
          seen.add(date);
          return true;
        }
        return false;
      })
      .slice(0, 5);
  }

  // Caché de últimas 5 búsquedas

  getRecentSearches(): CachedSearch[] {
    const raw = localStorage.getItem(this.CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  addToCache(city: string): void {
    let searches = this.getRecentSearches();
    searches = searches.filter((s) => s.city.toLowerCase() !== city.toLowerCase());
    searches.unshift({ city, timestamp: Date.now() });
    searches = searches.slice(0, this.MAX_CACHE);
    localStorage.setItem(this.CACHE_KEY, JSON.stringify(searches));
  }

  clearCache(): void {
    localStorage.removeItem(this.CACHE_KEY);
  }

  // Manejo de errores
  private handleError(error: HttpErrorResponse): Observable<never> {
    let message = 'Error desconocido';
    if (error.status === 0) {
      message = 'Sin conexión a internet. Verifica tu red.';
    } else if (error.status === 404) {
      message = 'Ciudad no encontrada. Verifica el nombre.';
    } else if (error.status === 401) {
      message = 'API Key inválida.';
    } else if (error.status === 429) {
      message = 'Límite de peticiones alcanzado. Intenta más tarde.';
    } else {
      message = `Error del servidor: ${error.status}`;
    }
    return throwError(() => new Error(message));
  }

  searchCities(query: string): Observable<GeoCity[]> {
    if (!query || query.length < 2) return of([]);
    const url = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(query)}&limit=5&appid=${this.API_KEY}`;
    return this.http.get<GeoCity[]>(url).pipe(catchError(() => of([])));
  }
}
