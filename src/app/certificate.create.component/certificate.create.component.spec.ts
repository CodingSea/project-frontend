import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CertificateCreateComponent } from './certificate.create.component';

describe('CertificateCreateComponent', () => {
  let component: CertificateCreateComponent;
  let fixture: ComponentFixture<CertificateCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CertificateCreateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CertificateCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
