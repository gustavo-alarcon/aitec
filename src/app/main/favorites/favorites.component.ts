import { Component, OnInit } from '@angular/core';
import { combineLatest, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Product } from 'src/app/core/models/product.model';
import { AuthService } from 'src/app/core/services/auth.service';
import { DatabaseService } from 'src/app/core/services/database.service';

@Component({
  selector: 'app-favorites',
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.scss']
})
export class FavoritesComponent implements OnInit {

  products$:Observable<Product[]>
  constructor(
    private dbs: DatabaseService,
    public auth: AuthService
  ) { }

  ngOnInit(): void {
    this.products$=combineLatest(
      this.auth.user$,
      this.dbs.getProductsListValueChanges()
    ).pipe(
      map(([user,products])=>{
        let favs = user.favorites?user.favorites:[]
        return products.filter(el=>favs.includes(el.id))
      })
    )
  }

}
