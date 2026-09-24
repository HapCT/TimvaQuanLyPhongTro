const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const path = require('path');
require('dotenv').config();

const serviceAccount = require(path.join(__dirname, '..', 'firebase-service-account.json'));

const app = getApps().length
  ? getApps()[0]
  : initializeApp({ credential: cert(serviceAccount) });

module.exports = { auth: getAuth(app) };
