import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';
import { CreateIntakePayload, Medication, MedicationIntake, MedicationPayload } from '../models/medication.model';
import { dateRangeParams } from '../utils/date';

@Service()
export class MedicationService {
  private http = inject(HttpClient);

  /** The user's medications by name; archived ones only when `includeArchived`. */
  getMedications(includeArchived = false): Observable<Medication[]> {
    const params: Record<string, string> = includeArchived ? { includeArchived: 'true' } : {};
    return this.http.get<Medication[]>('/api/medications', { params });
  }

  createMedication(payload: MedicationPayload) {
    return this.http.post<Medication>('/api/medications', payload);
  }

  updateMedication(id: string, payload: MedicationPayload) {
    return this.http.put<Medication>(`/api/medications/${id}`, payload);
  }

  /** Deletes the medication, or archives it when doses of it were logged. */
  deleteMedication(id: string) {
    return this.http.delete<void>(`/api/medications/${id}`);
  }

  /** Doses newest first, optionally only those taken from `from` (inclusive) until `to` (exclusive), and at most `limit`. */
  getIntakes(range: { from?: Date; to?: Date; limit?: number } = {}): Observable<MedicationIntake[]> {
    return this.http.get<MedicationIntake[]>('/api/medication-intakes', { params: dateRangeParams(range) });
  }

  getIntakeById(id: string): Observable<MedicationIntake> {
    return this.http.get<MedicationIntake>(`/api/medication-intakes/${id}`);
  }

  createIntake(payload: CreateIntakePayload) {
    return this.http.post<MedicationIntake>('/api/medication-intakes', payload);
  }

  updateIntake(id: string, payload: CreateIntakePayload) {
    return this.http.put<MedicationIntake>(`/api/medication-intakes/${id}`, payload);
  }

  deleteIntake(id: string) {
    return this.http.delete<void>(`/api/medication-intakes/${id}`);
  }
}
