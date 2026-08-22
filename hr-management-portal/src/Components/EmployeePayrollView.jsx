import React from 'react';
import { DollarSign, Download, Lock, CheckCircle, FileText, ShieldAlert, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/employeePayroll.css';

export const EmployeePayrollView = () => {
  const { currentUser } = useAuth();

  const salary = currentUser?.salary || {
    basic: 65000,
    hra: 25000,
    special: 15000,
    pf: 4800,
    tax: 5200,
    net: 95000
  };

  const totalEarnings = (salary.basic || 0) + (salary.hra || 0) + (salary.special || 0);
  const totalDeductions = (salary.pf || 0) + (salary.tax || 0);
  const netSalary = salary.net || totalEarnings - totalDeductions;

  const handleDownloadPayslip = (month) => {
    alert(`Downloading Official Payslip PDF for ${month}...`);
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
              Employee ID: <strong>{currentUser?.employeeId}</strong> • Account: Direct Bank Transfer (Verified)
            </div>
          </div>

          <button className="btn btn-primary" onClick={() => handleDownloadPayslip('August 2026')}>
            <Download size={18} />
            <span>Download August Payslip</span>
          </button>
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
              <tr>
                <td>Basic Salary</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>${(salary.basic || 0).toLocaleString()}</td>
              </tr>
              <tr>
                <td>House Rent Allowance (HRA)</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>${(salary.hra || 0).toLocaleString()}</td>
              </tr>
              <tr>
                <td>Special & Performance Allowance</td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>${(salary.special || 0).toLocaleString()}</td>
              </tr>
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
              <tr>
                <td>Provident Fund (PF Contribution)</td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>-${(salary.pf || 0).toLocaleString()}</td>
              </tr>
              <tr>
                <td>Income Tax (TDS Deduction)</td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>-${(salary.tax || 0).toLocaleString()}</td>
              </tr>
              <tr>
                <td>Health Insurance Contribution</td>
                <td style={{ textAlign: 'right', fontWeight: 700, color: '#94a3b8' }}>$0 (Company Covered)</td>
              </tr>
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
              {['August 2026', 'July 2026', 'June 2026'].map((month, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 700 }}>{month}</td>
                  <td>${totalEarnings.toLocaleString()}</td>
                  <td style={{ color: '#dc2626' }}>-${totalDeductions.toLocaleString()}</td>
                  <td style={{ fontWeight: 700, color: '#047857' }}>${netSalary.toLocaleString()}</td>
                  <td>
                    <span className="badge badge-approved">Paid</span>
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleDownloadPayslip(month)}>
                      <Download size={14} />
                      <span>PDF Payslip</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
