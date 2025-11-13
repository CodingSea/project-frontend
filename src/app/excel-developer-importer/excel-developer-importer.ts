import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Output } from '@angular/core';
import { environment } from '@environments/environment';
import * as XLSX from 'xlsx';
import { firstValueFrom } from 'rxjs'; // ✅ recommended over .toPromise()
import { DevelopersDashboard } from '@app/developers-dashboard/developers-dashboard';
import { CommonModule } from '@angular/common';

@Component({
  imports: [ CommonModule ],
  selector: 'app-excel-developer-importer',
  templateUrl: './excel-developer-importer.html',
  styleUrls: [ './excel-developer-importer.css' ]
})
export class ExcelDeveloperImporter
{
  constructor(private http: HttpClient) { }

  @Output() importComplete = new EventEmitter<void>();

  excelData: any[] = [];
  groupedData: { firstName: string; lastName: string; email: string; password: string }[] = [];

  onFileChange(event: any)
  {
    const target: DataTransfer = <DataTransfer>event.target;
    if (target.files.length !== 1)
    {
      throw new Error('Cannot use multiple files');
    }

    const reader: FileReader = new FileReader();
    reader.onload = (e: any) =>
    {
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });

      const wsname: string = wb.SheetNames[ 0 ];
      const ws: XLSX.WorkSheet = wb.Sheets[ wsname ];

      this.excelData = XLSX.utils.sheet_to_json(ws, { header: 1 });
      const headers = this.excelData[ 0 ] as string[];
      this.groupedData = [];

      for (let i = 1; i < this.excelData.length; i++)
      {
        const row = this.excelData[ i ];
        const firstName = row[ headers.indexOf('First Name') ]?.toLowerCase() || '';
        const lastName = row[ headers.indexOf('Last Name') ]?.toLowerCase() || '';
        const email = row[ headers.indexOf('Email') ]?.toLowerCase() || '';
        const password = row[ headers.indexOf('Password') ]?.toLowerCase() || '';

        if (firstName && lastName && email && password)
        {
          this.groupedData.push({ firstName, lastName, email, password });
        }
      }

       this.ImportInDB();

    };

    reader.readAsBinaryString(target.files[ 0 ]);
  }

  async ImportInDB()
  {
    try
    {
      // ✅ Convert to API user format
      const users = this.groupedData.map((element) => ({
        first_name: element.firstName,
        last_name: element.lastName,
        email: element.email,
        password: element.password
      }));

      // ✅ Fetch all existing users (you can optimize this endpoint)
      const existingUsers: any[] = await firstValueFrom(
        this.http.get<any[]>(`${environment.apiUrl}/user`)
      );

      // ✅ Build a set of existing emails for faster lookup
      const existingEmails = new Set(existingUsers.map((u) => u.email.toLowerCase()));

      // ✅ Filter out duplicates
      const newUsers = users.filter((u) => !existingEmails.has(u.email.toLowerCase()));

      if (newUsers.length === 0)
      {
        console.warn('All users already exist — nothing to import.');
        return;
      }

      // ✅ Send only new users to the backend
      const imported = await firstValueFrom(
        await this.http.post(`${environment.apiUrl}/user/import`, newUsers)
      ).then(async () => { await this.importComplete.emit(); });



    } catch (err)
    {
      console.error('❌ Import failed:', err);
    }
  }
}
