import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Headache } from '../headaches/entities/headache.entity.js';
import { Workout } from '../exercise-library/entities/workout.entity.js';

/** How much of one kind of entry a user has logged. */
export interface SourceSummary {
  count: number;
  /** When the earliest entry started, or null when there are none. */
  firstStartedAt: Date | null;
}

export interface HistorySummary {
  headaches: SourceSummary;
  workouts: SourceSummary;
}

/** Counts and first dates of a user's entries, so the client can tell if there is enough history without loading it all. */
@Injectable()
export class HistorySummaryService {
  constructor(
    @InjectRepository(Headache) private readonly headacheRepo: Repository<Headache>,
    @InjectRepository(Workout) private readonly workoutRepo: Repository<Workout>,
  ) {}

  async summarize(userId: string): Promise<HistorySummary> {
    const [headaches, workouts] = await Promise.all([
      this.summarizeSource(this.headacheRepo, userId),
      this.summarizeSource(this.workoutRepo, userId),
    ]);
    return { headaches, workouts };
  }

  private async summarizeSource(repo: Repository<Headache | Workout>, userId: string): Promise<SourceSummary> {
    const raw = await repo
      .createQueryBuilder('entry')
      .select('COUNT(*)', 'count')
      .addSelect('MIN(entry.startedAt)', 'first')
      .where('entry.userId = :userId', { userId })
      .getRawOne<{ count: string | number; first: Date | string | null }>();
    // MySQL returns COUNT as a string
    return {
      count: Number(raw?.count ?? 0),
      firstStartedAt: raw?.first ? new Date(raw.first) : null,
    };
  }
}
