import { Pipe, PipeTransform } from '@angular/core';

/** Formats a duration in seconds as e.g. "1h 5min", "45min", "2min 30s" or "40s". */
@Pipe({ name: 'duration' })
export class DurationPipe implements PipeTransform {
  transform(seconds: number | null | undefined): string {
    if (seconds == null) return '';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (secs === 0) return hours > 0 ? `${hours}h ${minutes}min` : `${minutes}min`;
    if (hours > 0) return `${hours}h ${minutes}min ${secs}s`;
    return minutes > 0 ? `${minutes}min ${secs}s` : `${secs}s`;
  }
}
