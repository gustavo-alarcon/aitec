import { Component, OnInit, Input } from '@angular/core';
import { DatabaseService } from '../../../core/services/database.service';
import { FormGroup, FormControl, FormBuilder, Validators } from '@angular/forms';
import { QuestionsService } from '../../../core/services/questions.service';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { AngularFirestore } from '@angular/fire/firestore';
import { map, startWith, take, filter, switchMap } from 'rxjs/operators';
import { AuthService } from '../../../core/services/auth.service';
import { PushService } from 'src/app/core/services/push.service';
import { User } from '../../../core/models/user.model';

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

  userEmail;

  @Input() emailUser:string;


  constructor(   
     public dbs: QuestionsService,
     public afs: AngularFirestore,
     private db:DatabaseService,
     private authService:AuthService,
     private pushService: PushService

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
  
  saveAnswer(idProduct:string,idQuestion:string ,user:User){

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

  this.sendEmail(user);

  }

  sendEmail(recipiendtUser:User){

    this.authService.user$.pipe(
      take(1)
    ).subscribe(
      user =>{

      const emailRef = this.afs.firestore.collection(`/mail`).doc();
      const batch = this.afs.firestore.batch();

      let nombre;

      if (recipiendtUser.personData.name) {        
        nombre = recipiendtUser.personData.name.toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase());
      } else{
        nombre = recipiendtUser.name.toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase());
      }

        let message = {
          to: `${recipiendtUser.email}`,
          message: {
            subject: 'Consulta en Aitec App',
            html: 
            `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
                    <title></title>
                    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

                    <style type="text/css">
                      
                    </style>
                </head>
                <body style="padding: 0; margin: 0 auto; ">
                    <div>

                    <table style="width: 100%; max-width: 600px; margin: 0 auto; font-family: Arial, Helvetica, sans-serif; border-collapse: collapse; 
                                  border: solid 1px #828282;">
                        <thead style="background-image: linear-gradient(90deg, #018EFB 0%, #270059 100%);">
                            <tr>                     
                                <th style="padding: 10px 0; font-size: 1.3rem;">
                                    <h3 style="color: white; text-decoration: none;" >Genial, recibimos tu pregunta!</h3>
                                </th>
                                <th style="padding: 10px 0; ">
                                    <img style="display: block; width: 150px; margin: 0 auto;" src="https://firebasestorage.googleapis.com/v0/b/aitec-ecommerce.appspot.com/o/logo%2Flogo-white.png?alt=media&token=b6c2f740-5bc5-4bb9-a956-d6f146e49c12" />
                                </th>
                            </tr>
                        </thead>
                        <tbody>               
                            <tr>
                                <td style="color: #828282;" colspan="6"  >
                                  <p style=" text-align: left; font-size: 13px; margin-left: 20px; margin-right: 20px; margin-top: 30px;">
                                    Hola <span>${nombre}</span> , tu pregunta fue respondida por nuestros asesores. Puedes verificarla ingresando a nuestra página.
                                </p>
                                </td>
                            </tr> 

                            <tr>
                                <td colspan="6" style="text-align:center">
                                    <h3 style="color: black;">
                                        Gracias por contactarte con nosotros                       
                                    </h3>
                                </td>   
                            </tr>
                            
                            
                            <tr>
                                <td colspan="6" style="text-align:center; margin: 0;">
                                    <br/><br/>

                                    <a style="text-decoration: none; color: white; background-color: #1c31ea; padding: 10px 35px; border-radius: 5px; margin-top: 0;"
                                        href="#"> 
                                        Ir a página
                                    </a>
            
                                </td>
                            </tr>
                        </tbody>
                        
                        <tfoot >
                            <tr>
                                <td style="color: #828282;" colspan="6"  >
                                  <p style=" text-align: left; font-size: 13px; margin-left: 20px; margin-right: 20px; margin-top: 30px;">
                                    Encuéntranos en nuestras redes sociales como:                    
                                  </p>
                                </td>
                            </tr>

                            <tr>
                                <td colspan="6" style=" text-align: center; padding: 20px 40px 0px 40px; margin-bottom: 50px;">
                                    <a style="padding: 0 2px;" href="https://wa.link/wd6jml"><img style="width: 42px; " src="https://firebasestorage.googleapis.com/v0/b/aitec-ecommerce.appspot.com/o/icon%2Fwhatsapp.png?alt=media&token=fe80418e-9912-4294-8607-d90a22b43cb3" /></a>
                                    <a style="padding: 0 2px;" href="https://web.facebook.com/aitecgroup"><img style="width: 30px; border: solid 2px black; border-radius: 30px; padding: 5px;" src="https://firebasestorage.googleapis.com/v0/b/aitec-ecommerce.appspot.com/o/icon%2Ffacebook.png?alt=media&token=7bc4abd1-2025-4508-adb9-0c5990bc578f" /></a>
                                    <a style="padding: 0 2px;" href="https://www.instagram.com/aitecgroup_"><img style="width: 42px; " src="https://firebasestorage.googleapis.com/v0/b/aitec-ecommerce.appspot.com/o/icon%2Finstagram.png?alt=media&token=e55bafc8-71d8-4128-a602-686538ce232a" /></a>
                                    <br/><br/>
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                </div>
                </body>
            </html>

            `
          },
        };

       
       
      batch.set(emailRef, message);

      batch.commit().then(() => {

       });
      } 
    )
   
    this.sendMessage(recipiendtUser);
  }

  sendMessage(recipiendtUser:User){
   
    this.authService.user$.pipe(
    take(1)
    ).subscribe(
      user =>{
        const message='Tu pregunta fue respondida';
        const title = 'Pregunta';
        
        this.pushService.sendPush(user,recipiendtUser,message,title);      

      }
    ) 
  }


  deleteQuestion(idProduct:string,idQuestion:string){

    this.dbs.deleteQuestionById(idProduct,idQuestion);

  }


}

