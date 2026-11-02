import { Component, computed, inject, signal } from '@angular/core';
import { HeadacheService } from '../../services/headache.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatChipListbox, MatChipListboxChange, MatChipOption } from '@angular/material/chips';
import { MatProgressBar } from '@angular/material/progress-bar';
import { Button } from '../../components/button/button';
import { ListItem } from '../../components/list-item/list-item';
import { WorkoutService } from '../../services/workout.service';
import { Workout } from '../../models/workout.model';
import { formatDuration } from '../../utils/duration';
import { addDays, dayKey, dayLabel, startOfWeek, weekLabel } from '../../utils/date';

const WEEKS_PER_PAGE = 4;

export type DiaryFilter = 'all' | DiaryEntry['kind'];

interface DiaryEntry {
  kind: 'headache' | 'activity';
  id: string;
  title: string;
  line: string;
  details: string[];
  link: string[];
  startedAt: Date;
}

interface DiaryDay {
  key: string;
  label: string;
  entries: DiaryEntry[];
}

interface DiaryWeek {
  key: string;
  label: string;
  isCurrent: boolean;
  summary: string;
  days: DiaryDay[];
}

@Component({
  imports: [MatChipListbox, MatChipOption, MatProgressBar, Button, ListItem],
  selector: 'app-diary',
  styleUrl: './diary.scss',
  templateUrl: './diary.html',
})
export class Diary {
  private headacheService = inject(HeadacheService);
  private workoutService = inject(WorkoutService);

  /** How many weeks back from the current one are loaded, including the current week. */
  weeksLoaded = signal(WEEKS_PER_PAGE);

  filter = signal<DiaryFilter>('all');

  private from = computed(() => addDays(startOfWeek(new Date()), -7 * (this.weeksLoaded() - 1)));

  headaches = rxResource({
    params: () => ({ from: this.from() }),
    stream: ({ params }) => this.headacheService.getHeadaches(params),
  });

  workouts = rxResource({
    params: () => ({ from: this.from() }),
    stream: ({ params }) => this.workoutService.getWorkouts(params),
  });

  /** True only before the first load, so loading earlier weeks does not blank the list. */
  isInitialLoading = computed(() => !this.headaches.hasValue() || !this.workouts.hasValue());
  isLoadingMore = computed(() => this.headaches.isLoading() || this.workouts.isLoading());

  weeks = computed<DiaryWeek[]>(() => {
    const filter = this.filter();
    const entries = [...this.headacheEntries(), ...this.workoutEntries()]
      .filter((entry) => filter === 'all' || entry.kind === filter)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
    const currentWeek = startOfWeek(new Date());

    const weeks = new Map<string, { monday: Date; entries: DiaryEntry[] }>();
    for (const entry of entries) {
      const monday = startOfWeek(entry.startedAt);
      const key = dayKey(monday);
      if (!weeks.has(key)) weeks.set(key, { monday, entries: [] });
      weeks.get(key)!.entries.push(entry);
    }

    return [...weeks].map(([key, { monday, entries }]) => ({
      key,
      label: weekLabel(monday),
      isCurrent: key === dayKey(currentWeek),
      summary: this.summarise(entries),
      days: this.groupByDay(entries),
    }));
  });

  onFilterChange(event: MatChipListboxChange) {
    // Clicking the selected chip would clear the selection; keep the current filter instead
    if (event.value) this.filter.set(event.value);
    else event.source.value = this.filter();
  }

  loadEarlier() {
    this.weeksLoaded.update((weeks) => weeks + WEEKS_PER_PAGE);
  }

  private headacheEntries = computed<DiaryEntry[]>(() =>
    (this.headaches.value() ?? []).map((headache) => ({
      kind: 'headache',
      id: headache.id,
      title: `Headache - ${headache.painLevel}/10`,
      line: '',
      details: [
        (headache.locations ?? []).map((l) => l.name).join(', '),
        this.nameList(headache.symptoms ?? [], 2),
      ].filter(Boolean),
      link: ['/user/headache', headache.id],
      startedAt: new Date(headache.startedAt),
    })),
  );

  private workoutEntries = computed<DiaryEntry[]>(() =>
    (this.workouts.value() ?? []).map((workout) => ({
      kind: 'activity',
      id: workout.id,
      title: workout.title,
      line: this.timeAndDuration(workout.startedAt, workout.durationSeconds),
      details: [this.workoutDetail(workout)].filter(Boolean),
      link: ['/user/workout', workout.id],
      startedAt: new Date(workout.startedAt),
    })),
  );

  private groupByDay(entries: DiaryEntry[]): DiaryDay[] {
    const days = new Map<string, DiaryDay>();
    for (const entry of entries) {
      const key = dayKey(entry.startedAt);
      if (!days.has(key)) days.set(key, { key, label: dayLabel(entry.startedAt), entries: [] });
      days.get(key)!.entries.push(entry);
    }
    return [...days.values()];
  }

  private summarise(entries: DiaryEntry[]): string {
    const workouts = entries.filter((e) => e.kind === 'activity').length;
    const headaches = entries.length - workouts;
    return [
      workouts && `${workouts} ${workouts === 1 ? 'workout' : 'workouts'}`,
      headaches && `${headaches} ${headaches === 1 ? 'headache' : 'headaches'}`,
    ].filter(Boolean).join(' · ');
  }

  /** The first `max` names, followed by how many more there are. */
  private nameList(options: { name: string }[], max: number): string {
    const names = options.slice(0, max).map((o) => o.name).join(', ');
    return options.length > max ? `${names} +${options.length - max}` : names;
  }

  private timeAndDuration(startedAt: string, seconds: number): string {
    return [this.time(new Date(startedAt)), formatDuration(seconds)].filter(Boolean).join(' · ');
  }

  private workoutDetail(workout: Workout): string {
    const exercises = workout.exercises.length;
    const sets = workout.exercises.reduce((sum, e) => sum + e.sets.length, 0);
    return [
      exercises && `${exercises} ${exercises === 1 ? 'exercise' : 'exercises'}`,
      sets && `${sets} ${sets === 1 ? 'set' : 'sets'}`,
    ].filter(Boolean).join(' · ');
  }

  private time(date: Date): string {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }
}
