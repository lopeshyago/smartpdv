import React, { useState } from 'react';
import { useApp } from '../App';
import { Product, OrderItem, PaymentMethod, Sale } from '../types';

export default function MesasView() {
  const { tables, products, addSale, refreshTables } = useApp();
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
      newOrders.push({ productId: product.id, quantity: 1, priceAtTime: Number(product.price) });
    }
    syncTable(selectedTableId, 'Ocupada', newOrders);
  };

  const removeFromTable = (productId: string) => {
    if (!selectedTableId || !selectedTable) return;
    const existingOrderIndex = selectedTable.orders.findIndex(o => o.productId === productId);
    if (existingOrderIndex === -1) return;

    let newOrders = [...selectedTable.orders];
    if (newOrders[existingOrderIndex].quantity > 1) {
      newOrders[existingOrderIndex] = { ...newOrders[existingOrderIndex], quantity: newOrders[existingOrderIndex].quantity - 1 };
    } else {
      newOrders = newOrders.filter(o => o.productId !== productId);
    }

    const newStatus = newOrders.length === 0 ? 'Livre' : 'Ocupada';
    syncTable(selectedTableId, newStatus, newOrders);
  };

  const handleCheckout = async (method: PaymentMethod) => {
    if (!selectedTable) return;
    const total = selectedTable.orders.reduce((acc, curr) => acc + (Number(curr.priceAtTime) * curr.quantity), 0);
    const newSale: Sale = { id: Date.now().toString(), items: [...selectedTable.orders], total, paymentMethod: method, timestamp: Date.now() };
    
    await addSale(newSale);
    await syncTable(selectedTable.id, 'Livre', []);
    
    setIsCheckoutOpen(false);
    setSelectedTableId(null);
  };

  const calculateTableTotal = (orders: OrderItem[]) => {
    return orders.reduce((a, c) => a + (Number(c.priceAtTime) * c.quantity), 0);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-bold">Mapa de Mesas</h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {tables.map(table => (
          <button key={table.id} onClick={() => setSelectedTableId(table.id)} className={`aspect-square flex flex-col items-center justify-center rounded-2xl border-2 transition-all active:scale-95 ${table.status === 'Livre' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
            <span className="text-xl font-black">{table.id}</span>
            <span className="text-[10px] font-bold uppercase">{table.status}</span>
            {table.status === 'Ocupada' && (
              <span className="text-[10px] font-black mt-1">R$ {calculateTableTotal(table.orders).toFixed(0)}</span>
            )}
          </button>
        ))}
      </div>

      {selectedTable && (
        <div className="fixed inset-0 z-[100] bg-white animate-in slide-in-from-bottom duration-300 flex flex-col">
          <header className="p-4 border-b flex justify-between items-center bg-white sticky top-0">
            <div><h3 className="text-xl font-bold">Mesa {selectedTable.id}</h3><p className="text-xs text-slate-500">Consumo em tempo real</p></div>
            <button onClick={() => setSelectedTableId(null)} className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center"><i className="fa-solid fa-xmark text-xl text-slate-500"></i></button>
          </header>
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <section>
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Itens Lançados</h4>
              {selectedTable.orders.length === 0 ? <p className="py-12 text-center bg-slate-50 rounded-2xl text-slate-400 text-sm italic border-2 border-dashed border-slate-200">Mesa vazia</p> : (
                <div className="space-y-2">
                  {selectedTable.orders.map((o, i) => {
                    const p = products.find(prod => prod.id === o.productId);
                    return (
                      <div key={i} className="flex justify-between items-center p-3 bg-white border rounded-xl shadow-sm">
                        <div className="flex flex-col">
                          <span className="font-bold text-sm">{p?.name}</span>
                          <span className="text-xs text-slate-400">Unit: R$ {Number(o.priceAtTime).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={() => removeFromTable(o.productId)} className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100 active:bg-rose-100">
                            <i className="fa-solid fa-minus"></i>
                          </button>
                          <span className="font-black text-indigo-600">{o.quantity}</span>
                          <button onClick={() => addToTable(p!)} className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100 active:bg-emerald-100">
                            <i className="fa-solid fa-plus"></i>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
            <section>
              <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Catálogo de Produtos</h4>
              <div className="grid grid-cols-2 gap-2">
                {products.map(p => (
                  <button key={p.id} onClick={() => addToTable(p)} className="p-3 bg-white border border-slate-200 rounded-xl text-left active:bg-indigo-50 transition-colors">
                    <p className="font-bold text-xs truncate">{p.name}</p>
                    <p className="text-[10px] text-indigo-600 font-bold">R$ {Number(p.price).toFixed(2)}</p>
                  </button>
                ))}
              </div>
            </section>
          </div>
          <footer className="p-4 bg-white border-t space-y-3 pb-8">
            <div className="flex justify-between text-xl font-black">
              <span>Total Mesa:</span>
              <span className="text-indigo-600">R$ {calculateTableTotal(selectedTable.orders).toFixed(2)}</span>
            </div>
            <button 
              disabled={selectedTable.orders.length === 0} 
              onClick={() => setIsCheckoutOpen(true)} 
              className="w-full bg-indigo-600 text-white font-bold py-4 rounded-2xl disabled:bg-slate-200 shadow-lg shadow-indigo-100 active:scale-[0.98] transition-transform"
            >
              Fechar Conta e Liberar
            </button>
          </footer>
        </div>
      )}

      {isCheckoutOpen && (
        <div className="fixed inset-0 z-[110] bg-black/60 flex items-end">
          <div className="w-full bg-white rounded-t-[32px] p-6 animate-in slide-in-from-bottom">
            <h3 className="text-xl font-bold text-center mb-6">Meio de Pagamento</h3>
            <div className="space-y-2 mb-6">
              {['Pix', 'Cartão', 'Dinheiro'].map(m => (
                <button key={m} onClick={() => handleCheckout(m as PaymentMethod)} className="w-full p-5 border rounded-2xl text-left font-bold flex justify-between items-center active:bg-indigo-50 transition-colors">
                  {m} <i className="fa-solid fa-chevron-right text-slate-300"></i>
                </button>
              ))}
            </div>
            <button onClick={() => setIsCheckoutOpen(false)} className="w-full text-slate-400 font-bold py-2">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}