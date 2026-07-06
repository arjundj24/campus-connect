const dns = require('dns');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const clubRoutes = require('./routes/clubRoutes');
const eventRoutes = require('./routes/eventRoutes');
const registrationRoutes = require('./routes/registrationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const clubRequestRoutes = require('./routes/clubRequestRoutes');
const memberRoutes = require('./routes/memberRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', function (req, res) {
  res.send('Campus Connect Backend API is running');
});

app.get('/api/health', function (req, res) {
  res.json({
    success: true,
    message: 'Campus Connect backend is healthy'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/clubs', clubRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/club-requests', clubRequestRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/assignments', assignmentRoutes);

async function startServer() {
  try {
    if (!process.env.MONGO_URI) {
      console.warn('MONGO_URI is missing. Add it inside your .env file.');
    } else {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('MongoDB connected successfully');
    }

    app.listen(PORT, function () {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Server failed to start:', error.message);
    process.exit(1);
  }
}

startServer();
