
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
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (product: Product) => {
    setCart(prev => {
      const idx = prev.findIndex(item => item.productId === product.id);
      if (idx > -1) {
        const newCart = [...prev];
        newCart[idx].quantity += 1;
        return newCart;
      }
      return [...prev, { productId: product.id, quantity: 1, priceAtTime: product.price }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const cartTotal = cart.reduce((acc, curr) => acc + (curr.priceAtTime * curr.quantity), 0);

  const finishSale = (method: PaymentMethod) => {
    const newSale: Sale = {
      id: Date.now().toString(),
      items: [...cart],
      total: cartTotal,
      paymentMethod: method,
      timestamp: Date.now(),
    };
    addSale(newSale);
    setCart([]);
    setIsCheckoutOpen(false);
    alert("Venda realizada com sucesso!");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)]">
      <div className="mb-4">
        <div className="relative">
          <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input
            type="text"
            placeholder="Buscar produto ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-3 pb-4">
        {filteredProducts.map(prod => (
          <button
            key={prod.id}
            onClick={() => addToCart(prod)}
            className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm active:scale-95 transition-transform text-left"
          >
            <img src={prod.image} alt={prod.name} className="w-full aspect-square object-cover rounded-xl mb-2" />
            <h4 className="font-bold text-sm truncate">{prod.name}</h4>
            <p className="text-indigo-600 font-black">R$ {prod.price.toFixed(2)}</p>
          </button>
        ))}
      </div>

      <div className={`fixed bottom-16 left-0 right-0 p-4 bg-white border-t border-slate-200 shadow-[0_-4px_15px_rgba(0,0,0,0.05)] transition-all duration-300 ${cart.length > 0 ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 font-bold uppercase tracking-widest">Itens no Carrinho ({cart.length})</span>
              <span className="text-2xl font-black text-indigo-600">R$ {cartTotal.toFixed(2)}</span>
            </div>
            <button 
              onClick={() => setIsCheckoutOpen(true)}
              className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 active:scale-95"
            >
              Finalizar <i className="fa-solid fa-arrow-right"></i>
            </button>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2">
            {cart.map(item => {
              const p = products.find(prod => prod.id === item.productId);
              return (
                <div key={item.productId} className="flex-shrink-0 bg-slate-50 px-3 py-2 rounded-xl flex items-center gap-3 border border-slate-200">
                  <span className="font-black text-indigo-600">{item.quantity}x</span>
                  <span className="text-sm font-medium">{p?.name}</span>
                  <button onClick={() => removeFromCart(item.productId)} className="text-rose-500 ml-1">
                    <i className="fa-solid fa-circle-xmark"></i>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {isCheckoutOpen && (
        <div className="fixed inset-0 z-[110] bg-black/60 flex items-end">
          <div className="w-full bg-white rounded-t-[32px] p-6 animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6"></div>
            <h3 className="text-xl font-bold text-center mb-2">Finalizar Venda</h3>
            <p className="text-center text-slate-500 mb-6 text-sm">Valor total a receber: <span className="font-bold text-indigo-600">R$ {cartTotal.toFixed(2)}</span></p>
            <div className="grid grid-cols-1 gap-3 mb-6">
              <PaymentOption icon="fa-qrcode" label="Pix" onClick={() => finishSale('Pix')} />
              <PaymentOption icon="fa-credit-card" label="Cartão" onClick={() => finishSale('Cartão')} />
              <PaymentOption icon="fa-money-bill-wave" label="Dinheiro" onClick={() => finishSale('Dinheiro')} />
            </div>
            <button 
              onClick={() => setIsCheckoutOpen(false)}
              className="w-full text-slate-500 font-bold py-2"
            >
              Voltar ao carrinho
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PaymentOption({ icon, label, onClick }: { icon: string, label: string, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-4 p-4 border border-slate-200 rounded-2xl active:bg-indigo-50 active:border-indigo-200 text-left transition-colors"
    >
      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-indigo-600">
        <i className={`fa-solid ${icon}`}></i>
      </div>
      <span className="font-bold text-slate-700">{label}</span>
      <i className="fa-solid fa-chevron-right ml-auto text-slate-300"></i>
    </button>
  );
}
