import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { User } from '@app/user';
import { environment } from '@environments/environment';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-excel-developer-importer',
  templateUrl: './excel-developer-importer.html',
  styleUrls: [ './excel-developer-importer.css' ] // Fixed styleUrls property
})
export class ExcelDeveloperImporter
{
  constructor(private http: HttpClient) { }

  excelData: any[] = [];
  groupedData: { firstName: string, lastName: string, email: string, password: string }[] = [];

  onFileChange(event: any)
  {
    const target: DataTransfer = <DataTransfer>(event.target);
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

      // Convert the worksheet data to a JSON array using the first row as headers
      this.excelData = XLSX.utils.sheet_to_json(ws, { header: 1 });

      // Extract headers from the first row
      const headers = this.excelData[ 0 ] as string[];

      // Initialize the groupedData array
      this.groupedData = [];

      // Iterate through the rows starting from the second row
      for (let i = 1; i < this.excelData.length; i++)
      {
        const row = this.excelData[ i ];

        // Map the columns by header names
        const firstName = row[ headers.indexOf('First Name') ];
        const lastName = row[ headers.indexOf('Last Name') ];
        const email = row[ headers.indexOf('Email') ];
        const password = row[ headers.indexOf('Password') ];

        if (firstName && lastName && email && password)
        {
          // Add user data to groupedData
          this.groupedData.push({ firstName, lastName, email, password });
        }
      }

      console.log(this.groupedData);

      // Call the method to import data into the database
      this.ImportInDB();
    };

    reader.readAsBinaryString(target.files[ 0 ]);
  }

  async ImportInDB()
  {
    try
    {
      let users: {first_name: String, last_name: String, email: String, password: String}[] = [];
      this.groupedData.forEach(element => 
      {
        users.push({first_name: element.firstName, last_name: element.lastName, email: element.email, password: element.password});
      });
      
      const newDevelopers = await this.http.post(`${environment.apiUrl}/user/import`, users).toPromise();
      console.log('Import successful', newDevelopers);
    }
    catch (err)
    {
      console.log(err);
      return;
    }
  }
}