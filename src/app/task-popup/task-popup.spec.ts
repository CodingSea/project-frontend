import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TaskPopup } from './task-popup';

describe('TaskPopup', () => {
  let component: TaskPopup;
  let fixture: ComponentFixture<TaskPopup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskPopup]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TaskPopup);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
