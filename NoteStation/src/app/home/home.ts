import { Component, ViewEncapsulation, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
  encapsulation: ViewEncapsulation.None
})
export class HomeComponent implements AfterViewInit {

  ngAfterViewInit() {
    const elements = document.querySelectorAll('.reveal, .reveal-stagger');

    const observer = new IntersectionObserver((entries)=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.15 });

    elements.forEach(el=>observer.observe(el));
  }

}