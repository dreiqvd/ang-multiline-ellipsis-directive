import { NgModule } from '@angular/core';

import { LineClampDirective } from './multiline-ellipsis.directive';

@NgModule({
  declarations: [LineClampDirective],
  exports: [LineClampDirective]
})
export class MultiLineEllipsisModule { }
