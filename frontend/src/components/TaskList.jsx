import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { tasksAPI } from '../services/api';
import TaskForm from './TaskForm';
import TaskItem from './TaskItem';

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const { user, logout } = useAuth();

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await tasksAPI.getAll();
      setTasks(response.data.tasks);
      setError('');
    } catch (err) {
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleCreateTask = async (taskData) => {
    try {
      await tasksAPI.create(taskData);
      fetchTasks();
      setShowForm(false);
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Failed to create task');
    }
  };

  const handleUpdateTask = async (taskData) => {
    try {
      await tasksAPI.update(editingTask.id, taskData);
      fetchTasks();
      setEditingTask(null);
    } catch (err) {
      throw new Error(err.response?.data?.error || 'Failed to update task');
    }
  };

  const handleToggleStatus = async (taskId) => {
    try {
      await tasksAPI.toggleStatus(taskId);
      fetchTasks();
    } catch (err) {
      setError('Failed to update task status');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await tasksAPI.delete(taskId);
      fetchTasks();
    } catch (err) {
      setError('Failed to delete task');
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'pending') return task.status === 'pending';
    if (filter === 'completed') return task.status === 'completed';
    return true;
  });

  const pendingCount = tasks.filter(t => t.status === 'pending').length;
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <>
      <header className="header">
        <h1>
          <span className="header-logo">{'\u2713'}</span>
          TaskFlow
        </h1>
        <div className="user-info">
          <div className="user-avatar">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <span>{user?.username}</span>
          <button onClick={logout} className="btn btn-outline">Logout</button>
        </div>
      </header>

      <div className="task-stats">
        <div className="stat-card">
          <div className="stat-icon total">{'\uD83D\uDCCB'}</div>
          <div className="stat-info">
            <span className="stat-value">{tasks.length}</span>
            <span className="stat-label">Total Tasks</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pending">{'\u23F3'}</div>
          <div className="stat-info">
            <span className="stat-value">{pendingCount}</span>
            <span className="stat-label">Pending</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon completed">{'\u2705'}</div>
          <div className="stat-info">
            <span className="stat-value">{completedCount}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>
      </div>

      <div className="progress-section">
        <div className="progress-bar-container">
          <div className="progress-header">
            <span>Overall Progress</span>
            <span className="progress-percentage">{progressPercent}%</span>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="task-controls-wrapper">
        <div className="task-controls">
          <button
            onClick={() => { setShowForm(true); setEditingTask(null); }}
            className="btn btn-primary"
          >
            + New Task
          </button>
          <div className="filter-buttons">
            <button
              onClick={() => setFilter('all')}
              className={`btn ${filter === 'all' ? 'btn-active' : 'btn-outline'}`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`btn ${filter === 'pending' ? 'btn-active' : 'btn-outline'}`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('completed')}
              className={`btn ${filter === 'completed' ? 'btn-active' : 'btn-outline'}`}
            >
              Completed
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="dashboard-error">
          <div className="error-message">{error}</div>
        </div>
      )}

      {(showForm || editingTask) && (
        <TaskForm
          task={editingTask}
          onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
          onCancel={() => { setShowForm(false); setEditingTask(null); }}
        />
      )}

      {loading ? (
        <div className="loading">Loading tasks...</div>
      ) : filteredTasks.length === 0 ? (
        <div className="no-tasks">
          <span className="empty-icon">{'\uD83D\uDCDD'}</span>
          <p className="empty-title">
            {filter === 'all' ? 'No tasks yet' : `No ${filter} tasks`}
          </p>
          <p className="empty-subtitle">
            {filter === 'all'
              ? 'Create your first task to get started!'
              : 'Try changing your filter to see other tasks.'}
          </p>
        </div>
      ) : (
        <div className="tasks">
          {filteredTasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggleStatus={handleToggleStatus}
              onEdit={setEditingTask}
              onDelete={handleDeleteTask}
            />
          ))}
        </div>
      )}
    </>
  );
};

export default TaskList;
