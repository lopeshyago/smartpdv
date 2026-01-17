import React, { useState } from 'react';
import { useApp } from '../App';
import { Product, OrderItem, PaymentMethod, Sale } from '../types';

export default function VendaDiretaView() {
  const { products, addSale } = useApp();
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const addToCart = (product: Product) => {
    setCart(prev => {
      const idx = prev.findIndex(item => item.productId === product.id);
      if (idx > -1) {
        const newCart = [...prev];
        newCart[idx].quantity += 1;
        return newCart;
      }
      return [...prev, { productId: product.id, quantity: 1, priceAtTime: Number(product.price) }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const idx = prev.findIndex(item => item.productId === productId);
      if (idx > -1) {
        const newCart = [...prev];
        if (newCart[idx].quantity > 1) {
          newCart[idx].quantity -= 1;
          return newCart;
        }
        return prev.filter(item => item.productId !== productId);
      }
      return prev;
    });
  };

  const cartTotal = cart.reduce((acc, curr) => acc + (Number(curr.priceAtTime) * curr.quantity), 0);

  const finishSale = async (method: PaymentMethod) => {
    const newSale: Sale = {
      id: Date.now().toString(),
      items: [...cart],
      total: cartTotal,
      paymentMethod: method,
      timestamp: Date.now(),
    };
    await addSale(newSale);
    setCart([]);
    setIsCheckoutOpen(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      <div className="mb-4">
        <div className="relative">
          <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input
            type="text"
            placeholder="Buscar produto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-3 pb-24">
        {filteredProducts.map(prod => (
          <button
            key={prod.id}
            onClick={() => addToCart(prod)}
            className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm active:scale-95 transition-transform text-left flex flex-col h-full overflow-hidden"
          >
            <img 
              src={prod.image} 
              alt={prod.name} 
              className="w-full aspect-square object-cover rounded-xl mb-2 bg-slate-50" 
              onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150?text=Produto')}
            />
            <div className="px-1 flex-1 flex flex-col justify-between">
              <h4 className="font-bold text-sm text-slate-800 line-clamp-2 leading-tight">{prod.name}</h4>
              <p className="text-indigo-600 font-black mt-1">R$ {Number(prod.price).toFixed(2)}</p>
            </div>
          </button>
        ))}
      </div>

      {cart.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] z-40">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-4">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Subtotal ({cart.reduce((a, b) => a + b.quantity, 0)} itens)</span>
                <span className="text-2xl font-black text-indigo-600">R$ {cartTotal.toFixed(2)}</span>
              </div>
              <button 
                onClick={() => setIsCheckoutOpen(true)}
                className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 active:scale-95 shadow-lg shadow-indigo-100"
              >
                Pagar <i className="fa-solid fa-arrow-right"></i>
              </button>
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {cart.map(item => {
                const p = products.find(prod => prod.id === item.productId);
                return (
                  <div key={item.productId} className="flex-shrink-0 bg-slate-50 px-3 py-2 rounded-xl flex items-center gap-3 border border-slate-200">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => removeFromCart(item.productId)} className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-rose-500 active:bg-rose-50">
                        <i className="fa-solid fa-minus text-[8px]"></i>
                      </button>
                      <span className="font-black text-indigo-600 text-sm w-4 text-center">{item.quantity}</span>
                      <button onClick={() => p && addToCart(p)} className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-emerald-500 active:bg-emerald-50">
                        <i className="fa-solid fa-plus text-[8px]"></i>
                      </button>
                    </div>
                    <span className="text-sm font-semibold text-slate-700 whitespace-nowrap">{p?.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {isCheckoutOpen && (
        <div className="fixed inset-0 z-[110] bg-black/60 flex items-end backdrop-blur-sm">
          <div className="w-full bg-white rounded-t-[32px] p-6 animate-in slide-in-from-bottom duration-300 shadow-2xl">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>
            <h3 className="text-xl font-bold text-center mb-2">Finalizar Venda</h3>
            <p className="text-center text-slate-500 mb-6 text-sm">Total: <span className="font-bold text-indigo-600">R$ {cartTotal.toFixed(2)}</span></p>
            <div className="grid grid-cols-1 gap-3 mb-6">
              <PaymentOption icon="fa-qrcode" label="Pix" onClick={() => finishSale('Pix')} color="bg-emerald-50 text-emerald-600" />
              <PaymentOption icon="fa-credit-card" label="Cartão de Débito/Crédito" onClick={() => finishSale('Cartão')} color="bg-indigo-50 text-indigo-600" />
              <PaymentOption icon="fa-money-bill-wave" label="Dinheiro" onClick={() => finishSale('Dinheiro')} color="bg-amber-50 text-amber-600" />
            </div>
            <button onClick={() => setIsCheckoutOpen(false)} className="w-full text-slate-400 font-bold py-2 active:text-slate-600">Voltar ao carrinho</button>
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentOption({ icon, label, onClick, color }: { icon: string, label: string, onClick: () => void, color: string }) {
  return (
    <button onClick={onClick} className="flex items-center gap-4 p-4 border border-slate-100 rounded-2xl active:bg-slate-50 text-left transition-all shadow-sm">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${color}`}>
        <i className={`fa-solid ${icon}`}></i>
      </div>
      <span className="font-bold text-slate-700">{label}</span>
      <i className="fa-solid fa-chevron-right ml-auto text-slate-300"></i>
    </button>
  );
}