import { Injectable } from '@angular/core';
import { AngularFirestoreCollection, AngularFirestore } from '@angular/fire/firestore';
import { Questions } from '../models/questions.model';
import { combineLatest, Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class QuestionsService {

  questionsCollection: AngularFirestoreCollection<Questions>;
  questions: Observable<Questions[]>;

  prueba: any = [];
  constructor(public afs: AngularFirestore) {

  }

  getQuestions(idProducto: string) {

    this.questionsCollection = this.afs.collection<Questions>(`db/aitec/productsList/${idProducto}/questions`);

    this.questions = this.questionsCollection.snapshotChanges().pipe(
      map(actions => actions.map(a => {
        const data = a.payload.doc.data() as Questions;
        const id = a.payload.doc.id;
        return { id, ...data };
      }))
    );
    return this.questions;

  }


  saveQuestion(idProducto: string, questions: Questions) {

    this.getProduct(idProducto).subscribe(product => {  
      const productRef = this.afs.firestore.collection(`db/aitec/productsList`).doc(product.id);
      const questionsRef = this.afs.firestore.collection(`db/aitec/productsList/${idProducto}/questions`).doc();
      const batch = this.afs.firestore.batch();

      questions.id = questionsRef.id;
      questions.idProduct = idProducto

      let countQuestions = product.questions ? product.questions : 0
      countQuestions++
      //this.questionsCollection.add(questions);
      batch.update(productRef, {
        questions: countQuestions
      })
      batch.set(questionsRef, questions);

      batch.commit().then(
        ref => {

        }
      );
    })


  }
  //get all products with questions
  getQuestionsByProduct() { 
    return combineLatest(
      this.getAllQuestions(),
      this.getProductsWithQuestions()
    ).pipe(
      map(([questions, products]) => {
        let prods = products.map(product => {
          return {
            photoURL: product.gallery[product.indCover].photoURL,
            name: product.description,
            stock: product.realStock,
            price:product.cost,
            id: product.id,
            questions:questions.filter(question=>question.idProduct ==product.id)
          }
        })

        return prods
      })
    )
  }
   //get all questions  with product
 

  /*
  && this.getFilterTime(question.createdAt,date)
             return products.filter((el) => {
              return this.getFilterTime(el["createdAt"], date);
            });

            getProductsByQuestion() {
    return combineLatest(
      this.getAllQuestions(),
      this.getProductsWithQuestions()
    ).pipe(
      map(([questions, products]) => {
        let prods = products.map(product => {
          return {
            photoURL: product.gallery[product.indCover].photoURL,
            name: product.description,
            stock: product.realStock,
            price:product.cost,
            id: product.id
          }
        })
        return questions.map(question => {
          question['product'] = prods.filter(product => product.id == question.idProduct )[0]
          return question
        })
      })
    )
  } */
   // get all questions
  getAllQuestions(): Observable<Questions[]> {
    return this.afs.collectionGroup<Questions>('questions').valueChanges();
  }
  //get all product have quetions
  getProductsWithQuestions(): Observable<Product[]> {
    return this.afs.collection<Product>(`db/aitec/productsList`, (ref) =>
      ref.orderBy("questions", "asc")
    ).get().pipe(
      map((snap) => {
        return snap.docs.map((el) => <Product>el.data());
      })
    );
  }

  getProduct(id: string): Observable<Product> {
    return this.afs
      .doc<Product>(`db/aitec/productsList/${id}`)
      .valueChanges()
      .pipe(take(1));
  }
  getQuestionById(idProduct:string,idQuestion:string):Observable<Questions>{
    return this.afs.doc<Questions>(`db/aitec/productsList/${idProduct}/questions/${idQuestion}`)
    .valueChanges()
    .pipe(take(1));    
  }

  deleteQuestionById(idProduct:string,idQuestion:string){
    
      const questionsRef = this.afs.firestore.collection(`db/aitec/productsList/${idProduct}/questions`).doc(idQuestion);
      const batch = this.afs.firestore.batch();

      batch.delete(questionsRef);

      batch.commit().then(
        ref => {

        }
      );    

  }

  updateQuestionById(idProduct:string,idQuestion:string,answer:string){

    

    const questionsRef = this.afs.firestore.collection(`db/aitec/productsList/${idProduct}/questions`).doc(idQuestion);
    const batch = this.afs.firestore.batch();

    batch.delete(questionsRef);

    batch.commit().then(
      ref => {

      }
    );   

   

  }

}
