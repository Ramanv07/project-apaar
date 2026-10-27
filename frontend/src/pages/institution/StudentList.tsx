import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { DataTable, Column } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ExternalLink, Award, Search, Filter } from 'lucide-react';

interface AdmissionRecord {
  id: string;
  record_ref: string;
  institution_name: string;
  course_name: string;
  apaar_id: string;
  student_name: string;
  dob: string;
  gender: string;
  year_of_admission: number;
  admission_date: string;
  student_id_enrolment: string;
  mobile_masked: string;
  email_masked: string;
  category: string;
  quota_type: string;
  two_key_status: string;
  confirmation_token: string;
  validation_status: string;
}

export const StudentList: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [records, setRecords] = useState<AdmissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [quotaFilter, setQuotaFilter] = useState<string>('');

  useEffect(() => {
    fetchAdmissions();
  }, [statusFilter, quotaFilter, searchParams]);

  const fetchAdmissions = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { limit: '200' };
      const queryInst = searchParams.get('inst') || user?.institution_id;
      if (queryInst) params.institution_id = queryInst;
      if (statusFilter) params.two_key_status = statusFilter;
      if (quotaFilter) params.quota_type = quotaFilter;

      const res = await api.get('/admissions', { params });
      setRecords(res.data);
    } catch (err) {
      console.error('Failed to load admissions:', err);
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<AdmissionRecord>[] = [
    {
      header: 'Record Reference',
      accessorKey: 'record_ref',
      sortable: true,
      cell: (r) => <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{r.record_ref}</span>
    },
    {
      header: 'APAAR ID',
      accessorKey: 'apaar_id',
      sortable: true,
      cell: (r) => <span style={{ fontFamily: 'monospace' }}>{r.apaar_id}</span>
    },
    {
      header: 'Student Name',
      accessorKey: 'student_name',
      sortable: true,
      cell: (r) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1e293b' }}>{r.student_name}</div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Roll: {r.student_id_enrolment}</div>
        </div>
      )
    },
    {
      header: 'Course & Year',
      accessorKey: 'course_name',
      sortable: true,
      cell: (r) => (
        <div>
          <div style={{ fontSize: '12px' }}>{r.course_name}</div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>Adm: {r.admission_date} ({r.year_of_admission})</div>
        </div>
      )
    },
    {
      header: 'Category / Quota',
      sortable: true,
      cell: (r) => (
        <div>
          <span className="status-badge slate">{r.category}</span>
          <span style={{ margin: '0 4px', fontSize: '11px' }}>•</span>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#0f4c81' }}>{r.quota_type}</span>
        </div>
      )
    },
    {
      header: 'Contact Masked',
      cell: (r) => (
        <div style={{ fontSize: '11px', fontFamily: 'monospace' }}>
          <div>{r.mobile_masked}</div>
          <div style={{ color: '#64748b' }}>{r.email_masked}</div>
        </div>
      )
    },
    {
      header: 'Two-Key Status',
      accessorKey: 'two_key_status',
      sortable: true,
      cell: (r) => <StatusBadge label={r.two_key_status.replace(/_/g, ' ')} code={r.two_key_status} />
    },
    {
      header: 'Verification Link & Cert',
      cell: (r) => (
        <div style={{ display: 'flex', gap: '4px' }}>
          <a
            href={`/confirm-admission/${r.confirmation_token}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
            title="Open simulated Key-2 student confirmation screen"
          >
            <ExternalLink size={12} />
            <span>Key-2 Link</span>
          </a>
          <button
            onClick={() => navigate(`/certificate?ref=${r.record_ref}`)}
            className="btn btn-secondary btn-sm"
            title="View Official Certificate Template"
          >
            <Award size={12} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="main-content-wrapper">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Enrolment Ledger & Admission Records</h1>
          <p className="page-subtitle">
            Dense Master Registry of APAAR Admissions, Two-Key Authentication State, and Masked Identity Attributes
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Filter size={14} color="#64748b" />
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Filter:</span>
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="form-select"
          style={{ width: '220px', fontSize: '12px' }}
        >
          <option value="">All Two-Key States</option>
          <option value="STUDENT_CONFIRMED">Student Confirmed</option>
          <option value="SUBMITTED">Submitted (Pending Key-2)</option>
          <option value="UNCONFIRMED_GRACE_PERIOD">Unconfirmed (Grace Period)</option>
          <option value="DISPUTED">Disputed by Student</option>
        </select>

        <select
          value={quotaFilter}
          onChange={e => setQuotaFilter(e.target.value)}
          className="form-select"
          style={{ width: '180px', fontSize: '12px' }}
        >
          <option value="">All Quotas</option>
          <option value="GENERAL">General</option>
          <option value="EWS">EWS</option>
          <option value="TFW">TFW</option>
          <option value="STATE_ALLOTMENT">State Allotment</option>
          <option value="NRI">NRI</option>
          <option value="FN">Foreign National (FN)</option>
        </select>
      </div>

      <DataTable
        columns={columns}
        data={records}
        searchPlaceholder="Filter student name, APAAR ID, record reference, or roll number..."
        exportFilename="trustseat_student_enrolments"
        pageSize={12}
      />
    </div>
  );
};
