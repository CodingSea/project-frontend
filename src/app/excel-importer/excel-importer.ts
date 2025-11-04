import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-excel-importer',
  imports: [ CommonModule ],
  templateUrl: './excel-importer.html',
  styleUrls: [ './excel-importer.css' ]
})
export class ExcelImporter
{
  excelData: any[] = [];
  groupedData: { projectName: string; services: string[] }[] = []; // Array to hold projects and their services

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

      // Convert the worksheet data to a JSON array
      this.excelData = XLSX.utils.sheet_to_json(ws, { header: 1 });

      // Initialize the groupedData array
      this.groupedData = [];
      let lastProjectEntry: { projectName: string; services: string[] } | null = null;

      this.excelData.forEach(row =>
      {
        const projectName = row[ 1 ]; // Assuming "Project Name" is in the 2nd column
        const serviceModule = row[ 2 ]; // Assuming "Service/Module" is in the 3rd column

        if (projectName)
        {
          // Find the project in groupedData
          const projectEntry = this.groupedData.find(project => project.projectName === projectName);

          if (projectEntry)
          {
            // If the project already exists, add the service
            if (serviceModule)
            {
              projectEntry.services.push(serviceModule);
            }
            lastProjectEntry = projectEntry; // Update lastProjectEntry to current project
          } else
          {
            // If the project does not exist, create a new entry
            const newProjectEntry = {
              projectName: projectName,
              services: serviceModule ? [ serviceModule ] : [] // Initialize with service if it exists
            };
            this.groupedData.push(newProjectEntry);
            lastProjectEntry = newProjectEntry; // Update lastProjectEntry to the newly created project
          }
        } else if (lastProjectEntry && serviceModule)
        {
          // If the project is missing, add the service to the last added project
          lastProjectEntry.services.push(serviceModule);
        }
      });

      this.groupedData.shift();

      console.log(this.groupedData); // Logs grouped projects and their services
    };

    reader.readAsBinaryString(target.files[ 0 ]);
  }
}