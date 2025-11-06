import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface ContatoCliente {
  idcontato: number;
  idcliente: number;
  tipo: 'Comercial' | 'Sucesso' | 'Suporte' | 'Financeiro' | 'Outro';
  assunto: string;
  descricao: string;
  data_cadastro: Date;
  responsavel?: string | null;
  data_proximo_contato?: Date | null;
  observacoes?: string | null;
  ativo?: boolean | null;
}

@Injectable({ providedIn: 'root' })
export class ContatoClienteService {
  private supabaseUrl = 'https://abgogpozaenobxykxcij.supabase.co';
  private supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiZ29ncG96YWVub2J4eWt4Y2lqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3ODAxNzYsImV4cCI6MjA3NTM1NjE3Nn0.y8mCwWzJOEnKcYCH5VhmylnNGOaNF6UyMGhhzgEz-iQ';

  private supabase: any;
  private platformId = inject(PLATFORM_ID);

  private contatosState = signal<ContatoCliente[]>([]);
  public contatos = this.contatosState.asReadonly();

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      const supabaseLib = (globalThis as any)?.supabase;
      if (typeof supabaseLib !== 'undefined') {
        if (this.supabaseUrl && this.supabaseKey && this.supabaseUrl.startsWith('http')) {
          this.supabase = supabaseLib.createClient(this.supabaseUrl, this.supabaseKey);
        }
      }
    }
  }

  async loadContatosFromSupabase(): Promise<void> {
    if (!this.supabase) return;
    try {
      const { data, error } = await this.supabase
        .from('contato_cliente')
        .select('*')
        .order('data_cadastro', { ascending: false });
      if (error) throw error;

      const lista: ContatoCliente[] = (data || []).map((c: any) => ({
        idcontato: c.idcontato,
        idcliente: c.idcliente,
        tipo: c.tipo,
        assunto: c.assunto,
        descricao: c.descricao,
        data_cadastro: new Date(c.data_cadastro),
        responsavel: c.responsavel ?? null,
        data_proximo_contato: c.data_proximo_contato ? new Date(c.data_proximo_contato) : null,
        observacoes: c.observacoes ?? null,
        ativo: c.ativo ?? true
      }));

      this.contatosState.set(lista);
    } catch (err) {
      console.error('Falha ao carregar contatos do Supabase.', err);
    }
  }

  async addContato(
    idcliente: number,
    tipo: 'Comercial' | 'Sucesso' | 'Suporte' | 'Financeiro' | 'Outro',
    assunto: string,
    descricao: string,
    data_cadastro: Date,
    responsavel?: string,
    data_proximo_contato?: Date,
    observacoes?: string
  ): Promise<ContatoCliente | null> {
    if (!this.supabase) {
      // fallback local
      const lista = this.contatosState();
      const novoId = lista.length ? Math.max(...lista.map(c => c.idcontato)) + 1 : 1;
      const contato: ContatoCliente = {
        idcontato: novoId,
        idcliente,
        tipo,
        assunto: assunto.trim(),
        descricao: descricao.trim(),
        data_cadastro,
        responsavel: responsavel?.trim() || null,
        data_proximo_contato: data_proximo_contato || null,
        observacoes: observacoes?.trim() || null,
        ativo: true
      };
      this.contatosState.update(c => [contato, ...c]);
      return contato;
    }

    try {
      const { data: insertedData, error } = await this.supabase
        .from('contato_cliente')
        .insert({
          idcliente,
          tipo,
          assunto: assunto.trim(),
          descricao: descricao.trim(),
          data_cadastro: data_cadastro.toISOString().split('T')[0],
          responsavel: responsavel?.trim() || null,
          data_proximo_contato: data_proximo_contato ? data_proximo_contato.toISOString().split('T')[0] : null,
          observacoes: observacoes?.trim() || null,
          ativo: true
        })
        .select()
        .single();

      if (error) throw error;

      await this.loadContatosFromSupabase();
      return this.contatosState().find(c => c.idcontato === insertedData.idcontato) || null;
    } catch (err) {
      console.error('Falha ao adicionar contato no Supabase.', err);
      return null;
    }
  }

  async updateContato(
    idcontato: number,
    tipo: 'Comercial' | 'Sucesso' | 'Suporte' | 'Financeiro' | 'Outro',
    assunto: string,
    descricao: string,
    data_cadastro: Date,
    responsavel?: string,
    data_proximo_contato?: Date,
    observacoes?: string
  ): Promise<ContatoCliente | null> {
    if (!this.supabase) {
      // fallback local
      this.contatosState.update(lista => lista.map(c => {
        if (c.idcontato === idcontato) {
          return {
            ...c,
            tipo,
            assunto: assunto.trim(),
            descricao: descricao.trim(),
            data_cadastro,
            responsavel: responsavel?.trim() || null,
            data_proximo_contato: data_proximo_contato || null,
            observacoes: observacoes?.trim() || null
          };
        }
        return c;
      }));
      return this.contatosState().find(c => c.idcontato === idcontato) || null;
    }

    try {
      const { error } = await this.supabase
        .from('contato_cliente')
        .update({
          tipo,
          assunto: assunto.trim(),
          descricao: descricao.trim(),
          data_cadastro: data_cadastro.toISOString().split('T')[0],
          responsavel: responsavel?.trim() || null,
          data_proximo_contato: data_proximo_contato ? data_proximo_contato.toISOString().split('T')[0] : null,
          observacoes: observacoes?.trim() || null
        })
        .eq('idcontato', idcontato);

      if (error) throw error;

      await this.loadContatosFromSupabase();
      return this.contatosState().find(c => c.idcontato === idcontato) || null;
    } catch (err) {
      console.error('Falha ao atualizar contato no Supabase.', err);
      return null;
    }
  }

  async removeContato(idcontato: number): Promise<void> {
    if (!this.supabase) {
      this.contatosState.update(c => c.filter(x => x.idcontato !== idcontato));
      return;
    }
    try {
      const { error } = await this.supabase
        .from('contato_cliente')
        .delete()
        .eq('idcontato', idcontato);
      if (error) throw error;

      this.contatosState.update(c => c.filter(x => x.idcontato !== idcontato));
    } catch (err) {
      console.error('Falha ao remover contato no Supabase.', err);
    }
  }
}

