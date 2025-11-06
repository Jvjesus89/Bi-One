import { Component, signal, inject, computed, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ContatoClienteService, ContatoCliente } from './services/contato-cliente.service';
import { ClientesService } from './services/clientes.service';
import { ClienteSelecionadoService } from './services/selecionado.service';
import { ClienteAutocompleteComponent } from './cliente-autocomplete';

@Component({
  selector: 'app-contato-cliente',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ClienteAutocompleteComponent],
  templateUrl: './contato-cliente.html',
  styleUrls: ['./contato-cliente.css']
})
export class ContatoClienteComponent implements OnInit {
  // Formulário
  idcliente = signal<number | null>(null);
  tipo = signal<'Comercial' | 'Sucesso' | 'Suporte' | 'Financeiro' | 'Outro'>('Comercial');
  assunto = signal('');
  descricao = signal('');
  data = signal<Date>(new Date());
  responsavel = signal<string | null>('');
  proximoContato = signal<Date | null>(null);
  observacoes = signal<string | null>('');

  // Edição
  contatoSelecionado = signal<ContatoCliente | null>(null);

  private contatoService = inject(ContatoClienteService);
  private clientesService = inject(ClientesService);
  private clienteSel = inject(ClienteSelecionadoService);
  public clienteSelecionado = this.clienteSel.clienteSelecionado;
  public clientes = this.clientesService.clientes;
  public contatos = this.contatoService.contatos;

  // Filtros
  filtroTipo = signal<string>('');

  constructor() {
    effect(() => {
      const cliente = this.clienteSelecionado();
      if (cliente) {
        this.idcliente.set(cliente.idcliente);
      }
    });
  }

  // Contatos filtrados
  contatosFiltrados = computed(() => {
    const cliente = this.clienteSelecionado();
    const tipoFiltro = this.filtroTipo().trim().toLowerCase();
    let lista = this.contatos();

    if (cliente) {
      lista = lista.filter(c => c.idcliente === cliente.idcliente);
    }

    if (tipoFiltro) {
      lista = lista.filter(c =>
        c.tipo.toLowerCase().includes(tipoFiltro) ||
        c.assunto.toLowerCase().includes(tipoFiltro) ||
        (c.responsavel && c.responsavel.toLowerCase().includes(tipoFiltro))
      );
    }

    return lista;
  });

  // Métricas
  totalContatos = computed(() => this.contatosFiltrados().length);

  contatosPorTipo = computed(() => {
    const tipos: { [key: string]: number } = {};
    this.contatosFiltrados().forEach(c => {
      tipos[c.tipo] = (tipos[c.tipo] || 0) + 1;
    });
    return tipos;
  });

  get contatosPorTipoKeys(): string[] {
    return Object.keys(this.contatosPorTipo());
  }

  contatosComProximoContato = computed(() =>
    this.contatosFiltrados().filter(c => c.data_proximo_contato && new Date(c.data_proximo_contato) >= new Date()).length
  );

  ngOnInit() {
    const svc: any = this.contatoService;
    if (svc.loadContatosFromSupabase) svc.loadContatosFromSupabase();

    const svcClientes: any = this.clientesService;
    if (svcClientes.loadClientesFromSupabase) svcClientes.loadClientesFromSupabase();
  }

  limparFormulario() {
    this.idcliente.set(null);
    this.tipo.set('Comercial');
    this.assunto.set('');
    this.descricao.set('');
    this.data.set(new Date());
    this.responsavel.set('');
    this.proximoContato.set(null);
    this.observacoes.set('');
    this.contatoSelecionado.set(null);
  }

  preencherFormulario(contato: ContatoCliente) {
    this.idcliente.set(contato.idcliente);
    this.tipo.set(contato.tipo);
    this.assunto.set(contato.assunto);
    this.descricao.set(contato.descricao);
    this.data.set(new Date(contato.data_cadastro));
    this.responsavel.set(contato.responsavel || '');
    this.proximoContato.set(contato.data_proximo_contato ? new Date(contato.data_proximo_contato) : null);
    this.observacoes.set(contato.observacoes || '');
    this.contatoSelecionado.set(contato);
  }

  editarContato(contato: ContatoCliente) {
    this.preencherFormulario(contato);
  }

  async submit() {
    const selecionado = this.contatoSelecionado();

    if (selecionado) {
      await this.atualizarContato(selecionado.idcontato);
    } else {
      await this.cadastrarContato();
    }
  }

  async cadastrarContato() {
    const idclienteVal = this.idcliente();
    const assuntoVal = this.assunto().trim();
    const descricaoVal = this.descricao().trim();

    if (!idclienteVal || !assuntoVal || !descricaoVal) {
      alert('Por favor, preencha Cliente, Assunto e Descrição.');
      return;
    }

    try {
      const resultado = await this.contatoService.addContato(
        idclienteVal,
        this.tipo(),
        assuntoVal,
        descricaoVal,
        this.data(),
        this.responsavel() || undefined,
        this.proximoContato() || undefined,
        this.observacoes() || undefined
      );

      if (resultado) {
        alert('Contato registrado com sucesso!');
        this.limparFormulario();
      } else {
        alert('Erro ao registrar contato.');
      }
    } catch (error) {
      console.error('Erro ao cadastrar:', error);
      alert('Erro ao registrar contato.');
    }
  }

  async atualizarContato(idcontato: number) {
    const assuntoVal = this.assunto().trim();
    const descricaoVal = this.descricao().trim();

    if (!assuntoVal || !descricaoVal) {
      alert('Por favor, preencha Assunto e Descrição.');
      return;
    }

    try {
      const resultado = await this.contatoService.updateContato(
        idcontato,
        this.tipo(),
        assuntoVal,
        descricaoVal,
        this.data(),
        this.responsavel() || undefined,
        this.proximoContato() || undefined,
        this.observacoes() || undefined
      );

      if (resultado) {
        alert('Contato atualizado com sucesso!');
        this.limparFormulario();
      } else {
        alert('Erro ao atualizar contato.');
      }
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      alert('Erro ao atualizar contato.');
    }
  }

  async excluirContato(idcontato: number) {
    if (confirm('Tem certeza que deseja excluir este contato?')) {
      await this.contatoService.removeContato(idcontato);
      alert('Contato excluído com sucesso!');
    }
  }

  onClienteAutocompleteChange(idCliente: number | null) {
    this.idcliente.set(idCliente);
  }

  getClienteNome(idcliente: number | null | undefined): string {
    if (idcliente === null || idcliente === undefined) return '';
    const cli = this.clientes().find((c: any) => c.idcliente === idcliente);
    if (!cli) return String(idcliente);
    return cli.razao || cli.fantasia || String(idcliente);
  }

  getTipoColor(tipo: string): string {
    const colors: { [key: string]: string } = {
      'Comercial': 'bg-blue-500/20 text-blue-400',
      'Sucesso': 'bg-green-500/20 text-green-400',
      'Suporte': 'bg-purple-500/20 text-purple-400',
      'Financeiro': 'bg-amber-500/20 text-amber-400',
      'Outro': 'bg-gray-500/20 text-gray-400'
    };
    return colors[tipo] || colors['Outro'];
  }

  get dataFormatada(): string {
    const d = this.data();
    return d.toISOString().split('T')[0];
  }

  set dataFormatada(val: string) {
    if (val) {
      this.data.set(new Date(val));
    }
  }

  get proximoContatoFormatado(): string {
    const p = this.proximoContato();
    return p ? p.toISOString().split('T')[0] : '';
  }

  set proximoContatoFormatado(val: string) {
    this.proximoContato.set(val ? new Date(val) : null);
  }
}

