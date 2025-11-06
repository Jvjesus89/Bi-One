import { Component, signal, computed, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Importa o serviço e a interface para que o componente saiba como usá-los
import { ChamadoService, Chamado } from './services/chamado.service';
import { ClientesService } from './services/clientes.service';
import { ClienteSelecionadoService } from './services/selecionado.service';
import { ClienteAutocompleteComponent } from './cliente-autocomplete';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ClienteAutocompleteComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit {
  sidebarOpen = true;
  clienteBusca = '';

  private clientesService = inject(ClientesService);
  private chamadoService = inject(ChamadoService);
  public clientes = this.clientesService.clientes;
  private clienteSel = inject(ClienteSelecionadoService);
  public clienteSelecionadoSignal = this.clienteSel.clienteSelecionado;
  
  // Signal para o ID do cliente selecionado
  clienteSelecionadoId = signal<number | null>(null);

  constructor() {
    // Effect para reagir às mudanças de cliente selecionado
    effect(() => {
      const cliente = this.clienteSelecionadoSignal();
      console.log('=== APP EFFECT ===');
      console.log('Cliente do signal:', cliente);
      
      if (cliente) {
        console.log('Cliente selecionado:', cliente.razao || cliente.fantasia);
        console.log('Setando ID:', cliente.idcliente);
        this.clienteSelecionadoId.set(cliente.idcliente);
      } else {
        console.log('Filtro de cliente removido');
        this.clienteSelecionadoId.set(null);
      }
      console.log('clienteSelecionadoId atual:', this.clienteSelecionadoId());
      console.log('==================');
    });
  }

  ngOnInit() {
    // Carrega clientes e chamados do serviço se necessário
    const svc: any = this.clientesService;
    if (svc.loadClientesFromSupabase) svc.loadClientesFromSupabase();
    
    // Também carrega chamados para garantir que os dados estejam disponíveis
    if (this.chamadoService.getChamados) this.chamadoService.getChamados();
  }

  get clienteSelecionado() {
    return this.clienteSelecionadoSignal();
  }

  // Método para receber seleção do autocomplete
  onClienteAutocompleteSelecionado(idCliente: number | null) {
    console.log('=== AUTOCOMPLETE SIDEBAR CALLBACK ===');
    console.log('ID recebido do autocomplete:', idCliente);
    console.log('Lista de clientes disponível:', this.clientes().length);
    
    if (idCliente) {
      const cliente = this.clientes().find(c => c.idcliente === idCliente);
      if (cliente) {
        console.log('Cliente encontrado para setar:', cliente.razao);
        this.clienteSel.set(cliente);
        console.log('Cliente setado no serviço');
      } else {
        console.log('ERRO: Cliente não encontrado com ID:', idCliente);
      }
    } else {
      console.log('Limpando seleção (recebeu null)');
      this.clienteSel.set(null);
    }
    console.log('=====================================');
  }

  async buscarCliente() {
    const termo = this.clienteBusca.trim().toLowerCase();
    if (!termo) return;
    
    console.log('=== BUSCANDO CLIENTE ===');
    console.log('Termo de busca:', termo);
    
    let lista = this.clientes();
    console.log('Clientes disponíveis:', lista.length);
    
    const svc: any = this.clientesService;
    // se ainda não carregou clientes, tente chamá-los do service
    if ((!lista || !lista.length) && typeof svc.getClientes === 'function') {
      try {
        const res = svc.getClientes();
        if (res && typeof res.then === 'function') await res;
        lista = this.clientes();
      } catch {
        // ignore
      }
    }

    // Busca por razão, fantasia ou cpcn
    const encontrado = (lista || []).find((c: any) =>
      (c.razao && c.razao.toLowerCase().includes(termo)) ||
      (c.fantasia && c.fantasia.toLowerCase().includes(termo)) ||
      (c.cpcn && String(c.cpcn).includes(termo))
    );
    
    if (encontrado) {
      console.log('Cliente encontrado:', encontrado.razao || encontrado.fantasia);
      this.clienteSel.set(encontrado);
      this.clienteBusca = '';
      console.log('Cliente setado no serviço');
    } else {
      console.log('Nenhum cliente encontrado com o termo:', termo);
    }
    console.log('========================');
  }

  clearSelection() {
    console.log('Limpando seleção de cliente');
    this.clienteSel.set(null);
  }
}
