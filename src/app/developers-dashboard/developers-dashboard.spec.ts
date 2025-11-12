import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DevelopersDashboard } from './developers-dashboard';

describe('DevelopersDashboard', () => {
  let component: DevelopersDashboard;
  let fixture: ComponentFixture<DevelopersDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DevelopersDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DevelopersDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
