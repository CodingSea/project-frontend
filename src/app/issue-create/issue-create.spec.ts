import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IssueCreate } from './issue-create';

describe('IssueCreate', () => {
  let component: IssueCreate;
  let fixture: ComponentFixture<IssueCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IssueCreate]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IssueCreate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
