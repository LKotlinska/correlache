import { HeadacheLocation } from '../lookups/headache-location.entity.js';
import { ReliefMeasure } from '../lookups/relief-measure.entity.js';
import { Symptom } from '../lookups/symptom.entity.js';
import { Trigger } from '../lookups/trigger.entity.js';

export interface HeadacheOptionsDto {
  headacheLocations: HeadacheLocation[];
  triggers: Trigger[];
  symptoms: Symptom[];
  reliefMeasures: ReliefMeasure[];
}
