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
      cell: (r) => (
        <span className="font-mono font-semibold text-xs text-sky-600 dark:text-sky-400">
          {r.record_ref}
        </span>
      )
    },
    {
      header: 'APAAR ID',
      accessorKey: 'apaar_id',
      sortable: true,
      cell: (r) => (
        <span className="font-mono text-xs text-zinc-800 dark:text-zinc-200">
          {r.apaar_id}
        </span>
      )
    },
    {
      header: 'Student Name',
      accessorKey: 'student_name',
      sortable: true,
      cell: (r) => (
        <div>
          <div className="font-semibold text-zinc-950 dark:text-white tracking-tight">
            {r.student_name}
          </div>
          <div className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5">
            Roll: {r.student_id_enrolment}
          </div>
        </div>
      )
    },
    {
      header: 'Course & Year',
      accessorKey: 'course_name',
      sortable: true,
      cell: (r) => (
        <div>
          <div className="font-medium text-zinc-900 dark:text-zinc-100">{r.course_name}</div>
          <div className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono mt-0.5">
            Adm: {r.admission_date} ({r.year_of_admission})
          </div>
        </div>
      )
    },
    {
      header: 'Category / Quota',
      sortable: true,
      cell: (r) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          <StatusBadge label={r.category} variant="slate" />
          <span className="text-[11px] font-mono font-semibold text-sky-600 dark:text-sky-400">
            {r.quota_type}
          </span>
        </div>
      )
    },
    {
      header: 'Contact Masked',
      cell: (r) => (
        <div className="text-[11px] font-mono text-zinc-700 dark:text-zinc-300">
          <div>{r.mobile_masked}</div>
          <div className="text-zinc-400 dark:text-zinc-500">{r.email_masked}</div>
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
        <div className="flex items-center gap-2">
          <a
            href={`/confirm-admission/${r.confirmation_token}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111215] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#1f2128] text-xs font-semibold transition-colors"
            title="Open simulated Key-2 student confirmation screen"
          >
            <ExternalLink className="w-3.5 h-3.5 text-sky-500" />
            <span>Key-2</span>
          </a>
          <button
            onClick={() => navigate(`/certificate?ref=${r.record_ref}`)}
            className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111215] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-[#1f2128] transition-colors"
            title="View Official Certificate Template"
          >
            <Award className="w-3.5 h-3.5 text-amber-500" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <h1 className="text-xl sm:text-2xl font-bold text-zinc-950 dark:text-white tracking-tight font-display">
          Enrolment Ledger & Admission Records
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          Master Registry of APAAR Admissions, Two-Key Authentication State, and Masked Identity Attributes
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-display">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111215] text-zinc-900 dark:text-zinc-100 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 transition-colors"
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
          className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111215] text-zinc-900 dark:text-zinc-100 px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-sky-500 transition-colors"
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

      {/* Master Data Table */}
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
