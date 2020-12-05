import { Component, OnInit, Input } from '@angular/core';
import { Questions } from '../../../core/models/questions.model';
import { QuestionsService } from '../../../core/services/questions.service';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { take } from 'rxjs/operators';

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

  public question ={} as Questions;

  public formQuestionSubmit=false;


  constructor(
    public questionsService:QuestionsService,
    private formbuilder:FormBuilder,
    public authService:AuthService

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
    


  }

}
