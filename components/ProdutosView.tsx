
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
    image: 'https://picsum.photos/200/200?random=' + Math.floor(Math.random() * 1000)
  });

  const handleSave = async () => {
    if (!formData.name || !formData.price) return;

    const updatedProduct = isEditing === 'new' 
      ? { ...formData, id: Date.now().toString() } as Product
      : { ...formData } as Product;

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
      alert("Erro ao salvar produto no banco de dados.");
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
    setFormData({ name: '', price: 0, category: '', image: 'https://picsum.photos/200/200?random=' + Math.floor(Math.random() * 1000) });
    setIsEditing('new');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Catálogo de Produtos</h2>
        <button onClick={startNew} className="bg-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center active:scale-90">
          <i className="fa-solid fa-plus"></i>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {products.map(prod => (
          <div key={prod.id} className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center gap-4 shadow-sm">
            <img src={prod.image} className="w-16 h-16 rounded-xl object-cover" />
            <div className="flex-1 min-w-0">
              <h4 className="font-bold truncate">{prod.name}</h4>
              <p className="text-indigo-600 font-black">R$ {Number(prod.price).toFixed(2)}</p>
            </div>
            <button onClick={() => startEdit(prod)} className="p-3 text-slate-400"><i className="fa-solid fa-pen-to-square"></i></button>
          </div>
        ))}
      </div>

      {isEditing && (
        <div className="fixed inset-0 z-[120] bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl">
            <header className="p-4 border-b flex justify-between items-center bg-slate-50">
              <h3 className="font-bold">{isEditing === 'new' ? 'Novo Produto' : 'Editar Produto'}</h3>
              <button onClick={() => setIsEditing(null)}><i className="fa-solid fa-xmark text-slate-400"></i></button>
            </header>
            <div className="p-6 space-y-4">
              <input type="text" placeholder="Nome" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border rounded-xl" />
              <input type="number" placeholder="Preço" value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || 0})} className="w-full px-4 py-3 bg-slate-50 border rounded-xl" />
              <input type="text" placeholder="Categoria" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border rounded-xl" />
            </div>
            <footer className="p-4 bg-slate-50 flex gap-2">
              {isEditing !== 'new' && <button onClick={() => handleDelete(isEditing)} className="flex-1 bg-rose-50 text-rose-600 font-bold py-3 rounded-xl">Excluir</button>}
              <button onClick={handleSave} className="flex-[2] bg-indigo-600 text-white font-bold py-3 rounded-xl">Salvar</button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
