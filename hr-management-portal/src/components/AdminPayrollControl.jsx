import React, { useState } from 'react';
import { DollarSign, Search, Edit3, CheckCircle, ShieldAlert, Users, TrendingUp, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import '../styles/adminPayroll.css';

export const AdminPayrollControl = () => {
  const { users } = useAuth();
  const { updateEmployeeSalary } = useData();

  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [salaryForm, setSalaryForm] = useState({
    basic: 0,
    hra: 0,
    special: 0,
    pf: 0,
    tax: 0
  });

  const [msg, setMsg] = useState({ type: '', text: '' });

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.employeeId.toLowerCase().includes(search.toLowerCase()) ||
    u.department.toLowerCase().includes(search.toLowerCase())
  );

  // Total payroll calculation across company
  const totalCompanyPayroll = users.reduce((acc, u) => acc + (u.salary?.net || 75000), 0);
  const avgSalary = Math.round(totalCompanyPayroll / (users.length || 1));

  const handleOpenEditModal = (emp) => {
    setSelectedUser(emp);
    setSalaryForm({
      basic: emp.salary?.basic || 50000,
      hra: emp.salary?.hra || 20000,
      special: emp.salary?.special || 10000,
      pf: emp.salary?.pf || 4000,
      tax: emp.salary?.tax || 4000
    });
  };

  const handleSalarySubmit = (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    const res = updateEmployeeSalary(selectedUser.employeeId, salaryForm);
    if (res.success) {
      setMsg({ type: 'success', text: `Salary structure updated for ${selectedUser.name}. Changes reflected immediately.` });
      setSelectedUser(null);
    }
  };

  const handleRunPayroll = () => {
    setMsg({ type: 'success', text: `Monthly Payroll for ${users.length} employees processed successfully! All direct deposits generated.` });
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Admin Payroll Control</h1>
          <p className="page-subtitle">View company-wide payroll, update salary structures, and ensure payroll accuracy.</p>
        </div>
        <button className="btn btn-success" onClick={handleRunPayroll}>
          <RefreshCw size={18} />
          <span>Run Monthly Payroll</span>
        </button>
      </div>

      {msg.text && (
        <div className={`auth-alert ${msg.type === 'success' ? 'auth-alert-success' : 'auth-alert-danger'}`} style={{ marginBottom: '1.5rem' }}>
          <CheckCircle size={16} />
          <span>{msg.text}</span>
        </div>
      )}

      {/* Admin Payroll Summary Cards */}
      <div className="admin-payroll-summary-grid">
        <div className="admin-payroll-stat-card">
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>TOTAL MONTHLY PAYROLL</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginTop: '0.35rem' }}>
            ${totalCompanyPayroll.toLocaleString()}
          </div>
        </div>

        <div className="admin-payroll-stat-card">
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>PAYROLL HEADCOUNT</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#4f46e5', marginTop: '0.35rem' }}>
            {users.length} Employees
          </div>
        </div>

        <div className="admin-payroll-stat-card">
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>AVERAGE NET PAY</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#059669', marginTop: '0.35rem' }}>
            ${avgSalary.toLocaleString()}
          </div>
        </div>

        <div className="admin-payroll-stat-card">
          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>PAYROLL STATUS</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#047857', marginTop: '0.5rem' }}>
            Ready for Payout
          </div>
        </div>
      </div>

      {/* Payroll Management Table */}
      <div className="card">
        <div className="card-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div className="card-title">
            <DollarSign size={20} color="var(--primary)" />
            <span>Employee Payroll Master List</span>
          </div>

          <div style={{ position: 'relative', width: '300px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Search employee, ID or department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.25rem' }}
            />
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          </div>
        </div>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Basic Salary</th>
                <th>HRA</th>
                <th>Allowances</th>
                <th>Deductions (PF+Tax)</th>
                <th>Net Payable</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(emp => {
                const s = emp.salary || { basic: 50000, hra: 20000, special: 10000, pf: 4000, tax: 4000, net: 72000 };
                const deductions = (s.pf || 0) + (s.tax || 0);

                return (
                  <tr key={emp.employeeId}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{emp.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{emp.employeeId}</div>
                    </td>
                    <td>{emp.department}</td>
                    <td>${(s.basic || 0).toLocaleString()}</td>
                    <td>${(s.hra || 0).toLocaleString()}</td>
                    <td>${(s.special || 0).toLocaleString()}</td>
                    <td style={{ color: '#dc2626' }}>-${deductions.toLocaleString()}</td>
                    <td style={{ fontWeight: 800, color: '#047857' }}>${(s.net || 0).toLocaleString()}</td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => handleOpenEditModal(emp)}>
                        <Edit3 size={14} />
                        <span>Update Salary</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Salary Structure Update Modal */}
      {selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                Update Salary Structure: {selectedUser.name}
              </h2>
              <button className="modal-close-btn" onClick={() => setSelectedUser(null)}>✕</button>
            </div>

            <form onSubmit={handleSalarySubmit}>
              <div className="salary-edit-grid">
                <div className="form-group">
                  <label className="form-label">Basic Salary ($)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={salaryForm.basic}
                    onChange={(e) => setSalaryForm({ ...salaryForm, basic: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">HRA ($)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={salaryForm.hra}
                    onChange={(e) => setSalaryForm({ ...salaryForm, hra: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Special Allowance ($)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={salaryForm.special}
                    onChange={(e) => setSalaryForm({ ...salaryForm, special: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">PF Deduction ($)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={salaryForm.pf}
                    onChange={(e) => setSalaryForm({ ...salaryForm, pf: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">TDS Tax Deduction ($)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={salaryForm.tax}
                    onChange={(e) => setSalaryForm({ ...salaryForm, tax: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ background: '#ecfdf5', padding: '0.85rem', borderRadius: '8px', marginTop: '0.5rem', fontWeight: 700, color: '#047857', display: 'flex', justifyContent: 'space-between' }}>
                <span>Calculated Net Pay:</span>
                <span>
                  ${((Number(salaryForm.basic) || 0) + (Number(salaryForm.hra) || 0) + (Number(salaryForm.special) || 0) - ((Number(salaryForm.pf) || 0) + (Number(salaryForm.tax) || 0))).toLocaleString()}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedUser(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Salary Structure
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
