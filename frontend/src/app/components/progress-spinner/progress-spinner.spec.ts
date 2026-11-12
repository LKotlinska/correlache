import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProgressSpinner } from './progress-spinner';

describe('PageSpinner', () => {
  let component: ProgressSpinner;
  let fixture: ComponentFixture<ProgressSpinner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressSpinner],
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressSpinner);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
