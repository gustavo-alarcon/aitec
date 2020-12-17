import { Component, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-answer',
  templateUrl: './answer.component.html',
  styleUrls: ['./answer.component.scss']
})
export class AnswerComponent implements OnInit {

  displayedColumns: string[] = ['position', 'name', 'weight', 'symbol','actions'];
  dataSource = new MatTableDataSource<PeriodicElement>(ELEMENT_DATA);

  @ViewChild(MatPaginator) paginator: MatPaginator;

  constructor() { }

  ngOnInit(): void {
    this.dataSource.paginator = this.paginator;

  }

}

export interface PeriodicElement {
  name: string;
  position: number;
  weight: number;
  symbol: string;
  actions:string;
}

const ELEMENT_DATA: PeriodicElement[] = [
  {position: 1, name: 'Hydrogen', weight: 1.0079, symbol: 'H',actions:'Eliminer Responder'},
  {position: 2, name: 'Helium', weight: 4.0026, symbol: 'He',actions:'Eliminer Responder'},
  {position: 3, name: 'Lithium', weight: 6.941, symbol: 'Li',actions:'Eliminer Responder'},
  {position: 4, name: 'Beryllium', weight: 9.0122, symbol: 'Be',actions:'Eliminer Responder'},
  {position: 5, name: 'Boron', weight: 10.811, symbol: 'B',actions:'Eliminer Responder'},
  {position: 6, name: 'Carbon', weight: 12.0107, symbol: 'C',actions:'Eliminer Responder'},
  {position: 7, name: 'Nitrogen', weight: 14.0067, symbol: 'N',actions:'Eliminer Responder'},
  {position: 8, name: 'Oxygen', weight: 15.9994, symbol: 'O',actions:'Eliminer Responder'},
  {position: 9, name: 'Fluorine', weight: 18.9984, symbol: 'F',actions:'Eliminer Responder'},
  {position: 10, name: 'Neon', weight: 20.1797, symbol: 'Ne',actions:'Eliminer Responder'},
  {position: 11, name: 'Sodium', weight: 22.9897, symbol: 'Na',actions:'Eliminer Responder'},
  {position: 12, name: 'Magnesium', weight: 24.305, symbol: 'Mg',actions:'Eliminer Responder'},
  {position: 13, name: 'Aluminum', weight: 26.9815, symbol: 'Al',actions:'Eliminer Responder'},
  {position: 14, name: 'Silicon', weight: 28.0855, symbol: 'Si',actions:'Eliminer Responder'},
  {position: 15, name: 'Phosphorus', weight: 30.9738, symbol: 'P',actions:'Eliminer Responder'},
  {position: 16, name: 'Sulfur', weight: 32.065, symbol: 'S',actions:'Eliminer Responder'},
  {position: 17, name: 'Chlorine', weight: 35.453, symbol: 'Cl',actions:'Eliminer Responder'},
  {position: 18, name: 'Argon', weight: 39.948, symbol: 'Ar',actions:'Eliminer Responder'},
  {position: 19, name: 'Potassium', weight: 39.0983, symbol: 'K',actions:'Eliminer Responder'},
  {position: 20, name: 'Calcium', weight: 40.078, symbol: 'Ca',actions:'Eliminer Responder'},
];
