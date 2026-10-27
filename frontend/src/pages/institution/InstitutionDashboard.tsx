import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/common/StatCard';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Upload, Users, AlertTriangle, CheckCircle, Clock, ShieldCheck } from 'lucide-react';

export const InstitutionDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [institution, setInstitution] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInstitutionData();
  }, [user]);

  const fetchInstitutionData = async () => {
    if (!user?.institution_id) return;
    setLoading(true);
    try {
      const res = await api.get(`/institutions/${user.institution_id}`);
      setInstitution(res.data);
    } catch (err) {
      console.error('Failed to load institution profile:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!institution) {
    return (
      <div className="main-content-wrapper">
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          Loading institution profile and intake status...
        </div>
      </div>
    );
  }

  const totalIntake = institution.total_approved_intake;
  const totalEnrolled = institution.total_enrolled;
  const utilPercent = totalIntake ? Math.round((totalEnrolled / totalIntake) * 100) : 0;
  const isOverIntake = totalEnrolled > totalIntake * 1.15;

  return (
    <div className="main-content-wrapper">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">{institution.name}</h1>
          <p className="page-subtitle">
            AICTE Permanent Institute ID: {institution.aicte_id} | State: {institution.state} ({institution.region} Region)
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => navigate('/upload-admissions')} className="btn btn-primary">
            <Upload size={14} />
            <span>Upload New Admissions</span>
          </button>
        </div>
      </div>

      {/* Institutional Compliance Status Banner */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>Nodal Officer</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e293b' }}>{institution.nodal_officer_name}</div>
            <div style={{ fontSize: '12px', color: '#475569' }}>{institution.nodal_officer_email} | Contact: {institution.nodal_officer_phone_masked}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Institutional Review Score</div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: institution.review_score >= 60 ? '#dc2626' : institution.review_score >= 35 ? '#d97706' : '#15803d' }}>
                {institution.review_score} / 100
              </div>
            </div>
            <StatusBadge label={institution.status.replace(/_/g, ' ')} code={institution.status} />
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="metric-grid">
        <StatCard
          title="Approved Regular Intake"
          value={totalIntake}
          subtext="Approved by AICTE Council"
          indicatorColor="#0f4c81"
        />
        <StatCard
          title="Enrolled Admissions"
          value={totalEnrolled}
          subtext={`${utilPercent}% Intake Utilisation`}
          indicatorColor={isOverIntake ? '#dc2626' : '#15803d'}
        />
        <StatCard
          title="Unconfirmed by Student"
          value={`${institution.unconfirmed_rate}%`}
          subtext="Two-Key Confirmation Grace Period"
          indicatorColor="#d97706"
        />
        <StatCard
          title="Active Programmes"
          value={institution.programmes.length}
          subtext="UG / PG Courses"
          indicatorColor="#0f4c81"
        />
      </div>

      {/* Programme Breakdown Table */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
            Departmental Intake Quota Allocation & Supernumerary Limits
          </h2>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Audited under AICTE Approval Process Handbook (2025-26)
          </span>
        </div>

        <div className="data-table-container">
          <table className="gov-table">
            <thead>
              <tr>
                <th>Programme / Level</th>
                <th>Course Name</th>
                <th>Approved Intake</th>
                <th>Supernumerary Permitted</th>
                <th>Actual Enrolled</th>
                <th>Unconfirmed</th>
                <th>Accreditation</th>
                <th>Capacity Headroom</th>
              </tr>
            </thead>
            <tbody>
              {institution.programmes.map((p: any) => {
                const superPermitted = Math.floor(p.approved_intake * (p.supernumerary_cap_percent / 100));
                const totalCeiling = p.approved_intake + superPermitted;
                const headroom = totalCeiling - p.enrolled_count;
                const isOver = headroom < 0;

                return (
                  <tr key={p.id}>
                    <td><span className="status-badge slate">{p.level}</span> {p.programme_name}</td>
                    <td style={{ fontWeight: 600 }}>{p.course_name}</td>
                    <td>{p.approved_intake}</td>
                    <td>+{superPermitted} ({p.supernumerary_cap_percent}%)</td>
                    <td style={{ fontWeight: 700, color: isOver ? '#dc2626' : '#1e293b' }}>
                      {p.enrolled_count}
                    </td>
                    <td style={{ color: p.unconfirmed_count > 0 ? '#b45309' : '#1e293b' }}>
                      {p.unconfirmed_count}
                    </td>
                    <td>
                      <StatusBadge label={p.is_nba_accredited ? 'NBA Accredited' : 'Non-Accredited'} variant={p.is_nba_accredited ? 'green' : 'slate'} />
                    </td>
                    <td>
                      <span style={{ fontWeight: 700, color: isOver ? '#dc2626' : '#15803d' }}>
                        {isOver ? `Ceiling Breached (${headroom})` : `${headroom} seats available`}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Shortcut Banners */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <div
          onClick={() => navigate('/discrepancies')}
          style={{ border: '1px solid #cbd5e1', padding: '16px', borderRadius: '4px', backgroundColor: '#ffffff', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b45309', fontWeight: 700, fontSize: '13px' }}>
            <AlertTriangle size={16} />
            <span>Discrepancy Resolution Queue</span>
          </div>
          <p style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
            Review pending name transliterations and DOB mismatches requiring Nodal Officer validation.
          </p>
        </div>

        <div
          onClick={() => navigate('/students')}
          style={{ border: '1px solid #cbd5e1', padding: '16px', borderRadius: '4px', backgroundColor: '#ffffff', cursor: 'pointer' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0f4c81', fontWeight: 700, fontSize: '13px' }}>
            <Users size={16} />
            <span>Search & Manage Enrolment Records</span>
          </div>
          <p style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
            Inspect active APAAR IDs, Two-Key confirmation timestamps, and generate student verification tokens.
          </p>
        </div>
      </div>

    </div>
  );
};
