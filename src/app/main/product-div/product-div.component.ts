import { Component, Input, OnInit } from '@angular/core';
import { Router } from "@angular/router";
import { DatabaseService } from 'src/app/core/services/database.service';

@Component({
  selector: 'app-product-div',
  templateUrl: './product-div.component.html',
  styleUrls: ['./product-div.component.scss']
})
export class ProductDivComponent implements OnInit {
  
  @Input() product: any

  defaultImage = "../../../assets/images/icono-aitec-01.png";
  constructor(
    private router: Router,
    private dbs: DatabaseService
  ) { }


  ngOnInit(): void {
    
  }

  navigateProduct(product) {
    this.router.navigate(["/main/producto", product]);
  }
}
