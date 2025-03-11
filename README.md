# 🛍️ UKG Marketplace

**Missing the centralized marketplace chat from Slack? We've got you covered!**

## 👋 Ah, Remember When...

Remember when finding that standing desk, selling your old monitor, or swapping office supplies was as easy as posting in the Slack marketplace channel? Those were the days! Since we've moved away from that centralized hub, things just haven't been the same.

**That's why we built UKG Marketplace** - a simple, company-wide solution to bring back the convenience of having one place to buy, sell, and trade items with colleagues!

## ✨ Features That'll Make Your Life Easier

### 🛒 Easy Buy & Sell Experience
- **Simple Item Listings** - Post items you want to sell or trade
- **Company-wide Access** - Connect with colleagues across departments
- **Search & Filter** - Find exactly what you need without hassle
- **Item Categories** - Browse by item types and more

### 🚀 Streamlined Marketplace Functions
- **Basic Listings** - Add descriptions and details about your items
- **Item Status** - See what's available and what's been sold
- **Contact Info** - Connect with sellers directly
- **Clean Interface** - No complicated bells and whistles - just what you need

## 📚 Documentation

All documentation lives in the `/docs` directory:
- **Go Style Guide** (`go-style-guide.md`) - Coding standards for contributors
- Additional documentation will be added as the project evolves

### 🔍 API Documentation (Swagger)

The UKG Marketplace provides interactive API documentation using Swagger UI:

- **Access URL**: `http://localhost:3001/api-docs` (when running locally)
- **Features**:
  - Interactive testing of all API endpoints
  - Request/response schema documentation
  - Authentication documentation
  - API models and data structures

To access Swagger documentation:
1. Ensure the server is running
2. Navigate to `http://localhost:3001/api-docs` in your browser
3. Explore and test the available API endpoints

### 📰 RSS Feeds

UKG Marketplace provides RSS feeds to stay updated with the latest marketplace items:

- **Main Feed**: `http://localhost:3001/api/v1/rss`
  - Contains the latest marketplace items
  - Updates automatically as new items are added
  
- **Debug Endpoint**: `http://localhost:3001/api/v1/rss/debug`
  - Provides technical information about the RSS feed
  - Useful for troubleshooting feed issues

You can subscribe to these feeds using any RSS reader application to stay updated with new marketplace listings.

## 🚀 Getting Started

Want to run UKG Marketplace locally? It's easy!

```bash
# Clone the repository
git clone https://github.com/monstercameron/UKGmarketplace.git

# Install dependencies
npm install

# Configure your environment
cp .env.example .env

# Initialize the database (required)
npm run db:init

# Seed the database with sample data (optional)
npm run db:seed

# Start the development server with live CSS building
npm run dev:full
```

The server will be available at `http://localhost:3001` (or your configured PORT).

## 🧰 Tech Stack

Built with modern, reliable technologies:
- **Node.js & Express** - Rock-solid backend
- **SQLite** - Simple but powerful database
- **TailwindCSS** - Beautiful, responsive styling
- **And more!** - Check package.json for the full list

## 🛠️ Future Roadmap

We're just getting started! Some features we're considering for future releases:
- Favorites system
- In-app messaging
- User ratings
- Department highlights
- And more based on your feedback!

## 🤝 Need Help or Have Ideas?

This project exists because we all missed having a centralized marketplace. If you:

- 🐛 Found a bug
- 💡 Have a feature idea
- 🙋 Want to contribute
- 🤔 Just have questions

Contact **Cam Cameron** at [cam.cameron@ukg.com](mailto:cam.cameron@ukg.com)

## 📱 Repository

Check out the project on GitHub: [https://github.com/monstercameron/UKGmarketplace](https://github.com/monstercameron/UKGmarketplace)

---

<p align="center">
  <i>This project was fully vibe coded with Cursor AI</i>
</p>

<p align="center">
  <strong>UKG Marketplace</strong> - One place for all your workplace marketplace needs!
</p>
