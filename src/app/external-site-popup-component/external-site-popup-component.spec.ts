import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExternalSitePopupComponent } from './external-site-popup-component';

describe('ExternalSitePopupComponent', () => {
  let component: ExternalSitePopupComponent;
  let fixture: ComponentFixture<ExternalSitePopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExternalSitePopupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExternalSitePopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
