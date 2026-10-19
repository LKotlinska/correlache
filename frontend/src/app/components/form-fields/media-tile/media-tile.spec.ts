import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MediaTile } from './media-tile';

describe('MediaTile', () => {
  let component: MediaTile;
  let fixture: ComponentFixture<MediaTile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MediaTile],
    }).compileComponents();

    fixture = TestBed.createComponent(MediaTile);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
