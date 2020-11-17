import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { Product } from 'src/app/core/models/product.model';
import { DatabaseService } from 'src/app/core/services/database.service';

@Component({
  selector: 'app-recommendation',
  templateUrl: './recommendation.component.html',
  styleUrls: ['./recommendation.component.scss']
})
export class RecommendationComponent implements OnInit {
  defaultImage = "../../../assets/images/default-image.png";
  products$: Observable<Product[]>=null

  constructor(
    private dbs: DatabaseService
  ) { }

  ngOnInit(): void {
    this.products$ = this.dbs.getRecommendedProducts(2)
  }

}
