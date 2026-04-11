import React from 'react';
import { AnalyticsData } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, Clock, Target, Lightbulb } from 'lucide-react';
import { cn } from '../lib/utils';

interface AnalyticsProps {
  data: AnalyticsData;
}

export const Analytics: React.FC<AnalyticsProps> = ({ data }) => {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 mb-2">
            <Target className="w-5 h-5 text-blue-500" />
            <h3 className="font-medium">Konwersja (Leady -&gt; Wygrane)</h3>
          </div>
          <div className="text-3xl font-bold text-slate-800">{data.conversionRate}%</div>
          <div className="text-sm text-emerald-600 flex items-center mt-2">
            <TrendingUp className="w-4 h-4 mr-1" /> +2.1% vs zeszły miesiąc
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 mb-2">
            <Clock className="w-5 h-5 text-indigo-500" />
            <h3 className="font-medium">Średni czas decyzji</h3>
          </div>
          <div className="text-3xl font-bold text-slate-800">{data.avgDecisionTimeDays} dni</div>
          <div className="text-sm text-emerald-600 flex items-center mt-2">
            <TrendingDown className="w-4 h-4 mr-1" /> -0.5 dnia (szybciej)
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm bg-gradient-to-br from-indigo-50 to-white">
          <div className="flex items-center gap-3 text-indigo-700 mb-2">
            <Lightbulb className="w-5 h-5" />
            <h3 className="font-medium">Wskazówka AI</h3>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">
            Wykryto <strong>15% spadek</strong> otwarć ofert w weekendy. Rozważ automatyzację wysyłki na poniedziałek rano (godz. 8:00-10:00).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* YoY Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
          <h3 className="font-semibold text-slate-800 mb-6 text-lg">Przychody: Rok do Roku (YoY)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.yoyRevenue} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `${val / 1000}k`} />
                <RechartsTooltip 
                  formatter={(value: number) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 }).format(value)}
                  cursor={{fill: '#f1f5f9'}}
                />
                <Legend iconType="circle" />
                <Bar dataKey="previousYear" name="Poprzedni Rok" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="currentYear" name="Obecny Rok" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trending Destinations */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-4 text-lg">Trendy Kierunków</h3>
          <div className="space-y-4">
            {data.trendingDestinations.map((dest, idx) => (
              <div key={idx} className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-slate-800">{dest.name}</span>
                  <span className={cn(
                    "text-sm font-semibold flex items-center px-2 py-1 rounded-full",
                    dest.growth > 0 ? "text-emerald-700 bg-emerald-100" : "text-rose-700 bg-rose-100"
                  )}>
                    {dest.growth > 0 ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
                    {Math.abs(dest.growth)}%
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {dest.recommendation}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
