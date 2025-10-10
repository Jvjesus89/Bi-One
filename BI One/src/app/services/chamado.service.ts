// --- IMPORTAÇÕES GERAIS ---
import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// --- INTERFACE ---
export interface Chamado {
  idchamado: number;
  titulo: string;
  descricao: string;
  dataabertura: Date;
  datafechamento?: Date;
  status: 'Aberto' | 'Fechado';
  solucao?: string;
  idcliente: number;
  tipo: string;
}

@Injectable({
  providedIn: 'root',
})
export class ChamadoService {
  private supabaseUrl = 'https://abgogpozaenobxykxcij.supabase.co';
  private supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiZ29ncG96YWVub2J4eWt4Y2lqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3ODAxNzYsImV4cCI6MjA3NTM1NjE3Nn0.y8mCwWzJOEnKcYCH5VhmylnNGOaNF6UyMGhhzgEz-iQ';

  private supabase: any;
  private platformId = inject(PLATFORM_ID);

  private chamadosState = signal<Chamado[]>([]);
  public chamados = this.chamadosState.asReadonly();

  constructor() {
    // A inicialização é feita com as variáveis definidas diretamente no serviço.
    if (isPlatformBrowser(this.platformId)) {
      const supabaseLib = (globalThis as any)?.supabase;
      if (typeof supabaseLib !== 'undefined') {
        if (this.supabaseUrl && this.supabaseKey && this.supabaseUrl.startsWith('http')) {
          this.supabase = supabaseLib.createClient(this.supabaseUrl, this.supabaseKey);
          console.log('Cliente Supabase inicializado com sucesso.');
        } else {
          console.error('URL ou Chave do Supabase inválidas. Verifique se a URL começa com http e se a chave foi preenchida.');
        }
      }
    }
  }

  async getChamados(): Promise<void> {
    if (!this.supabase) {
      console.log("Supabase não inicializado. Usando dados de exemplo (mock).");
      this.chamadosState.set(this.getMockData());
      return;
    }

    try {
      console.log("Buscando chamados do Supabase...");
      const { data, error } = await this.supabase.from('chamados').select('*').order('dataabertura', { ascending: false });
      if (error) throw error;

      const chamadosFormatados = (data || []).map((c: any) => ({
        ...c,
        dataabertura: c.dataabertura ? new Date(c.dataabertura) : new Date(),
        datafechamento: c.datafechamento ? new Date(c.datafechamento) : undefined,
      }));
      this.chamadosState.set(chamadosFormatados);
    } catch (error) {
      console.error("Falha ao buscar do Supabase. Verifique a conexão e as regras de RLS.", error);
      this.chamadosState.set(this.getMockData());
    }
  }

  async addChamado(titulo: string, descricao: string, idcliente: number, tipo: string = ''): Promise<void> {
    if (!this.supabase) {
      console.error("Ação cancelada: Supabase não inicializado.");
      return;
    }

    try {
      const { data, error } = await this.supabase
        .from('chamados')
        .insert({
          titulo,
          descricao,
          status: 'Aberto',
          dataabertura: new Date().toISOString(),
          idcliente,
          tipo
        })
        .select()
        .single();
      if (error) throw error;

      const novoChamado: Chamado = { ...data, dataabertura: new Date(data.dataabertura) };
      this.chamadosState.update(listaAtual => [novoChamado, ...listaAtual]);
    } catch(error) {
      console.error("Falha ao adicionar no Supabase.", error);
    }
  }

  async finalizarChamado(id: number, solucao: string): Promise<void> {
    if (!this.supabase) {
      console.error("Ação cancelada: Supabase não inicializado.");
      return;
    }

    // Atualização otimista na interface para resposta imediata
    this.chamadosState.update(lista =>
      lista.map(c =>
        c.idchamado === id
          ? { ...c, status: 'Fechado', solucao: solucao, datafechamento: new Date() }
          : c
      )
    );

    try {
      const { error } = await this.supabase
        .from('chamados')
        .update({ status: 'Fechado', solucao, datafechamento: new Date().toISOString() })
        .eq('idchamado', id);
      if (error) throw error;
    } catch (error) {
      console.error("Falha ao sincronizar finalização com o Supabase.", error);
    }
  }

  private getMockData(): Chamado[] {
    return [
      { idchamado: 1, titulo: 'Exemplo: PC não liga (Mock)', descricao: 'O computador da recepção não dá sinal de vida.', dataabertura: new Date(), status: 'Aberto', idcliente: 1, tipo: 'Dúvidas' },
    ];
  }
}
