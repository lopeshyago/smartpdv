import React, { useState } from 'react';
import { useApp } from '../App';
import { Product } from '../types';

export default function ProdutosView() {
  const { products, setProducts } = useApp();
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    price: 0,
    category: '',
    image: ''
  });

  const handleSave = async () => {
    if (!formData.name || formData.price === undefined) return;

    const finalImage = formData.image || `https://picsum.photos/200/200?random=${Date.now()}`;
    
    const updatedProduct = isEditing === 'new' 
      ? { ...formData, id: Date.now().toString(), image: finalImage } as Product
      : { ...formData, image: finalImage } as Product;

    try {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProduct)
      });

      if (isEditing === 'new') {
        setProducts(prev => [...prev, updatedProduct]);
      } else {
        setProducts(prev => prev.map(p => p.id === isEditing ? updatedProduct : p));
      }
      setIsEditing(null);
    } catch (err) {
      alert("Erro ao salvar produto.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Deseja excluir este produto permanentemente?")) {
      try {
        await fetch(`/api/products/${id}`, { method: 'DELETE' });
        setProducts(prev => prev.filter(p => p.id !== id));
        setIsEditing(null);
      } catch (err) {
        alert("Erro ao excluir.");
      }
    }
  };

  const startEdit = (p: Product) => { setFormData(p); setIsEditing(p.id); };
  const startNew = () => {
    setFormData({ name: '', price: 0, category: '', image: '' });
    setIsEditing('new');
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Catálogo de Produtos</h2>
        <button onClick={startNew} className="bg-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center active:scale-90 shadow-lg shadow-indigo-200">
          <i className="fa-solid fa-plus"></i>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {products.map(prod => (
          <div key={prod.id} className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center gap-4 shadow-sm">
            <img src={prod.image} className="w-16 h-16 rounded-xl object-cover bg-slate-100" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150?text=Produto')} />
            <div className="flex-1 min-w-0">
              <h4 className="font-bold truncate text-slate-800">{prod.name}</h4>
              <p className="text-indigo-600 font-black">R$ {Number(prod.price).toFixed(2)}</p>
              <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold uppercase">{prod.category || 'Geral'}</span>
            </div>
            <button onClick={() => startEdit(prod)} className="p-3 text-slate-400 active:text-indigo-600"><i className="fa-solid fa-pen-to-square"></i></button>
          </div>
        ))}
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-[120] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <header className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-700">{isEditing === 'new' ? 'Novo Produto' : 'Editar Produto'}</h3>
              <button onClick={() => setIsEditing(null)} className="p-2"><i className="fa-solid fa-xmark text-slate-400"></i></button>
            </header>
            <div className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nome do Produto</label>
                <input type="text" placeholder="Ex: Coca-Cola 350ml" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Preço (R$)</label>
                  <input type="number" step="0.01" placeholder="0,00" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || 0})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Categoria</label>
                  <input type="text" placeholder="Bebidas" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">URL da Imagem</label>
                <input type="text" placeholder="https://exemplo.com/foto.jpg" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            </div>
            <footer className="p-4 bg-slate-50 flex gap-2">
              {isEditing !== 'new' && <button onClick={() => handleDelete(isEditing)} className="flex-1 bg-white text-rose-500 border border-rose-100 font-bold py-3 rounded-xl active:bg-rose-50">Excluir</button>}
              <button onClick={handleSave} className="flex-[2] bg-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-100 active:scale-95 transition-transform">Salvar Produto</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}