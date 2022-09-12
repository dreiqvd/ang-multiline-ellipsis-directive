import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { MultiLineEllipsisModule } from './lib/multiline-ellipsis.module';
import { AppComponent } from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    MultiLineEllipsisModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
