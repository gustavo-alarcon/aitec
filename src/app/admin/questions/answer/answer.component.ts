import { Component, OnInit } from '@angular/core';
import { DatabaseService } from '../../../core/services/database.service';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { QuestionsService } from '../../../core/services/questions.service';
import { Observable, BehaviorSubject } from 'rxjs';

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

  
productos$: Observable<any>
productos: Array<any>

view :  Observable<any[]>;

loading = new BehaviorSubject<boolean>(true);
  loading$ = this.loading.asObservable();

public productsWithQuestions:any;

  constructor(   
     public dbs: QuestionsService,
     private formbuilder:FormBuilder,
  ) { 
  this.answerForm = this.formbuilder.group({
    answer:['',Validators.required]
  });
}

  ngOnInit(): void {

    console.log("============= producto ============")

    this.dbs.getQuestionsByProduct().subscribe(
      (product:any) =>      
        {
                    
          this.productsWithQuestions =  product;
          console.log(this.productsWithQuestions);
          
          //const preueba= this.answerForm.controls['answer'].setValue(product.questions);
          /* const prueba= product.body.data;
          this.loading.next(false)
        this.answerForm.controls['answer'].setValue(question.answer)

          console.log(prueba); */
          
        }

    ); 
  }
  
  get frm(){    
    return this.answerForm.controls;    
  }


  saveAnswer(){
    
    console.log(this.answerForm.get('answer').value);

    this.answerForm.reset();

    var elementos = document.getElementsByName("answer1");
    var elemento1 = document.getElementById('answer1')
    console.log('Answer : ',elementos);
    console.log('Answer1 : ',elemento1);

  }

  deleteQuestion(idProduct:string,idQuestion:string){

    console.log("pregunta eliminado");
    console.log('idProduct : ',idProduct);
    console.log('idQuestion : ',idQuestion);

    this.dbs.deleteQuestionById(idProduct,idQuestion);

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
