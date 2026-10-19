import { TestBed } from '@angular/core/testing';
import { Headache } from './headache';

describe('Headache', () => {
  let service: Headache;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Headache);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
