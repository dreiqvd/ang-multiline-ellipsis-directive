import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  posts = [
    {
      title: 'This is a text that has no overflow, just standard wrapping',
      excerpt: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent commodo scelerisque dolor',
      date: this.formatDate(new Date(Date.now()))
    },
    {
      title: 'This is a text that exceeds the height of its container and an ellipsis should be inserted',
      tag: 'coding',
      excerpt: 'Lorem ipsum nisl ante, laoreet eu tempor eget, efficitur nec augue. Morbi a erat vel mi cursus porta. Lorem ipsum dolor sit amet, consectetur adipiscing elit',
      date: this.formatDate(new Date(Date.now()))
    },
    {
      title: 'Another example of a text that exceeds the height of its container.',
      tag: 'coding',
      excerpt: 'Lorem ipsum vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae',
      date: this.formatDate(new Date(Date.now()))
    }
  ];

  private formatDate(d: Date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul',
      'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const year = d.getFullYear();
    const month = months[d.getMonth()];
    const date = d.getDate();
    return `${month} ${date}, ${year}`;
  }
}
