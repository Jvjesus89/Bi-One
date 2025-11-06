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
  selector: 'app-chamados',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ClienteAutocompleteComponent],
  templateUrl: './chamados.html',
  styleUrls: ['./chamados.css']
})
export class ChamadosComponent implements OnInit {
  chamadoSelecionado = signal<Chamado | null>(null);
  private solucaoSignal = signal<string>('');
  public get solucaoAtual(): string { return this.solucaoSignal(); }
  public set solucaoAtual(v: string) { this.solucaoSignal.set(v); }

  private clientesService = inject(ClientesService);
  public clients = this.clientesService.clientes;
  private chamadoService = inject(ChamadoService);
  public chamados = this.chamadoService.chamados;

  // filtros de texto (mantidos para o template)
  filtroCliente = signal<string>('');
  filtroTipo = signal<string>('');

  // Novo sistema de busca de cliente para o formulário
  clienteBuscaForm = signal<string>('');
  clientesEncontrados = computed(() => {
    const termo = this.clienteBuscaForm().trim().toLowerCase();
    if (!termo) return [];

    return this.clients().filter((c: any) =>
      (c.razao && c.razao.toLowerCase().includes(termo)) ||
      (c.fantasia && c.fantasia.toLowerCase().includes(termo)) ||
      (c.cpcn && String(c.cpcn).includes(termo))
    );
  });

  mostrarDropdown = signal<boolean>(false);

  // selectedCliente usado pelo formulário (id)
  private selectedClienteSignal = signal<number | null>(null);
  public get selectedCliente(): number | null { return this.selectedClienteSignal(); }
  public set selectedCliente(v: number | null) {
    this.selectedClienteSignal.set(v);
    if (v) {
      const cli = this.clients().find((c: any) => c.idcliente === v);
      if (cli) {
        this.clienteSel.set(cli);
        // Atualiza o campo de busca com o nome do cliente
        this.clienteBuscaForm.set(cli.razao || cli.fantasia || '');
      }
    } else {
      // se limpar seleção local, remover seleção global
      this.clienteSel.set(null);
      this.clienteBuscaForm.set('');
    }
  }


  private clienteSel = inject(ClienteSelecionadoService);
  clienteSelecionado = this.clienteSel.clienteSelecionado;

  constructor() {
    // Mantém o selectedCliente do formulário sincronizado com a seleção global
    effect(() => {
      const cli = this.clienteSelecionado();
      const listaClientes = this.clients(); // Lê a lista para reagir quando mudar
      const idCliente = cli ? cli.idcliente : null;

      // Busca o cliente completo na lista para garantir dados atualizados
      if (idCliente && cli) {
        const clienteCompleto = listaClientes.find(c => c.idcliente === idCliente);
        if (clienteCompleto && clienteCompleto !== cli) {
          // Atualiza o serviço com o cliente completo se encontrar um mais completo
          this.clienteSel.set(clienteCompleto);
        }
      }

      this.selectedClienteSignal.set(idCliente);

      // Atualiza o campo de busca também
      if (cli) {
        this.clienteBuscaForm.set(cli.razao || cli.fantasia || '');
      } else {
        this.clienteBuscaForm.set('');
      }

      console.log('=== CHAMADOS - SINCRONIZANDO FORMULÁRIO ===');
      console.log('Cliente selecionado:', cli?.razao || 'Nenhum');
      console.log('ID setado no formulário:', idCliente);
      console.log('==========================================');
    });
  }

  // Aplica filtros: se houver cliente selecionado global, filtra por ele; caso contrário,
  // aplica filtros de texto (filtroCliente) — se filtro vazio, retorna todos
  chamadosAbertos = computed(() => {
    const cliente = this.clienteSelecionado();
    const filtroCli = (this.filtroCliente() || '').trim().toLowerCase();
    const filtroTip = (this.filtroTipo() || '').trim().toLowerCase();
    return this.chamados().filter(c => {
      if (c.status !== 'Aberto') return false;
      if (cliente && cliente.idcliente) {
        return c.idcliente === cliente.idcliente;
      }
      // sem cliente global: aplicar filtros textuais (se existirem)
      if (filtroCli) {
        const nomeCli = (this.clients().find((x: any) => x.idcliente === c.idcliente)?.razao || '').toLowerCase();
        if (!nomeCli.includes(filtroCli)) return false;
      }
      if (filtroTip) {
        if (!String(c.tipo || '').toLowerCase().includes(filtroTip)) return false;
      }
      return true;
    });
  });

  chamadosFechados = computed(() => {
    const cliente = this.clienteSelecionado();
    const filtroCli = (this.filtroCliente() || '').trim().toLowerCase();
    const filtroTip = (this.filtroTipo() || '').trim().toLowerCase();
    return this.chamados().filter(c => {
      if (c.status !== 'Fechado') return false;
      if (cliente && cliente.idcliente) {
        return c.idcliente === cliente.idcliente;
      }
      if (filtroCli) {
        const nomeCli = (this.clients().find((x: any) => x.idcliente === c.idcliente)?.razao || '').toLowerCase();
        if (!nomeCli.includes(filtroCli)) return false;
      }
      if (filtroTip) {
        if (!String(c.tipo || '').toLowerCase().includes(filtroTip)) return false;
      }
      return true;
    });
  });

  ngOnInit() {
    if (this.chamadoService.getChamados) this.chamadoService.getChamados();
    const svc: any = this.clientesService;
    if (svc.loadClientesFromSupabase) svc.loadClientesFromSupabase();

    // Verifica se já existe cliente selecionado ao inicializar
    // Isso garante que o formulário seja preenchido mesmo se o effect ainda não tiver executado
    const clienteInicial = this.clienteSelecionado();
    if (clienteInicial) {
      // Aguarda um pouco para garantir que os dados foram carregados
      setTimeout(() => {
        const listaClientes = this.clients();
        const clienteCompleto = listaClientes.find(c => c.idcliente === clienteInicial.idcliente);
        if (clienteCompleto) {
          // Atualiza com o cliente completo
          this.clienteSel.set(clienteCompleto);
          this.selectedClienteSignal.set(clienteCompleto.idcliente);
          this.clienteBuscaForm.set(clienteCompleto.razao || clienteCompleto.fantasia || '');
        } else {
          // Se não encontrar, usa o que está no signal
          this.selectedClienteSignal.set(clienteInicial.idcliente);
          this.clienteBuscaForm.set(clienteInicial.razao || clienteInicial.fantasia || '');
        }
      }, 100);
    }
  }

  onClienteBuscaChange() {
    const termo = this.clienteBuscaForm().trim();
    if (!termo) {
      this.mostrarDropdown.set(false);
      this.selectedClienteSignal.set(null);
      return;
    }

    const encontrados = this.clientesEncontrados();

    // Se encontrou exatamente 1, seleciona automaticamente
    if (encontrados.length === 1) {
      const cliente = encontrados[0];
      this.selectedClienteSignal.set(cliente.idcliente);
      this.clienteBuscaForm.set(cliente.razao || cliente.fantasia || '');
      this.mostrarDropdown.set(false);
      console.log('Cliente selecionado automaticamente:', cliente.razao);
    } else if (encontrados.length > 1) {
      // Se encontrou mais de 1, mostra dropdown
      this.mostrarDropdown.set(true);
    } else {
      // Nenhum encontrado
      this.mostrarDropdown.set(false);
      this.selectedClienteSignal.set(null);
    }
  }

  selecionarCliente(cliente: any) {
    this.selectedClienteSignal.set(cliente.idcliente);
    this.clienteBuscaForm.set(cliente.razao || cliente.fantasia || '');
    this.mostrarDropdown.set(false);
    console.log('Cliente selecionado manualmente:', cliente.razao);
  }

  limparClienteForm() {
    this.clienteBuscaForm.set('');
    this.selectedClienteSignal.set(null);
    this.mostrarDropdown.set(false);
  }

  // Método para receber seleção do componente autocomplete
  onClienteAutocompleteChange(idCliente: number | null) {
    this.selectedClienteSignal.set(idCliente);
    if (idCliente) {
      const cli = this.clients().find((c: any) => c.idcliente === idCliente);
      if (cli) {
        this.clienteSel.set(cli);
      }
    } else {
      this.clienteSel.set(null);
    }
  }

  adicionarChamado(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const titulo = String(formData.get('titulo') ?? '');
    const descricao = String(formData.get('descricao') ?? '');
    const idcliente = this.selectedCliente || 0;
    const tipo = String(formData.get('tipo') ?? '');

    if (!titulo || !descricao) {
      alert('Por favor, preencha o título e descrição');
      return;
    }

    if (!idcliente) {
      alert('Por favor, selecione um cliente');
      return;
    }

    if (typeof (this.chamadoService as any).addChamado === 'function') {
      (this.chamadoService as any).addChamado(titulo, descricao, idcliente, tipo);
    }

    form.reset();
    this.limparClienteForm();
  }

  public getClienteNome(idcliente: number | null | undefined): string {
    if (idcliente === null || idcliente === undefined) return '';
    const cli = this.clients().find((c: any) => c.idcliente === idcliente);
    if (!cli) return String(idcliente);
    return cli.razao || cli.fantasia || String(idcliente);
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

