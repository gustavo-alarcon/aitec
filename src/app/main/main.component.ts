import { Component, ElementRef, OnInit, Renderer2, ViewChild } from '@angular/core';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit {
  @ViewChild("megaMenu") menu: ElementRef;
  openedMenu:boolean = false
  constructor(
    private renderer: Renderer2
  ) { }

  ngOnInit(): void {
  }

  toggleMenu(){
    this.openedMenu = !this.openedMenu;
    console.log(this.openedMenu);
    
    //this.renderer.setStyle(this.menu.nativeElement, "display",'block');
  }
}
