import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OutlinedField } from './outlined-field';

describe('OutlinedField', () => {
  let component: OutlinedField;
  let fixture: ComponentFixture<OutlinedField>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OutlinedField],
    }).compileComponents();

    fixture = TestBed.createComponent(OutlinedField);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
