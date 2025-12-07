import { Routes } from '@angular/router';
import { ClientesComponent } from './pages/clientes/clientes';
import { ChamadosComponent } from './pages/chamados/chamados';
import { OverviewComponent } from './pages/overview/overview';
import { FinanceiroComponent } from './pages/financeiro/financeiro';
import { ContatoClienteComponent } from './pages/contato-cliente/contato-cliente';

export const routes: Routes = [
    { path: '', component: OverviewComponent },
    { path: 'chamados', component: ChamadosComponent },
    { path: 'clientes', component: ClientesComponent },
    { path: 'financeiro', component: FinanceiroComponent },
    { path: 'contato-cliente', component: ContatoClienteComponent }
];
