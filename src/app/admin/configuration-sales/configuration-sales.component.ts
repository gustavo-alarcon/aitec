import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-configuration-sales',
  templateUrl: './configuration-sales.component.html',
  styleUrls: ['./configuration-sales.component.scss']
})
export class ConfigurationSalesComponent implements OnInit {
  links = [
    { name: 'Categorías', route: 'categorias' },
    { name: 'Marcas', route: 'marcas' },
    { name: 'Delivery - Tiendas', route: 'delivery' },
    { name: 'General', route: 'general' },
  ];

  activeLink = this.links[0];

  loadingRouteConfig: boolean;
  constructor() { }

  ngOnInit(): void {
  }

}
