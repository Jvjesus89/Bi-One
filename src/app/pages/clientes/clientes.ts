import { Component, signal, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ClientesService } from '../../services/clientes.service';
import { ClienteSelecionadoService } from '../../services/selecionado.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './clientes.html',
  styleUrls: ['./clientes.css']
})
export class ClientesComponent {
  razao = signal('');
  fantasia = signal<string | null>('');
  cpcn = signal<number | null>(null);
  email = signal<string | null>('');
  observacoes = signal<string | null>('');
  telefones = signal<Array<{ celular: string; responsavel?: string; email?: string }>>([
    { celular: '', responsavel: '', email: '' }
  ]);

  // Adicionar acesso ao cliente selecionado
  private clienteSel = inject(ClienteSelecionadoService);
  public clienteSelecionado = this.clienteSel.clienteSelecionado;

  // Clientes filtrados como computed signal
  public clientes = computed(() => {
    const todos = this.clientesService.clientes();
    const selecionado = this.clienteSelecionado();

    // Se houver cliente selecionado, mostra apenas ele
    if (selecionado) {
      return todos.filter(c => c.idcliente === selecionado.idcliente);
    }

    // Caso contrário, mostra todos
    return todos;
  });

  constructor(
    private clientesService: ClientesService,
    private router: Router
  ) {
    // Effect que monitora tanto o cliente selecionado quanto a lista de clientes
    // Isso garante que quando os dados forem carregados, o formulário será preenchido
    effect(() => {
      const selecionado = this.clienteSelecionado();
      const listaClientes = this.clientesService.clientes(); // Lê a lista para reagir quando mudar

      if (selecionado) {
        // Busca o cliente completo na lista para garantir que tenha todos os dados (telefones, etc)
        const clienteCompleto = listaClientes.find(
          c => c.idcliente === selecionado.idcliente
        );
        if (clienteCompleto) {
          // Usa o cliente completo da lista que tem todos os dados relacionados
          this.preencherFormulario(clienteCompleto);
        } else if (selecionado.clientes_telefone) {
          // Se não encontrar completo na lista mas o selecionado tem telefones, usa ele
          this.preencherFormulario(selecionado);
        } else {
          // Se não encontrar completo e o selecionado não tem telefones, aguarda carregar
          // O effect será executado novamente quando a lista de clientes for atualizada
          console.log('Aguardando carregamento completo do cliente...');
        }
      } else {
        // Se não houver cliente selecionado, limpa o formulário
        this.limparFormulario();
      }
    });
  }

  // Função auxiliar para preencher o formulário com dados do cliente
  preencherFormulario(cliente: any) {
    console.log('Preenchendo formulário com cliente:', cliente.razao);
    this.razao.set(cliente.razao || '');
    this.fantasia.set(cliente.fantasia || '');
    this.cpcn.set(cliente.cpcn || null);
    this.observacoes.set(cliente.observacoes || '');

    // Preenche os telefones
    if (cliente.clientes_telefone && cliente.clientes_telefone.length > 0) {
      this.telefones.set(cliente.clientes_telefone.map((t: any) => ({
        celular: t.celular || '',
        responsavel: t.responsavel || '',
        email: t.email || ''
      })));
    } else {
      // Se não houver telefones, mantém pelo menos um campo vazio
      this.telefones.set([{ celular: '', responsavel: '', email: '' }]);
    }
  }

  ngOnInit() {
    if ((this.clientesService as any).loadClientesFromSupabase) {
      (this.clientesService as any).loadClientesFromSupabase();
    }

    // Verifica se já existe cliente selecionado ao inicializar
    // Isso garante que mesmo se o effect ainda não tiver executado, preenchemos o formulário
    const clienteInicial = this.clienteSelecionado();
    if (clienteInicial) {
      // Aguarda um pouco para garantir que os dados foram carregados
      setTimeout(() => {
        const listaClientes = this.clientesService.clientes();
        const clienteCompleto = listaClientes.find(
          c => c.idcliente === clienteInicial.idcliente
        );
        if (clienteCompleto) {
          this.preencherFormulario(clienteCompleto);
        } else if (clienteInicial.clientes_telefone) {
          this.preencherFormulario(clienteInicial);
        }
      }, 100);
    }
  }

  limparFormulario() {
    this.razao.set('');
    this.fantasia.set('');
    this.cpcn.set(null);
    this.observacoes.set('');
    this.telefones.set([{ celular: '', responsavel: '', email: '' }]);
  }

  selectCliente(cliente: any) {
    // Define seleção global e navega para chamados por padrão
    this.clienteSel.set(cliente);
    // opcional: navegar para a tela de chamados para ver dados específicos
    try { this.router.navigate(['/chamados']); } catch {}
  }

  addPhoneField() {
    this.telefones.update(t => [...t, { celular: '', responsavel: '', email: '' }]);
  }

  removePhoneField(index: number) {
    this.telefones.update(t => t.filter((_, i) => i !== index));
  }

  updatePhone(index: number, value: { celular?: string; responsavel?: string; email?: string }) {
    this.telefones.update(t => t.map((p, i) => i === index ? { ...p, ...value } : p));
  }

  submit() {
    const selecionado = this.clienteSelecionado();

    if (selecionado) {
      // Modo de edição
      this.atualizarCliente(selecionado.idcliente);
    } else {
      // Modo de cadastro
      this.cadastrarCliente();
    }
  }

  cadastrarCliente() {
    const razao = this.razao().trim();
    const telefones = this.telefones()
      .map(t => ({ celular: (t.celular || '').trim(), responsavel: (t.responsavel || '').trim(), email: (t.email || '').trim() }))
      .filter(t => !!t.celular || !!t.email);
    if (!razao || !telefones.length) return;
    const fantasia = (this.fantasia() || '').trim();
    const cpcnVal = this.cpcn();
    const email = (this.email() || '').trim();
    const observacoes = (this.observacoes() || '').trim();
    this.clientesService.addCliente(
      razao,
      telefones,
      fantasia || undefined,
      typeof cpcnVal === 'number' ? cpcnVal : undefined,
      email || undefined,
      observacoes || undefined
    );
    this.limparFormulario();
  }

  async atualizarCliente(idCliente: number) {
    const razao = this.razao().trim();
    const telefones = this.telefones()
      .map(t => ({ celular: (t.celular || '').trim(), responsavel: (t.responsavel || '').trim(), email: (t.email || '').trim() }))
      .filter(t => !!t.celular || !!t.email);
    if (!razao || !telefones.length) {
      console.error('Por favor, preencha ao menos a Razão Social e um contato.');
      alert('Por favor, preencha ao menos a Razão Social e um contato.');
      return;
    }

    const fantasia = (this.fantasia() || '').trim();
    const cpcnVal = this.cpcn();
    const observacoes = (this.observacoes() || '').trim();

    try {
      // Chamar método de atualização no serviço
      const clienteAtualizado = await this.clientesService.updateCliente(
        idCliente,
        razao,
        telefones,
        fantasia || undefined,
        typeof cpcnVal === 'number' ? cpcnVal : undefined,
        observacoes || undefined
      );

      if (clienteAtualizado) {
        console.log('Cliente atualizado com sucesso!', clienteAtualizado);
        alert('Cliente atualizado com sucesso!');
        this.limparFormulario();
        this.clienteSel.set(null); // Limpa o filtro após atualizar
      } else {
        console.error('Falha ao atualizar cliente.');
        alert('Erro ao atualizar cliente. Verifique o console para mais detalhes.');
      }
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      alert('Erro ao atualizar cliente. Verifique o console para mais detalhes.');
    }
  }

  deleteCliente(idcliente: number) {
    this.clientesService.removeCliente(idcliente);
  }
}
