const TaskItem = ({ task, onToggleStatus, onEdit, onDelete }) => {
  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isOverdue = () => {
    if (!task.due_date || task.status === 'completed') return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.due_date);
    return dueDate < today;
  };

  const isDueToday = () => {
    if (!task.due_date || task.status === 'completed') return false;
    const today = new Date();
    const dueDate = new Date(task.due_date);
    return (
      today.getFullYear() === dueDate.getFullYear() &&
      today.getMonth() === dueDate.getMonth() &&
      today.getDate() === dueDate.getDate()
    );
  };

  return (
    <div className={`task-item ${task.status} ${isOverdue() ? 'overdue' : ''}`}>
      <div className="task-checkbox">
        <input
          type="checkbox"
          checked={task.status === 'completed'}
          onChange={() => onToggleStatus(task.id)}
          id={`task-${task.id}`}
        />
      </div>
      <div className="task-content">
        <label htmlFor={`task-${task.id}`} className="task-title">
          {task.title}
        </label>
        {task.description && (
          <p className="task-description">{task.description}</p>
        )}
        <div className="task-meta">
          {task.due_date && (
            <span className={`due-date ${isOverdue() ? 'overdue' : ''} ${isDueToday() ? 'due-today' : ''}`}>
              {isOverdue() ? 'Overdue: ' : isDueToday() ? 'Due today: ' : 'Due: '}
              {formatDate(task.due_date)}
            </span>
          )}
          <span className={`status-badge ${task.status}`}>
            {task.status}
          </span>
        </div>
      </div>
      <div className="task-actions">
        <button
          onClick={() => onEdit(task)}
          className="btn-icon"
          title="Edit task"
        >
          Edit
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="btn-icon btn-danger"
          title="Delete task"
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default TaskItem;
