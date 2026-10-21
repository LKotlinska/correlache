import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Headaches } from './headaches';

describe('Headaches', () => {
  let component: Headaches;
  let fixture: ComponentFixture<Headaches>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Headaches],
    }).compileComponents();

    fixture = TestBed.createComponent(Headaches);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
