
import React, { useState } from 'react';
import { useApp } from '../App';
import { User } from '../types';

export default function EquipeView() {
  const { users, currentUser, setCurrentUser } = useApp();
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState('');

  const handleAddUser = async () => {
    if (!newName) return;
    const newUser: User = { id: Date.now().toString(), name: newName, role: 'Atendente' };
    await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser)
    });
    window.location.reload(); // Simplificação para atualizar lista global
  };

  const handleDelete = async (id: string) => {
    if (confirm("Remover este usuário?")) {
      await fetch(`/api/users/${id}`, { method: 'DELETE' });
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Equipe / Atendentes</h2>
        <button onClick={() => setIsAdding(true)} className="bg-indigo-600 text-white w-8 h-8 rounded-full"><i className="fa-solid fa-plus"></i></button>
      </div>

      <div className="grid gap-3">
        {users.map(u => (
          <div key={u.id} className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${currentUser?.id === u.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg scale-[1.02]' : 'bg-white border-slate-200'}`}>
            <button onClick={() => setCurrentUser(u)} className="flex-1 text-left flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${currentUser?.id === u.id ? 'bg-white/20' : 'bg-slate-100 text-indigo-600'}`}>
                {u.name[0]}
              </div>
              <div>
                <p className="font-bold">{u.name}</p>
                <p className={`text-[10px] ${currentUser?.id === u.id ? 'text-white/70' : 'text-slate-400'}`}>{u.role}</p>
              </div>
            </button>
            <button onClick={() => handleDelete(u.id)} className={`p-2 ${currentUser?.id === u.id ? 'text-white/50' : 'text-rose-200'}`}><i className="fa-solid fa-trash-can"></i></button>
          </div>
        ))}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[120] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-3xl w-full max-w-xs space-y-4">
            <h3 className="font-bold">Novo Atendente</h3>
            <input autoFocus type="text" placeholder="Nome Completo" value={newName} onChange={e => setNewName(e.target.value)} className="w-full p-3 bg-slate-50 border rounded-xl" />
            <div className="flex gap-2">
              <button onClick={() => setIsAdding(false)} className="flex-1 py-3 text-slate-400 font-bold">Cancelar</button>
              <button onClick={handleAddUser} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
