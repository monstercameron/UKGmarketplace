import swaggerJsdoc from 'swagger-jsdoc';
import dotenv from 'dotenv';

dotenv.config();

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'UKG Marketplace API',
            version: process.env.API_VERSION || 'v1',
            description: 'A comprehensive marketplace API for managing items, categories, and user communications',
            contact: {
                name: 'API Support',
                url: 'https://github.com/yourusername/ukg-marketplace'
            }
        },
        servers: [
            {
                url: `http://localhost:${process.env.PORT || 3000}`,
                description: 'Development server'
            }
        ],
        tags: [
            {
                name: 'Auth',
                description: 'User authentication and profile management endpoints'
            },
            {
                name: 'Items',
                description: 'Marketplace item management endpoints'
            },
            {
                name: 'Categories',
                description: 'Category management endpoints'
            },
            {
                name: 'Messages',
                description: 'User communication and messaging endpoints'
            }
        ],
        components: {
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        error: {
                            type: 'string',
                            description: 'Error type'
                        },
                        message: {
                            type: 'string',
                            description: 'Error message'
                        }
                    }
                },
                Item: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'Item unique identifier'
                        },
                        title: {
                            type: 'string',
                            description: 'Item title'
                        },
                        description: {
                            type: 'string',
                            description: 'Item description'
                        },
                        price: {
                            type: 'number',
                            description: 'Item price'
                        },
                        condition: {
                            type: 'string',
                            enum: ['new', 'like-new', 'good', 'fair', 'poor'],
                            description: 'Item condition'
                        },
                        location: {
                            type: 'string',
                            description: 'Item location'
                        },
                        categoryId: {
                            type: 'integer',
                            description: 'Category identifier'
                        }
                    }
                },
                Category: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'Category unique identifier'
                        },
                        name: {
                            type: 'string',
                            description: 'Category name'
                        },
                        description: {
                            type: 'string',
                            description: 'Category description'
                        },
                        parentId: {
                            type: 'integer',
                            nullable: true,
                            description: 'Parent category identifier'
                        }
                    }
                },
                Message: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'Message unique identifier'
                        },
                        senderEmail: {
                            type: 'string',
                            format: 'email',
                            description: 'Sender email address'
                        },
                        receiverEmail: {
                            type: 'string',
                            format: 'email',
                            description: 'Receiver email address'
                        },
                        itemId: {
                            type: 'integer',
                            description: 'Related item identifier'
                        },
                        message: {
                            type: 'string',
                            description: 'Message content'
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Message creation timestamp'
                        }
                    }
                }
            },
            responses: {
                Error400: {
                    description: 'Bad Request',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            }
                        }
                    }
                },
                Error404: {
                    description: 'Not Found',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            }
                        }
                    }
                },
                Error500: {
                    description: 'Internal Server Error',
                    content: {
                        'application/json': {
                            schema: {
                                $ref: '#/components/schemas/Error'
                            }
                        }
                    }
                }
            }
        }
    },
    apis: ['./src/api/routes/**/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec; 