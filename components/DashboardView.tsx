
import React, { useMemo } from 'react';
import { useApp } from '../App';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function DashboardView() {
  const { sales, products } = useApp();

  const metrics = useMemo(() => {
    const totalSales = sales.reduce((acc, sale) => acc + sale.total, 0);
    const count = sales.length;
    const ticketMedio = count > 0 ? totalSales / count : 0;

    const byMethod = sales.reduce((acc, sale) => {
      acc[sale.paymentMethod] = (acc[sale.paymentMethod] || 0) + sale.total;
      return acc;
    }, {} as Record<string, number>);

    // Ranking de Produtos
    const productCounts: Record<string, number> = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        productCounts[item.productId] = (productCounts[item.productId] || 0) + item.quantity;
      });
    });

    const ranking = Object.entries(productCounts)
      .map(([id, qty]) => ({
        name: products.find(p => p.id === id)?.name || 'Removido',
        vendas: qty
      }))
      .sort((a, b) => b.vendas - a.vendas)
      .slice(0, 5);

    return { totalSales, count, ticketMedio, byMethod, ranking };
  }, [sales, products]);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Visão Financeira</h2>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Faturamento Total" value={`R$ ${metrics.totalSales.toFixed(2)}`} icon="fa-wallet" color="text-indigo-600" />
        <MetricCard label="Ticket Médio" value={`R$ ${metrics.ticketMedio.toFixed(2)}`} icon="fa-hand-holding-dollar" color="text-emerald-600" />
        <MetricCard label="Vendas Realizadas" value={metrics.count.toString()} icon="fa-bag-shopping" color="text-amber-600" />
        <MetricCard label="Produtos Vendidos" value={metrics.ranking.reduce((a, b) => a + b.vendas, 0).toString()} icon="fa-boxes-stacked" color="text-rose-600" />
      </div>

      {/* Payment Methods Breakdown */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Entradas por Meio</h3>
        <div className="space-y-4">
          <PaymentBar label="Pix" value={metrics.byMethod['Pix'] || 0} total={metrics.totalSales} color="bg-emerald-500" />
          <PaymentBar label="Cartão" value={metrics.byMethod['Cartão'] || 0} total={metrics.totalSales} color="bg-indigo-500" />
          <PaymentBar label="Dinheiro" value={metrics.byMethod['Dinheiro'] || 0} total={metrics.totalSales} color="bg-amber-500" />
        </div>
      </div>

      {/* Top Products Chart */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Top 5 Mais Vendidos</h3>
        {metrics.ranking.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.ranking} layout="vertical" margin={{ left: -20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={100} 
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#64748b' }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="vendas" radius={[0, 4, 4, 0]} barSize={20}>
                  {metrics.ranking.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 italic text-sm">Nenhuma venda registrada hoje</div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, color }: { label: string, value: string, icon: string, color: string }) {
  return (
    <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between h-32">
      <div className={`w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center ${color}`}>
        <i className={`fa-solid ${icon} text-sm`}></i>
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-lg font-black text-slate-800 leading-none mt-1">{value}</p>
      </div>
    </div>
  );
}

function PaymentBar({ label, value, total, color }: { label: string, value: number, total: number, color: string }) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs font-bold">
        <span>{label}</span>
        <span>R$ {value.toFixed(2)} ({percentage.toFixed(0)}%)</span>
      </div>
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} transition-all duration-500`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
