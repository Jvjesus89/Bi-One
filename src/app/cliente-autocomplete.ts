import { Component, signal, computed, output, input, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ClienteOption {
  idcliente: number;
  razao: string;
  fantasia?: string | null;
  cpcn?: number | null;
}

@Component({
  selector: 'app-cliente-autocomplete',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="relative">
      @if (label()) {
        <label [for]="inputId()" class="block text-sm font-medium text-slate-300 mb-1">
          {{ label() }}
          @if (clienteSelecionadoId()) {
            <span class="text-xs text-green-400 ml-2">✓ Selecionado</span>
          }
          @if (required()) {
            <span class="text-red-400 ml-1">*</span>
          }
        </label>
      }
      <div class="relative">
        <input 
          [id]="inputId()"
          [name]="inputId()"
          type="text"
          [(ngModel)]="buscaTexto"
          (ngModelChange)="onBuscaChange()"
          (focus)="onBuscaChange()"
          (blur)="onBlur()"
          [placeholder]="placeholder()"
          [required]="required()"
          class="w-full px-3 py-2 border border-slate-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-slate-700 text-slate-200"
          autocomplete="off"
        />
        @if (buscaTexto()) {
          <button 
            type="button"
            (click)="limpar()"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
          >
            ✕
          </button>
        }
      </div>
      
      <!-- Dropdown com resultados -->
      @if (mostrarDropdown() && clientesEncontrados().length > 0) {
        <div class="autocomplete-dropdown absolute z-10 w-full mt-1 bg-slate-800 border border-slate-600 rounded-md shadow-lg max-h-60 overflow-auto">
          @for (cliente of clientesEncontrados(); track cliente.idcliente) {
            <button
              type="button"
              (click)="selecionar(cliente)"
              class="w-full text-left px-4 py-2 hover:bg-slate-700 text-slate-200 border-b border-slate-700 last:border-b-0"
            >
              <div class="font-medium">{{ cliente.razao }}</div>
              @if (cliente.fantasia) {
                <div class="text-sm text-slate-400">{{ cliente.fantasia }}</div>
              }
              @if (cliente.cpcn) {
                <div class="text-xs text-slate-500">CNPJ/CPF: {{ cliente.cpcn }}</div>
              }
            </button>
          }
        </div>
      }
      
      @if (buscaTexto() && clientesEncontrados().length === 0 && !clienteSelecionadoId()) {
        <div class="mt-1 text-sm text-red-400">Nenhum cliente encontrado</div>
      }
    </div>
  `,
  styles: [`
    .autocomplete-dropdown {
      scrollbar-width: thin;
      scrollbar-color: rgba(148, 163, 184, 0.3) transparent;
    }

    .autocomplete-dropdown::-webkit-scrollbar {
      width: 8px;
    }

    .autocomplete-dropdown::-webkit-scrollbar-track {
      background: transparent;
    }

    .autocomplete-dropdown::-webkit-scrollbar-thumb {
      background-color: rgba(148, 163, 184, 0.3);
      border-radius: 4px;
    }

    .autocomplete-dropdown::-webkit-scrollbar-thumb:hover {
      background-color: rgba(148, 163, 184, 0.5);
    }
  `]
})
export class ClienteAutocompleteComponent {
  // Inputs
  clientes = input.required<ClienteOption[]>();
  clienteInicial = input<number | null>(null);
  label = input<string>('Cliente');
  placeholder = input<string>('Digite o nome, CNPJ ou razão social...');
  inputId = input<string>('clienteAutocomplete');
  required = input<boolean>(false);

  // Outputs
  clienteSelecionado = output<number | null>();

  // State
  buscaTexto = signal<string>('');
  mostrarDropdown = signal<boolean>(false);
  clienteSelecionadoId = signal<number | null>(null);
  private inicializado = signal<boolean>(false);

  constructor() {
    // Effect para sincronizar com clienteInicial
    effect(() => {
      const idInicial = this.clienteInicial();
      console.log('Autocomplete effect - clienteInicial:', idInicial);
      
      if (idInicial) {
        const cliente = this.clientes().find(c => c.idcliente === idInicial);
        if (cliente) {
          console.log('Autocomplete - Preenchendo com:', cliente.razao);
          this.clienteSelecionadoId.set(idInicial);
          this.buscaTexto.set(cliente.razao || cliente.fantasia || '');
          this.inicializado.set(true);
        }
      } else if (idInicial === null) {
        // Quando clienteInicial mudar para null, limpar o campo
        console.log('Autocomplete - Limpando (clienteInicial = null)');
        this.buscaTexto.set('');
        this.clienteSelecionadoId.set(null);
        this.mostrarDropdown.set(false);
      }
    }, { allowSignalWrites: true });
  }

  clientesEncontrados = computed(() => {
    const termo = this.buscaTexto().trim().toLowerCase();
    if (!termo) return [];
    
    return this.clientes().filter(c =>
      (c.razao && c.razao.toLowerCase().includes(termo)) ||
      (c.fantasia && c.fantasia.toLowerCase().includes(termo)) ||
      (c.cpcn && String(c.cpcn).includes(termo))
    );
  });

  onBuscaChange() {
    const termo = this.buscaTexto().trim();
    if (!termo) {
      this.mostrarDropdown.set(false);
      // Só limpa se o componente já foi inicializado e o usuário limpou manualmente
      if (this.inicializado() && this.clienteSelecionadoId()) {
        this.clienteSelecionadoId.set(null);
        this.clienteSelecionado.emit(null);
      }
      return;
    }
    
    this.inicializado.set(true);
    const encontrados = this.clientesEncontrados();
    
    // Sempre mostra dropdown se houver resultados
    if (encontrados.length > 0) {
      this.mostrarDropdown.set(true);
      
      // APENAS seleciona automaticamente se for correspondência EXATA
      const correspondenciaExata = encontrados.find(c => 
        c.razao?.toLowerCase() === termo.toLowerCase() ||
        c.fantasia?.toLowerCase() === termo.toLowerCase() ||
        String(c.cpcn) === termo
      );
      
      if (correspondenciaExata) {
        this.clienteSelecionadoId.set(correspondenciaExata.idcliente);
        this.buscaTexto.set(correspondenciaExata.razao || correspondenciaExata.fantasia || '');
        this.mostrarDropdown.set(false);
        this.clienteSelecionado.emit(correspondenciaExata.idcliente);
        console.log('Cliente selecionado automaticamente (correspondência exata):', correspondenciaExata.razao);
      }
    } else {
      // Nenhum encontrado
      this.mostrarDropdown.set(false);
      if (this.clienteSelecionadoId()) {
        this.clienteSelecionadoId.set(null);
        this.clienteSelecionado.emit(null);
      }
    }
  }

  selecionar(cliente: ClienteOption) {
    this.clienteSelecionadoId.set(cliente.idcliente);
    this.buscaTexto.set(cliente.razao || cliente.fantasia || '');
    this.mostrarDropdown.set(false);
    this.clienteSelecionado.emit(cliente.idcliente);
    console.log('Cliente selecionado manualmente:', cliente.razao);
  }

  limpar() {
    this.buscaTexto.set('');
    this.clienteSelecionadoId.set(null);
    this.mostrarDropdown.set(false);
    this.clienteSelecionado.emit(null);
  }

  onBlur() {
    // Aguarda um pouco antes de fechar o dropdown para permitir cliques
    setTimeout(() => {
      this.mostrarDropdown.set(false);
    }, 200);
  }
}
