import { Routes } from '@angular/router';
import { ClientesComponent } from './clientes';
import { ChamadosComponent } from './chamados';
import { OverviewComponent } from './overview';
import { FinanceiroComponent } from './financeiro';
import { ContatoClienteComponent } from './contato-cliente';

export const routes: Routes = [
    { path: '', component: OverviewComponent },
    { path: 'chamados', component: ChamadosComponent },
    { path: 'clientes', component: ClientesComponent },
    { path: 'financeiro', component: FinanceiroComponent },
    { path: 'contato-cliente', component: ContatoClienteComponent }
];
