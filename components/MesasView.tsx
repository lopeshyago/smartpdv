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
      <h2 className="text-lg font-bold text-slate-800">Mapa de Mesas</h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {tables.map(table => (
          <button key={table.id} onClick={() => setSelectedTableId(table.id)} className={`aspect-square flex flex-col items-center justify-center rounded-2xl border-2 transition-all active:scale-95 shadow-sm ${table.status === 'Livre' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
            <span className="text-2xl font-black">{table.id}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider">{table.status}</span>
            {table.status === 'Ocupada' && (
              <span className="text-[10px] font-black mt-1 bg-rose-200/50 px-2 py-0.5 rounded-full">R$ {calculateTableTotal(table.orders).toFixed(0)}</span>
            )}
          </button>
        ))}
      </div>

      {selectedTable && (
        <div className="fixed inset-0 z-[100] bg-white animate-in slide-in-from-bottom duration-300 flex flex-col">
          <header className="p-4 border-b flex justify-between items-center bg-white sticky top-0 z-10 shadow-sm">
            <div>
              <h3 className="text-xl font-bold text-slate-800">Mesa {selectedTable.id}</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Controle de Consumo</p>
            </div>
            <button onClick={() => setSelectedTableId(null)} className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 active:bg-slate-100"><i className="fa-solid fa-xmark text-xl"></i></button>
          </header>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50/30">
            <section>
              <h4 className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Itens Lançados</h4>
              {selectedTable.orders.length === 0 ? (
                <div className="py-12 text-center bg-white rounded-3xl text-slate-400 text-sm border-2 border-dashed border-slate-200">
                  <i className="fa-solid fa-receipt text-3xl mb-2 block opacity-20"></i>
                  Nenhum item lançado ainda
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedTable.orders.map((o, i) => {
                    const p = products.find(prod => prod.id === o.productId);
                    return (
                      <div key={i} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700 text-sm">{p?.name || 'Item Removido'}</span>
                          <span className="text-xs text-indigo-600 font-bold">R$ {Number(o.priceAtTime).toFixed(2)} un.</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button onClick={() => removeFromTable(o.productId)} className="w-9 h-9 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100 active:scale-90">
                            <i className="fa-solid fa-minus"></i>
                          </button>
                          <span className="font-black text-slate-800 w-6 text-center">{o.quantity}</span>
                          <button onClick={() => p && addToTable(p)} className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100 active:scale-90">
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
              <h4 className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Adicionar ao Consumo</h4>
              <div className="grid grid-cols-2 gap-2 pb-10">
                {products.map(p => (
                  <button key={p.id} onClick={() => addToTable(p)} className="p-3 bg-white border border-slate-100 rounded-2xl text-left active:bg-indigo-50 active:border-indigo-100 transition-all flex items-center gap-2 shadow-sm">
                    <img src={p.image} className="w-8 h-8 rounded-lg object-cover bg-slate-50" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150?text=P')} />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-[11px] truncate text-slate-700 leading-tight">{p.name}</p>
                      <p className="text-[10px] text-indigo-600 font-black">R$ {Number(p.price).toFixed(2)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          </div>

          <footer className="p-4 bg-white border-t border-slate-100 space-y-3 pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
            <div className="flex justify-between items-end">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Acumulado</span>
              <span className="text-3xl font-black text-indigo-600">R$ {calculateTableTotal(selectedTable.orders).toFixed(2)}</span>
            </div>
            <button 
              disabled={selectedTable.orders.length === 0} 
              onClick={() => setIsCheckoutOpen(true)} 
              className="w-full bg-indigo-600 text-white font-bold py-5 rounded-[24px] disabled:bg-slate-100 disabled:text-slate-300 shadow-xl shadow-indigo-100 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-check-circle"></i> Fechar Conta e Liberar Mesa
            </button>
          </footer>
        </div>
      )}

      {isCheckoutOpen && (
        <div className="fixed inset-0 z-[110] bg-black/60 flex items-end backdrop-blur-sm">
          <div className="w-full bg-white rounded-t-[32px] p-6 animate-in slide-in-from-bottom shadow-2xl">
            <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-6"></div>
            <h3 className="text-xl font-bold text-center mb-6 text-slate-800">Selecione o Pagamento</h3>
            <div className="space-y-3 mb-6">
              {[
                { m: 'Pix', icon: 'fa-qrcode', color: 'bg-emerald-50 text-emerald-600' },
                { m: 'Cartão', icon: 'fa-credit-card', color: 'bg-indigo-50 text-indigo-600' },
                { m: 'Dinheiro', icon: 'fa-money-bill-wave', color: 'bg-amber-50 text-amber-600' }
              ].map(item => (
                <button 
                  key={item.m} 
                  onClick={() => handleCheckout(item.m as PaymentMethod)} 
                  className="w-full p-5 border border-slate-100 rounded-2xl text-left font-bold flex justify-between items-center active:bg-slate-50 shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color}`}>
                      <i className={`fa-solid ${item.icon}`}></i>
                    </div>
                    <span>{item.m}</span>
                  </div>
                  <i className="fa-solid fa-chevron-right text-slate-300"></i>
                </button>
              ))}
            </div>
            <button onClick={() => setIsCheckoutOpen(false)} className="w-full text-slate-400 font-bold py-2 active:text-slate-600">Cancelar</button>
          </div>
        </div>
      )}
    </div>
  );
}