export interface WeatherCurrent {
  name: string;
  coord: { lat: number; lon: number };
  sys: { country: string; sunrise: number; sunset: number };
  main: {
    temp: number; // en Kelvin
    feels_like: number; // en Kelvin
    humidity: number;
    temp_min: number;
    temp_max: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  wind: { speed: number; deg: number };
  visibility: number;
}

export interface ForecastItem {
  dt: number;
  dt_txt: string;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
}

export interface WeatherForecast {
  list: ForecastItem[];
  city: { name: string; country: string };
}

export interface CachedSearch {
  city: string;
  timestamp: number;
}

export interface GeoCity {
  name: string;
  local_names?: { [key: string]: string };
  lat: number;
  lon: number;
  country: string;
  state?: string;
}
