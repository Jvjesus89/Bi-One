import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ClientesService } from './services/clientes.service';

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
  public get clientes() { return this.clientesService.clientes; }

  constructor(private clientesService: ClientesService) {}

  ngOnInit() {
    if ((this.clientesService as any).loadClientesFromSupabase) {
      (this.clientesService as any).loadClientesFromSupabase();
    }
  }

  addPhoneField() {
    this.telefones.update(t => [...t, { celular: '', responsavel: '' }]);
  }

  removePhoneField(index: number) {
    this.telefones.update(t => t.filter((_, i) => i !== index));
  }

  updatePhone(index: number, value: { celular?: string; responsavel?: string }) {
    this.telefones.update(t => t.map((p, i) => i === index ? { ...p, ...value } : p));
  }

  submit() {
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
    // reset form
    this.razao.set('');
    this.fantasia.set('');
    this.cpcn.set(null);
    this.email.set('');
    this.observacoes.set('');
    this.telefones.set([{ celular: '', responsavel: '', email: '' }]);
  }

  deleteCliente(idcliente: number) {
    this.clientesService.removeCliente(idcliente);
  }
}
