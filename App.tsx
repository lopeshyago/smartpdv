
import React, { useState, useEffect, createContext, useContext } from 'react';
import { Product, Table, Sale, AppTab, User } from './types';
import MesasView from './components/MesasView';
import VendaDiretaView from './components/VendaDiretaView';
import ProdutosView from './components/ProdutosView';
import EquipeView from './components/EquipeView';
import DashboardView from './components/DashboardView';

interface AppContextType {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  tables: Table[];
  setTables: React.Dispatch<React.SetStateAction<Table[]>>;
  sales: Sale[];
  users: User[];
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  refreshTables: () => Promise<void>;
  addSale: (sale: Sale) => Promise<void>;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('mesas');
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [p, s, t, u] = await Promise.all([
        fetch('/api/products').then(r => r.json()),
        fetch('/api/sales').then(r => r.json()),
        fetch('/api/tables').then(r => r.json()),
        fetch('/api/users').then(r => r.json())
      ]);
      setProducts(p);
      setSales(s);
      setTables(t);
      setUsers(u);
    } catch (e) { console.error(e); }
    finally { setIsLoading(false); }
  };

  useEffect(() => {
    fetchData();
    // Polling opcional para mesas a cada 10s para manter garçons sincronizados
    const interval = setInterval(() => {
      fetch('/api/tables').then(r => r.json()).then(setTables);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const refreshTables = async () => {
    const t = await fetch('/api/tables').then(r => r.json());
    setTables(t);
  };

  const addSale = async (sale: Sale) => {
    const saleWithUser = { ...sale, userId: currentUser?.id };
    await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saleWithUser)
    });
    setSales(prev => [saleWithUser, ...prev]);
  };

  return (
    <AppContext.Provider value={{ 
      products, setProducts, tables, setTables, sales, users, 
      currentUser, setCurrentUser, refreshTables, addSale, activeTab, setActiveTab, isLoading 
    }}>
      <div className="flex flex-col min-h-screen pb-20 bg-slate-50">
        <header className="sticky top-0 z-50 bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
          <h1 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
            <i className="fa-solid fa-cash-register"></i> Smart PDV
          </h1>
          <div className="flex items-center gap-2">
            {currentUser ? (
              <button onClick={() => setCurrentUser(null)} className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full font-bold flex items-center gap-1">
                <i className="fa-solid fa-user text-[8px]"></i> {currentUser.name}
              </button>
            ) : (
              <span className="text-[10px] text-rose-500 font-bold">Sem Usuário</span>
            )}
          </div>
        </header>

        <main className="flex-1 w-full max-w-4xl mx-auto p-4">
          {!currentUser && activeTab !== 'equipe' ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <i className="fa-solid fa-user-lock text-4xl text-slate-300 mb-4"></i>
              <h2 className="text-lg font-bold">Identifique-se para começar</h2>
              <p className="text-sm text-slate-500 mb-6">Selecione seu nome na aba "Equipe"</p>
              <button onClick={() => setActiveTab('equipe')} className="bg-indigo-600 text-white px-6 py-2 rounded-full font-bold">Ir para Equipe</button>
            </div>
          ) : (
            <>
              {activeTab === 'mesas' && <MesasView />}
              {activeTab === 'venda-direta' && <VendaDiretaView />}
              {activeTab === 'produtos' && <ProdutosView />}
              {activeTab === 'equipe' && <EquipeView />}
              {activeTab === 'dashboard' && <DashboardView />}
            </>
          )}
        </main>

        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t py-1 px-1 flex justify-around items-center z-50 h-16 shadow-lg">
          <NavItem icon="fa-table" label="Mesas" active={activeTab === 'mesas'} onClick={() => setActiveTab('mesas')} />
          <NavItem icon="fa-bolt" label="Venda" active={activeTab === 'venda-direta'} onClick={() => setActiveTab('venda-direta')} />
          <NavItem icon="fa-box" label="Itens" active={activeTab === 'produtos'} onClick={() => setActiveTab('produtos')} />
          <NavItem icon="fa-users" label="Equipe" active={activeTab === 'equipe'} onClick={() => setActiveTab('equipe')} />
          <NavItem icon="fa-chart-pie" label="Gestão" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        </nav>
      </div>
    </AppContext.Provider>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: string, label: string, active: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center w-full h-full ${active ? 'text-indigo-600' : 'text-slate-400'}`}>
      <i className={`fa-solid ${icon} text-lg mb-0.5`}></i>
      <span className="text-[9px] font-bold uppercase">{label}</span>
    </button>
  );
}
