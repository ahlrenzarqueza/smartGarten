import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalListdevicesComponent } from './modal-listdevices.component';

@NgModule({
    imports: [IonicModule, RouterModule, CommonModule, FormsModule],
    exports: [ModalListdevicesComponent],
    declarations: [ModalListdevicesComponent],
    entryComponents: [ModalListdevicesComponent]
})
export class ModalListdevicesModule {}
