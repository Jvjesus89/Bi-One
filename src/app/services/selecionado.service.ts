import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ClienteSelecionadoService {
  private clienteSignal = signal<any>(null);
  clienteSelecionado = this.clienteSignal.asReadonly();

  set(cliente: any) { this.clienteSignal.set(cliente); }
  get() { return this.clienteSignal(); }
}