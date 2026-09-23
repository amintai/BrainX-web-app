// Minimal OpenAPI 3.1 document type — avoids adding openapi3-ts as a dependency
type OpenAPIObject = Record<string, unknown>;

const profileSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    email: { type: 'string', format: 'email' },
    full_name: { type: 'string', nullable: true },
    avatar_url: { type: 'string', format: 'uri', nullable: true },
    role: { type: 'string', enum: ['admin', 'manager', 'member'] },
    onboarding_completed_at: { type: 'string', format: 'date-time', nullable: true },
    created_at: { type: 'string', format: 'date-time' },
    updated_at: { type: 'string', format: 'date-time' },
  },
  required: ['id', 'email', 'role', 'created_at', 'updated_at'],
};

const successResponse = (dataSchema: object, description = 'Success') => ({
  description,
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: dataSchema,
        },
        required: ['success', 'data'],
      },
    },
  },
});

const errorResponse = (description: string) => ({
  description,
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
    },
  },
});

const bearerAuth = { bearerAuth: [] };

export const openApiSpec: OpenAPIObject = {
  openapi: '3.1.0',
  info: {
    title: 'BrainX API',
    version: '1.0.0',
    description: 'REST API for the BrainX application.',
  },
  servers: [{ url: '/api/v1', description: 'Current server' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Supabase JWT access token',
      },
    },
    schemas: {
      Profile: profileSchema,
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'UNAUTHORIZED' },
              message: { type: 'string', example: 'Authentication required' },
            },
            required: ['code', 'message'],
          },
          fields: {
            type: 'object',
            additionalProperties: { type: 'string' },
            description: 'Per-field validation errors (validation failures only)',
          },
        },
        required: ['success', 'error'],
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        description: 'Verifies API and database connectivity.',
        security: [],
        responses: {
          '200': successResponse(
            {
              type: 'object',
              properties: {
                status: { type: 'string', example: 'ok' },
                db: { type: 'string', example: 'connected' },
              },
            },
            'Service is healthy',
          ),
          '503': errorResponse('Database unreachable'),
        },
      },
    },

    '/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Get current user profile',
        security: [bearerAuth],
        responses: {
          '200': successResponse({ $ref: '#/components/schemas/Profile' }),
          '401': errorResponse('Unauthorized'),
        },
      },
      patch: {
        tags: ['Users'],
        summary: 'Update current user profile',
        security: [bearerAuth],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  full_name: { type: 'string', minLength: 1, maxLength: 100 },
                  avatar_url: { type: 'string', format: 'uri' },
                },
              },
            },
          },
        },
        responses: {
          '200': successResponse({ $ref: '#/components/schemas/Profile' }),
          '400': errorResponse('Validation error'),
          '401': errorResponse('Unauthorized'),
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Delete current user account',
        security: [bearerAuth],
        responses: {
          '204': { description: 'Account deleted' },
          '401': errorResponse('Unauthorized'),
        },
      },
    },

    '/users/me/onboarding/complete': {
      patch: {
        tags: ['Users'],
        summary: 'Mark onboarding as complete',
        security: [bearerAuth],
        responses: {
          '200': successResponse({ $ref: '#/components/schemas/Profile' }),
          '401': errorResponse('Unauthorized'),
        },
      },
    },

    '/users/me/avatar': {
      post: {
        tags: ['Users'],
        summary: 'Upload avatar image',
        security: [bearerAuth],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  avatar: {
                    type: 'string',
                    format: 'binary',
                    description: 'Image file (JPG, PNG, WebP — max 5 MB)',
                  },
                },
                required: ['avatar'],
              },
            },
          },
        },
        responses: {
          '200': successResponse({
            type: 'object',
            properties: { avatar_url: { type: 'string', format: 'uri' } },
          }),
          '400': errorResponse('Invalid file'),
          '401': errorResponse('Unauthorized'),
        },
      },
    },

    '/users': {
      get: {
        tags: ['Admin — Users'],
        summary: 'List all users',
        description: 'Admin only.',
        security: [bearerAuth],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20, maximum: 100 } },
        ],
        responses: {
          '200': successResponse({
            type: 'object',
            properties: {
              data: { type: 'array', items: { $ref: '#/components/schemas/Profile' } },
              total: { type: 'integer' },
              page: { type: 'integer' },
              limit: { type: 'integer' },
            },
          }),
          '401': errorResponse('Unauthorized'),
          '403': errorResponse('Forbidden — admin role required'),
        },
      },
    },

    '/users/{id}': {
      get: {
        tags: ['Admin — Users'],
        summary: 'Get user by ID',
        description: 'Admin only.',
        security: [bearerAuth],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: {
          '200': successResponse({ $ref: '#/components/schemas/Profile' }),
          '401': errorResponse('Unauthorized'),
          '403': errorResponse('Forbidden — admin role required'),
          '404': errorResponse('User not found'),
        },
      },
    },

    '/users/{id}/role': {
      patch: {
        tags: ['Admin — Users'],
        summary: 'Update user role',
        description: 'Admin only.',
        security: [bearerAuth],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  role: { type: 'string', enum: ['admin', 'manager', 'member'] },
                },
                required: ['role'],
              },
            },
          },
        },
        responses: {
          '200': successResponse({ $ref: '#/components/schemas/Profile' }),
          '400': errorResponse('Validation error'),
          '401': errorResponse('Unauthorized'),
          '403': errorResponse('Forbidden — admin role required'),
          '404': errorResponse('User not found'),
        },
      },
    },

    '/stats': {
      get: {
        tags: ['Admin — Stats'],
        summary: 'Get platform statistics',
        description: 'Admin only.',
        security: [bearerAuth],
        responses: {
          '200': successResponse({
            type: 'object',
            description: 'Aggregated platform stats',
          }),
          '401': errorResponse('Unauthorized'),
          '403': errorResponse('Forbidden — admin role required'),
        },
      },
    },
  },
};
