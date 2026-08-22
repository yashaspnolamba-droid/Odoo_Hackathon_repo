import React from 'react';
import { DollarSign, Download, Lock, CheckCircle, FileText, ShieldAlert, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import '../styles/employeePayroll.css';

export const EmployeePayrollView = () => {
  const { currentUser } = useAuth();
  const { employeeSalary, payslips } = useData();

  // If we have payslips, use the latest one to show current month net pay.
  // Otherwise fallback to base_salary from employeeSalary.
  const latestPayslip = payslips && payslips.length > 0 ? payslips[0] : null;

  const totalEarnings = latestPayslip ? parseFloat(latestPayslip.total_earnings) : (employeeSalary ? parseFloat(employeeSalary.base_salary) : 0);
  const totalDeductions = latestPayslip ? parseFloat(latestPayslip.total_deductions) : 0;
  const netSalary = latestPayslip ? parseFloat(latestPayslip.net_salary) : totalEarnings;

  const handleDownloadPayslip = (payslipId) => {
    alert(`Downloading Official Payslip PDF (ID: ${payslipId})...`);
    // Ideally open a new tab to backend endpoint that generates PDF
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Employee Payroll View</h1>
          <p className="page-subtitle">View your monthly salary structure, earnings, tax deductions, and download payslips.</p>
        </div>
        <div className="payslip-badge-read-only" style={{ background: '#e0e7ff', color: '#4f46e5' }}>
          <Lock size={14} />
          <span>Read-Only Employee Access</span>
        </div>
      </div>

      {/* Hero Salary Card */}
      <div className="payroll-hero-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 600 }}>CURRENT MONTH NET TAKE-HOME PAY</div>
            <div className="payroll-hero-amount">${netSalary.toLocaleString()}</div>
            <div style={{ fontSize: '0.825rem', color: '#94a3b8' }}>
              Employee ID: <strong>{currentUser?.employeeId || (latestPayslip ? latestPayslip.employee_id_display : '')}</strong> • Account: Direct Bank Transfer (Verified)
            </div>
          </div>

          {latestPayslip && (
            <button className="btn btn-primary" onClick={() => handleDownloadPayslip(latestPayslip.id)}>
              <Download size={18} />
              <span>Download Latest Payslip</span>
            </button>
          )}
        </div>
      </div>

      {/* Detailed Earnings & Deductions Breakdown */}
      <div className="grid-2" style={{ marginBottom: '2rem' }}>
        {/* Earnings Card */}
        <div className="card">
          <div className="payroll-section-title">
            <DollarSign size={20} color="var(--primary)" />
            <span>Earnings Component</span>
          </div>

          <table className="payroll-breakdown-table">
            <tbody>
              {latestPayslip?.breakdown?.earnings ? (
                latestPayslip.breakdown.earnings.map((e, idx) => (
                  <tr key={idx}>
                    <td>{e.name}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>${parseFloat(e.amount).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td>Base Salary</td>
                  <td style={{ textAlign: 'right', fontWeight: 700 }}>${totalEarnings.toLocaleString()}</td>
                </tr>
              )}
              <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                <td>Total Gross Earnings</td>
                <td style={{ textAlign: 'right', color: 'var(--primary)' }}>${totalEarnings.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Deductions Card */}
        <div className="card">
          <div className="payroll-section-title">
            <ShieldAlert size={20} color="#dc2626" />
            <span>Deductions Component</span>
          </div>

          <table className="payroll-breakdown-table">
            <tbody>
              {latestPayslip?.breakdown?.deductions ? (
                latestPayslip.breakdown.deductions.map((d, idx) => (
                  <tr key={idx}>
                    <td>{d.name}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>-${parseFloat(d.amount).toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td>No Deductions Listed</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>$0</td>
                </tr>
              )}
              <tr style={{ background: '#fee2e2', fontWeight: 800 }}>
                <td>Total Deductions</td>
                <td style={{ textAlign: 'right', color: '#b91c1c' }}>-${totalDeductions.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Past Payslips History */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <FileText size={20} color="var(--secondary)" />
            <span>Recent Payslip Archive</span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Pay Period</th>
                <th>Gross Earnings</th>
                <th>Deductions</th>
                <th>Net Payable</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {payslips.length > 0 ? (
                payslips.map(payslip => (
                  <tr key={payslip.id}>
                    <td style={{ fontWeight: 700 }}>
                      {payslip.month}/{payslip.year}
                    </td>
                    <td>${parseFloat(payslip.total_earnings).toLocaleString()}</td>
                    <td style={{ color: '#dc2626' }}>-${parseFloat(payslip.total_deductions).toLocaleString()}</td>
                    <td style={{ fontWeight: 700, color: '#047857' }}>${parseFloat(payslip.net_salary).toLocaleString()}</td>
                    <td>
                      <span className={`badge ${payslip.status === 'PAID' ? 'badge-approved' : 'badge-pending'}`}>
                        {payslip.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleDownloadPayslip(payslip.id)}>
                        <Download size={14} />
                        <span>PDF Payslip</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                    No payslips found for your account.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
