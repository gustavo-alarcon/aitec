import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-web',
  templateUrl: './web.component.html',
  styleUrls: ['./web.component.scss']
})
export class WebComponent implements OnInit {
  links = [
    { name: 'Banners', route: 'banners' },
    { name: 'Contacto', route: 'contacto' },
    { name: 'Landing', route: 'landing' },
    { name: 'Noticias', route: 'news' }
  ];

  activeLink = this.links[0];

  loadingRouteConfig: boolean;
  constructor() { }

  ngOnInit(): void {
  }

}
