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

  return (
    <div className="task-list-container">
      <header className="header">
        <h1>Task Manager</h1>
        <div className="user-info">
          <span>Welcome, {user?.username}</span>
          <button onClick={logout} className="btn btn-outline">Logout</button>
        </div>
      </header>

      <div className="task-stats">
        <span className="stat">Total: {tasks.length}</span>
        <span className="stat pending">Pending: {pendingCount}</span>
        <span className="stat completed">Completed: {completedCount}</span>
      </div>

      <div className="task-controls">
        <button
          onClick={() => { setShowForm(true); setEditingTask(null); }}
          className="btn btn-primary"
        >
          + Add Task
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

      {error && <div className="error-message">{error}</div>}

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
          {filter === 'all' ? 'No tasks yet. Create your first task!' : `No ${filter} tasks.`}
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
    </div>
  );
};

export default TaskList;
