import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeadacheView } from './headache-view';

describe('HeadacheView', () => {
  let component: HeadacheView;
  let fixture: ComponentFixture<HeadacheView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeadacheView],
    }).compileComponents();

    fixture = TestBed.createComponent(HeadacheView);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
