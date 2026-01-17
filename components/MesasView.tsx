
import React, { useState } from 'react';
import { useApp } from '../App';
import { Product, OrderItem, PaymentMethod, Sale } from '../types';

export default function MesasView() {
  const { tables, setTables, products, addSale, refreshTables } = useApp();
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const selectedTable = tables.find(t => t.id === selectedTableId);

  const syncTable = async (id: number, status: string, orders: any[]) => {
    await fetch(`/api/tables/${id}/order`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, orders })
    });
    refreshTables();
  };

  const addToTable = (product: Product) => {
    if (!selectedTableId || !selectedTable) return;
    const existingOrderIndex = selectedTable.orders.findIndex(o => o.productId === product.id);
    const newOrders = [...selectedTable.orders];
    if (existingOrderIndex > -1) {
      newOrders[existingOrderIndex] = { ...newOrders[existingOrderIndex], quantity: newOrders[existingOrderIndex].quantity + 1 };
    } else {
      newOrders.push({ productId: product.id, quantity: 1, priceAtTime: product.price });
    }
    syncTable(selectedTableId, 'Ocupada', newOrders);
  };

  const handleCheckout = async (method: PaymentMethod) => {
    if (!selectedTable) return;
    const total = selectedTable.orders.reduce((acc, curr) => acc + (curr.priceAtTime * curr.quantity), 0);
    const newSale: Sale = { id: Date.now().toString(), items: [...selectedTable.orders], total, paymentMethod: method, timestamp: Date.now() };
    
    await addSale(newSale);
    await syncTable(selectedTable.id, 'Livre', []);
    
    setIsCheckoutOpen(false);
    setSelectedTableId(null);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Mapa de Mesas</h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {tables.map(table => (
          <button key={table.id} onClick={() => setSelectedTableId(table.id)} className={`aspect-square flex flex-col items-center justify-center rounded-2xl border-2 transition-all ${table.status === 'Livre' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
            <span className="text-xl font-black">{table.id}</span>
            <span className="text-[10px] font-bold uppercase">{table.status}</span>
          </button>
        ))}
      </div>

      {selectedTable && (
        <div className="fixed inset-0 z-[100] bg-white animate-in slide-in-from-bottom duration-300 flex flex-col">
          <header className="p-4 border-b flex justify-between items-center bg-white">
            <div><h3 className="text-xl font-bold">Mesa {selectedTable.id}</h3><p className="text-xs text-slate-500">Controle compartilhado</p></div>
            <button onClick={() => setSelectedTableId(null)} className="p-2 rounded-full bg-slate-100"><i className="fa-solid fa-xmark text-xl"></i></button>
          </header>
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <section>
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Consumo Atual</h4>
              {selectedTable.orders.length === 0 ? <p className="py-8 text-center bg-slate-50 rounded-xl text-slate-400 text-sm italic">Vazia</p> : (
                <div className="space-y-2">
                  {selectedTable.orders.map((o, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-white border rounded-xl shadow-sm">
                      <span className="font-medium text-sm"><span className="text-indigo-600 font-bold mr-2">{o.quantity}x</span> {products.find(p => p.id === o.productId)?.name}</span>
                      <span className="font-bold text-sm">R$ {(o.priceAtTime * o.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
            <section>
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Lançar Produto</h4>
              <div className="grid grid-cols-2 gap-2">
                {products.map(p => (
                  <button key={p.id} onClick={() => addToTable(p)} className="p-3 bg-white border border-slate-200 rounded-xl text-left active:bg-indigo-50 transition-colors">
                    <p className="font-bold text-xs truncate">{p.name}</p>
                    <p className="text-[10px] text-slate-400">R$ {Number(p.price).toFixed(2)}</p>
                  </button>
                ))}
              </div>
            </section>
          </div>
          <footer className="p-4 bg-white border-t space-y-3">
            <div className="flex justify-between text-lg font-black"><span>Total:</span><span className="text-indigo-600">R$ {selectedTable.orders.reduce((a, c) => a + (c.priceAtTime * c.quantity), 0).toFixed(2)}</span></div>
            <button disabled={selectedTable.orders.length === 0} onClick={() => setIsCheckoutOpen(true)} className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl disabled:bg-slate-200">Fechar Conta</button>
          </footer>
        </div>
      )}

      {isCheckoutOpen && (
        <div className="fixed inset-0 z-[110] bg-black/60 flex items-end">
          <div className="w-full bg-white rounded-t-[32px] p-6 animate-in slide-in-from-bottom">
            <h3 className="text-xl font-bold text-center mb-6">Pagamento</h3>
            <div className="space-y-2 mb-6">
              {['Pix', 'Cartão', 'Dinheiro'].map(m => (
                <button key={m} onClick={() => handleCheckout(m as PaymentMethod)} className="w-full p-4 border rounded-2xl text-left font-bold flex justify-between items-center">
                  {m} <i className="fa-solid fa-chevron-right text-slate-300"></i>
                </button>
              ))}
            </div>
            <button onClick={() => setIsCheckoutOpen(false)} className="w-full text-slate-400 font-bold">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}
