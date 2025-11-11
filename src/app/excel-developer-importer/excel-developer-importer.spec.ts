import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExcelDeveloperImporter } from './excel-developer-importer';

describe('ExcelDeveloperImporter', () => {
  let component: ExcelDeveloperImporter;
  let fixture: ComponentFixture<ExcelDeveloperImporter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExcelDeveloperImporter]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExcelDeveloperImporter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
