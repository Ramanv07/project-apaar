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
      const res = await api.get('/audit/consent', { params: { limit: '150' } });
      setConsentRecords(res.data);
    } catch (err) {
      console.error('Failed to load consent ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeConsent = async (consentId: string) => {
    if (!confirm("Are you sure you wish to revoke consent for this purpose? Third-party verifiers will no longer have access.")) return;
    try {
      await api.post(`/audit/consent/revoke/${consentId}`);
      fetchConsentRecords();
    } catch (err: any) {
      alert("Revocation failed: " + (err.response?.data?.detail || err.message));
    }
  };

  const auditColumns: Column<AuditLog>[] = [
    {
      header: 'Audit ID & Time (UTC)',
      accessorKey: 'timestamp',
      sortable: true,
      cell: (r) => (
        <div>
          <div style={{ fontFamily: 'monospace', fontWeight: 600 }}>#{r.id}</div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>{new Date(r.timestamp).toLocaleString()}</div>
        </div>
      )
    },
    {
      header: 'Actor & Role',
      accessorKey: 'username',
      sortable: true,
      cell: (r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.username}</div>
          <div style={{ fontSize: '11px', color: '#0f4c81' }}>{r.role}</div>
        </div>
      )
    },
    {
      header: 'Statutory Action',
      accessorKey: 'action',
      sortable: true,
      cell: (r) => <span className="status-badge blue">{r.action}</span>
    },
    {
      header: 'Entity / Target',
      cell: (r) => (
        <div>
          <span style={{ fontSize: '11px', color: '#64748b' }}>{r.entity_type}:</span>{' '}
          <code style={{ fontSize: '11px' }}>{r.entity_id}</code>
        </div>
      )
    },
    {
      header: 'IP Address',
      accessorKey: 'ip_address',
      cell: (r) => <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>{r.ip_address}</span>
    },
    {
      header: 'Audit Payload',
      cell: (r) => (
        <pre style={{ fontSize: '10px', background: '#f8fafc', padding: '4px', borderRadius: '2px', maxWidth: '280px', overflowX: 'auto', maxHeight: '60px' }}>
          {JSON.stringify(r.details, null, 1)}
        </pre>
      )
    }
  ];

  const consentColumns: Column<ConsentRecord>[] = [
    {
      header: 'Consent ID',
      accessorKey: 'id',
      cell: (r) => <span style={{ fontFamily: 'monospace', fontSize: '11px' }}>{r.id.slice(0, 12)}...</span>
    },
    {
      header: 'Masked APAAR ID',
      accessorKey: 'apaar_id_masked',
      sortable: true,
      cell: (r) => <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{r.apaar_id_masked}</span>
    },
    {
      header: 'Record Ref',
      accessorKey: 'record_ref',
      sortable: true,
      cell: (r) => <span style={{ fontWeight: 600 }}>{r.record_ref}</span>
    },
    {
      header: 'Purpose Tag',
      accessorKey: 'purpose',
      sortable: true,
      cell: (r) => <span className="status-badge slate">{r.purpose.replace(/_/g, ' ')}</span>
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
          <div style={{ fontSize: '12px' }}>{new Date(r.granted_at).toLocaleString()}</div>
          {r.revoked_at && (
            <div style={{ fontSize: '10px', color: '#dc2626' }}>Revoked: {new Date(r.revoked_at).toLocaleDateString()}</div>
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
            className="btn btn-secondary btn-sm"
            style={{ color: '#dc2626', borderColor: '#fca5a5' }}
            title="Revoke academic verification consent"
          >
            <Ban size={12} />
            <span>Revoke</span>
          </button>
        ) : (
          <span style={{ fontSize: '11px', color: '#94a3b8' }}>Revoked</span>
        )
      )
    }
  ];

  return (
    <div className="main-content-wrapper">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Statutory Audit Trail & Consent Ledger</h1>
          <p className="page-subtitle">
            Append-Only Regulatory Ledger and DPDP Purpose-Tagged Consent Register
          </p>
        </div>
      </div>

      <div className="statutory-alert-box">
        <ShieldCheck size={18} style={{ flexShrink: 0 }} />
        <div>
          <strong>Tamper-Evident Immutable Log:</strong> Every login attempt, batch upload, discrepancy resolution, "What-If" policy simulation, and third-party verification query is cryptographically appended to this statutory ledger.
        </div>
      </div>

      {/* Mode Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #cbd5e1', marginBottom: '16px' }}>
        <button
          onClick={() => setActiveTab('audit')}
          className="btn"
          style={{
            backgroundColor: activeTab === 'audit' ? '#0f4c81' : 'transparent',
            color: activeTab === 'audit' ? '#ffffff' : '#475569',
            borderRadius: '2px 2px 0 0',
            borderBottom: 'none'
          }}
        >
          Statutory Audit Logs
        </button>
        <button
          onClick={() => setActiveTab('consent')}
          className="btn"
          style={{
            backgroundColor: activeTab === 'consent' ? '#0f4c81' : 'transparent',
            color: activeTab === 'consent' ? '#ffffff' : '#475569',
            borderRadius: '2px 2px 0 0',
            borderBottom: 'none',
            marginLeft: '4px'
          }}
        >
          Purpose-Tagged Consent Ledger
        </button>
      </div>

      {activeTab === 'audit' && (
        <>
          {/* Audit Filters */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={14} color="#64748b" />
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Filter:</span>
            </div>

            <select
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              className="form-select"
              style={{ width: '240px', fontSize: '12px' }}
            >
              <option value="">All Actions</option>
              <option value="USER_LOGIN_SUCCESS">User Login</option>
              <option value="UPLOAD_ADMISSION_BATCH">Upload Batch</option>
              <option value="STUDENT_CONFIRM_ENROLMENT">Two-Key Confirmation</option>
              <option value="RESOLVE_NAME_MISMATCH">Discrepancy Resolution</option>
              <option value="SIMULATE_WHAT_IF_QUOTA">What-If Simulation</option>
              <option value="VERIFY_CREDENTIAL_LOOKUP">Verifier Lookup</option>
            </select>

            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="form-select"
              style={{ width: '200px', fontSize: '12px' }}
            >
              <option value="">All Roles</option>
              <option value="AICTE_ADMIN">AICTE Admin</option>
              <option value="AICTE_REGIONAL_OFFICER">Regional Officer</option>
              <option value="INSTITUTION_NODAL_OFFICER">Nodal Officer</option>
              <option value="SYSTEM">System Automation</option>
            </select>
          </div>

          <DataTable
            columns={auditColumns}
            data={auditLogs}
            searchPlaceholder="Filter audit actions, usernames, or entity IDs..."
            exportFilename="trustseat_statutory_audit_ledger"
            pageSize={15}
          />
        </>
      )}

      {activeTab === 'consent' && (
        <DataTable
          columns={consentColumns}
          data={consentRecords}
          searchPlaceholder="Filter consent record reference, masked APAAR, or purpose..."
          exportFilename="trustseat_consent_ledger"
          pageSize={15}
        />
      )}

    </div>
  );
};
