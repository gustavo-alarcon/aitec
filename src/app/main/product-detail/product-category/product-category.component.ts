import { Component, Input, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { DatabaseService } from 'src/app/core/services/database.service';

@Component({
  selector: 'app-product-category',
  templateUrl: './product-category.component.html',
  styleUrls: ['./product-category.component.scss']
})
export class ProductCategoryComponent implements OnInit {
  @Input() category:string;
  products$: Observable<any>;

  slideConfig2 = {
    "slidesToShow": 4, "slidesToScroll": 1,
    "autoplay": false,
    responsive: [
      {
        breakpoint: 1360,
        settings: {
          slidesToShow: 3
        }
      },
      {
        breakpoint: 480,
        settings: {
          slidesToShow: 2,
          arrows: false
        }
      }
    ]
  };
  
  constructor(
    private dbs: DatabaseService
  ) { }

  ngOnInit(): void {
  }

  ngOnChanges(){
    
    this.products$ = this.dbs.getProductsListByCategory(this.category)

   

  }

}
