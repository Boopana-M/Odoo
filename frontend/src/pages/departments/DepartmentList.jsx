import React, { useState, useEffect } from 'react';
import { Building, Plus, Edit2, Trash2, Users, Search } from 'lucide-react';
import { departmentApi } from '../../api/departmentApi';
import { employeeApi } from '../../api/employeeApi';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { useNotification } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';

export function DepartmentList() {
  const { success, error } = useNotification();
  const { isAdmin, isHRManager } = useAuth();

  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deptName, setDeptName] = useState('');
  const [deleteDeptId, setDeleteDeptId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [deptRes, empRes] = await Promise.all([
        departmentApi.getAll(),
        employeeApi.getAll().catch(() => ({ data: [] }))
      ]);
      setDepartments(deptRes.data || []);
      setEmployees(empRes.data || []);
    } catch (err) {
      error(err.message || 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setEditingDept(null);
    setDeptName('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dept) => {
    setEditingDept(dept);
    setDeptName(dept.name);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!deptName.trim()) {
      error('Department name is required');
      return;
    }

    try {
      if (editingDept) {
        await departmentApi.update(editingDept._id, { name: deptName.trim() });
        success('Department updated successfully');
      } else {
        await departmentApi.create({ name: deptName.trim() });
        success('Department created successfully');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      error(err.message || 'Failed to save department');
    }
  };

  const handleDelete = async () => {
    if (!deleteDeptId) return;
    try {
      await departmentApi.delete(deleteDeptId);
      success('Department deleted successfully');
      setDeleteDeptId(null);
      fetchData();
    } catch (err) {
      error(err.message || 'Failed to delete department');
    }
  };

  const filteredDepartments = departments.filter((d) =>
    d.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div className="page-title-area">
          <Building size={24} color="var(--primary)" />
          <h1 className="page-title">Departments Management</h1>
        </div>
        {(isAdmin || isHRManager) && (
          <div className="page-actions">
            <button className="btn btn-primary" onClick={handleOpenCreate}>
              <Plus size={16} /> Create Department
            </button>
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search
              size={16}
              style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }}
            />
            <input
              type="text"
              className="form-control"
              placeholder="Search departments..."
              style={{ paddingLeft: '2.25rem' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ color: 'var(--text-light)', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
            Showing {filteredDepartments.length} of {departments.length} departments
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Department Name</th>
                <th>Assigned Headcount</th>
                <th>Created Date</th>
                {(isAdmin || isHRManager) && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredDepartments.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
                    No departments found. Click "Create Department" to add one.
                  </td>
                </tr>
              ) : (
                filteredDepartments.map((dept) => {
                  const empCount = employees.filter(
                    (e) => (e.departmentId?._id || e.departmentId) === dept._id
                  ).length;

                  return (
                    <tr key={dept._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div style={{ background: '#e0e7ff', padding: '6px', borderRadius: '6px' }}>
                            <Building size={16} color="var(--primary)" />
                          </div>
                          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{dept.name}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Users size={14} color="var(--text-light)" />
                          <span className="badge badge-secondary">{empCount} employee{empCount === 1 ? '' : 's'}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ color: 'var(--text-light)', fontSize: '0.85rem' }}>
                          {dept.createdAt ? new Date(dept.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </td>
                      {(isAdmin || isHRManager) && (
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ marginRight: '0.5rem' }}
                            onClick={() => handleOpenEdit(dept)}
                          >
                            <Edit2 size={14} /> Edit
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setDeleteDeptId(dept._id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingDept ? 'Edit Department' : 'Create Department'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSave}>
              Save Department
            </button>
          </>
        }
      >
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label required">Department Name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Engineering, Finance, Sales"
              value={deptName}
              onChange={(e) => setDeptName(e.target.value)}
              required
              autoFocus
            />
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteDeptId}
        onClose={() => setDeleteDeptId(null)}
        onConfirm={handleDelete}
        title="Delete Department"
        message="Are you sure you want to delete this department? Employees assigned to it may need reassignment."
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
}

export default DepartmentList;
