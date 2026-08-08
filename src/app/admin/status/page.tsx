'use client';

import React from 'react';
import { Activity, Server, AlertTriangle, ShieldAlert, CheckCircle2, Clock, Terminal, ActivityIcon } from 'lucide-react';
import { motion } from 'framer-motion';

// --- MOCK DATA ---
const MOCK_KPIS = [
  { label: 'Estado de API', value: '100% Uptime', icon: Server, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  { label: 'Errores (24h)', value: '23', icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  { label: 'Bloqueos (Rate Limit)', value: '142', icon: ShieldAlert, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { label: 'Latencia Promedio', value: '45ms', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-500/10' },
];

const MOCK_LOGS = [
  { id: '1', level: 'error', message: 'Failed to authenticate user: Invalid token', endpoint: '/api/auth/login', time: 'hace 2 min', user: 'usr_892b' },
  { id: '2', level: 'warning', message: 'Rate limit exceeded for IP', endpoint: '/api/bricks/search', time: 'hace 15 min', user: 'anonymous' },
  { id: '3', level: 'info', message: 'Database backup completed successfully', endpoint: 'cron', time: 'hace 1 hora', user: 'system' },
  { id: '4', level: 'error', message: 'Uncaught TypeError: undefined is not a function', endpoint: '/api/bounties/create', time: 'hace 3 horas', user: 'usr_109a' },
  { id: '5', level: 'info', message: 'New user registration', endpoint: '/api/auth/signup', time: 'hace 4 horas', user: 'usr_991c' },
];

export default function AdminStatusPrototype() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans selection:bg-purple-500/30">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent flex items-center gap-3">
            <ActivityIcon className="w-8 h-8 text-purple-500" />
            Centro de Control de Sistema
          </h1>
          <p className="text-slate-400 mt-1 text-sm">Vista In-House de observabilidad, errores y rendimiento (Prototipo)</p>
        </div>
        
        <div className="flex items-center gap-3 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-sm font-medium text-emerald-400">Todos los sistemas operativos</span>
        </div>
      </header>

      {/* KPIS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {MOCK_KPIS.map((kpi, idx) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            key={kpi.label} 
            className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-6 rounded-2xl hover:border-slate-700 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">{kpi.label}</p>
                <p className="text-3xl font-semibold text-white">{kpi.value}</p>
              </div>
              <div className={`p-3 rounded-xl ${kpi.bg}`}>
                <kpi.icon className={`w-6 h-6 ${kpi.color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LOGS TABLE (MAIN AREA) */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden"
        >
          <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/80">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Terminal className="w-5 h-5 text-slate-400" />
              Últimos Logs del Sistema
            </h2>
            <button className="text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg transition-colors">
              Ver todos
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/50 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-medium">Nivel</th>
                  <th className="px-6 py-4 font-medium">Mensaje</th>
                  <th className="px-6 py-4 font-medium">Origen / Contexto</th>
                  <th className="px-6 py-4 font-medium">Hace</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {MOCK_LOGS.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      {log.level === 'error' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20"><AlertTriangle className="w-3.5 h-3.5" /> Error</span>}
                      {log.level === 'warning' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20"><AlertTriangle className="w-3.5 h-3.5" /> Alerta</span>}
                      {log.level === 'info' && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20"><CheckCircle2 className="w-3.5 h-3.5" /> Info</span>}
                    </td>
                    <td className={`px-6 py-4 font-medium ${log.level === 'error' ? 'text-rose-200' : 'text-slate-300'}`}>
                      {log.message}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-xs">
                        <span className="text-slate-300 font-mono bg-slate-800/50 px-2 py-0.5 rounded w-fit">{log.endpoint}</span>
                        <span className="text-slate-500">ID: {log.user}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {log.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* SIDEBAR WIDGETS */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col gap-6"
        >
          {/* Health Check Widget */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">Health Checks Internos</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 flex items-center gap-2"><Server className="w-4 h-4 text-slate-500" /> Base de Datos (Supabase)</span>
                <span className="text-emerald-400 text-sm font-medium">En línea</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div className="bg-emerald-500 h-1.5 rounded-full w-full"></div>
              </div>
              
              <div className="flex items-center justify-between pt-2">
                <span className="text-slate-300 flex items-center gap-2"><Activity className="w-4 h-4 text-slate-500" /> Cola de Logs Asíncrona</span>
                <span className="text-emerald-400 text-sm font-medium">En línea</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div className="bg-emerald-500 h-1.5 rounded-full w-full"></div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">Acciones Rápidas</h3>
            <div className="flex flex-col gap-3">
              <button className="w-full text-left px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-medium transition-colors border border-slate-700 hover:border-slate-600 flex justify-between items-center">
                Purgar Logs antiguos (30+ días)
                <Terminal className="w-4 h-4 text-slate-400" />
              </button>
              <button className="w-full text-left px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-medium transition-colors border border-slate-700 hover:border-slate-600 flex justify-between items-center">
                Descargar Reporte JSON
                <Terminal className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
