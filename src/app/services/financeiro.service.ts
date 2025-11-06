import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface Financeiro {
  idfinanceiro: number;
  idcliente: number;
  descricao: string;
  valor: number;
  tipo: 'Receita' | 'Despesa';
  data_cadastro: Date;
  status: 'Pendente' | 'Pago' | 'Vencido';
  vencimento?: Date;
  observacoes?: string | null;
  ativo?: boolean | null;
}

@Injectable({ providedIn: 'root' })
export class FinanceiroService {
  private supabaseUrl = 'https://abgogpozaenobxykxcij.supabase.co';
  private supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiZ29ncG96YWVub2J4eWt4Y2lqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3ODAxNzYsImV4cCI6MjA3NTM1NjE3Nn0.y8mCwWzJOEnKcYCH5VhmylnNGOaNF6UyMGhhzgEz-iQ';

  private supabase: any;
  private platformId = inject(PLATFORM_ID);

  private financeiroState = signal<Financeiro[]>([]);
  public financeiro = this.financeiroState.asReadonly();

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

  async loadFinanceiroFromSupabase(): Promise<void> {
    if (!this.supabase) return;
    try {
      const { data, error } = await this.supabase
        .from('financeiro')
        .select('*')
        .order('data_cadastro', { ascending: false });
      if (error) throw error;

      const lista: Financeiro[] = (data || []).map((f: any) => ({
        idfinanceiro: f.idfinanceiro,
        idcliente: f.idcliente,
        descricao: f.descricao,
        valor: f.valor,
        tipo: f.tipo,
        data_cadastro: new Date(f.data_cadastro),
        status: f.status,
        vencimento: f.vencimento ? new Date(f.vencimento) : undefined,
        observacoes: f.observacoes ?? null,
        ativo: f.ativo ?? true
      }));

      this.financeiroState.set(lista);
    } catch (err) {
      console.error('Falha ao carregar financeiro do Supabase.', err);
    }
  }

  async addFinanceiro(
    idcliente: number,
    descricao: string,
    valor: number,
    tipo: 'Receita' | 'Despesa',
    data_cadastro: Date,
    status: 'Pendente' | 'Pago' | 'Vencido',
    vencimento?: Date,
    observacoes?: string
  ): Promise<Financeiro | null> {
    if (!this.supabase) {
      // fallback local
      const lista = this.financeiroState();
      const novoId = lista.length ? Math.max(...lista.map(f => f.idfinanceiro)) + 1 : 1;
      const item: Financeiro = {
        idfinanceiro: novoId,
        idcliente,
        descricao: descricao.trim(),
        valor,
        tipo,
        data_cadastro,
        status,
        vencimento,
        observacoes: observacoes?.trim() || null,
        ativo: true
      };
      this.financeiroState.update(f => [item, ...f]);
      return item;
    }

    try {
      const { data: insertedData, error } = await this.supabase
        .from('financeiro')
        .insert({
          idcliente,
          descricao: descricao.trim(),
          valor,
          tipo,
          data_cadastro: data_cadastro.toISOString().split('T')[0],
          status,
          vencimento: vencimento ? vencimento.toISOString().split('T')[0] : null,
          observacoes: observacoes?.trim() || null,
          ativo: true
        })
        .select()
        .single();

      if (error) throw error;

      await this.loadFinanceiroFromSupabase();
      return this.financeiroState().find(f => f.idfinanceiro === insertedData.idfinanceiro) || null;
    } catch (err) {
      console.error('Falha ao adicionar financeiro no Supabase.', err);
      return null;
    }
  }

  async updateFinanceiro(
    idfinanceiro: number,
    descricao: string,
    valor: number,
    tipo: 'Receita' | 'Despesa',
    data_cadastro: Date,
    status: 'Pendente' | 'Pago' | 'Vencido',
    vencimento?: Date,
    observacoes?: string
  ): Promise<Financeiro | null> {
    if (!this.supabase) {
      // fallback local
      this.financeiroState.update(lista => lista.map(f => {
        if (f.idfinanceiro === idfinanceiro) {
          return {
            ...f,
            descricao: descricao.trim(),
            valor,
            tipo,
            data_cadastro,
            status,
            vencimento,
            observacoes: observacoes?.trim() || null
          };
        }
        return f;
      }));
      return this.financeiroState().find(f => f.idfinanceiro === idfinanceiro) || null;
    }

    try {
      const { error } = await this.supabase
        .from('financeiro')
        .update({
          descricao: descricao.trim(),
          valor,
          tipo,
          data_cadastro: data_cadastro.toISOString().split('T')[0],
          status,
          vencimento: vencimento ? vencimento.toISOString().split('T')[0] : null,
          observacoes: observacoes?.trim() || null
        })
        .eq('idfinanceiro', idfinanceiro);

      if (error) throw error;

      await this.loadFinanceiroFromSupabase();
      return this.financeiroState().find(f => f.idfinanceiro === idfinanceiro) || null;
    } catch (err) {
      console.error('Falha ao atualizar financeiro no Supabase.', err);
      return null;
    }
  }

  async removeFinanceiro(idfinanceiro: number): Promise<void> {
    if (!this.supabase) {
      this.financeiroState.update(f => f.filter(x => x.idfinanceiro !== idfinanceiro));
      return;
    }
    try {
      const { error } = await this.supabase
        .from('financeiro')
        .delete()
        .eq('idfinanceiro', idfinanceiro);
      if (error) throw error;

      this.financeiroState.update(f => f.filter(x => x.idfinanceiro !== idfinanceiro));
    } catch (err) {
      console.error('Falha ao remover financeiro no Supabase.', err);
    }
  }
}

