import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DevelopersSearchComponent } from './developers.search.component';

describe('DevelopersSearchComponent', () => {
  let component: DevelopersSearchComponent;
  let fixture: ComponentFixture<DevelopersSearchComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DevelopersSearchComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DevelopersSearchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
