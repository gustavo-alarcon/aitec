import { Injectable } from '@angular/core';
import { AngularFirestoreCollection, AngularFirestore } from '@angular/fire/firestore';
import { Questions } from '../models/questions.model';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class QuestionsService {

  questionsCollection: AngularFirestoreCollection<Questions>;
  questions: Observable<Questions[]>;

  prueba:any=[];
  constructor( public afs:AngularFirestore) { 
    
  }
  
  getQuestions(idProducto:string){
    
    this.questionsCollection= this.afs.collection<Questions>(`db/aitec/productsList/${idProducto}/questions` );
   
  this.questions = this.questionsCollection.snapshotChanges().pipe(
    map(actions => actions.map(a => {
      const data = a.payload.doc.data() as Questions;
      const id = a.payload.doc.id;   
        return {id ,...data};
    }))
  );  
    return  this.questions;

  }

 
  saveQuestion(idProducto:string,questions:Questions){


    const questionsRef = this.afs.firestore.collection(`db/aitec/productsList/${idProducto}/questions`).doc();

    
    const batch = this.afs.firestore.batch();


    const idQuestion = questionsRef.id;

    questions.id=idQuestion;
      
    //this.questionsCollection.add(questions);

    batch.set(questionsRef,questions);

    batch.commit().then(
      ref=>{

      }
    );

  }

}
