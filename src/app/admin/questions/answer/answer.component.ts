import { Component, OnInit } from '@angular/core';
import { DatabaseService } from '../../../core/services/database.service';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-answer',
  templateUrl: './answer.component.html',
  styleUrls: ['./answer.component.scss']
})
export class AnswerComponent implements OnInit {

  panelOpenState = false;

  answerForm = new FormGroup({
    answer: new FormControl('')
  });


  
  foods: Food[] = [
    {value: '1', viewValue: 'hace 15 dias'},
    {value: '2', viewValue: 'hace 30 dias'},
    {value: '3', viewValue: 'hace 2 meses'}
  ];

  productsList:Products[]=[
   {img:"../../../../assets/images/producto.png",description: 'Memoria RAM', price:32, stock:9 },
   {img:"../../../../assets/images/producto.png",description: 'Memoria RAM', price:2, stock:4 },
   {img:"../../../../assets/images/producto.png",description: 'Memoria RAM', price:342, stock:9 },
   {img:"../../../../assets/images/producto.png",description: 'Memoria RAM', price:352, stock:4 },
   {img:"../../../../assets/images/producto.png",description: 'Memoria RAM', price:332, stock:7 },
   {img:"../../../../assets/images/producto.png",description: 'Memoria RAM', price:32, stock:4 },
   {img:"../../../../assets/images/producto.png",description: 'Memoria RAM', price:342, stock:5 },
   {img:"../../../../assets/images/producto.png",description: 'Memoria RAM', price:32, stock:4 },
   {img:"../../../../assets/images/producto.png",description: 'Memoria RAM', price:32, stock:4 },
   {img:"../../../../assets/images/producto.png",description: 'Memoria RAM', price:32, stock:4 },
   {img:"../../../../assets/images/producto.png",description: 'Memoria RAM', price:32, stock:4 },
   {img:"../../../../assets/images/producto.png",description: 'Memoria RAM', price:32, stock:4 },
   {img:"../../../../assets/images/producto.png",description: 'Memoria RAM', price:32, stock:4 },
];

  

  constructor(   
     public dbs: DatabaseService,
     private formbuilder:FormBuilder,
  ) { 
  this.answerForm = this.formbuilder.group({
    answer:['',Validators.required]
  });
}

  ngOnInit(): void {
   
  }
  
  get frm(){    
    return this.answerForm.controls;    
  }


  saveAnswer(){
    
    console.log(this.answerForm.get('answer').value);

    this.answerForm.reset();

  }

  deleteQuestion(){

    console.log("pregunta eliminado");

  }


}


interface Food {
  value: string;
  viewValue: string;
}

interface Products {
  img: string;
  description: string;
  price:number;
  stock:number;
}
