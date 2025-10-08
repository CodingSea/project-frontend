import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddTaskPopup } from './add-task-popup';

describe('AddTaskPopup', () => {
  let component: AddTaskPopup;
  let fixture: ComponentFixture<AddTaskPopup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddTaskPopup]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddTaskPopup);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
