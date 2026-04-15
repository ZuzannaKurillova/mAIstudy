import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-slide',
  standalone: true,
  templateUrl: './slide.component.html',
  styleUrls: ['./slide.component.css'],
})
export class SlideComponent {
  @Input() title = '';
  @Input() content = '';
  @Input() sources = '';
}
