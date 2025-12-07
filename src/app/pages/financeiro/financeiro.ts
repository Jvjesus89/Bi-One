import { Component, signal, inject, computed, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { FinanceiroService, Financeiro } from '../../services/financeiro.service';
import { ClientesService } from '../../services/clientes.service';
import { ClienteSelecionadoService } from '../../services/selecionado.service';
import { ClienteAutocompleteComponent } from '../../cliente-autocomplete';

@Component({
  selector: 'app-financeiro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ClienteAutocompleteComponent],
  templateUrl: './financeiro.html',
  styleUrls: ['./financeiro.css']
})
export class FinanceiroComponent implements OnInit {
  // Formulário
  idcliente = signal<number | null>(null);
  descricao = signal('');
  valor = signal<number | null>(null);
  tipo = signal<'Receita' | 'Despesa'>('Receita');
  data = signal<Date>(new Date());
  status = signal<'Pendente' | 'Pago' | 'Vencido'>('Pendente');
  vencimento = signal<Date | null>(null);
  observacoes = signal<string | null>('');

  // Edição
  financeiroSelecionado = signal<Financeiro | null>(null);

  private financeiroService = inject(FinanceiroService);
  private clientesService = inject(ClientesService);
  private clienteSel = inject(ClienteSelecionadoService);
  public clienteSelecionado = this.clienteSel.clienteSelecionado;
  public clientes = this.clientesService.clientes;
  public financeiro = this.financeiroService.financeiro;

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

  // Financeiro filtrado
  financeiroFiltrado = computed(() => {
    const cliente = this.clienteSelecionado();
    const tipoFiltro = this.filtroTipo().trim().toLowerCase();
    let lista = this.financeiro();

    if (cliente) {
      lista = lista.filter(f => f.idcliente === cliente.idcliente);
    }

    if (tipoFiltro) {
      lista = lista.filter(f =>
        f.tipo.toLowerCase().includes(tipoFiltro) ||
        f.status.toLowerCase().includes(tipoFiltro) ||
        f.descricao.toLowerCase().includes(tipoFiltro)
      );
    }

    return lista;
  });

  // Métricas
  totalReceita = computed(() =>
    this.financeiroFiltrado()
      .filter(f => f.tipo === 'Receita' && f.status === 'Pago')
      .reduce((acc, f) => acc + f.valor, 0)
  );

  totalDespesa = computed(() =>
    this.financeiroFiltrado()
      .filter(f => f.tipo === 'Despesa' && f.status === 'Pago')
      .reduce((acc, f) => acc + f.valor, 0)
  );

  saldo = computed(() => this.totalReceita() - this.totalDespesa());

  pendentes = computed(() =>
    this.financeiroFiltrado().filter(f => f.status === 'Pendente').length
  );

  ngOnInit() {
    const svc: any = this.financeiroService;
    if (svc.loadFinanceiroFromSupabase) svc.loadFinanceiroFromSupabase();

    const svcClientes: any = this.clientesService;
    if (svcClientes.loadClientesFromSupabase) svcClientes.loadClientesFromSupabase();
  }

  limparFormulario() {
    this.idcliente.set(null);
    this.descricao.set('');
    this.valor.set(null);
    this.tipo.set('Receita');
    this.data.set(new Date());
    this.status.set('Pendente');
    this.vencimento.set(null);
    this.observacoes.set('');
    this.financeiroSelecionado.set(null);
  }

  preencherFormulario(fin: Financeiro) {
    this.idcliente.set(fin.idcliente);
    this.descricao.set(fin.descricao);
    this.valor.set(fin.valor);
    this.tipo.set(fin.tipo);
    this.data.set(new Date(fin.data_cadastro));
    this.status.set(fin.status);
    this.vencimento.set(fin.vencimento ? new Date(fin.vencimento) : null);
    this.observacoes.set(fin.observacoes || '');
    this.financeiroSelecionado.set(fin);
  }

  editarFinanceiro(fin: Financeiro) {
    this.preencherFormulario(fin);
  }

  async submit() {
    const selecionado = this.financeiroSelecionado();

    if (selecionado) {
      await this.atualizarFinanceiro(selecionado.idfinanceiro);
    } else {
      await this.cadastrarFinanceiro();
    }
  }

  async cadastrarFinanceiro() {
    const idclienteVal = this.idcliente();
    const descricaoVal = this.descricao().trim();
    const valorVal = this.valor();

    if (!idclienteVal || !descricaoVal || valorVal === null || valorVal === undefined) {
      alert('Por favor, preencha Cliente, Descrição e Valor.');
      return;
    }

    try {
      const resultado = await this.financeiroService.addFinanceiro(
        idclienteVal,
        descricaoVal,
        valorVal,
        this.tipo(),
        this.data(),
        this.status(),
        this.vencimento() || undefined,
        this.observacoes() || undefined
      );

      if (resultado) {
        alert('Lançamento financeiro cadastrado com sucesso!');
        this.limparFormulario();
      } else {
        alert('Erro ao cadastrar lançamento financeiro.');
      }
    } catch (error) {
      console.error('Erro ao cadastrar:', error);
      alert('Erro ao cadastrar lançamento financeiro.');
    }
  }

  async atualizarFinanceiro(idfinanceiro: number) {
    const descricaoVal = this.descricao().trim();
    const valorVal = this.valor();

    if (!descricaoVal || valorVal === null || valorVal === undefined) {
      alert('Por favor, preencha Descrição e Valor.');
      return;
    }

    try {
      const resultado = await this.financeiroService.updateFinanceiro(
        idfinanceiro,
        descricaoVal,
        valorVal,
        this.tipo(),
        this.data(),
        this.status(),
        this.vencimento() || undefined,
        this.observacoes() || undefined
      );

      if (resultado) {
        alert('Lançamento financeiro atualizado com sucesso!');
        this.limparFormulario();
      } else {
        alert('Erro ao atualizar lançamento financeiro.');
      }
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      alert('Erro ao atualizar lançamento financeiro.');
    }
  }

  async excluirFinanceiro(idfinanceiro: number) {
    if (confirm('Tem certeza que deseja excluir este lançamento?')) {
      await this.financeiroService.removeFinanceiro(idfinanceiro);
      alert('Lançamento excluído com sucesso!');
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

  formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
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

  get vencimentoFormatado(): string {
    const v = this.vencimento();
    return v ? v.toISOString().split('T')[0] : '';
  }

  set vencimentoFormatado(val: string) {
    this.vencimento.set(val ? new Date(val) : null);
  }
}

