import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChipList } from './chip-list';

describe('ChipList', () => {
  let component: ChipList;
  let fixture: ComponentFixture<ChipList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChipList],
    }).compileComponents();

    fixture = TestBed.createComponent(ChipList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
