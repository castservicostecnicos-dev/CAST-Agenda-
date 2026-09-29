import React, { useState } from 'react';
import { Wrench, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { useData } from '../context/DataContext';

export const ServiceTypesView: React.FC = () => {
  const { services } = useData();
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = services.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.description && s.description.toLowerCase().includes(search.toLowerCase())) ||
    s.tools.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar tipos de serviço ou ferramentas..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
        />
      </div>

      {/* Services List */}
      <div className="space-y-2.5">
        {filtered.map(service => {
          const isExpanded = expandedId === service.id;
          return (
            <div
              key={service.id}
              className="p-3.5 sm:p-4 rounded-2xl bg-slate-900 border border-slate-800/80 transition-all shadow-sm"
            >
              <div
                onClick={() => setExpandedId(isExpanded ? null : service.id)}
                className="flex items-center justify-between cursor-pointer"
              >
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-white">
                    {service.name}
                  </h3>
                  {service.description && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {service.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded-md border border-cyan-800/40 shrink-0">
                    {service.tools.length} ferramentas
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {/* Expanded Tools Checklist */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Ferramentas Necessárias:</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {service.tools.map((tool, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-slate-950 text-slate-300 text-xs border border-slate-800"
                      >
                        {tool}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
