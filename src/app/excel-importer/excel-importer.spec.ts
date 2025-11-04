import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExcelImporter } from './excel-importer';

describe('ExcelImporter', () => {
  let component: ExcelImporter;
  let fixture: ComponentFixture<ExcelImporter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExcelImporter]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExcelImporter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
