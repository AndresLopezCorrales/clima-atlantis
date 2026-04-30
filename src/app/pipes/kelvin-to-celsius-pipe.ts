import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'kelvinToCelsius',
  standalone: true,
})
export class KelvinToCelsiusPipe implements PipeTransform {
  transform(kelvin: number, decimals: number = 1): string {
    if (kelvin == null || isNaN(kelvin)) return '--';
    const celsius = kelvin - 273.15;
    return `${celsius.toFixed(decimals)}°C`;
  }
}
