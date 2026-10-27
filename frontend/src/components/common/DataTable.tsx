import React, { useState, useMemo } from 'react';
import { Download, Search, ChevronUp, ChevronDown } from 'lucide-react';
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
    <div>
      {/* Table Controls Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', position: 'relative', minWidth: '280px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', color: '#64748b' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '30px', fontSize: '12px' }}
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            aria-label="Filter records"
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Showing {Math.min(sortedData.length, (currentPage - 1) * pageSize + 1)} - {Math.min(sortedData.length, currentPage * pageSize)} of {sortedData.length} records
          </span>
          <button onClick={handleExport} className="btn btn-secondary btn-sm" title="Download spreadsheet">
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="data-table-container">
        <table className="gov-table">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  onClick={() => col.sortable && handleSort(col.accessorKey as string)}
                  style={{ cursor: col.sortable ? 'pointer' : 'default', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>{col.header}</span>
                    {col.sortable && sortKey === col.accessorKey && (
                      sortDirection === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '24px', color: '#64748b' }}>
                  No matching records found in this view.
                </td>
              </tr>
            ) : (
              paginatedData.map((item, rowIdx) => (
                <tr
                  key={rowIdx}
                  onClick={() => onRowClick && onRowClick(item)}
                  style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {columns.map((col, colIdx) => (
                    <td key={colIdx}>
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
          <button
            className="btn btn-secondary btn-sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          >
            Previous
          </button>
          <span style={{ fontSize: '12px', margin: '0 6px', color: '#475569' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
