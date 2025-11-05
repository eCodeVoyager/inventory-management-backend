// src/server.js

const app = require('./app');
const ConnectDB = require('./config/db');
const server = require('http').createServer(app);
const checkEnvVariables = require('./utils/envChecker');

const envCheck = checkEnvVariables(true);

if (envCheck.success) {
  ConnectDB()
    .then(async () => {
      console.log('✅ Connected to MongoDB');

      const PORT = process.env.PORT || 3000;
      server.listen(PORT, () => {
        console.log(`🚀 Server is running on port ${PORT}`);
      }).on('error', (error) => {
        console.error('Server failed to start:', error);
        console.error('Server startup error details:', error);
        process.exit(1);
      });
      ['SIGINT', 'SIGTERM', 'SIGQUIT'].forEach(signal => {
        process.on(signal, async () => {
          console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);

          // First, wait for workers to clean up (handled in initialize.js)
          console.log('Waiting for workers to finish...');
          await new Promise(resolve => setTimeout(resolve, 5000));

          // Then close the server
          console.log('Closing HTTP server...');
          server.close(() => {
            console.log('🛑 HTTP server closed.');

            // Final delay to ensure all console messages are printed
            setTimeout(() => {
              console.log('👋 Process exiting...');
              process.exit(0);
            }, 1000);
          });
        });
      });
    })
    .catch(err => {
      console.error('❌ Database connection failed:', err);
      console.error('Database connection error details:', err);
      process.exit(1);
    });
} else {
  console.error('❌ Environment variable check failed');
  if (envCheck.missingCritical?.length > 0) {
    console.error('Missing critical variables:', envCheck.missingCritical);
  }
  if (envCheck.validationIssues?.length > 0) {
    console.error('Validation issues:', envCheck.validationIssues);
  }
  if (envCheck.securityWarnings?.length > 0) {
    console.error('Security warnings:', envCheck.securityWarnings);
  }
  process.exit(1);
}
