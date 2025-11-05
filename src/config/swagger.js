const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Load comprehensive API documentation
const loadComprehensiveApiDocs = () => {
  try {
    const docsPath = path.join(__dirname, '../docs/api-documentation.json');
    const docsContent = fs.readFileSync(docsPath, 'utf8');
    return JSON.parse(docsContent);
  } catch (error) {
    console.warn('⚠️ Could not load comprehensive API documentation, falling back to generated docs');
    return null;
  }
};

// Generate ETag for documentation
const generateETag = (content) => {
  return crypto.createHash('md5').update(JSON.stringify(content)).digest('hex');
};

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Searlo API',
      version: '1.0.0',
      description: 'API documentation for Searlo - Advanced Search Platform',
      contact: {
        name: 'Searlo Team',
        email: 'support@searlo.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.BACKEND_URL || 'http://localhost:3001',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'User ID'
            },
            name: {
              type: 'string',
              description: 'User full name'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            googleId: {
              type: 'string',
              description: 'Google OAuth ID'
            },
            profilePicture: {
              type: 'string',
              format: 'uri',
              description: 'Profile picture URL'
            },
            authProvider: {
              type: 'string',
              enum: ['google'],
              description: 'Authentication provider'
            },
            isEmailVerified: {
              type: 'boolean',
              description: 'Email verification status'
            },
            isDeleted: {
              type: 'boolean',
              description: 'User deletion status'
            },
            credits: {
              type: 'number',
              description: 'User credits for API usage'
            },
            lastLogin: {
              type: 'string',
              format: 'date-time',
              description: 'Last login timestamp'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp'
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        SearchResult: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'Search result title'
            },
            link: {
              type: 'string',
              format: 'uri',
              description: 'Search result URL'
            },
            snippet: {
              type: 'string',
              description: 'Search result snippet/description'
            },
            displayLink: {
              type: 'string',
              description: 'Display URL'
            }
          }
        },
        SearchResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Request success status'
            },
            data: {
              type: 'object',
              properties: {
                items: {
                  type: 'array',
                  items: {
                    $ref: '#/components/schemas/SearchResult'
                  }
                },
                searchInformation: {
                  type: 'object',
                  properties: {
                    totalResults: {
                      type: 'string',
                      description: 'Total number of results'
                    },
                    searchTime: {
                      type: 'number',
                      description: 'Search execution time'
                    }
                  }
                }
              }
            },
            message: {
              type: 'string',
              description: 'Response message'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: 'Error message'
            },
            error: {
              type: 'string',
              description: 'Error details'
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './src/modules/*/routes/*.js',
    './src/modules/*/controllers/*.js'
  ]
};

const specs = swaggerJSDoc(options);
const comprehensiveApiDocs = loadComprehensiveApiDocs();

const swaggerSetup = (app) => {
  if (process.env.ENABLE_DOCS === 'true') {
    // Use comprehensive documentation if available, otherwise fall back to generated specs
    const docsToServe = comprehensiveApiDocs || specs;
    
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(docsToServe, {
      explorer: true,
      customCss: '.swagger-ui .topbar { display: none }',
      customSiteTitle: 'Searlo API Documentation',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        tryItOutEnabled: true,
        requestInterceptor: (req) => {
          // Add timestamp to requests for better debugging
          req.headers['X-Request-Time'] = new Date().toISOString();
          return req;
        }
      }
    }));
    
    // Enhanced JSON endpoint for the swagger spec with proper headers and caching
    app.get('/api-docs.json', (req, res) => {
      const docsToServe = comprehensiveApiDocs || specs;
      const etag = generateETag(docsToServe);
      const lastModified = new Date().toUTCString();
      
      // Set proper Content-Type header
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      
      // Set caching headers for optimal performance
      res.setHeader('Cache-Control', 'public, max-age=3600, must-revalidate'); // Cache for 1 hour
      res.setHeader('ETag', `"${etag}"`);
      res.setHeader('Last-Modified', lastModified);
      
      // Add CORS headers for cross-origin requests
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, If-None-Match, If-Modified-Since');
      
      // Support for conditional requests (ETag/Last-Modified)
      const clientETag = req.headers['if-none-match'];
      const clientLastModified = req.headers['if-modified-since'];
      
      // Check if client has cached version
      if (clientETag === `"${etag}"` || clientLastModified === lastModified) {
        res.status(304).end(); // Not Modified
        return;
      }
      
      // Add metadata to response
      const responseData = {
        ...docsToServe,
        'x-generated-at': new Date().toISOString(),
        'x-documentation-version': '1.0.0',
        'x-api-status': 'active'
      };
      
      res.json(responseData);
    });
    
    // Health check endpoint for documentation service
    app.get('/api-docs/health', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.json({
        status: 'healthy',
        documentation: {
          comprehensive: !!comprehensiveApiDocs,
          fallback: !comprehensiveApiDocs,
          lastUpdated: new Date().toISOString()
        },
        endpoints: {
          ui: '/api-docs',
          json: '/api-docs.json',
          health: '/api-docs/health'
        }
      });
    });
    
    console.log('📚 API Documentation available at /api-docs');
    console.log('📄 JSON specification available at /api-docs.json');
    console.log('🏥 Documentation health check at /api-docs/health');
    
    if (comprehensiveApiDocs) {
      console.log('✅ Using comprehensive API documentation');
    } else {
      console.log('⚠️ Using fallback generated documentation');
    }
  }
};

module.exports = { swaggerSetup, specs };