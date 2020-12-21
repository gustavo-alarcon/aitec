import { Questions } from './../../../core/models/questions.model';
import { Component, OnInit } from '@angular/core';
import { DatabaseService } from '../../../core/services/database.service';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { QuestionsService } from '../../../core/services/questions.service';
import { Observable, BehaviorSubject } from 'rxjs';
import { AngularFirestore } from '@angular/fire/firestore';

@Component({
  selector: 'app-answer',
  templateUrl: './answer.component.html',
  styleUrls: ['./answer.component.scss']
})
export class AnswerComponent implements OnInit {

  panelOpenState = false;
  
  now: Date = new Date();
  
  dateTime: DateTime[] = [
    {value: '1', date: 'hace 15 dias'},
    {value: '2', date: 'hace 30 dias'},
    {value: '3', date: 'hace 60 meses'}
  ];

  dateForm: FormGroup;
  view = new BehaviorSubject<number>(1);
  view$ = this.view.asObservable();

  answerTemp:string;
  productsWithQuestions:any;

  constructor(   
     public dbs: QuestionsService,
     public afs: AngularFirestore,
     private db:DatabaseService
  ) { 
  
}

  ngOnInit(): void {

    const view = this.db.getCurrentMonthOfViewDate();

    let beginDate = view.from;
    let endDate = new Date();
    endDate.setHours(23, 59, 59);

    this.dateForm = new FormGroup({
      start: new FormControl(beginDate),
      end: new FormControl(endDate)
    });


    this.dbs.getQuestionsByProduct().subscribe(
      (product:any) =>      
        {
                    
          this.productsWithQuestions =  product;
          
        }

    ); 
  }

  
  saveAnswerChange(valor:string){
   this.answerTemp=valor;

  }

  
  saveAnswer(idProduct:string,idQuestion:string){

    this.dbs.getQuestionById(idProduct,idQuestion).subscribe(
      (question:any) =>      
        {
          const questionsRef = this.afs.firestore.collection(`db/aitec/productsList/${idProduct}/questions`).doc(idQuestion);
          const batch = this.afs.firestore.batch();
         
          question.answer=this.answerTemp;
          question.answerAt=this.now;
      
          batch.update(questionsRef,question);
          
          batch.commit().then(
            ref => {
             
            }
          );  
           
        }

    );

  }
  deleteQuestion(idProduct:string,idQuestion:string){

    this.dbs.deleteQuestionById(idProduct,idQuestion);

  }


}


interface DateTime {
  value: string;
  date: string;
}
