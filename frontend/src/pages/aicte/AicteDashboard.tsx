import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DataTable, Column } from '../../components/common/DataTable';
import { IntakeBarChart } from '../../components/charts/IntakeBarChart';
import { AlertCircle, Eye, ShieldAlert, Filter } from 'lucide-react';

interface InstitutionItem {
  id: string;
  aicte_id: string;
  name: string;
  state: string;
  region: string;
  status: string;
  review_score: number;
  total_approved_intake: number;
  total_enrolled: number;
  unconfirmed_rate: number;
  open_flags_count: number;
}

interface OverviewStats {
  total_institutions: number;
  total_approved_intake: number;
  total_admissions: number;
  total_unconfirmed: number;
  total_disputed: number;
  flagged_institutions_count: number;
  national_intake_utilisation_pct: number;
  weekly_admissions: { week: string; count: number }[];
}

export const AicteDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [institutions, setInstitutions] = useState<InstitutionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  useEffect(() => {
    fetchDashboardData();
  }, [selectedState, selectedStatus]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const statsRes = await api.get('/institutions/overview-stats');
      setStats(statsRes.data);

      const params: Record<string, string> = {};
      if (selectedState) params.state = selectedState;
      if (selectedStatus) params.status = selectedStatus;

      const instRes = await api.get('/institutions', { params });
      setInstitutions(instRes.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const columns: Column<InstitutionItem>[] = [
    {
      header: 'AICTE Permanent ID',
      accessorKey: 'aicte_id',
      sortable: true,
      cell: (row) => <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{row.aicte_id}</span>
    },
    {
      header: 'Institution Name',
      accessorKey: 'name',
      sortable: true,
      cell: (row) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1e293b' }}>{row.name}</div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>{row.state} ({row.region} Region)</div>
        </div>
      )
    },
    {
      header: 'Intake vs Enrolment',
      sortable: true,
      cell: (row) => {
        const pct = row.total_approved_intake ? Math.round((row.total_enrolled / row.total_approved_intake) * 100) : 0;
        const isExceeded = row.total_enrolled > row.total_approved_intake * 1.15;
        return (
          <div>
            <div style={{ fontWeight: 600, color: isExceeded ? '#dc2626' : '#1e293b' }}>
              {row.total_enrolled} / {row.total_approved_intake} ({pct}%)
            </div>
            <div style={{ fontSize: '11px', color: isExceeded ? '#dc2626' : '#64748b' }}>
              {isExceeded ? 'Ceiling Exceeded' : 'Within Approved Capacity'}
            </div>
          </div>
        );
      }
    },
    {
      header: 'Unconfirmed Rate',
      accessorKey: 'unconfirmed_rate',
      sortable: true,
      cell: (row) => (
        <span style={{ color: row.unconfirmed_rate > 35 ? '#b45309' : '#1e293b', fontWeight: row.unconfirmed_rate > 35 ? 700 : 400 }}>
          {row.unconfirmed_rate}%
        </span>
      )
    },
    {
      header: 'Review Score',
      accessorKey: 'review_score',
      sortable: true,
      cell: (row) => {
        const score = row.review_score;
        const color = score >= 60 ? '#dc2626' : score >= 35 ? '#d97706' : '#15803d';
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontWeight: 700, color, fontSize: '14px' }}>{score}</span>
            <span style={{ fontSize: '10px', color: '#64748b' }}>/ 100</span>
          </div>
        );
      }
    },
    {
      header: 'Regulatory Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => <StatusBadge label={row.status.replace(/_/g, ' ')} code={row.status} />
    },
    {
      header: 'Audit Action',
      cell: (row) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => navigate(`/review-flags?inst=${row.id}`)}
            className="btn btn-secondary btn-sm"
            title="Inspect Review Flags & Fraud Graph"
          >
            <ShieldAlert size={12} />
            <span>Flags</span>
          </button>
          <button
            onClick={() => navigate(`/students?inst=${row.id}`)}
            className="btn btn-secondary btn-sm"
            title="View Enrolment Records"
          >
            <Eye size={12} />
            <span>Records</span>
          </button>
        </div>
      )
    }
  ];

  // Chart data formatting: Top 6 institutions
  const chartData = institutions.slice(0, 6).map(inst => ({
    name: inst.name.split(' ').slice(0, 3).join(' ') + '...',
    approvedIntake: inst.total_approved_intake,
    actualEnrolment: inst.total_enrolled,
    supernumerary: Math.max(0, inst.total_enrolled - inst.total_approved_intake)
  }));

  return (
    <div className="main-content-wrapper">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">National Institutional Oversight Dashboard</h1>
          <p className="page-subtitle">
            All India Council for Technical Education — Real-Time APAAR Verification & Intake Ledger
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="user-badge" style={{ backgroundColor: '#1b2a49' }}>
            Jurisdiction: {user?.region || 'All India Central'}
          </span>
        </div>
      </div>

      {/* Statutory Advisory Notice */}
      <div className="statutory-alert-box">
        <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <strong>Statutory Compliance Oversight:</strong> Intake ceilings and quota distributions are audited against the versioned Approval Process Handbook (APH 2025-26). All review scores are advisory indicators for official inspection and do not constitute a final judicial finding.
        </div>
      </div>

      {/* Key Metric Cards */}
      {stats && (
        <div className="metric-grid">
          <StatCard
            title="Monitored Institutions"
            value={stats.total_institutions}
            subtext="AICTE Approved Polytechnic & Engineering"
            indicatorColor="#0f4c81"
          />
          <StatCard
            title="National Approved Intake"
            value={stats.total_approved_intake.toLocaleString()}
            subtext="Approved regular capacity"
            indicatorColor="#0f4c81"
          />
          <StatCard
            title="Enrolled Admissions"
            value={stats.total_admissions.toLocaleString()}
            subtext={`${stats.national_intake_utilisation_pct}% National Intake Utilisation`}
            indicatorColor="#e65100"
          />
          <StatCard
            title="Two-Key Pending / Disputed"
            value={`${stats.total_unconfirmed} / ${stats.total_disputed}`}
            subtext="Student confirmation grace period"
            indicatorColor="#d97706"
          />
          <StatCard
            title="Flagged for Official Review"
            value={stats.flagged_institutions_count}
            subtext="Over-intake or contact clustering"
            indicatorColor="#dc2626"
          />
        </div>
      )}

      {/* Intake vs Admission Chart */}
      {chartData.length > 0 && (
        <IntakeBarChart
          data={chartData}
          title="Sample Institutional Intake vs Actual Admissions (Regular & Supernumerary)"
        />
      )}

      {/* Filter Toolbar */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Filter size={14} color="#64748b" />
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Filter By:</span>
        </div>

        <select
          value={selectedState}
          onChange={e => setSelectedState(e.target.value)}
          className="form-select"
          style={{ width: '180px', fontSize: '12px' }}
        >
          <option value="">All States / UTs</option>
          <option value="Maharashtra">Maharashtra</option>
          <option value="Uttar Pradesh">Uttar Pradesh</option>
          <option value="Karnataka">Karnataka</option>
          <option value="Tamil Nadu">Tamil Nadu</option>
          <option value="Gujarat">Gujarat</option>
          <option value="Telangana">Telangana</option>
          <option value="West Bengal">West Bengal</option>
          <option value="Odisha">Odisha</option>
        </select>

        <select
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
          className="form-select"
          style={{ width: '170px', fontSize: '12px' }}
        >
          <option value="">All Statuses</option>
          <option value="COMPLIANT">Compliant</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="FLAGGED">Flagged</option>
        </select>
      </div>

      {/* Institutional Records Table */}
      <DataTable
        columns={columns}
        data={institutions}
        searchPlaceholder="Search institution name, AICTE ID, or state..."
        exportFilename="aicte_institutional_intake_report"
        pageSize={10}
      />
    </div>
  );
};
