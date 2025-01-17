import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';


const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule)
    // redirectTo: ,
    // pathMatch: 'full'
  },
  {
    path: 'welcome',
    loadChildren:  ()=> import('./welcome/welcome.module').then(m=>m.WelcomePageModule),
    pathMatch: 'full'
  }
  // { path: 'welcome', loadChildren: './welcome/welcome.module#WelcomePageModule' }
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
