import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { GridModule } from '@progress/kendo-angular-grid';


import { AppComponent } from './app.component';
import { DomChangeDirective } from './dom-change.directive';


@NgModule({
  declarations: [
    AppComponent,
    DomChangeDirective
  ],
  imports: [
    BrowserModule, BrowserAnimationsModule, GridModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
