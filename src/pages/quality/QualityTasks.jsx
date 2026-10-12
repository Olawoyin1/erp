import React, { useState, useMemo } from 'react';
import {
  FiSearch,
  FiFilter,
  FiDownload,
  FiPlus,
  FiEye,
  FiMoreVertical,
  FiEdit,
  FiCheck,
  FiX,
  FiUploadCloud,
  FiGrid,
  FiList,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiCalendar,
  FiPaperclip,
} from 'react-icons/fi';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';
import Drawer from '../../components/ui/Drawer';
import { mockQualityTasks } from '../../data/mockQuality';

function PriorityBadge({ priority }) {
  const styles = {
    Hot: { bg: '#FEE2E2', color: '#DC2626' },
    High: { bg: '#FFE4E6', color: '#E11D48' },
    Medium: { bg: '#FEF3C7', color: '#D97706' },
    Low: { bg: '#E0F2FE', color: '#0284C7' },
  };
  const s = styles[priority] || { bg: '#F1F5F9', color: '#64748B' };
  return (
    <span
      style={{
        backgroundColor: s.bg,
        color: s.color,
        padding: '3px 10px',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        display: 'inline-block',
      }}
    >
      {priority}
    </span>
  );
}

function StatusBadge({ status }) {
  const styles = {
    'To Do': { bg: '#F1F5F9', color: '#475569' },
    'In Progress': { bg: '#EFF6FF', color: '#1D4ED8' },
    Done: { bg: '#DCFCE7', color: '#15803D' },
    Overdue: { bg: '#FEE2E2', color: '#B91C1C' },
  };
  const s = styles[status] || { bg: '#F1F5F9', color: '#475569' };
  return (
    <span
      style={{
        backgroundColor: s.bg,
        color: s.color,
        padding: '3px 10px',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
        display: 'inline-block',
      }}
    >
      {status}
    </span>
  );
}

export default function QualityTasks() {
  const [tasks, setTasks] = useState(mockQualityTasks);
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'kanban'
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState([]);

  // Modals & Drawers
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewDrawerOpen, setIsViewDrawerOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [activeTask, setActiveTask] = useState(null);
  const [openActionMenuId, setOpenActionMenuId] = useState(null);

  // Filters
  const [priorityFilter, setPriorityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    id: '',
    task: '',
    assignedTo: 'Chinonso Eze',
    relatedTo: 'Audit Management',
    priority: 'High',
    startDate: '12/02/25',
    dueDate: '28/05/25',
    description: '',
    document: '',
  });

  // Filter logic
  const filteredTasks = useMemo(() => {
    return tasks.filter((item) => {
      const matchesSearch =
        !searchTerm ||
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.task.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.assignedTo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.relatedTo.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPriority = !priorityFilter || item.priority === priorityFilter;
      const matchesStatus = !statusFilter || item.status === statusFilter;

      return matchesSearch && matchesPriority && matchesStatus;
    });
  }, [tasks, searchTerm, priorityFilter, statusFilter]);

  const totalPages = Math.ceil(filteredTasks.length / pageSize) || 1;
  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTasks.slice(start, start + pageSize);
  }, [filteredTasks, currentPage, pageSize]);

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(paginatedTasks.map((t) => t.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const openAssignModal = () => {
    const nextNum = tasks.length + 1;
    setFormData({
      id: `QM-TSK-0${nextNum < 10 ? '0' + nextNum : nextNum}`,
      task: '',
      assignedTo: 'Chinonso Eze',
      relatedTo: 'Audit Management',
      priority: 'High',
      startDate: '12/02/25',
      dueDate: '28/05/25',
      description: '',
      document: 'Internal_Audit_Report_IA-2026-004.pdf (25MB)',
    });
    setIsAssignModalOpen(true);
  };

  const handleAssignSubmit = (e) => {
    e.preventDefault();
    const newTask = {
      ...formData,
      status: 'To Do',
    };
    setTasks([newTask, ...tasks]);
    setIsAssignModalOpen(false);
  };

  const openEditModal = (task) => {
    setActiveTask(task);
    setFormData({
      id: task.id,
      task: task.task,
      assignedTo: task.assignedTo,
      relatedTo: task.relatedTo,
      priority: task.priority,
      startDate: task.startDate,
      dueDate: task.dueDate,
      description: task.description,
      document: task.document || '',
    });
    setOpenActionMenuId(null);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    setTasks((prev) =>
      prev.map((t) => (t.id === activeTask.id ? { ...t, ...formData } : t))
    );
    if (activeTask && activeTask.id === formData.id) {
      setActiveTask((prev) => ({ ...prev, ...formData }));
    }
    setIsEditModalOpen(false);
  };

  const openViewDrawer = (task) => {
    setActiveTask(task);
    setOpenActionMenuId(null);
    setIsViewDrawerOpen(true);
  };

  const handleMarkCompleted = (taskId) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: 'Done' } : t))
    );
    if (activeTask && activeTask.id === taskId) {
      setActiveTask((prev) => ({ ...prev, status: 'Done' }));
    }
    setOpenActionMenuId(null);
  };

  const columns = [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          onChange={handleSelectAll}
          checked={
            paginatedTasks.length > 0 &&
            selectedIds.length === paginatedTasks.length
          }
          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
        />
      ),
      render: (_, row) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.id)}
          onChange={() => handleSelectOne(row.id)}
          style={{ cursor: 'pointer', width: '16px', height: '16px' }}
        />
      ),
    },
    {
      key: 'id',
      label: 'TASK ID',
      render: (v) => (
        <span style={{ color: '#64748B', fontWeight: 600, fontSize: '0.85rem' }}>
          {v}
        </span>
      ),
    },
    {
      key: 'task',
      label: 'TASK',
      render: (v) => (
        <span style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.875rem' }}>
          {v}
        </span>
      ),
    },
    {
      key: 'assignedTo',
      label: 'ASSIGNED TO',
      render: (v) => (
        <span style={{ color: '#0F172A', fontSize: '0.875rem' }}>{v}</span>
      ),
    },
    {
      key: 'relatedTo',
      label: 'RELATED TO',
      render: (v) => (
        <span style={{ color: '#475569', fontSize: '0.85rem' }}>{v}</span>
      ),
    },
    {
      key: 'priority',
      label: 'PRIORITY',
      render: (v) => <PriorityBadge priority={v} />,
    },
    {
      key: 'dueDate',
      label: 'DUE DATE ⇅',
      render: (v) => (
        <span style={{ color: '#475569', fontSize: '0.85rem' }}>{v}</span>
      ),
    },
    {
      key: 'status',
      label: 'STATUS ⇅',
      render: (v) => <StatusBadge status={v} />,
    },
    {
      key: 'actions',
      label: 'ACTIONS',
      align: 'right',
      render: (_, row) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '8px',
            position: 'relative',
          }}
        >
          <button
            className="icon-btn"
            title="View Task"
            onClick={() => openViewDrawer(row)}
            style={{
              padding: '6px',
              borderRadius: '6px',
              border: 'none',
              background: 'transparent',
              color: '#64748B',
              cursor: 'pointer',
            }}
          >
            <FiEye size={16} />
          </button>

          <div style={{ position: 'relative' }}>
            <button
              className="icon-btn"
              title="More Actions"
              onClick={(e) => {
                e.stopPropagation();
                setOpenActionMenuId(
                  openActionMenuId === row.id ? null : row.id
                );
              }}
              style={{
                padding: '6px',
                borderRadius: '6px',
                border: 'none',
                background: 'transparent',
                color: '#64748B',
                cursor: 'pointer',
              }}
            >
              <FiMoreVertical size={16} />
            </button>

            {openActionMenuId === row.id && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  zIndex: 50,
                  backgroundColor: '#FFFFFF',
                  borderRadius: '8px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.12)',
                  border: '1px solid #E2E8F0',
                  width: '160px',
                  padding: '6px 0',
                  textAlign: 'left',
                }}
              >
                <button
                  onClick={() => openEditModal(row)}
                  style={{
                    width: '100%',
                    padding: '8px 14px',
                    border: 'none',
                    background: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '0.85rem',
                    color: '#1E293B',
                    cursor: 'pointer',
                  }}
                >
                  <FiEdit size={14} /> Edit Task
                </button>
                {row.status !== 'Done' && (
                  <button
                    onClick={() => handleMarkCompleted(row.id)}
                    style={{
                      width: '100%',
                      padding: '8px 14px',
                      border: 'none',
                      background: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '0.85rem',
                      color: '#16A34A',
                      cursor: 'pointer',
                    }}
                  >
                    <FiCheck size={14} /> Mark Completed
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        padding: '24px',
        backgroundColor: '#F8FAFC',
        minHeight: '100vh',
      }}
      onClick={() => setOpenActionMenuId(null)}
    >
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: '#0F172A',
              margin: 0,
            }}
          >
            Tasks — Quality System
          </h1>
          <p
            style={{
              color: '#64748B',
              fontSize: '0.875rem',
              margin: '4px 0 0 0',
            }}
          >
            Assign and track Quality workstream tasks
          </p>
        </div>
        <button
          onClick={() => alert('Bulk upload Quality tasks feature initiated')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            color: '#1E293B',
            fontWeight: 500,
            padding: '8px 16px',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          <FiUploadCloud size={16} /> Upload ↑
        </button>
      </div>

      {/* KPI Cards Row (Matching Screenshot 2026-10-12 132441.png) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
        }}
      >
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '10px',
            padding: '20px',
            border: '1px solid #E2E8F0',
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
              TOTAL TASKS
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#EFF6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1D4ED8',
              }}
            >
              <FiList size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginTop: '10px' }}>
            128
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
            All assigned activities
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '10px',
            padding: '20px',
            border: '1px solid #E2E8F0',
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
              IN PROGRESS
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#DCFCE7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#15803D',
              }}
            >
              <FiClock size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginTop: '10px' }}>
            32
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
            Currently being worked on
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '10px',
            padding: '20px',
            border: '1px solid #E2E8F0',
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
              DUE THIS WEEK
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#F3E8FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#7E22CE',
              }}
            >
              <FiCalendar size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginTop: '10px' }}>
            65
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
            Upcoming deadlines
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '10px',
            padding: '20px',
            border: '1px solid #E2E8F0',
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
              OVERDUE TASKS
            </span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: '#FFE4E6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#E11D48',
              }}
            >
              <FiAlertCircle size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0F172A', marginTop: '10px' }}>
            25
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
            Past due date
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card" style={{ padding: '0px', overflow: 'hidden' }}>
        {/* Toolbar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px 20px',
            borderBottom: '1px solid #F1F5F9',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ position: 'relative', width: '320px' }}>
            <FiSearch
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94A3B8',
              }}
            />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setIsFilterOpen(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: priorityFilter || statusFilter ? '#EFF6FF' : '#FFFFFF',
                border: `1px solid ${priorityFilter || statusFilter ? '#3B82F6' : '#E2E8F0'}`,
                color: priorityFilter || statusFilter ? '#1D4ED8' : '#334155',
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <FiFilter size={15} />
              Filter {priorityFilter || statusFilter ? '(Active)' : ''}
            </button>

            <button
              onClick={() => alert('Exporting task list...')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                color: '#334155',
                padding: '8px 14px',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <FiDownload size={15} />
              Export
            </button>

            <button
              onClick={openAssignModal}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#1D4ED8',
                color: '#FFFFFF',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <FiPlus size={16} />
              + Task
            </button>

            {/* View Mode Toggle */}
            <div
              style={{
                display: 'flex',
                backgroundColor: '#F1F5F9',
                borderRadius: '6px',
                padding: '2px',
              }}
            >
              <button
                onClick={() => setViewMode('table')}
                style={{
                  border: 'none',
                  backgroundColor: viewMode === 'table' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'table' ? '#1D4ED8' : '#64748B',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                <FiList size={16} />
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                style={{
                  border: 'none',
                  backgroundColor: viewMode === 'kanban' ? '#FFFFFF' : 'transparent',
                  color: viewMode === 'kanban' ? '#1D4ED8' : '#64748B',
                  padding: '6px 10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  boxShadow: viewMode === 'kanban' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                <FiGrid size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* View Mode Switch */}
        {viewMode === 'table' ? (
          <>
            <DataTable
              columns={columns}
              data={paginatedTasks}
              rowKey="id"
              emptyMessage="No tasks found."
            />
            <div style={{ padding: '12px 20px', borderTop: '1px solid #F1F5F9' }}>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredTasks.length}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
              />
            </div>
          </>
        ) : (
          /* Kanban View */
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px',
              padding: '20px',
              backgroundColor: '#F8FAFC',
            }}
          >
            {['To Do', 'In Progress', 'Done', 'Overdue'].map((colStatus) => {
              const colTasks = filteredTasks.filter((t) => t.status === colStatus);
              return (
                <div
                  key={colStatus}
                  style={{
                    backgroundColor: '#F1F5F9',
                    borderRadius: '8px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    minHeight: '400px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1E293B' }}>
                      {colStatus}
                    </span>
                    <span
                      style={{
                        backgroundColor: '#E2E8F0',
                        color: '#475569',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }}
                    >
                      {colTasks.length}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {colTasks.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => openViewDrawer(t)}
                        style={{
                          backgroundColor: '#FFFFFF',
                          borderRadius: '6px',
                          padding: '14px',
                          border: '1px solid #E2E8F0',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
                            {t.id}
                          </span>
                          <PriorityBadge priority={t.priority} />
                        </div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0F172A' }}>
                          {t.task}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
                          <span>{t.assignedTo}</span>
                          <span>Due: {t.dueDate}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Filter Drawer */}
      <Drawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        title="Filter Tasks"
        width={360}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
              Priority
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '0.875rem',
              }}
            >
              <option value="">All Priorities</option>
              <option value="Hot">Hot</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #CBD5E1',
                fontSize: '0.875rem',
              }}
            >
              <option value="">All Statuses</option>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
              <option value="Overdue">Overdue</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              onClick={() => {
                setPriorityFilter('');
                setStatusFilter('');
                setIsFilterOpen(false);
              }}
              style={{
                flex: 1,
                padding: '8px 14px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 500,
              }}
            >
              Reset
            </button>
            <button
              onClick={() => setIsFilterOpen(false)}
              style={{
                flex: 1,
                padding: '8px 14px',
                border: 'none',
                backgroundColor: '#1D4ED8',
                color: '#FFFFFF',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Apply Filter
            </button>
          </div>
        </div>
      </Drawer>

      {/* Assign Task Modal */}
      {isAssignModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              maxWidth: '540px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>
                Assign Task
              </h2>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  TASK NAME <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Prepare Q2 internal audit checklist"
                  value={formData.task}
                  onChange={(e) => setFormData({ ...formData, task: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    TASK ID <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.id}
                    readOnly
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#F1F5F9',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      color: '#475569',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    ASSIGNED OFFICER <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                    }}
                  >
                    <option value="Chinonso Eze">Chinonso Eze</option>
                    <option value="Femi Adeyemi">Femi Adeyemi</option>
                    <option value="Zainab Mohammed">Zainab Mohammed</option>
                    <option value="Tolu Afolabi">Tolu Afolabi</option>
                    <option value="Amira Bello">Amira Bello</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    PRIORITY <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                    }}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                    <option value="Hot">Hot</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    START DATE
                  </label>
                  <input
                    type="text"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  TARGET DUE DATE
                </label>
                <input
                  type="text"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  TASK DESCRIPTION
                </label>
                <textarea
                  rows={3}
                  placeholder="Insert notes on deliverables..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  ATTACH DOCUMENTS
                </label>
                <div
                  style={{
                    border: '1.5px dashed #CBD5E1',
                    borderRadius: '8px',
                    padding: '20px',
                    textAlign: 'center',
                    backgroundColor: '#F8FAFC',
                    cursor: 'pointer',
                  }}
                  onClick={() => setFormData({ ...formData, document: 'Internal_Audit_Report_IA-2026-004.pdf (25MB)' })}
                >
                  <FiUploadCloud size={24} color="#1D4ED8" style={{ marginBottom: '6px' }} />
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: '#1E293B' }}>
                    Drop file here or click to browse
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.75rem', color: '#94A3B8' }}>
                    PDF, DOCX, DWG, PNG. up to 50MB
                  </p>
                </div>

                {formData.document && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginTop: '8px',
                      padding: '8px 12px',
                      backgroundColor: '#F1F5F9',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      color: '#334155',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FiPaperclip size={14} color="#64748B" />
                      <span>{formData.document}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, document: '' })}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#EF4444' }}
                    >
                      <FiX size={15} />
                    </button>
                  </div>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  borderTop: '1px solid #E2E8F0',
                  paddingTop: '16px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 20px',
                    backgroundColor: '#1D4ED8',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                  }}
                >
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {isEditModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '12px',
              maxWidth: '540px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>
                Edit Task
              </h2>
              <button
                onClick={() => setIsEditModalOpen(false)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  TASK NAME <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.task}
                  onChange={(e) => setFormData({ ...formData, task: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    TASK ID <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.id}
                    readOnly
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: '#F1F5F9',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                      color: '#475569',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    ASSIGNED OFFICER <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                    }}
                  >
                    <option value="Chinonso Eze">Chinonso Eze</option>
                    <option value="Femi Adeyemi">Femi Adeyemi</option>
                    <option value="Zainab Mohammed">Zainab Mohammed</option>
                    <option value="Tolu Afolabi">Tolu Afolabi</option>
                    <option value="Amira Bello">Amira Bello</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    PRIORITY <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                    }}
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                    <option value="Hot">Hot</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                    START DATE
                  </label>
                  <input
                    type="text"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '1px solid #CBD5E1',
                      borderRadius: '6px',
                      fontSize: '0.875rem',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  TARGET DUE DATE
                </label>
                <input
                  type="text"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  TASK DESCRIPTION
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  ATTACH DOCUMENTS
                </label>
                {formData.document && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      backgroundColor: '#F1F5F9',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      color: '#334155',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FiPaperclip size={14} color="#64748B" />
                      <span>{formData.document}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, document: '' })}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#EF4444' }}
                    >
                      <FiX size={15} />
                    </button>
                  </div>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '12px',
                  borderTop: '1px solid #E2E8F0',
                  paddingTop: '16px',
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  style={{
                    padding: '8px 16px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 20px',
                    backgroundColor: '#1D4ED8',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                  }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Task Drawer */}
      <Drawer
        isOpen={isViewDrawerOpen}
        onClose={() => setIsViewDrawerOpen(false)}
        title={activeTask?.task || 'Task Details'}
        subtitle={`${activeTask?.assignedTo || ''} • ${activeTask?.id || ''}`}
        width={560}
      >
        {activeTask && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header row with Status and Edit button */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingBottom: '14px',
                borderBottom: '1px solid #E2E8F0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 500 }}>
                  Status:
                </span>
                <StatusBadge status={activeTask.status} />
                <PriorityBadge priority={activeTask.priority} />
              </div>

              <button
                onClick={() => openEditModal(activeTask)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#EFF6FF',
                  color: '#1D4ED8',
                  border: '1px solid #BFDBFE',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <FiEdit size={14} /> Edit Task
              </button>
            </div>

            {/* Task Info Card */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                  TASK NAME
                </div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0F172A', marginTop: '2px' }}>
                  {activeTask.task}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                    TASK ID
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#0F172A', marginTop: '2px' }}>
                    {activeTask.id}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                    ASSIGNED OFFICER
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#0F172A', marginTop: '2px' }}>
                    {activeTask.assignedTo}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                    PRIORITY
                  </div>
                  <div style={{ fontSize: '0.875rem', marginTop: '2px' }}>
                    <PriorityBadge priority={activeTask.priority} />
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                    RELATED TO
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#0F172A', marginTop: '2px' }}>
                    {activeTask.relatedTo}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                    START DATE
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#0F172A', marginTop: '2px' }}>
                    {activeTask.startDate || '-'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                    TARGET DUE DATE
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#0F172A', marginTop: '2px' }}>
                    {activeTask.dueDate}
                  </div>
                </div>
              </div>
            </div>

            {/* Description Card */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: '8px',
                border: '1px solid #E2E8F0',
                padding: '16px',
              }}
            >
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                TASK DESCRIPTION
              </div>
              <p
                style={{
                  fontSize: '0.875rem',
                  color: '#334155',
                  marginTop: '8px',
                  lineHeight: '1.5',
                  marginBottom: 0,
                }}
              >
                {activeTask.description}
              </p>
            </div>

            {/* Attached Documents */}
            {activeTask.document && (
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  padding: '16px',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', textTransform: 'uppercase', marginBottom: '10px' }}>
                  ATTACHED DOCUMENTS
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    backgroundColor: '#F8FAFC',
                    borderRadius: '6px',
                    border: '1px solid #E2E8F0',
                    fontSize: '0.875rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FiPaperclip size={16} color="#64748B" />
                    <span style={{ color: '#1E293B', fontWeight: 500 }}>
                      {activeTask.document}
                    </span>
                  </div>
                  <button
                    onClick={() => alert(`Downloading: ${activeTask.document}`)}
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B' }}
                  >
                    <FiDownload size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
