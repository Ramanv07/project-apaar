import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ShieldCheck, FileText, Lock, Filter, Ban, CheckCircle } from 'lucide-react';

interface AuditLog {
  id: number;
  timestamp: string;
  username: string;
  role: string;
  action: string;
  entity_type: string;
  entity_id: string;
  ip_address: string;
  details: any;
}

interface ConsentRecord {
  id: string;
  apaar_id_masked: string;
  record_ref: string;
  purpose: string;
  status: string;
  granted_at: string;
  revoked_at?: string | null;
}

export const AuditLedger: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'audit' | 'consent'>('audit');

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [consentRecords, setConsentRecords] = useState<ConsentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs();
    } else {
      fetchConsentRecords();
    }
  }, [activeTab, actionFilter, roleFilter]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: '150' };
      if (actionFilter) params.action = actionFilter;
      if (roleFilter) params.role = roleFilter;

      const res = await api.get('/audit/logs', { params });
      setAuditLogs(res.data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchConsentRecords = async () => {
    setLoading(true);
    try {
      const res = await api.get('/audit/consent-ledger', { params: { limit: '150' } });
      setConsentRecords(res.data);
    } catch (err) {
      console.error('Failed to load consent ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeConsent = async (consentId: string) => {
    if (!window.confirm('Revoke active verification consent for this citizen record? Future public queries will be blocked.')) {
      return;
    }
    try {
      await api.post(`/audit/revoke-consent/${consentId}`);
      await fetchConsentRecords();
    } catch (err) {
      console.error('Failed to revoke consent:', err);
    }
  };

  const auditColumns: Column<AuditLog>[] = [
    {
      header: 'Audit ID & Time',
      sortable: true,
      cell: (r) => (
        <div>
          <span className="font-mono text-xs text-zinc-900 dark:text-zinc-100 block">
            {new Date(r.timestamp).toLocaleString()}
          </span>
          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
            LOG-#{r.id}
          </span>
        </div>
      )
    },
    {
      header: 'Actor & Identity',
      sortable: true,
      cell: (r) => (
        <div>
          <div className="font-semibold text-zinc-950 dark:text-white">{r.username}</div>
          <div className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono">{r.role.replace(/_/g, ' ')}</div>
        </div>
      )
    },
    {
      header: 'Statutory Action',
      accessorKey: 'action',
      sortable: true,
      cell: (r) => (
        <span className="font-mono text-xs font-semibold text-sky-600 dark:text-sky-400">
          {r.action}
        </span>
      )
    },
    {
      header: 'Entity Impacted',
      sortable: true,
      cell: (r) => (
        <div>
          <span className="status-badge slate text-[10px] mr-1">{r.entity_type}</span>
          <span className="font-mono text-xs text-zinc-800 dark:text-zinc-200">{r.entity_id}</span>
        </div>
      )
    },
    {
      header: 'IP Address',
      accessorKey: 'ip_address',
      sortable: true,
      cell: (r) => (
        <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
          {r.ip_address}
        </span>
      )
    },
    {
      header: 'Audit Event Parameters',
      cell: (r) => (
        <div className="max-w-md truncate font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
          {JSON.stringify(r.details)}
        </div>
      )
    }
  ];

  const consentColumns: Column<ConsentRecord>[] = [
    {
      header: 'Consent ID',
      accessorKey: 'id',
      sortable: true,
      cell: (r) => (
        <span className="font-mono text-xs text-sky-600 dark:text-sky-400 font-semibold">
          {r.id.substring(0, 16)}...
        </span>
      )
    },
    {
      header: 'APAAR Citizen ID',
      accessorKey: 'apaar_id_masked',
      sortable: true,
      cell: (r) => (
        <span className="font-mono text-xs text-zinc-800 dark:text-zinc-200">
          {r.apaar_id_masked}
        </span>
      )
    },
    {
      header: 'Record Ref',
      accessorKey: 'record_ref',
      sortable: true,
      cell: (r) => (
        <span className="font-mono font-semibold text-xs text-zinc-950 dark:text-white">
          {r.record_ref}
        </span>
      )
    },
    {
      header: 'Purpose Tag',
      accessorKey: 'purpose',
      sortable: true,
      cell: (r) => <StatusBadge label={r.purpose.replace(/_/g, ' ')} variant="slate" />
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (r) => <StatusBadge label={r.status} code={r.status} />
    },
    {
      header: 'Granted Timestamp',
      accessorKey: 'granted_at',
      sortable: true,
      cell: (r) => (
        <div>
          <div className="font-mono text-xs text-zinc-800 dark:text-zinc-200">{new Date(r.granted_at).toLocaleString()}</div>
          {r.revoked_at && (
            <div className="text-[10px] text-rose-500 font-mono mt-0.5">Revoked: {new Date(r.revoked_at).toLocaleDateString()}</div>
          )}
        </div>
      )
    },
    {
      header: 'Consent Action',
      cell: (r) => (
        r.status === 'ACTIVE' ? (
          <button
            onClick={() => handleRevokeConsent(r.id)}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-rose-300 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-xs font-semibold transition-colors"
            title="Revoke academic verification consent"
          >
            <Ban className="w-3.5 h-3.5" />
            <span>Revoke</span>
          </button>
        ) : (
          <span className="text-[11px] text-zinc-400 font-mono">Revoked</span>
        )
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-950 dark:text-white tracking-tight font-display">
          Statutory Audit Trail & Consent Ledger
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          Append-Only Regulatory Ledger and DPDP Purpose-Tagged Consent Register
        </p>
      </div>

      <div className="statutory-alert-box">
        <ShieldCheck className="w-4 h-4 text-sky-500 flex-shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm leading-relaxed">
          <strong className="font-semibold text-zinc-950 dark:text-white">Tamper-Evident Immutable Log:</strong> Every login attempt, batch upload, discrepancy resolution, "What-If" policy simulation, and third-party verification query is cryptographically appended to this statutory ledger.
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-6">
        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'border-zinc-950 dark:border-white text-zinc-950 dark:text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Statutory Audit Logs</span>
        </button>
        <button
          onClick={() => setActiveTab('consent')}
          className={`pb-3 text-sm font-semibold transition-colors border-b-2 -mb-px flex items-center gap-2 ${
            activeTab === 'consent'
              ? 'border-zinc-950 dark:border-white text-zinc-950 dark:text-white'
              : 'border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Purpose-Tagged Consent Ledger</span>
        </button>
      </div>

      {activeTab === 'audit' && (
        <div className="space-y-4">
          {/* Audit Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-display">
              <Filter className="w-3.5 h-3.5" />
              <span>Filters:</span>
            </div>

            <select
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111215] text-zinc-900 dark:text-zinc-100 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 transition-colors"
            >
              <option value="">All Action Types</option>
              <option value="LOGIN_SUCCESS">LOGIN_SUCCESS</option>
              <option value="LOGIN_FAILED">LOGIN_FAILED</option>
              <option value="ROLE_QUICK_SWITCH">ROLE_QUICK_SWITCH</option>
              <option value="BATCH_ADMISSION_UPLOAD">BATCH_ADMISSION_UPLOAD</option>
              <option value="DISCREPANCY_RESOLVED">DISCREPANCY_RESOLVED</option>
              <option value="TWO_KEY_STUDENT_CONFIRM">TWO_KEY_STUDENT_CONFIRM</option>
              <option value="POLICY_WHAT_IF_SIMULATION">POLICY_WHAT_IF_SIMULATION</option>
              <option value="PUBLIC_CREDENTIAL_VERIFIED">PUBLIC_CREDENTIAL_VERIFIED</option>
            </select>

            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111215] text-zinc-900 dark:text-zinc-100 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 transition-colors"
            >
              <option value="">All Roles</option>
              <option value="AICTE_ADMIN">AICTE_ADMIN</option>
              <option value="AICTE_REGIONAL_OFFICER">AICTE_REGIONAL_OFFICER</option>
              <option value="INSTITUTION_NODAL_OFFICER">INSTITUTION_NODAL_OFFICER</option>
              <option value="STUDENT">STUDENT</option>
              <option value="PUBLIC_VERIFIER">PUBLIC_VERIFIER</option>
            </select>
          </div>

          <DataTable
            columns={auditColumns}
            data={auditLogs}
            searchPlaceholder="Search actor username, IP, action, or entity ID..."
            exportFilename="aicte_statutory_audit_ledger"
            pageSize={12}
          />
        </div>
      )}

      {activeTab === 'consent' && (
        <DataTable
          columns={consentColumns}
          data={consentRecords}
          searchPlaceholder="Search APAAR ID, record reference, or purpose..."
          exportFilename="dpdp_student_consent_register"
          pageSize={12}
        />
      )}
    </div>
  );
};
