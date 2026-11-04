import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { HeadacheService } from '../../services/headache.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatChipListbox, MatChipListboxChange, MatChipOption } from '@angular/material/chips';
import { MatProgressBar } from '@angular/material/progress-bar';
import { Button } from '../../components/button/button';
import { ListItem } from '../../components/list-item/list-item';
import { WorkoutService } from '../../services/workout.service';
import { Workout } from '../../models/workout.model';
import { Headache } from '../../models/headache.model';
import { forkJoin, map } from 'rxjs';
import { formatDuration } from '../../utils/duration';
import { addDays, dayKey, dayLabel, formatTime, startOfWeek, weekLabel } from '../../utils/date';

const WEEKS_PER_PAGE = 4;

interface DiaryPage {
  page: number;
  headaches: Headache[];
  workouts: Workout[];
  /** Whether anything was logged before this page's first week. */
  hasEarlier: boolean;
}

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

  private currentWeek = startOfWeek(new Date());

  /** Index of the page being loaded; page 0 ends today and each following page is the `WEEKS_PER_PAGE` weeks before it. */
  private page = signal(0);

  filter = signal<DiaryFilter>('all');

  /** Pages loaded so far, kept so that a failed or slow page never blanks what is already shown. */
  private pages = signal<DiaryPage[]>([]);

  pageResource = rxResource({
    /** Re-run the resource whenever page changes */
    params: () => ({ page: this.page() }),
    stream: ({ params: { page } }) => {
      const from = this.pageStart(page);
      const to = page === 0 ? undefined : this.pageStart(page - 1);
      /** forkJoin could cause the whole page to fail if one request fails - keep for now */
      return forkJoin({
        headaches: this.headacheService.getHeadaches({ from, to }),
        workouts: this.workoutService.getWorkouts({ from, to }),
        earlierHeadaches: this.headacheService.getHeadaches({ to: from, limit: 1 }),
        earlierWorkouts: this.workoutService.getWorkouts({ to: from, limit: 1 }),
      }).pipe(
        map(({ headaches, workouts, earlierHeadaches, earlierWorkouts }): DiaryPage => ({
          page,
          headaches,
          workouts,
          hasEarlier: earlierHeadaches.length + earlierWorkouts.length > 0,
        })),
      );
    },
  });

  /** Describe the state of the diary's paged loading. */
  /** Update whenever pages or pageResource changes. */
  isInitialLoading = computed(() => this.pages().length === 0 && !this.pageResource.error());
  hasInitialError = computed(() => this.pages().length === 0 && !!this.pageResource.error());
  hasLoadMoreError = computed(() => this.pages().length > 0 && !!this.pageResource.error());
  isLoadingMore = computed(() => this.pageResource.isLoading());
  hasEarlier = computed(() => this.pages().at(-1)?.hasEarlier ?? false);
  weeksLoaded = computed(() => this.pages().length * WEEKS_PER_PAGE);

  /** Builds a new array from the old one. */
  constructor() {
    effect(() => {
      if (!this.pageResource.hasValue()) return;
      const loaded = this.pageResource.value();
      /** Untracked means the effect re-runs only when the resource produces a new value. */
      untracked(() => this.pages.update((pages) => [...pages.slice(0, loaded.page), loaded]));
    });
  }

  /** Turns the flat list of loaded entries into entries grouped by week */
  weeks = computed<DiaryWeek[]>(() => {
    const filter = this.filter();
    const entries = [...this.headacheEntries(), ...this.workoutEntries()]
      .filter((entry) => filter === 'all' || entry.kind === filter)
      /** Subtracting a from b gives a descending sort. */
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime()); 
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
      isCurrent: key === dayKey(this.currentWeek),
      summary: this.summarise(entries),
      days: this.groupByDay(entries),
    }));
  });

  onFilterChange(event: MatChipListboxChange) {
    /** Clicking the selected chip would clear the selection, so keep the current filter instead. */ 
    if (event.value) this.filter.set(event.value);
    else event.source.value = this.filter();
  }

  loadEarlier() {
    this.page.set(this.pages().length);
  }

  retry() {
    this.pageResource.reload();
  }

  /** Monday of the first week on `page`. */
  private pageStart(page: number): Date {
    return addDays(this.currentWeek, -7 * (WEEKS_PER_PAGE * (page + 1) - 1));
  }

  private headacheEntries = computed<DiaryEntry[]>(() =>
    this.pages().flatMap((p) => p.headaches).map((headache) => ({
      kind: 'headache',
      id: headache.id,
      title: `Headache - ${headache.painLevel}/10`,
      line: this.timeRange(headache.startedAt, headache.endedAt),
      details: [(headache.locations ?? []).map((l) => l.name).join(', ')].filter(Boolean),
      link: ['/user/headache', headache.id],
      startedAt: new Date(headache.startedAt),
    })),
  );

  private workoutEntries = computed<DiaryEntry[]>(() =>
    this.pages().flatMap((p) => p.workouts).map((workout) => ({
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

  /** Builds the short summary string for a week, such as "2 workouts, 1 headache" */
  private summarise(entries: DiaryEntry[]): string {
    const workouts = entries.filter((e) => e.kind === 'activity').length;
    const headaches = entries.length - workouts;
    return [
      workouts && `${workouts} ${workouts === 1 ? 'workout' : 'workouts'}`,
      headaches && `${headaches} ${headaches === 1 ? 'headache' : 'headaches'}`,
    ].filter(Boolean).join(' · ');
  }

  /** "14:05" or, when it has ended, "14:05 – 15:30". */
  private timeRange(startedAt: string, endedAt: string | null): string {
    const start = formatTime(new Date(startedAt));
    return endedAt ? `${start} – ${formatTime(new Date(endedAt))}` : start;
  }

  private timeAndDuration(startedAt: string, seconds: number): string {
    return [formatTime(new Date(startedAt)), formatDuration(seconds)].filter(Boolean).join(' · ');
  }

  /** Builds the one-line description for a single workout - "4 exercises, 12 sets" */
  private workoutDetail(workout: Workout): string {
    const exercises = workout.exercises.length;
    const sets = workout.exercises.reduce((sum, e) => sum + e.sets.length, 0);
    return [
      exercises && `${exercises} ${exercises === 1 ? 'exercise' : 'exercises'}`,
      sets && `${sets} ${sets === 1 ? 'set' : 'sets'}`,
    ].filter(Boolean).join(' · ');
  }
}
