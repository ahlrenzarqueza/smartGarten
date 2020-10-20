import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FooterbrandComponent } from './footerbrand.component';

@NgModule({
    imports: [IonicModule, RouterModule, CommonModule, FormsModule],
    exports: [FooterbrandComponent],
    declarations: [FooterbrandComponent]
})
export class FooterbrandModule {}
