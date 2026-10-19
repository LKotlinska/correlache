import { TestBed } from '@angular/core/testing';
import { HeadacheService } from './headache.service';

describe('Headache', () => {
  let service: HeadacheService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HeadacheService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
