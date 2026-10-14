import { useState } from 'react';
import { displayDate, personName } from '../documents/fileHelpers';
import { PRIORITY_LABEL, PRIORITY_STYLE, STATUS_KEYS, STATUS_LABEL } from './taskUtils';

const COLUMN_TINT = { todo: '#F1F5F9', in_progress: '#EFF6FF', done: '#DCFCE7' };

export default function TaskBoard({ board, loading, canMove, onOpen, onMove }) {
  const [dragging, setDragging] = useState(null);
  const [over, setOver] = useState(null);

  const drop = (status) => {
    if (dragging && dragging.status !== status) onMove(dragging, status);
    setDragging(null);
    setOver(null);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16, opacity: loading ? 0.6 : 1 }}>
      {STATUS_KEYS.map((status) => {
        const tasks = board[status] || [];
        return (
          <div
            key={status}
            onDragOver={(e) => { if (canMove) { e.preventDefault(); setOver(status); } }}
            onDragLeave={() => setOver(null)}
            onDrop={() => canMove && drop(status)}
            style={{
              backgroundColor: over === status ? '#E0F2FE' : '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10,
              padding: 12, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 240,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#334155', backgroundColor: COLUMN_TINT[status], padding: '3px 10px', borderRadius: 12 }}>
                {STATUS_LABEL[status]}
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>{tasks.length}</span>
            </div>
            {tasks.length === 0 && <div style={{ fontSize: '0.8rem', color: '#94A3B8', textAlign: 'center', padding: 24 }}>No tasks</div>}
            {tasks.map((task) => {
              const priority = PRIORITY_STYLE[task.priority] || {};
              return (
                <div
                  key={task._id}
                  draggable={canMove}
                  onDragStart={() => setDragging(task)}
                  onDragEnd={() => { setDragging(null); setOver(null); }}
                  onClick={() => onOpen(task)}
                  style={{ backgroundColor: '#fff', border: '1px solid #E2E8F0', borderRadius: 8, padding: 12, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>{task.taskNo}</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, padding: '1px 8px', borderRadius: 10, backgroundColor: priority.bg, color: priority.color }}>
                      {PRIORITY_LABEL[task.priority]}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0F172A' }}>{task.title}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748B' }}>
                    <span>{personName(task.assigneeId)}</span>
                    <span style={{ color: task.isOverdue ? '#DC2626' : '#64748B', fontWeight: task.isOverdue ? 600 : 400 }}>
                      {task.isOverdue ? 'Overdue • ' : ''}{displayDate(task.dueDate)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
