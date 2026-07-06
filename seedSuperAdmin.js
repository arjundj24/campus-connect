const dns = require('dns');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
dotenv.config();

async function seedSuperAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    const name = process.env.SUPER_ADMIN_NAME || 'Campus Super Admin';
    const email = process.env.SUPER_ADMIN_EMAIL;
    const password = process.env.SUPER_ADMIN_PASSWORD;

    if (!email || !password) {
      console.error('SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD are required in .env');
      process.exit(1);
    }

    const existingSuperAdmin = await User.findOne({ email: email });

    if (existingSuperAdmin) {
      console.log('Super admin already exists:', email);
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name: name,
      email: email,
      password: hashedPassword,
      role: 'superadmin',
      club: null
    });

    console.log('Super admin created successfully:', email);
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed super admin:', error.message);
    process.exit(1);
  }
}

seedSuperAdmin();