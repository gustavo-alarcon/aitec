import { Component, OnInit, Input } from '@angular/core';
import { Questions } from '../../../core/models/questions.model';
import { QuestionsService } from '../../../core/services/questions.service';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { take } from 'rxjs/operators';
import { AngularFirestore } from '@angular/fire/firestore';

@Component({
  selector: 'app-questions',
  templateUrl: './questions.component.html',
  styleUrls: ['./questions.component.scss']
})
export class QuestionsComponent implements OnInit {

  now: Date = new Date();
  
  questionForm = new FormGroup({
    question: new FormControl('')
  });


  public questions:any = [];
  public searchProductId:any = [];

  @Input() idProduct:string;
  @Input() nameProduct:string;

  public question ={} as Questions;

  public formQuestionSubmit=false;


  constructor(
    public questionsService:QuestionsService,
    private formbuilder:FormBuilder,
    public authService:AuthService,
    public afs: AngularFirestore,
    ) { 
    
    this.questionForm = this.formbuilder.group({
      question:['',Validators.required]
    });
    

  }
 
  ngOnInit(): void {
    
    this.questionsService.getQuestions(this.idProduct).subscribe(
      (questions:any) =>      
        {
          this.questions =  questions;
          
        }

    ); 

    
  }
  
  get frm(){
    
    return this.questionForm.controls;
    
  }
  
  
  saveQuestion(){
    
    this.questionForm.markAsPristine();
    this.questionForm.markAsUntouched();

    this.authService.user$.pipe(
      take(1)
    ).subscribe(
      user =>{

        this.question.id='';
        this.question.question= this.questionForm.get('question').value;
        this.question.createdAt=this.now;
        this.question.answer="";
        this.question.createdBy=user;
        this.question.answerAt = null;

        this.formQuestionSubmit=true;
    
        if (this.questionForm.valid) {
    
          this.questionsService.saveQuestion(this.idProduct,this.question);
        }
    
       // console.warn(this.questionForm.value);
    
        this.questionForm.reset();
            
      } 
    )

    this.sendEmail();

  }

  sendEmail(){

    this.authService.user$.pipe(
      take(1)
    ).subscribe(
      user =>{

      const emailRef = this.afs.firestore.collection(`/mail`).doc();
      const batch = this.afs.firestore.batch();
      
      let nombre;

      if (user.personData.name) {        
        nombre = user.personData.name.toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase());
      } else{
        nombre = user.name.toLowerCase().replace(/\b[a-z]/g, c => c.toUpperCase());
      }

        let message = {
          to: `${user.email}`,
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
                        <thead style="background-image: linear-gradient(90deg, #018EFB 0%, #271044 100%);">
                            <tr>                     
                                <th style="padding: 10px 0; font-size: 1.3rem;">
                                    <h3 style="color: white; text-decoration: none;" >Tienes una nueva pregunta!</h3>
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
                                    El usuario <span>${nombre} </span>, ha realizado un pregunta por el productos : ${this.nameProduct}  
                                </p>
                                </td>
                            </tr> 
            
                            <tr>
                                <td colspan="6" style="text-align:center">
                                    <h3 style="color: black;">
                                        Dale respuesta en breve
                                    </h3>
                                </td>   
                            </tr>
                            
                           
                        </tbody>
                        
                        <tfoot >
                            
                            <tr>
                                <td colspan="6" style="text-align:center; margin: 0;">
                                    <br/><br/>
            
                                    <a style="text-decoration: none; color: white; background-color: #1c31ea; padding: 10px 35px; border-radius: 5px; margin-top: 0;"
                                        href="#"> 
                                        ver pregunta
                                    </a>
             
                                    <br/>
                                    <br/>
                                    <br/>
            
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

  }

}
