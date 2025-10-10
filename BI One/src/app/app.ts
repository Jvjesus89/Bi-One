import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Importa o serviço e a interface para que o componente saiba como usá-los
import { ChamadoService, Chamado } from './services/chamado.service';
import { ClientesService } from './services/clientes.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class App implements OnInit {
  // --- SINAIS PARA CONTROLE DA INTERFACE ---
  chamadoSelecionado = signal<Chamado | null>(null);

  // solução interna (compatível com [(ngModel)])
  private solucaoSignal = signal<string>('');
  public get solucaoAtual(): string { return this.solucaoSignal(); }
  public set solucaoAtual(v: string) { this.solucaoSignal.set(v); }

  // --- LISTA DE CLIENTES / SELEÇÃO ---
  private clientesService = inject(ClientesService);
  public clients = this.clientesService.clientes; // use clients() no template

  private selectedClienteSignal = signal<number | null>(null); // guarda idcliente
  public get selectedCliente(): number | null { return this.selectedClienteSignal(); }
  public set selectedCliente(v: number | null) { this.selectedClienteSignal.set(v); }

  // --- FILTROS (opcional) ---
  filtroCliente = signal<string>('');
  filtroTipo = signal<string>('');

  // --- CONEXÃO COM O SERVIÇO ---
  private chamadoService = inject(ChamadoService);
  public chamados = this.chamadoService.chamados;

  // --- SINAIS COMPUTADOS PARA A TELA ---
  private normaliza = (v: string) => (v || '').toLocaleLowerCase();
  private clientesById = computed<Record<number, string>>(() => {
    const map: Record<number, string> = {};
    const list: any[] = this.clients();
    (list || []).forEach((c: any) => {
      if (c && typeof c.idcliente === 'number') {
        map[c.idcliente] = c.razao || c.fantasia || String(c.idcliente);
      }
    });
    return map;
  });
  private aplicaFiltros = (lista: Chamado[]) => {
    const filtroCliente = this.normaliza(this.filtroCliente());
    const filtroTipo = this.normaliza(this.filtroTipo());
    const byId = this.clientesById();
    return lista.filter(c => {
      const nomeCliente = byId[c.idcliente] || String(c.idcliente);
      const clienteOk = !filtroCliente || this.normaliza(nomeCliente).includes(filtroCliente);
      const tipoOk = !filtroTipo || this.normaliza(c.tipo) === filtroTipo || this.normaliza(c.tipo).includes(filtroTipo);
      return clienteOk && tipoOk;
    });
  };
  chamadosAbertos = computed(() => this.aplicaFiltros(this.chamados().filter(c => c.status === 'Aberto')));
  chamadosFechados = computed(() => this.aplicaFiltros(this.chamados().filter(c => c.status === 'Fechado')));

  public getClienteNome(idcliente: number | null | undefined): string {
    if (!idcliente) return '';
    const byId = this.clientesById();
    return byId[idcliente] || String(idcliente);
  }

  // --- CICLO DE VIDA ---
  ngOnInit() {
    // busca chamados
    if (this.chamadoService.getChamados) this.chamadoService.getChamados();

    // carrega clientes do serviço dedicado (Supabase se disponível)
    const svc: any = this.clientesService;
    if (svc.loadClientesFromSupabase) svc.loadClientesFromSupabase();
  }

  // --- MÉTODOS CHAMADOS PELO HTML ---

  adicionarChamado(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const titulo = String(formData.get('titulo') ?? '');
    const descricao = String(formData.get('descricao') ?? '');
    const idcliente = Number(formData.get('cliente')) || this.selectedCliente || 0;
    // pega tipo vindo do <select name="tipo">
    const tipo = String(formData.get('tipo') ?? '');

    if (!titulo || !descricao || !idcliente) return;

    // Chama o service passando cliente e tipo (compatível com a assinatura atual)
    if (typeof (this.chamadoService as any).addChamado === 'function') {
      try {
        (this.chamadoService as any).addChamado(titulo, descricao, idcliente, tipo);
      } catch {
        // fallback para versões antigas do service
        (this.chamadoService as any).addChamado(titulo, descricao, idcliente, tipo);
      }
    }

    form.reset();
    this.selectedClienteSignal.set(null); // limpa seleção ligada a ngModel
  }

  finalizarChamado() {
    const chamado = this.chamadoSelecionado();
    const solucao = this.solucaoAtual?.trim();
    if (!chamado || !solucao) return;
    if (this.chamadoService.finalizarChamado) {
      this.chamadoService.finalizarChamado(chamado.idchamado, solucao);
    }
    this.cancelarFinalizacao();
  }

  abrirModalSolucao(chamado: Chamado) {
    this.chamadoSelecionado.set(chamado);
    this.solucaoSignal.set('');
  }

  cancelarFinalizacao() {
    this.chamadoSelecionado.set(null);
  }
}

