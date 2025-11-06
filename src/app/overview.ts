import { Component, computed, inject, OnInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChamadoService } from './services/chamado.service';
import { ClientesService } from './services/clientes.service';
import { ClienteSelecionadoService } from './services/selecionado.service';
import { FinanceiroService } from './services/financeiro.service';
import { ContatoClienteService } from './services/contato-cliente.service';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './overview.html',
  styleUrls: ['./overview.css']
})
export class OverviewComponent implements OnInit {
  // Expor Math para o template
  Math = Math;

  private chamadoService = inject(ChamadoService);
  private clientesService = inject(ClientesService);
  private clienteSelecionadoService = inject(ClienteSelecionadoService);
  private financeiroService = inject(FinanceiroService);
  private contatoService = inject(ContatoClienteService);

  chamados = this.chamadoService.chamados;
  clientes = this.clientesService.clientes;
  financeiro = this.financeiroService.financeiro;
  contatos = this.contatoService.contatos;
  clienteSelecionado = this.clienteSelecionadoService.clienteSelecionado;

  constructor() {
    // Effect para debug e garantir reatividade
    effect(() => {
      const cliente = this.clienteSelecionado();
      const todosChamados = this.chamados();
      const total = this.chamadosFiltrados().length;
      console.log('=== OVERVIEW DEBUG ===');
      console.log('Total chamados no sistema:', todosChamados.length);
      console.log('Cliente filtrado:', cliente?.razao || 'Todos');
      console.log('Chamados após filtro:', total);
      console.log('=====================');
    });
  }

  // Chamados filtrados por cliente selecionado
  chamadosFiltrados = computed(() => {
    const cliente = this.clienteSelecionado();
    const todos = this.chamados();
    if (!cliente) return todos;
    return todos.filter(c => c.idcliente === cliente.idcliente);
  });

  // Métricas computadas baseadas nos chamados filtrados
  totalChamados = computed(() => this.chamadosFiltrados().length);

  chamadosAbertos = computed(() =>
    this.chamadosFiltrados().filter(c => !c.datafechamento).length
  );

  chamadosFechados = computed(() =>
    this.chamadosFiltrados().filter(c => c.datafechamento).length
  );

  // Prazo médio de solução em horas
  prazoMedioSolucao = computed(() => {
    const fechados = this.chamadosFiltrados().filter(c => c.datafechamento);
    if (fechados.length === 0) return 0;

    const totalHoras = fechados.reduce((acc, chamado) => {
      const abertura = new Date(chamado.dataabertura).getTime();
      const fechamento = new Date(chamado.datafechamento!).getTime();
      const horas = (fechamento - abertura) / (1000 * 60 * 60);
      return acc + horas;
    }, 0);

    return Math.round(totalHoras / fechados.length);
  });

  // Total de clientes
  totalClientes = computed(() => this.clientes().length);

  // Métricas Financeiro
  financeiroFiltrado = computed(() => {
    const cliente = this.clienteSelecionado();
    let lista = this.financeiro();
    if (cliente) {
      lista = lista.filter(f => f.idcliente === cliente.idcliente);
    }
    return lista;
  });

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

  saldoFinanceiro = computed(() => this.totalReceita() - this.totalDespesa());

  // Métricas Contatos
  contatosFiltrados = computed(() => {
    const cliente = this.clienteSelecionado();
    let lista = this.contatos();
    if (cliente) {
      lista = lista.filter(c => c.idcliente === cliente.idcliente);
    }
    return lista;
  });

  totalContatos = computed(() => this.contatosFiltrados().length);

  contatosComProximoContato = computed(() =>
    this.contatosFiltrados().filter(c => c.data_proximo_contato && new Date(c.data_proximo_contato) >= new Date()).length
  );

  // Chamados por tipo
  chamadosPorTipo = computed(() => {
    const tipos: { [key: string]: number } = {};
    this.chamadosFiltrados().forEach(c => {
      tipos[c.tipo] = (tipos[c.tipo] || 0) + 1;
    });
    return tipos;
  });

  // Porcentagem de cada tipo
  percentualTipos = computed(() => {
    const tipos = this.chamadosPorTipo();
    const total = this.totalChamados();
    const result: { tipo: string, count: number, percent: number }[] = [];

    Object.keys(tipos).forEach(tipo => {
      result.push({
        tipo,
        count: tipos[tipo],
        percent: total > 0 ? Math.round((tipos[tipo] / total) * 100) : 0
      });
    });

    return result.sort((a, b) => b.count - a.count);
  });

  // Últimos 7 dias de chamados
  chamadosUltimos7Dias = computed(() => {
    const hoje = new Date();
    const dias: { data: string, abertos: number, fechados: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const data = new Date(hoje);
      data.setDate(data.getDate() - i);
      data.setHours(0, 0, 0, 0);

      const dataStr = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

      const abertos = this.chamadosFiltrados().filter(c => {
        const abertura = new Date(c.dataabertura);
        abertura.setHours(0, 0, 0, 0);
        return abertura.getTime() === data.getTime();
      }).length;

      const fechados = this.chamadosFiltrados().filter(c => {
        if (!c.datafechamento) return false;
        const fechamento = new Date(c.datafechamento);
        fechamento.setHours(0, 0, 0, 0);
        return fechamento.getTime() === data.getTime();
      }).length;

      dias.push({ data: dataStr, abertos, fechados });
    }

    return dias;
  });

  // Altura máxima para o gráfico
  maxChamadosDia = computed(() => {
    const dias = this.chamadosUltimos7Dias();
    return Math.max(...dias.map(d => Math.max(d.abertos, d.fechados)), 1);
  });

  ngOnInit() {
    // Carregar dados quando o componente inicializar
    if (this.chamadoService.getChamados) {
      this.chamadoService.getChamados();
    }
    const svc: any = this.clientesService;
    if (svc.loadClientesFromSupabase) {
      svc.loadClientesFromSupabase();
    }
    const svcFin: any = this.financeiroService;
    if (svcFin.loadFinanceiroFromSupabase) {
      svcFin.loadFinanceiroFromSupabase();
    }
    const svcContato: any = this.contatoService;
    if (svcContato.loadContatosFromSupabase) {
      svcContato.loadContatosFromSupabase();
    }
  }

  formatarMoeda(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  // Função helper para calcular altura da barra
  calcularAlturaBarra(valor: number): number {
    const max = this.maxChamadosDia();
    return max > 0 ? (valor / max) * 100 : 0;
  }
}
