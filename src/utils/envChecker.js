//src/utils/envChecker.js

const dotenv = require('dotenv');
dotenv.config();

/**
 * Checks for required environment variables and optionally exits the process if critical ones are missing
 * @param {boolean} enforceRequired - Whether to exit process if required variables are missing
 * @returns {Object} - Object containing status and missing variables
 */
const checkEnvVariables = (enforceRequired = false) => {
  const criticalVariables = [
    'MONGO_URI',
    'REFRESH_TOKEN_SECRET',
    'ACCESS_TOKEN_SECRET',
    'ACCESS_TOKEN_LIFE',
    'REFRESH_TOKEN_LIFE',
    'PORT',
    'NODE_ENV',
    'LOGGER_LEVEL',
  ];

  // Important but not strictly required
  const recommendedVariables = [
    'EMAIL_SERVICE',
    'EMAIL_HOST',
    'EMAIL_PORT',
    'EMAIL_USER',
    'EMAIL_PASS',
    'EMAIL_SECURE',
    'EMAIL_POOL',
    'EMAIL_MAX_MESSAGES',
    'EMAIL_MAX_CONNECTIONS',
    'REDIS_HOST',
    'REDIS_PORT',
    'REDIS_PASSWORD',
    'FRONTEND_URL',
    'FRONTEND_URL_CORS',
    'INVITE_TOKEN_SECRET',
    'INVITE_TOKEN_LIFE',
  ];

  // Validation for specific variable formats
  const validateVariables = vars => {
    const issues = [];
    vars.forEach(v => {
      const value = process.env[v];
      if (value) {
        // Validate token lifetimes
        if (v.endsWith('_TOKEN_LIFE') && !value.match(/^\d+[dhms]$/)) {
          issues.push(`${v} must be in format: number + d/h/m/s (e.g., 7d, 24h, 60m)`);
        }
        // Validate URIs and URLs
        if (v.endsWith('_URI') || v.endsWith('_URL')) {
          try {
            new URL(value);
          } catch (err) {
            issues.push(`${v} must be a valid URL (e.g., http://example.com)`);
          }
        }
        // Validate ports
        if (v.endsWith('_PORT')) {
          const port = parseInt(value);
          if (isNaN(port) || port < 1 || port > 65535) {
            issues.push(`${v} must be a valid port number between 1 and 65535`);
          }
        }
        // Validate emails
        if (v.endsWith('_EMAIL') || v === 'EMAIL_USER') {
          if (!value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            issues.push(`${v} must be a valid email address`);
          }
        }
        // Validate security tokens and secrets
        if (v.endsWith('_SECRET') || v.endsWith('_TOKEN_SECRET')) {
          if (value.length < 32) {
            issues.push(`${v} must be at least 32 characters long for security`);
          }
          if (value.match(/^[a-zA-Z0-9]+$/) && !value.match(/^[a-zA-Z0-9]{64,}$/)) {
            issues.push(`${v} should be more complex or at least 64 chars if only alphanumeric`);
          }
        }
      }
    });
    return issues;
  };

  const validationIssues = [
    ...validateVariables(criticalVariables),
    ...validateVariables(recommendedVariables),
  ];

  if (validationIssues.length > 0) {
    console.warn('\n⚠️ Environment variable validation issues:');
    validationIssues.forEach(issue => console.warn(`   - ${issue}`));
  }

  // Feature-specific variables grouped by feature
  const featureSpecificVariables = {
    Migration: [
      'SYNC_MODE',
      'DRY_RUN',
      'SKIP_BACKUP',
      'FORCE_NO_TRANSACTION',
      'PRUNE_ORPHANS',
      'QUIET',
    ],
    'Outlook Integration': [
      'OUTLOOK_REDIRECT_URI',
      'OUTLOOK_GRAPH_URL',
      'OUTLOOK_CLIENT_ID',
      'OUTLOOK_CLIENT_SECRET',
      'OUTLOOK_TENANT_ID',
      'OUTLOOK_AUTHORITY',
      'OUTLOOK_FRONT_REDIRECT_URL',
      'WEBHOOK_BASE_URL',
    ],
    'CareerBuilder Integration': ['CB_USERNAME', 'CB_PASSWORD', 'CB_EMAIL', 'CB_API_URL'],
    'Monster Integration': [
      'MONSTER_CLIENT_ID',
      'MONSTER_CLIENT_SECRET',
      'MONSTER_AUTH_HOST',
      'MONSTER_CANDIDATE_HOST',
      'MONSTER_VERSION_NO',
      'MONSTER_CAT_TOKEN',
    ],
    'OpenAI Integration': ['OPENAI_API_KEY'],
    Scheduler: ['REPEAT_JOB_CRON'],
    'Email Verification': ['EMAIL_VERIFIER_URL', 'EMAIL_VERIFIER_KEY'],
  };

  const missingCritical = criticalVariables.filter(variable => !process.env[variable]);
  const missingRecommended = recommendedVariables.filter(variable => !process.env[variable]);

  // Check feature-specific variables
  const missingFeatureSpecific = {};
  Object.entries(featureSpecificVariables).forEach(([feature, variables]) => {
    const missing = variables.filter(variable => !process.env[variable]);
    if (missing.length > 0) {
      missingFeatureSpecific[feature] = missing;
    }
  });

  if (missingCritical.length > 0) {
    console.error(`❌ Missing CRITICAL environment variables: ${missingCritical.join(', ')}`);

    if (enforceRequired) {
      console.error('Application cannot start without critical environment variables.');
      process.exit(1);
    }
  }

  if (missingRecommended.length > 0) {
    console.warn(`⚠️ Missing RECOMMENDED environment variables: ${missingRecommended.join(', ')}`);
  }

  // Log missing feature-specific variables
  Object.entries(missingFeatureSpecific).forEach(([feature, variables]) => {
    console.warn(`⚠️ Missing ${feature} variables: ${variables.join(', ')}`);
  });

  if (
    missingCritical.length === 0 &&
    missingRecommended.length === 0 &&
    Object.keys(missingFeatureSpecific).length === 0
  ) {
    console.log('✅ All environment variables are set.');
  }

  // Check for deprecated or invalid variables
  const knownVariables = new Set([
    ...criticalVariables,
    ...recommendedVariables,
    ...Object.values(featureSpecificVariables).flat(),
  ]);

  const unknownVariables = Object.keys(process.env)
    .filter(
      key =>
        key.startsWith('MONGO_') ||
        key.endsWith('_TOKEN') ||
        key.endsWith('_SECRET') ||
        key.endsWith('_URL') ||
        key.endsWith('_URI')
    )
    .filter(key => !knownVariables.has(key));

  if (unknownVariables.length > 0) {
    console.warn('\n⚠️ Unknown or possibly deprecated environment variables found:');
    unknownVariables.forEach(v => console.warn(`   - ${v}`));
  }

  // Check for potentially insecure values (skip Google OAuth secrets for now)
  const securityWarnings = Object.entries(process.env)
    .filter(([key]) => key.endsWith('_SECRET') || key.endsWith('_TOKEN_SECRET'))
    .filter(([key]) => key !== 'GOOGLE_CLIENT_SECRET') // Skip Google OAuth validation for development
    .filter(
      ([, value]) =>
        value &&
        (value.includes('example') ||
          value.includes('test') ||
          value.includes('dev') ||
          value.toLowerCase().includes('password') ||
          value.toLowerCase().includes('secret'))
    )
    .map(([key]) => key);

  if (securityWarnings.length > 0) {
    console.warn('\n⚠️ Potentially insecure values detected:');
    securityWarnings.forEach(v => console.warn(`   - ${v} appears to contain an insecure value`));
  }

  return {
    success:
      missingCritical.length === 0 &&
      validationIssues.length === 0 &&
      securityWarnings.length === 0,
    missingCritical,
    missingRecommended,
    missingFeatureSpecific,
    validationIssues,
    unknownVariables,
    securityWarnings,
  };
};

module.exports = checkEnvVariables;
