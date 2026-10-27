import React, { useState, useMemo } from 'react';
import { Download, Search, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { exportToCSV } from '../../utils/export';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T | string;
  cell?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  exportFilename?: string;
  pageSize?: number;
  onRowClick?: (item: T) => void;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  searchPlaceholder = 'Filter records...',
  exportFilename = 'records_export',
  pageSize = 15,
  onRowClick
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(item =>
      Object.values(item).some(val =>
        val !== null && val !== undefined && String(val).toLowerCase().includes(term)
      )
    );
  }, [data, searchTerm]);

  // Sort
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const valA = a[sortKey];
      const valB = b[sortKey];
      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;
      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      return sortDirection === 'asc' ? 1 : -1;
    });
  }, [filteredData, sortKey, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key?: string) => {
    if (!key) return;
    if (sortKey === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const handleExport = () => {
    exportToCSV(exportFilename, sortedData);
  };

  return (
    <div className="space-y-3">
      {/* Table Controls Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative min-w-[280px] max-w-sm flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111215] text-zinc-900 dark:text-zinc-100 pl-10 pr-3.5 py-2 text-xs placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-sky-500 transition-colors"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            aria-label="Filter records"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-400 dark:text-zinc-500 tabular-nums font-mono">
            {sortedData.length > 0
              ? `${Math.min(sortedData.length, (currentPage - 1) * pageSize + 1)}-${Math.min(sortedData.length, currentPage * pageSize)} of ${sortedData.length}`
              : '0 records'}
          </span>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#16181d] text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#1f2128] text-xs font-semibold transition-colors"
            title="Download spreadsheet"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* FinTech Data Table Shell */}
      <div className="w-full overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-[#16181d] shadow-xs transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            {/* Table Header */}
            <thead className="border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50 dark:bg-[#121316] text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-semibold">
              <tr>
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    onClick={() => col.sortable && handleSort(col.accessorKey as string)}
                    className={`px-4 py-3.5 font-semibold text-[11px] ${col.sortable ? 'cursor-pointer select-none hover:text-zinc-900 dark:hover:text-white' : ''}`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      {col.sortable && sortKey === col.accessorKey && (
                        sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-sky-500" /> : <ChevronDown className="w-3.5 h-3.5 text-sky-500" />
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60 text-zinc-800 dark:text-zinc-200 font-normal">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="text-center py-10 text-zinc-400 dark:text-zinc-500 text-xs">
                    No matching records found in this view.
                  </td>
                </tr>
              ) : (
                paginatedData.map((item, rowIdx) => (
                  <tr
                    key={rowIdx}
                    onClick={() => onRowClick && onRowClick(item)}
                    className={`hover:bg-zinc-50 dark:hover:bg-[#1f2128] transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                  >
                    {columns.map((col, colIdx) => (
                      <td key={colIdx} className="px-4 py-3.5 whitespace-nowrap text-zinc-700 dark:text-zinc-300">
                        {col.cell
                          ? col.cell(item)
                          : col.accessorKey
                          ? String(item[col.accessorKey] ?? '—')
                          : '—'}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-end items-center gap-2 pt-1">
          <button
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#16181d] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#1f2128] text-xs font-semibold disabled:opacity-40 disabled:pointer-events-none transition-colors"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono px-2">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#16181d] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#1f2128] text-xs font-semibold disabled:opacity-40 disabled:pointer-events-none transition-colors"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
