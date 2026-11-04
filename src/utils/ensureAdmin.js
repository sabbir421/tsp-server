const bcrypt = require('bcryptjs');
const { AdminUser } = require('../schema');

const MIN_PASSWORD_LENGTH = 12;

// Creates the first super admin from ADMIN_EMAIL / ADMIN_PASSWORD. Never changes an existing account.
const ensureAdmin = async () => {
  const email = (process.env.ADMIN_EMAIL || '').toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || '';

  if (email && password) {
    if (password.length < MIN_PASSWORD_LENGTH) {
      console.warn(`ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters. Admin account not created.`);
    } else if (!(await AdminUser.findOne({ where: { email } }))) {
      await AdminUser.create({
        fullName: 'Platform Administrator',
        email,
        password: await bcrypt.hash(password, 12),
        role: 'super_admin',
        isActive: true,
      });
      console.log(`Created super admin account for ${email}`);
    }
  }

  if ((await AdminUser.count()) === 0) {
    console.warn('No admin accounts exist. Set ADMIN_EMAIL and ADMIN_PASSWORD and restart to create one.');
  }
};

module.exports = ensureAdmin;
