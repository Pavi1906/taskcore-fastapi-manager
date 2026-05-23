import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Add parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Mock Database ---
let users = [
  { id: 1, email: 'engineer@company.com', password: 'password123' }
];

let tasks = [
  { 
    id: 1, 
    title: 'Architect Database Schema', 
    description: 'Implement SQLAlchemy 2.0 models and configure Alembic migrations.',
    is_completed: true, 
    owner_id: 1,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  { 
    id: 2, 
    title: 'Implement JWT Auth', 
    description: 'Setup Passlib with bcrypt and PyJWT for stateless authentication.',
    is_completed: true, 
    owner_id: 1,
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  { 
    id: 3, 
    title: 'Integrate Frontend APIs', 
    description: 'Connect standard React + Vite frontend to FastAPI endpoints.',
    is_completed: false, 
    owner_id: 1,
    created_at: new Date().toISOString()
  },
];

const sessions: Record<string, number> = {};

// Helper: Authentication Middleware
const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ detail: 'Missing or invalid token' });
  }
  const token = authHeader.split(' ')[1];
  const userId = sessions[token];
  if (!userId) {
    return res.status(401).json({ detail: 'Expired or invalid token' });
  }
  (req as any).user = users.find(u => u.id === userId);
  next();
};

// --- Auth Routes ---
app.post('/api/v1/auth/register', (req, res) => {
  const { email, password } = req.body;
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ detail: 'User already exists' });
  }
  const newUser = { id: Date.now(), email, password };
  users.push(newUser);
  res.status(201).json({ id: newUser.id, email: newUser.email });
});

app.post('/api/v1/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.email === username && u.password === password);
  
  if (!user) {
    return res.status(401).json({ detail: 'Incorrect email or password' });
  }
  
  const token = `mock-jwt-token-${Date.now()}-${user.id}`;
  sessions[token] = user.id;
  
  res.json({
    access_token: token,
    token_type: 'bearer'
  });
});

// --- API Routes ---
app.get('/api/v1/tasks', authenticate, (req, res) => {
  const user = (req as any).user;
  const userTasks = tasks.filter(t => t.owner_id === user.id);
  res.json(userTasks);
});

app.post('/api/v1/tasks', authenticate, (req, res) => {
  const user = (req as any).user;
  const { title, description } = req.body;
  
  const newTask = {
    id: Date.now(),
    title,
    description: description || null,
    is_completed: false,
    owner_id: user.id,
    created_at: new Date().toISOString()
  };
  
  tasks.unshift(newTask);
  res.status(201).json(newTask);
});

app.put('/api/v1/tasks/:id', authenticate, (req, res) => {
  const user = (req as any).user;
  const taskId = parseInt(req.params.id);
  const taskIndex = tasks.findIndex(t => t.id === taskId && t.owner_id === user.id);
  
  if (taskIndex === -1) {
    return res.status(404).json({ detail: 'Task not found' });
  }
  
  const updatedTask = { ...tasks[taskIndex], ...req.body };
  tasks[taskIndex] = updatedTask;
  
  res.json(updatedTask);
});

app.delete('/api/v1/tasks/:id', authenticate, (req, res) => {
  const user = (req as any).user;
  const taskId = parseInt(req.params.id);
  const initialLength = tasks.length;
  
  tasks = tasks.filter(t => !(t.id === taskId && t.owner_id === user.id));
  
  if (tasks.length === initialLength) {
    return res.status(404).json({ detail: 'Task not found' });
  }
  
  res.status(204).send();
});

// --- Vite Middleware Integration ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
