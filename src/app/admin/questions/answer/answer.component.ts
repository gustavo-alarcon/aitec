import { Component, OnInit } from '@angular/core';
import { DatabaseService } from '../../../core/services/database.service';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { QuestionsService } from '../../../core/services/questions.service';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { AngularFirestore } from '@angular/fire/firestore';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-answer',
  templateUrl: './answer.component.html',
  styleUrls: ['./answer.component.scss']
})
export class AnswerComponent implements OnInit {

  panelOpenState = false;
  
  now: Date = new Date();
  
  dateForm: FormGroup;
  view = new BehaviorSubject<number>(1);
  view$ = this.view.asObservable();

  answerTemp:string;
  productsWithQuestions:any;

  init$: Observable<any[]>;


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
     
   this.init$ = combineLatest(
        this.dbs.getAllQuestions(),
        this.dbs.getProductsWithQuestions(),
        this.dateForm.get('start').valueChanges.pipe(
          startWith(beginDate),
          map(begin => begin.setHours(0, 0, 0, 0))
        ),
        this.dateForm.get('end').valueChanges.pipe(
          startWith(endDate),
          map(end =>  end?end.setHours(23, 59, 59):null)
        )
      ).pipe(
        map(([questions, products, startdate,enddate]) => {
          let prods = products.map(product => {
            return {
              photoURL: product.gallery[product.indCover].photoURL,
              name: product.description,
              stock: product.realStock,
              price:product.cost,
              id: product.id
            }
          })
          let date = {begin:startdate,end:enddate}

          return questions.map(question => {
            question['product'] = prods.filter(product => product.id == question.idProduct )
            return question;
          }).
          filter(questions=>this.getFilterTime(questions["createdAt"],date))
             
        })
      )
    
    }

  getFilterTime(el, time) {
    let date = el.toMillis();
    let begin = time.begin;
    let end = time.end;
    return date >= begin && date <= end;
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

