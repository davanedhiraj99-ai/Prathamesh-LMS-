// Dev server for API routes - runs on port 3001
import { createServer } from 'http';
import { parse } from 'url';

const PORT = 3001;

// In-memory store
const devStore = {
  students: [
    {
      id: 1,
      name: 'Prathamesh Sir',
      email: 'admin@prathameshsir.com',
      password: 'Admin@123',
      role: 'admin',
      ip_slot_1: null,
      ip_slot_2: null,
      is_active: true,
      last_login_at: null,
      created_at: new Date().toISOString()
    }
  ],
  batches: [],
  videos: [],
  student_batches: []
};

let nextId = 2;
const activeTokens = new Map();

const server = createServer(async (req, res) => {
  // CORS - MUST BE FIRST
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const parsed = parse(req.url, true);
  let pathname = parsed.pathname;
  
  // 🔥 FIX: Remove /api prefix if present (for dev-server compatibility)
  if (pathname.startsWith('/api')) {
    pathname = pathname.replace('/api', '');
    console.log('🔄 Normalized path:', pathname);
  }
  
  // DEBUG LOG
  console.log(`\n[${new Date().toLocaleTimeString()}] ${req.method} ${pathname}`);
  console.log('Headers:', req.headers.authorization ? 'Has Auth' : 'No Auth');

  // Helper: Parse body
  const getBody = () => new Promise((resolve) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try { resolve(JSON.parse(body || '{}')); } 
      catch { resolve({}); }
    });
  });

  // Helper: Auth check
  const checkAuth = (req) => {
    const auth = req.headers.authorization || '';
    const token = auth.replace('Bearer ', '');
    const userId = activeTokens.get(token);
    const user = userId ? devStore.students.find(s => s.id === userId) : null;
    console.log('Auth check:', token.substring(0, 20) + '...', 'User:', user?.name || 'NONE');
    return user;
  };

  // ========== HEALTH ==========
  if (pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'healthy', 
      batches: devStore.batches.length,
      students: devStore.students.length 
    }));
    return;
  }

  // ========== LOGIN ==========
  if (pathname === '/login' && req.method === 'POST') {
    const body = await getBody();
    console.log('Login body:', body);
    
    const { email, password } = body;
    const clientIp = req.headers['x-forwarded-for'] || '127.0.0.1';
    
    const user = devStore.students.find(s => s.email === email && s.is_active);
    
    if (!user || user.password !== password) {
      console.log('Login failed for:', email);
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Invalid credentials' }));
      return;
    }

    if (!user.ip_slot_1) user.ip_slot_1 = clientIp;
    else if (!user.ip_slot_2) user.ip_slot_2 = clientIp;
    user.last_login_at = new Date().toISOString();
    
    const token = 'dev-token-' + Date.now();
    activeTokens.set(token, user.id);
    
    console.log('✅ Login success:', user.name, 'Token:', token.substring(0, 30));
    
    const { password: _, ...userWithoutPassword } = user;
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      token,
      user: { ...userWithoutPassword, ip: clientIp }
    }));
    return;
  }

  // ========== LOGOUT ==========
  if (pathname === '/logout' && req.method === 'POST') {
    const auth = req.headers.authorization || '';
    const token = auth.replace('Bearer ', '');
    activeTokens.delete(token);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // ========== ADMIN: STUDENTS ==========
  if (pathname === '/admin/students') {
    const user = checkAuth(req);
    if (!user || user.role !== 'admin') {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Forbidden' }));
      return;
    }

    if (req.method === 'GET') {
      const users = devStore.students.map(({ password, ...s }) => s);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(users));
      return;
    }

    if (req.method === 'POST') {
      const body = await getBody();
      if (devStore.students.find(s => s.email === body.email)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Email exists' }));
        return;
      }

      const newStudent = {
        id: nextId++,
        name: body.name,
        email: body.email,
        password: body.password || 'student123',
        role: body.role || 'student',
        is_active: true,
        created_at: new Date().toISOString()
      };

      devStore.students.push(newStudent);
      const { password: _, ...withoutPassword } = newStudent;
      
      console.log('✅ Created student:', newStudent.name);
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(withoutPassword));
      return;
    }

    if (req.method === 'DELETE') {
      const id = parseInt(parsed.query.id);
      const idx = devStore.students.findIndex(s => s.id === id);
      if (idx > -1) {
        devStore.students.splice(idx, 1);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      }
      return;
    }
  }

  // ========== ADMIN: BATCHES ==========
  if (pathname === '/admin/batches') {
    console.log('>>> ENTERED /admin/batches route');
    
    const user = checkAuth(req);
    console.log('Auth result:', user ? user.name : 'NO AUTH');
    
    if (!user || user.role !== 'admin') {
      console.log('❌ Auth failed for batches');
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Forbidden - Admin only' }));
      return;
    }

    if (req.method === 'GET') {
      console.log('📋 GET batches:', devStore.batches.length);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(devStore.batches));
      return;
    }

    if (req.method === 'POST') {
      const body = await getBody();
      console.log('📝 POST batch body:', body);

      if (!body.name || body.name.trim() === '') {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Name required' }));
        return;
      }

      const newBatch = {
        id: devStore.batches.length + 1,
        name: body.name.trim(),
        description: body.description || '',
        is_active: true,
        created_at: new Date().toISOString()
      };
      
      devStore.batches.push(newBatch);
      
      console.log('✅ Batch created:', newBatch.name);
      console.log('Total batches now:', devStore.batches.length);
      
      res.writeHead(201, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(newBatch));
      return;
    }

    if (req.method === 'DELETE') {
      const id = parseInt(parsed.query.id);
      const idx = devStore.batches.findIndex(b => b.id === id);
      if (idx > -1) {
        devStore.batches.splice(idx, 1);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      }
      return;
    }
  }

  // ========== ADMIN: ENROLL ==========
  if (pathname === '/admin/enroll-student' && req.method === 'POST') {
    const user = checkAuth(req);
    if (!user || user.role !== 'admin') {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Forbidden' }));
      return;
    }

    const body = await getBody();
    const { studentId, batchId } = body;

    const exists = devStore.student_batches.find(
      sb => sb.student_id === studentId && sb.batch_id === batchId
    );
    
    if (exists) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Already enrolled' }));
      return;
    }

    const enrollment = {
      id: devStore.student_batches.length + 1,
      student_id: studentId,
      batch_id: batchId,
      enrolled_at: new Date().toISOString(),
      is_active: true
    };

    devStore.student_batches.push(enrollment);
    
    res.writeHead(201, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, enrollment }));
    return;
  }

  // ========== ADMIN: STUDENT BATCHES ==========
  if (pathname === '/admin/student-batches' && req.method === 'GET') {
    const user = checkAuth(req);
    if (!user || user.role !== 'admin') {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Forbidden' }));
      return;
    }

    const studentId = parseInt(parsed.query.studentId);
    
    const enrollments = devStore.student_batches
      .filter(sb => sb.student_id === studentId)
      .map(sb => {
        const batch = devStore.batches.find(b => b.id === sb.batch_id);
        return {
          ...sb,
          batch_name: batch?.name || 'Unknown'
        };
      });

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(enrollments));
    return;
  }

  // ========== ADMIN: STUDENT BATCHES (DELETE) ==========
  if (pathname === '/admin/student-batches' && req.method === 'DELETE') {
    const user = checkAuth(req);
    if (!user || user.role !== 'admin') {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Forbidden' }));
      return;
    }

    const studentId = parseInt(parsed.query.studentId);
    const batchId = parseInt(parsed.query.batchId);
  
    const idx = devStore.student_batches.findIndex(
      sb => sb.student_id === studentId && sb.batch_id === batchId
    );
  
    if (idx > -1) {
      devStore.student_batches.splice(idx, 1);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Enrollment not found' }));
    }
    return;
  }

  // ========== ADMIN: STATS ==========
  if (pathname === '/admin/stats' && req.method === 'GET') {
    const user = checkAuth(req);
    if (!user || user.role !== 'admin') {
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Forbidden' }));
      return;
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      totalStudents: devStore.students.filter(s => s.role === 'student').length,
      totalBatches: devStore.batches.length,
      totalVideos: 0,
      totalEnrollments: devStore.student_batches.length
    }));
    return;
  }

  // ========== STUDENT: MY BATCHES ==========
  if (pathname === '/student/my-batches' && req.method === 'GET') {
    const user = checkAuth(req);
    if (!user) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return;
    }

    const enrolled = devStore.student_batches
      .filter(sb => sb.student_id === user.id)
      .map(sb => {
        const batch = devStore.batches.find(b => b.id === sb.batch_id);
        return { ...batch, enrolled_at: sb.enrolled_at };
      });

    const enrolledIds = enrolled.map(e => e.id);
    const available = devStore.batches.filter(b => !enrolledIds.includes(b.id));

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ enrolled, available }));
    return;
  }
      // ========== ADMIN: BUNNY UPLOAD INIT ==========
if (pathname === '/admin/bunny-upload' && req.method === 'POST') {
  const user = checkAuth(req);
  if (!user || user.role !== 'admin') {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Forbidden' }));
    return;
  }

  const body = await getBody();
  
  // Mock Bunny.net response for dev
  const mockVideoId = 'mock-video-' + Date.now();
  
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    success: true,
    videoId: mockVideoId,
    libraryId: 'mock-library',
    title: body.title
  }));
  return;
}

// ========== ADMIN: UPLOAD CONTENT ==========
if (pathname === '/admin/upload-content' && req.method === 'POST') {
  const user = checkAuth(req);
  if (!user || user.role !== 'admin') {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Forbidden' }));
    return;
  }

  const body = await getBody();
  
  const newContent = {
    id: Date.now(),
    title: body.title,
    type: body.type,
    batch_id: body.batchId,
    url: body.url,
    file_size: body.fileSize,
    thumbnail: body.thumbnail,
    created_at: new Date().toISOString()
  };

  // Store in devStore (add content array if not exists)
  if (!devStore.batch_content) devStore.batch_content = [];
  devStore.batch_content.push(newContent);

  res.writeHead(201, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ success: true, content: newContent }));
  return;
}

// ========== ADMIN: BATCH CONTENT (GET/DELETE) ==========
if (pathname === '/admin/batch-content') {
  const user = checkAuth(req);
  if (!user || user.role !== 'admin') {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Forbidden' }));
    return;
  }

  if (req.method === 'GET') {
    const batchId = parseInt(parsed.query.batchId);
    const content = (devStore.batch_content || []).filter(c => c.batch_id === batchId);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      videos: content.filter(c => c.type === 'video'),
      notes: content.filter(c => c.type === 'note')
    }));
    return;
  }

  if (req.method === 'DELETE') {
    const id = parseInt(parsed.query.id);
    const idx = (devStore.batch_content || []).findIndex(c => c.id === id);
    if (idx > -1) {
      devStore.batch_content.splice(idx, 1);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    }
    return;
  }
}

// ========== STUDENT: BATCH CONTENT ==========
if (pathname === '/student/batch-content' && req.method === 'GET') {
  const user = checkAuth(req);
  if (!user) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return;
  }

  const batchId = parseInt(parsed.query.batchId);
  
  // Check enrollment (simplified for dev)
  const isEnrolled = devStore.student_batches.some(
    sb => sb.student_id === user.id && sb.batch_id === batchId
  );

  if (!isEnrolled) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not enrolled in this batch' }));
    return;
  }

  const content = (devStore.batch_content || []).filter(c => c.batch_id === batchId);
  
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    videos: content.filter(c => c.type === 'video'),
    notes: content.filter(c => c.type === 'note')
  }));
  return;
}

  // ========== 404 - NOT FOUND ==========
  console.log('❌ 404 - No route matched for:', pathname);
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    error: 'Not found', 
    path: pathname,
    method: req.method,
    hint: 'Check the URL path'
  }));
});

server.listen(PORT, () => {
  console.log('');
  console.log('🚀 ==========================================');
  console.log('🚀 Dev API Server running at http://localhost:' + PORT);
  console.log('🚀 ==========================================');
  console.log('');
});