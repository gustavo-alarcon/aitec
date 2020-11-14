import { Component, OnInit } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Component({
  selector: 'app-shopping-cart',
  templateUrl: './shopping-cart.component.html',
  styleUrls: ['./shopping-cart.component.scss']
})
export class ShoppingCartComponent implements OnInit {
  view = new BehaviorSubject<number>(1);
  view$ = this.view.asObservable();
  
  constructor() { }

  ngOnInit(): void {
  }
  firstView(){
    this.view.next(1)
  }
  secondView(){
    this.view.next(2)
  }
  thirdView(){
    this.view.next(3)
  }

}
