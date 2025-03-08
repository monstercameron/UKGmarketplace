# UKG Marketplace API

A comprehensive marketplace API built with Node.js, Express, and SQLite.

## Features

- Item management with categories
- Messaging system between users
- Image upload support
- Payment method integration
- Search and filtering capabilities
- Real-time notifications

## Prerequisites

- Node.js >= 18.0.0
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ukg-marketplace.git
cd ukg-marketplace
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
PORT=3000
DB_PATH=./database.sqlite
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
```

4. Initialize the database:
```bash
npm run db:init-and-seed
```

## Scripts

The project includes various utility scripts in the `scripts/` directory:

- Database management (initialization, seeding, resetting)
- Environment configuration
- Testing utilities

For more information, see the [scripts README](./scripts/README.md).

## Running the Application

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Documentation

### Items

#### Create Item
- **POST** `/api/v1/items`
- Body:
```json
{
  "categoryId": "number",
  "title": "string",
  "description": "string",
  "price": "number",
  "condition": "string",
  "location": "string",
  "paymentMethods": ["number"]
}
```
- Response includes a `managementKey` that should be saved for future item management

#### Get Item
- **GET** `/api/v1/items/:id`

#### Update Item
- **PUT** `/api/v1/items/:id`
- Headers: `X-Management-Key: <management_key>`
- Body: Same as create item (all fields optional)

#### Delete Item
- **DELETE** `/api/v1/items/:id`
- Headers: `X-Management-Key: <management_key>`

#### Add Item Image
- **POST** `/api/v1/items/:id/images`
- Headers: `X-Management-Key: <management_key>`
- Body:
```json
{
  "imageUrl": "string",
  "isPrimary": "boolean"
}
```

#### Remove Item Image
- **DELETE** `/api/v1/items/:id/images/:imageId`
- Headers: `X-Management-Key: <management_key>`

### Categories

#### Get Categories
- **GET** `/api/v1/categories`

#### Get Category Tree
- **GET** `/api/v1/categories/tree`

### Messages

#### Send Message
- **POST** `/api/v1/messages`
- Body:
```json
{
  "senderEmail": "string",
  "receiverEmail": "string",
  "itemId": "number",
  "message": "string"
}
```

#### Get Conversations
- **GET** `/api/v1/messages/conversations?email=<email>`

#### Get Conversation
- **GET** `/api/v1/messages/conversation/:itemId/:email?email=<current_email>`

#### Mark Message as Read
- **PUT** `/api/v1/messages/:messageId/read?email=<email>`

#### Mark Conversation as Read
- **PUT** `/api/v1/messages/conversation/:itemId/:email/read?currentEmail=<current_email>`

#### Get Unread Count
- **GET** `/api/v1/messages/unread/count?email=<email>`

#### Delete Message
- **DELETE** `/api/v1/messages/:messageId?email=<email>`

#### Delete Conversation
- **DELETE** `/api/v1/messages/conversation/:itemId/:email?currentEmail=<current_email>`

## Error Handling

The API uses a consistent error response format:

```json
{
  "error": "string",
  "message": "string"
}
```

Common HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized (Invalid management key)
- 404: Not Found
- 500: Internal Server Error

## Security

- Management key-based item access control
- CORS enabled
- Helmet security headers
- Input validation
- Rate limiting (coming soon)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```
PORT=3000
NODE_ENV=development
SMTP_HOST=your-smtp-host
SMTP_PORT=your-smtp-port
SMTP_USER=your-email
SMTP_PASS=your-password
DB_PATH=./database.sqlite
```

## Development

Run the development server with hot-reloading and Tailwind CSS watching:
```bash
npm run dev:full
```

Or run individual commands:
- `npm run dev` - Start development server with nodemon
- `npm run watch:css` - Watch and compile Tailwind CSS
- `npm run build:css` - Build and minify CSS for production
- `npm start` - Start production server

## API Endpoints

### Items

- `POST /api/items` - Create a new item
- `GET /api/items` - Get all items
- `GET /api/items/:id` - Get a specific item
- `PUT /api/items/:id` - Update an item
- `DELETE /api/items/:id` - Delete an item

### Subscriptions

- `POST /api/subscribe` - Subscribe to notifications
  - Body: `{ "email": "user@example.com", "frequency": "realtime|daily|weekly" }`

### Watching Items

- `POST /api/watch/:id` - Watch a specific item
  - Body: `{ "email": "user@example.com" }`

## Frontend Integration

The API serves static files from the `public` directory. Place your React application build files there for deployment.

### CSS Structure

Tailwind CSS is configured and ready to use. The main CSS file is located at:
- Source: `public/css/styles.css`
- Output: `public/css/output.css`

Include the output CSS file in your HTML: 