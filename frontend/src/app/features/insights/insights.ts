import { Component } from '@angular/core';
import { HeadachesPerMonth } from './charts/headaches-per-month/headaches-per-month';
import { TopTriggers } from './charts/top-triggers/top-triggers';
import { TopSymptoms } from './charts/top-symptoms/top-symptoms';
import { PainOverTime } from './charts/pain-over-time/pain-over-time';
import { HeadachesByWeekday } from './charts/headaches-by-weekday/headaches-by-weekday';
import { WorkoutsPerWeek } from './charts/workouts-per-week/workouts-per-week';
import { ExerciseProgress } from './charts/exercise-progress/exercise-progress';
import { MuscleBalance } from './charts/muscle-balance/muscle-balance';
import { WorkoutsVsHeadaches } from './charts/workouts-vs-headaches/workouts-vs-headaches';
import { WorkoutDayHeadaches } from './charts/workout-day-headaches/workout-day-headaches';
import { TimeSinceWorkout } from './charts/time-since-workout/time-since-workout';
import { IntensityVsPain } from './charts/intensity-vs-pain/intensity-vs-pain';
import { MuscleGroupHeadaches } from './charts/muscle-group-headaches/muscle-group-headaches';
import { InsightsData } from './insights-data';

@Component({
  imports: [
    HeadachesPerMonth,
    TopTriggers,
    TopSymptoms,
    PainOverTime,
    HeadachesByWeekday,
    WorkoutsPerWeek,
    WorkoutsVsHeadaches,
    WorkoutDayHeadaches,
    TimeSinceWorkout,
    IntensityVsPain,
    MuscleGroupHeadaches,
    ExerciseProgress,
    MuscleBalance,
  ],
  providers: [InsightsData],
  selector: 'app-insights',
  styleUrl: './insights.scss',
  templateUrl: './insights.html',
})
export class Insights {}
