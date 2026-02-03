const express = require('express');
const { dbWrapper: db } = require('../database/init');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all tasks for current user
router.get('/', (req, res) => {
  try {
    const tasks = db.prepare(`
      SELECT * FROM tasks
      WHERE user_id = ?
      ORDER BY
        CASE WHEN status = 'pending' THEN 0 ELSE 1 END,
        due_date ASC NULLS LAST,
        created_at DESC
    `).all(req.user.id);

    res.json({ tasks });
  } catch (err) {
    console.error('Get tasks error:', err);
    res.status(500).json({ error: 'Server error fetching tasks' });
  }
});

// Get single task
router.get('/:id', (req, res) => {
  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ task });
  } catch (err) {
    console.error('Get task error:', err);
    res.status(500).json({ error: 'Server error fetching task' });
  }
});

// Create new task
router.post('/', (req, res) => {
  try {
    const { title, description, due_date } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required' });
    }

    const stmt = db.prepare(`
      INSERT INTO tasks (user_id, title, description, due_date)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(req.user.id, title.trim(), description || null, due_date || null);

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ message: 'Task created successfully', task });
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ error: 'Server error creating task' });
  }
});

// Update task
router.put('/:id', (req, res) => {
  try {
    const { title, description, status, due_date } = req.body;

    // Check if task exists and belongs to user
    const existingTask = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (title !== undefined && title.trim() === '') {
      return res.status(400).json({ error: 'Title cannot be empty' });
    }

    if (status !== undefined && !['pending', 'completed'].includes(status)) {
      return res.status(400).json({ error: 'Status must be pending or completed' });
    }

    const stmt = db.prepare(`
      UPDATE tasks
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          status = COALESCE(?, status),
          due_date = COALESCE(?, due_date),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `);
    stmt.run(
      title?.trim() || null,
      description !== undefined ? description : null,
      status || null,
      due_date !== undefined ? due_date : null,
      req.params.id,
      req.user.id
    );

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);

    res.json({ message: 'Task updated successfully', task });
  } catch (err) {
    console.error('Update task error:', err);
    res.status(500).json({ error: 'Server error updating task' });
  }
});

// Toggle task status
router.patch('/:id/status', (req, res) => {
  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const newStatus = task.status === 'pending' ? 'completed' : 'pending';

    db.prepare(`
      UPDATE tasks
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newStatus, req.params.id);

    const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);

    res.json({ message: 'Task status toggled', task: updatedTask });
  } catch (err) {
    console.error('Toggle status error:', err);
    res.status(500).json({ error: 'Server error toggling task status' });
  }
});

// Delete task
router.delete('/:id', (req, res) => {
  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ? AND user_id = ?')
      .get(req.params.id, req.user.id);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);

    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Delete task error:', err);
    res.status(500).json({ error: 'Server error deleting task' });
  }
});

module.exports = router;
