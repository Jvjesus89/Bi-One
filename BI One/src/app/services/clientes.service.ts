import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface ClienteTelefone {
  idtelefone: number;
  celular: string | null;
  responsavel: string | null;
  email: string | null;
  ativo?: boolean | null;
}

export interface Cliente {
  idcliente: number;
  razao: string;
  fantasia?: string | null;
  cpcn?: number | null;
  ativo?: boolean | null;
  clientes_telefone: ClienteTelefone[];
  email?: string | null;
  observacoes?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ClientesService {
  private supabaseUrl = 'https://abgogpozaenobxykxcij.supabase.co';
  private supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiZ29ncG96YWVub2J4eWt4Y2lqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3ODAxNzYsImV4cCI6MjA3NTM1NjE3Nn0.y8mCwWzJOEnKcYCH5VhmylnNGOaNF6UyMGhhzgEz-iQ';

  private supabase: any;
  private platformId = inject(PLATFORM_ID);

  private clientesState = signal<Cliente[]>([
    {
      idcliente: 1,
      razao: 'Empresa X Ltda',
      fantasia: 'Empresa X',
      cpcn: 12345678900000,
      ativo: true,
      clientes_telefone: [
        { idtelefone: 1, celular: '+5511999999999', responsavel: 'João', email: 'joao@empresa.com', ativo: true }
      ],
      email: null,
      observacoes: null
    }
  ]);
  public clientes = this.clientesState.asReadonly();

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

  getClientes(): Cliente[] {
    return this.clientesState();
  }

  async loadClientesFromSupabase(): Promise<void> {
    if (!this.supabase) return;
    try {
      const { data, error } = await this.supabase
        .from('clientes')
        .select('*, clientes_telefone(*)')
        .order('idcliente', { ascending: false });
      if (error) throw error;
      const lista: Cliente[] = (data || []).map((c: any) => ({
        idcliente: c.idcliente,
        razao: c.razao,
        fantasia: c.fantasia ?? null,
        cpcn: c.cpcn ?? null,
        ativo: c.ativo ?? true,
        clientes_telefone: (c.clientes_telefone || []).map((t: any) => ({
          idtelefone: t.idtelefone,
          celular: t.celular ?? null,
          responsavel: t.responsavel ?? null,
          email: t.email ?? null,
          ativo: t.ativo ?? true
        })),
        email: c.email ?? null,
        observacoes: c.observacoes ?? null
      }));
      this.clientesState.set(lista);
    } catch (err) {
      console.error('Falha ao carregar clientes do Supabase.', err);
    }
  }

  async addCliente(razao: string, telefones: { celular: string; responsavel?: string; email?: string }[], fantasia?: string, cpcn?: number, email?: string, observacoes?: string): Promise<Cliente | null> {
    if (!this.supabase) {
      // fallback local
      const lista = this.clientesState();
      const novoId = lista.length ? Math.max(...lista.map(c => c.idcliente)) + 1 : 1;
      let proxIdTelefone = 1;
      if (lista.length) {
        const maxTel = Math.max(0, ...lista.flatMap(c => c.clientes_telefone.map(t => t.idtelefone)));
        proxIdTelefone = maxTel + 1;
      }
      const cliente: Cliente = {
        idcliente: novoId,
        razao: razao.trim(),
        fantasia: (fantasia?.trim() || null) ?? null,
        cpcn: typeof cpcn === 'number' ? cpcn : (cpcn ? Number(cpcn) : null),
        ativo: true,
        clientes_telefone: (telefones || []).map((t, index) => ({
          idtelefone: proxIdTelefone + index,
          celular: (t.celular || '').trim() || null,
          responsavel: (t.responsavel || '').trim() || null,
          email: (t.email || '').trim() || null,
          ativo: true
        })),
        email: email?.trim() || null,
        observacoes: observacoes?.trim() || null
      };
      this.clientesState.update(c => [cliente, ...c]);
      return cliente;
    }

    try {
      // 1) tenta inserir incluindo observacoes (se a coluna existir)
      let insertResult: any;
      try {
        insertResult = await this.supabase
          .from('clientes')
          .insert({
            razao: razao.trim(),
            fantasia: (fantasia?.trim() || null) ?? null,
            cpcn: typeof cpcn === 'number' ? cpcn : (cpcn ? Number(cpcn) : null),
            ativo: true,
            observacoes: observacoes?.trim() || null
          })
          .select()
          .single();
      } catch (e) {
        insertResult = { error: e };
      }

      // 2) se der erro de coluna inexistente, re-tenta sem observacoes
      if (insertResult?.error) {
        const err = insertResult.error;
        const msg = (err?.message || '').toString();
        if (msg.includes("Could not find the 'observacoes' column") || msg.includes('PGRST204')) {
          const retry = await this.supabase
            .from('clientes')
            .insert({
              razao: razao.trim(),
              fantasia: (fantasia?.trim() || null) ?? null,
              cpcn: typeof cpcn === 'number' ? cpcn : (cpcn ? Number(cpcn) : null),
              ativo: true
            })
            .select()
            .single();
          if (retry.error) throw retry.error;
          insertResult = retry;
        } else {
          throw err;
        }
      }

      const { data } = insertResult;

      const idcliente = data.idcliente as number;

      // inserir telefones vinculados
      const tels = (telefones || [])
        .filter(t => (t.celular || '').trim() || (t.email || '').trim())
        .map(t => ({ idcliente, celular: (t.celular || '').trim() || null, responsavel: (t.responsavel || '').trim() || null, email: (t.email || '').trim() || null, ativo: true }));
      if (tels.length) {
        const { error: telErr } = await this.supabase.from('clientes_telefone').insert(tels);
        if (telErr) throw telErr;
      }

      await this.loadClientesFromSupabase();
      return this.clientesState().find(c => c.idcliente === idcliente) || null;
    } catch (err) {
      console.error('Falha ao adicionar cliente no Supabase.', err);
      return null;
    }
  }

  async removeCliente(idcliente: number): Promise<void> {
    if (!this.supabase) {
      this.clientesState.update(c => c.filter(x => x.idcliente !== idcliente));
      return;
    }
    try {
      // Exclui telefones primeiro devido à FK
      const { error: telErr } = await this.supabase
        .from('clientes_telefone')
        .delete()
        .eq('idcliente', idcliente);
      if (telErr) throw telErr;

      const { error } = await this.supabase
        .from('clientes')
        .delete()
        .eq('idcliente', idcliente);
      if (error) throw error;

      this.clientesState.update(c => c.filter(x => x.idcliente !== idcliente));
    } catch (err) {
      console.error('Falha ao remover cliente no Supabase.', err);
    }
  }

  // substitui toda a lista (útil em testes ou carregamento)
  setClientes(list: Cliente[]) {
    this.clientesState.set(list || []);
  }
}
