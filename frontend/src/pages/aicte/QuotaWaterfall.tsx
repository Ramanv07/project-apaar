import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { GitBranch, Sliders, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';

interface PolicyVersion {
  id: string;
  version_code: string;
  handbook_name: string;
  description: string;
  effective_from: string;
  effective_to?: string | null;
  policy_json: any;
}

interface WhatIfResponse {
  current_compliant_programmes: number;
  current_non_compliant_programmes: number;
  simulated_compliant_programmes: number;
  simulated_non_compliant_programmes: number;
  newly_non_compliant_count: number;
  newly_compliant_count: number;
  impacted_programmes: Array<{
    institution_name: string;
    state: string;
    course_name: string;
    approved_intake: number;
    enrolled_count: number;
    prior_status: string;
    simulated_status: string;
    delta_headroom: number;
  }>;
}

export const QuotaWaterfall: React.FC = () => {
  const [policies, setPolicies] = useState<PolicyVersion[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<string>('AICTE-APH-2025-V2');
  
  // Interactive Simulation Controls
  const [superCap, setSuperCap] = useState<number>(20.0);
  const [nriCap, setNriCap] = useState<number>(5.0);
  const [allowTfwCascade, setAllowTfwCascade] = useState<boolean>(false);
  const [simulationResult, setSimulationResult] = useState<WhatIfResponse | null>(null);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    fetchPolicies();
    runSimulation(20.0, 5.0, false);
  }, []);

  const fetchPolicies = async () => {
    try {
      const res = await api.get('/quota/policies');
      setPolicies(res.data);
    } catch (err) {
      console.error('Failed to load policies:', err);
    }
  };

  const runSimulation = async (superPercent: number, nriPercent: number, cascadeTfw: boolean) => {
    setSimulating(true);
    try {
      const res = await api.post('/quota/simulate-what-if', {
        policy_version_code: selectedPolicy,
        supernumerary_cap_percent: superPercent,
        nri_quota_percent: nriPercent,
        allow_tfw_cascade_to_nri: cascadeTfw
      });
      setSimulationResult(res.data);
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setSimulating(false);
    }
  };

  const handleSliderChange = (newSuper: number) => {
    setSuperCap(newSuper);
    runSimulation(newSuper, nriCap, allowTfwCascade);
  };

  const handleNriChange = (newNri: number) => {
    setNriCap(newNri);
    runSimulation(superCap, newNri, allowTfwCascade);
  };

  const handleTfwToggle = (val: boolean) => {
    setAllowTfwCascade(val);
    runSimulation(superCap, nriCap, val);
  };

  const activePolicyData = policies.find(p => p.version_code === selectedPolicy);

  return (
    <div className="main-content-wrapper">
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Quota Waterfall Engine & Policy Simulator</h1>
          <p className="page-subtitle">
            Policy-as-Code Quota Cascade & Dynamic "What-If" Sensitivity Modelling
          </p>
        </div>
      </div>

      {/* Policy-as-Code Version Selector */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '16px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GitBranch size={16} color="#0f4c81" />
            <h2 style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
              Statutory Approval Process Handbook (Policy Version in Force)
            </h2>
          </div>
          <select
            value={selectedPolicy}
            onChange={e => setSelectedPolicy(e.target.value)}
            className="form-select"
            style={{ width: '280px', fontWeight: 600 }}
          >
            {policies.map(p => (
              <option key={p.version_code} value={p.version_code}>
                {p.version_code}: {p.handbook_name}
              </option>
            ))}
          </select>
        </div>

        {activePolicyData && (
          <div style={{ fontSize: '12px', color: '#475569', backgroundColor: '#f8fafc', padding: '10px', borderRadius: '2px', border: '1px solid #e2e8f0' }}>
            <p><strong>Description:</strong> {activePolicyData.description}</p>
            <p style={{ marginTop: '4px' }}>
              <strong>Effective Period:</strong> {activePolicyData.effective_from} to {activePolicyData.effective_to || 'Present (Active Law)'}
            </p>
          </div>
        )}
      </div>

      {/* Quota Waterfall Cascade Diagram */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '16px', marginBottom: '18px' }}>
        <h2 style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
          AICTE Quota Cascade Architecture
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          
          <div style={{ border: '1px solid #cbd5e1', padding: '12px', borderRadius: '2px', backgroundColor: '#f8fafc' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#0f4c81' }}>1. REGULAR INTAKE</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginTop: '4px' }}>100% Capacity</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>General, OBC, SC, ST, State Govt Allotment, Management.</div>
          </div>

          <div style={{ border: '1px solid #cbd5e1', padding: '12px', borderRadius: '2px', backgroundColor: '#f8fafc' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#15803d' }}>2. SUPERNUMERARY SEATS</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginTop: '4px' }}>+{superCap}% Cap</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>EWS (10%), TFW (5%), Foreign Nationals / OCI / CIWGC (15%).</div>
          </div>

          <div style={{ border: '1px solid #cbd5e1', padding: '12px', borderRadius: '2px', backgroundColor: '#f8fafc' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#d97706' }}>3. VACANT CASCADE</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginTop: '4px' }}>CIWGC → FN → NRI</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Unfilled supernumerary seats pass to NRI ONLY in NBA accredited courses.</div>
          </div>

          <div style={{ border: '1px solid #cbd5e1', padding: '12px', borderRadius: '2px', backgroundColor: '#f8fafc' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#b91c1c' }}>4. STATUTORY CEILING</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginTop: '4px' }}>Zero Breach</div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>Admissions above Approved + Supernumerary Cap trigger regulatory review.</div>
          </div>

        </div>
      </div>

      {/* Interactive "What-If" Sensitivity Controls */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '20px', marginBottom: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px' }}>
          <Sliders size={18} color="#e65100" />
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1b2a49' }}>
            Interactive "What-If" Policy Simulator (Council Revision Workbench)
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '20px', alignItems: 'center' }}>
          
          {/* Slider 1: Supernumerary Cap */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
              <span>Aggregate Supernumerary Ceiling:</span>
              <span style={{ color: '#0f4c81', fontSize: '14px', fontWeight: 700 }}>{superCap}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="25"
              step="1"
              value={superCap}
              onChange={e => handleSliderChange(parseFloat(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
              aria-label="Supernumerary Cap Slider"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b' }}>
              <span>10% (Strict)</span>
              <span>15% (2024 Rule)</span>
              <span>20% (2025 Rule)</span>
              <span>25% (Relaxed)</span>
            </div>
          </div>

          {/* Slider 2: NRI Sub-Quota */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
              <span>Base NRI Sub-Quota Ceiling:</span>
              <span style={{ color: '#e65100', fontSize: '14px', fontWeight: 700 }}>{nriCap}%</span>
            </div>
            <input
              type="range"
              min="3"
              max="15"
              step="1"
              value={nriCap}
              onChange={e => handleNriChange(parseFloat(e.target.value))}
              style={{ width: '100%', cursor: 'pointer' }}
              aria-label="NRI Cap Slider"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b' }}>
              <span>3% (Min)</span>
              <span>5% (Current APH)</span>
              <span>10%</span>
              <span>15% (Max)</span>
            </div>
          </div>

          {/* Checkbox: TFW to NRI Cascade */}
          <div style={{ borderLeft: '1px solid #e2e8f0', paddingLeft: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={allowTfwCascade}
                onChange={e => handleTfwToggle(e.target.checked)}
              />
              <span>Allow Unfilled TFW Seats to Cascade to NRI</span>
            </label>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
              Simulates experimental policy proposal.
            </div>
          </div>

        </div>
      </div>

      {/* Simulation Impact Results */}
      {simulationResult && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>
              National Simulation Outcome
            </h3>
            {simulating && <span style={{ fontSize: '11px', color: '#0f4c81' }}>Re-calculating 125 programmes...</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '16px' }}>
            <div style={{ padding: '12px', border: '1px solid #86efac', backgroundColor: '#f0fdf4', borderRadius: '2px' }}>
              <div style={{ fontSize: '11px', color: '#166534', fontWeight: 600 }}>SIMULATED COMPLIANT</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#15803d' }}>
                {simulationResult.simulated_compliant_programmes}
              </div>
              <div style={{ fontSize: '11px', color: '#166534' }}>
                Programmes within limits
              </div>
            </div>

            <div style={{ padding: '12px', border: '1px solid #fca5a5', backgroundColor: '#fef2f2', borderRadius: '2px' }}>
              <div style={{ fontSize: '11px', color: '#991b1b', fontWeight: 600 }}>SIMULATED NON-COMPLIANT</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#dc2626' }}>
                {simulationResult.simulated_non_compliant_programmes}
              </div>
              <div style={{ fontSize: '11px', color: '#991b1b' }}>
                Exceeding proposed ceilings
              </div>
            </div>

            <div style={{ padding: '12px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', borderRadius: '2px' }}>
              <div style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>NEWLY COMPLIANT</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#0f4c81' }}>
                +{simulationResult.newly_compliant_count}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Cured by relaxed ceiling
              </div>
            </div>

            <div style={{ padding: '12px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', borderRadius: '2px' }}>
              <div style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>NEWLY NON-COMPLIANT</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#d97706' }}>
                {simulationResult.newly_non_compliant_count}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Turn non-compliant if tightened
              </div>
            </div>
          </div>

          {/* Impacted Programmes List */}
          {simulationResult.impacted_programmes.length > 0 && (
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                Directly Shifted Programmes under this Simulation ({simulationResult.impacted_programmes.length}):
              </div>
              <div className="data-table-container">
                <table className="gov-table">
                  <thead>
                    <tr>
                      <th>Institution</th>
                      <th>State</th>
                      <th>Course</th>
                      <th>Intake</th>
                      <th>Admissions</th>
                      <th>Prior Status</th>
                      <th>Simulated Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {simulationResult.impacted_programmes.map((p, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600 }}>{p.institution_name}</td>
                        <td>{p.state}</td>
                        <td>{p.course_name}</td>
                        <td>{p.approved_intake}</td>
                        <td style={{ fontWeight: 600 }}>{p.enrolled_count}</td>
                        <td><StatusBadge label={p.prior_status} code={p.prior_status} /></td>
                        <td><StatusBadge label={p.simulated_status} code={p.simulated_status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
