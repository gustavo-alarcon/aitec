import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { BehaviorSubject, combineLatest, Observable, Subscription } from 'rxjs';
import { DatabaseService } from '../../core/services/database.service';
import { AuthService } from '../../core/services/auth.service';
import { take, startWith, map } from 'rxjs/operators';
import { QuestionsService } from '../../core/services/questions.service';
import { AngularFirestore } from '@angular/fire/firestore';

@Component({
  selector: 'app-questions',
  templateUrl: './questions.component.html',
  styleUrls: ['./questions.component.scss']
})
export class QuestionsComponent implements OnInit ,OnDestroy{

  dateForm: FormGroup;
  view = new BehaviorSubject<number>(1);
  view$ = this.view.asObservable();
  
  init$: Observable<any[]>;

  //init:Subscription;

  userEmail:string;

  constructor(    
     private db:DatabaseService,
     public authService:AuthService,
     public dbs: QuestionsService,
     public afs: AngularFirestore,

    ) { }

  ngOnInit(): void {
    const view = this.db.getCurrentMonthOfViewDate();

    let beginDate = view.from;
    let endDate = new Date();
    endDate.setHours(23, 59, 59);



    this.dateForm = new FormGroup({
      start: new FormControl(beginDate),
      end: new FormControl(endDate)
    });

    
    this.authService.user$.pipe(
      take(1)
    ).subscribe(
      user =>{

       this.init$= combineLatest(         
        this.dbs.getQuestionsByUser(user.email),
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
              id: product.id,
              sku:product.sku,

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
    )
  }
  ngOnDestroy(){
    //this.init.unsubscribe();

  }
  

  getFilterTime(el, time) {
    let date = el.toMillis();
    let begin = time.begin;
    let end = time.end;
    return date >= begin && date <= end;
  }
  

}


