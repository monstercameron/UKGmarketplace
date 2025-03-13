/**
 * @fileoverview Database seeding script to populate tables with test data
 */

import { db, runAsync, allAsync, generateManagementKey, tablesInitialized } from './schema.js';
import { initializeDatabase } from './init-db.js';
import { handle } from '../utils/result.js';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

/**
 * Seed the database with example/demo data
 * This function assumes the database has already been initialized with essential records
 */
export async function seedExampleData() {
    try {
        // Wait for tables to be initialized
        await tablesInitialized;
        
        // Ensure essential records are in place
        await initializeDatabase();
        
        // Categories - Extensive list with main categories and subcategories
        const categories = [
            // Electronics and Technology
            { name: 'Computers & Laptops', slug: 'computers-laptops', description: 'Desktop computers, laptops, and accessories' },
            { name: 'Smartphones', slug: 'smartphones', description: 'Mobile phones and accessories' },
            { name: 'TVs & Monitors', slug: 'tvs-monitors', description: 'Television sets, monitors, and display equipment' },
            { name: 'Audio Equipment', slug: 'audio-equipment', description: 'Speakers, headphones, and audio accessories' },
            { name: 'Gaming', slug: 'gaming', description: 'Video games, consoles, and gaming accessories' },
            { name: 'Cameras', slug: 'cameras', description: 'Digital cameras, lenses, and photography equipment' },
            
            // Home and Living
            { name: 'Furniture', slug: 'furniture', description: 'Home and office furniture' },
            { name: 'Home Appliances', slug: 'home-appliances', description: 'Kitchen and household appliances' },
            { name: 'Kitchen & Dining', slug: 'kitchen-dining', description: 'Cookware, utensils, and kitchen accessories' },
            { name: 'Home Decor', slug: 'home-decor', description: 'Decorative items for the home' },
            
            // Real Estate
            { name: 'Housing Rentals', slug: 'housing-rentals', description: 'Apartments and houses for rent' },
            { name: 'Real Estate for Sale', slug: 'real-estate-sale', description: 'Properties for sale' },
            { name: 'Roommates & Shared Living', slug: 'roommates', description: 'Roommate opportunities and shared accommodations' },
            
            // Vehicles and Transportation
            { name: 'Cars & Trucks', slug: 'cars-trucks', description: 'Automobiles for sale or rent' },
            { name: 'Motorcycles', slug: 'motorcycles', description: 'Motorcycles and related equipment' },
            { name: 'Bicycles', slug: 'bicycles', description: 'Bicycles and cycling accessories' },
            
            // Personal Items
            { name: 'Clothing & Apparel', slug: 'clothing', description: 'Clothes, shoes, and fashion accessories' },
            { name: 'Jewelry & Watches', slug: 'jewelry-watches', description: 'Fine jewelry, watches, and accessories' },
            { name: 'Bags & Luggage', slug: 'bags-luggage', description: 'Backpacks, purses, suitcases, and travel accessories' },
            
            // Entertainment and Media
            { name: 'Books & Magazines', slug: 'books', description: 'Books, textbooks, and publications' },
            { name: 'Movies & Music', slug: 'movies-music', description: 'DVDs, CDs, vinyl records, and digital media' },
            { name: 'Musical Instruments', slug: 'musical-instruments', description: 'Guitars, pianos, and other instruments' },
            
            // Sports and Outdoors
            { name: 'Sports Equipment', slug: 'sports-equipment', description: 'Athletic gear and sports accessories' },
            { name: 'Outdoor Recreation', slug: 'outdoor-recreation', description: 'Camping, hiking, and outdoor gear' },
            { name: 'Fitness & Exercise', slug: 'fitness', description: 'Exercise equipment and fitness accessories' },
            
            // Tickets and Events
            { name: 'Event Tickets', slug: 'event-tickets', description: 'Tickets for concerts, sports, and entertainment events' },
            { name: 'Travel Tickets', slug: 'travel-tickets', description: 'Airline tickets and travel vouchers' },
            
            // Collectibles and Hobbies
            { name: 'Collectibles', slug: 'collectibles', description: 'Rare items, memorabilia, and collectibles' },
            { name: 'Arts & Crafts', slug: 'arts-crafts', description: 'Art supplies and handmade items' },
            { name: 'Toys & Games', slug: 'toys-games', description: 'Board games, toys, and recreational items' },
            
            // Services
            { name: 'Professional Services', slug: 'professional-services', description: 'Business and professional services' },
            { name: 'Tutoring & Lessons', slug: 'tutoring-lessons', description: 'Educational services and private lessons' },
            
            // Miscellaneous
            { name: 'Free Items', slug: 'free-items', description: 'Items being given away for free' },
            { name: 'Other', slug: 'other', description: 'Items that don\'t fit in other categories' }
        ];

        for (const category of categories) {
            await runAsync(
                'INSERT OR IGNORE INTO categories (name, slug, description) VALUES (?, ?, ?)',
                [category.name, category.slug, category.description]
            );
        }

        // Users
        const users = [
            { username: 'john_doe', email: 'john@example.com', password: 'password123', location: 'New York' },
            { username: 'jane_smith', email: 'jane@example.com', password: 'password123', location: 'Los Angeles' },
            { username: 'bob_wilson', email: 'bob@example.com', password: 'password123', location: 'Chicago' }
        ];

        for (const user of users) {
            const passwordHash = await bcrypt.hash(user.password, SALT_ROUNDS);
            await runAsync(
                'INSERT OR IGNORE INTO users (username, email, password_hash, location) VALUES (?, ?, ?, ?)',
                [user.username, user.email, passwordHash, user.location]
            );
        }

        // Items
        const sampleItems = [
            // Electronics and Technology
            // Computers & Laptops (Category 1)
            { title: 'Dell XPS 15 Laptop', description: 'Powerful laptop with Intel i7 and 16GB RAM.', price: 1299.99, condition: 'like_new', location: 'San Francisco', categoryId: 1, userId: 1 },
            { title: 'Apple MacBook Pro 16"', description: 'High performance MacBook Pro with M1 Pro chip, 32GB RAM.', price: 2499.99, condition: 'new', location: 'New York', categoryId: 1, userId: 2 },

            // Smartphones (Category 2)
            { title: 'Samsung Galaxy S21 Ultra', description: 'Latest flagship with high-res camera.', price: 1199.99, condition: 'like_new', location: 'Los Angeles', categoryId: 2, userId: 3 },
            { title: 'iPhone 13', description: 'Sleek design with advanced camera features.', price: 899.99, condition: 'good', location: 'Chicago', categoryId: 2, userId: 1 },

            // TVs & Monitors (Category 3)
            { title: 'LG OLED TV 55"', description: '55-inch OLED TV with deep blacks.', price: 1499.99, condition: 'new', location: 'Miami', categoryId: 3, userId: 2 },
            { title: 'Dell UltraSharp Monitor', description: '27-inch 4K monitor with excellent color accuracy.', price: 499.99, condition: 'new', location: 'Seattle', categoryId: 3, userId: 3 },

            // Audio Equipment (Category 4)
            { title: 'Bose QuietComfort 35 II', description: 'Noise-cancelling wireless headphones in excellent condition.', price: 299.99, condition: 'like_new', location: 'Boston', categoryId: 4, userId: 1 },
            { title: 'Sonos One Smart Speaker', description: 'Voice-controlled speaker with rich sound quality.', price: 199.99, condition: 'good', location: 'San Diego', categoryId: 4, userId: 2 },

            // Gaming (Category 5)
            { title: 'PlayStation 5 Console', description: 'Next-gen console, comes with one controller.', price: 499.99, condition: 'new', location: 'Houston', categoryId: 5, userId: 3 },
            { title: 'Xbox Series X', description: 'Powerful gaming console for immersive play.', price: 499.99, condition: 'new', location: 'Phoenix', categoryId: 5, userId: 1 },

            // Cameras (Category 6)
            { title: 'Canon EOS R6', description: 'Mirrorless camera with excellent low-light performance.', price: 2499.99, condition: 'like_new', location: 'Denver', categoryId: 6, userId: 2 },
            { title: 'Nikon D850', description: 'High-resolution DSLR ideal for professionals.', price: 2799.99, condition: 'good', location: 'Atlanta', categoryId: 6, userId: 3 },

            // Home and Living - Furniture (Category 7)
            { title: 'Modern Leather Sofa', description: 'Comfortable modern sofa in great condition.', price: 899.99, condition: 'good', location: 'Los Angeles', categoryId: 7, userId: 1 },
            { title: 'Wooden Dining Table', description: 'Sturdy table with a natural finish.', price: 499.99, condition: 'like_new', location: 'San Francisco', categoryId: 7, userId: 2 },

            // Home Appliances (Category 8)
            { title: 'KitchenAid Stand Mixer', description: 'Powerful mixer for versatile kitchen tasks.', price: 399.99, condition: 'new', location: 'Chicago', categoryId: 8, userId: 3 },
            { title: 'Dyson Vacuum Cleaner', description: 'High-powered vacuum with HEPA filtration.', price: 299.99, condition: 'like_new', location: 'New York', categoryId: 8, userId: 1 },

            // Kitchen & Dining (Category 9)
            { title: 'Ceramic Dinnerware Set', description: 'Elegant set for six, dishwasher safe.', price: 149.99, condition: 'good', location: 'Boston', categoryId: 9, userId: 2 },
            { title: 'Stainless Steel Cookware', description: '10-piece non-stick cookware set.', price: 199.99, condition: 'new', location: 'Miami', categoryId: 9, userId: 3 },

            // Home Decor (Category 10)
            { title: 'Abstract Wall Art', description: 'Large canvas painting to brighten any room.', price: 249.99, condition: 'good', location: 'Seattle', categoryId: 10, userId: 1 },
            { title: 'Vintage Clock', description: 'Antique clock with a rustic design.', price: 129.99, condition: 'like_new', location: 'Denver', categoryId: 10, userId: 2 },

            // Real Estate - Housing Rentals (Category 11)
            { title: '2-Bedroom Apartment', description: 'Spacious apartment downtown.', price: 1500.00, condition: 'new', location: 'New York', categoryId: 11, userId: 3 },
            { title: 'Cozy Studio', description: 'Affordable studio apartment with modern amenities.', price: 900.00, condition: 'good', location: 'Chicago', categoryId: 11, userId: 1 },

            // Real Estate for Sale (Category 12)
            { title: 'Suburban Family Home', description: 'Beautiful 4-bedroom home in a quiet neighborhood.', price: 350000.00, condition: 'new', location: 'Los Angeles', categoryId: 12, userId: 2 },
            { title: 'Luxury Condo', description: 'Modern condo with stunning city views.', price: 500000.00, condition: 'like_new', location: 'Miami', categoryId: 12, userId: 3 },

            // Roommates & Shared Living (Category 13)
            { title: 'Room in Shared Apartment', description: 'Spacious room in a friendly shared apartment.', price: 600.00, condition: 'new', location: 'San Francisco', categoryId: 13, userId: 1 },
            { title: 'Co-Living Space', description: 'Modern co-living space with communal areas.', price: 750.00, condition: 'good', location: 'New York', categoryId: 13, userId: 2 },

            // Vehicles - Cars & Trucks (Category 14)
            { title: '2018 Toyota Camry', description: 'Well-maintained sedan with low mileage.', price: 15999.99, condition: 'good', location: 'Los Angeles', categoryId: 14, userId: 3 },
            { title: 'Ford F-150 Pickup', description: 'Reliable pickup truck with strong performance.', price: 25999.99, condition: 'like_new', location: 'Houston', categoryId: 14, userId: 1 },

            // Vehicles - Motorcycles (Category 15)
            { title: 'Harley-Davidson Sportster', description: 'Classic motorcycle in excellent condition.', price: 10999.99, condition: 'good', location: 'Phoenix', categoryId: 15, userId: 2 },
            { title: 'Yamaha YZF-R3', description: 'Lightweight sportbike perfect for beginners.', price: 4999.99, condition: 'new', location: 'San Diego', categoryId: 15, userId: 3 },

            // Vehicles - Bicycles (Category 16)
            { title: 'Trek Mountain Bike', description: 'Durable mountain bike for off-road adventures.', price: 799.99, condition: 'like_new', location: 'Denver', categoryId: 16, userId: 1 },
            { title: 'Specialized Road Bike', description: 'High-performance road bike with a carbon frame.', price: 999.99, condition: 'new', location: 'Seattle', categoryId: 16, userId: 2 },

            // Personal Items - Clothing & Apparel (Category 17)
            { title: 'Designer Jacket', description: 'Stylish jacket in excellent condition.', price: 299.99, condition: 'like_new', location: 'New York', categoryId: 17, userId: 3 },
            { title: 'Casual T-Shirts Pack', description: 'Pack of 3 comfortable cotton t-shirts.', price: 49.99, condition: 'new', location: 'Los Angeles', categoryId: 17, userId: 1 },

            // Personal Items - Jewelry & Watches (Category 18)
            { title: 'Gold Necklace', description: 'Elegant 14K gold necklace with intricate design.', price: 499.99, condition: 'good', location: 'Chicago', categoryId: 18, userId: 2 },
            { title: 'Luxury Watch', description: 'High-end watch with a classic design.', price: 799.99, condition: 'like_new', location: 'San Francisco', categoryId: 18, userId: 3 },

            // Personal Items - Bags & Luggage (Category 19)
            { title: 'Leather Handbag', description: 'Premium handbag with multiple compartments.', price: 199.99, condition: 'like_new', location: 'Boston', categoryId: 19, userId: 1 },
            { title: 'Travel Suitcase', description: 'Durable suitcase with spinner wheels, perfect for travel.', price: 129.99, condition: 'good', location: 'Miami', categoryId: 19, userId: 2 },

            // Entertainment and Media - Books & Magazines (Category 20)
            { title: 'The Great Gatsby', description: 'Classic novel in excellent condition.', price: 9.99, condition: 'good', location: 'New York', categoryId: 20, userId: 3 },
            { title: 'Magazine Subscription', description: '1-year subscription to a popular magazine.', price: 24.99, condition: 'new', location: 'Chicago', categoryId: 20, userId: 1 },

            // Entertainment and Media - Movies & Music (Category 21)
            { title: 'Blu-ray Movie Collection', description: 'Box set of award-winning films.', price: 49.99, condition: 'like_new', location: 'Los Angeles', categoryId: 21, userId: 2 },
            { title: 'Vinyl Record Collection', description: 'Assorted classic vinyl records in great condition.', price: 59.99, condition: 'good', location: 'San Francisco', categoryId: 21, userId: 3 },

            // Entertainment and Media - Musical Instruments (Category 22)
            { title: 'Acoustic Guitar', description: 'Well-maintained acoustic guitar ideal for beginners.', price: 149.99, condition: 'good', location: 'Seattle', categoryId: 22, userId: 1 },
            { title: 'Electric Keyboard', description: '61-key keyboard perfect for practice and gigs.', price: 199.99, condition: 'like_new', location: 'Denver', categoryId: 22, userId: 2 },

            // Sports and Outdoors - Sports Equipment (Category 23)
            { title: 'Tennis Racket', description: 'Lightweight racket for competitive play.', price: 89.99, condition: 'good', location: 'Miami', categoryId: 23, userId: 3 },
            { title: 'Basketball', description: 'Official size basketball ideal for indoor and outdoor play.', price: 29.99, condition: 'new', location: 'New York', categoryId: 23, userId: 1 },

            // Sports and Outdoors - Outdoor Recreation (Category 24)
            { title: 'Camping Tent', description: '4-person tent in excellent condition, perfect for family camping.', price: 129.99, condition: 'like_new', location: 'Denver', categoryId: 24, userId: 2 },
            { title: 'Hiking Backpack', description: 'Durable backpack with multiple compartments for long hikes.', price: 79.99, condition: 'good', location: 'Chicago', categoryId: 24, userId: 3 },

            // Sports and Outdoors - Fitness & Exercise (Category 25)
            { title: 'Yoga Mat', description: 'Non-slip yoga mat, great for daily exercise.', price: 19.99, condition: 'new', location: 'San Diego', categoryId: 25, userId: 1 },
            { title: 'Dumbbell Set', description: 'Adjustable dumbbell set for strength training, lightly used.', price: 99.99, condition: 'like_new', location: 'Los Angeles', categoryId: 25, userId: 2 },

            // Tickets and Events - Event Tickets (Category 26)
            { title: 'Concert Ticket', description: 'Ticket to a sold-out live concert.', price: 79.99, condition: 'new', location: 'New York', categoryId: 26, userId: 3 },
            { title: 'Sports Game Ticket', description: 'VIP ticket to a major league game.', price: 149.99, condition: 'like_new', location: 'Chicago', categoryId: 26, userId: 1 },

            // Tickets and Events - Travel Tickets (Category 27)
            { title: 'Round-trip Airline Ticket', description: 'Economy class ticket valid for a round trip.', price: 299.99, condition: 'new', location: 'Los Angeles', categoryId: 27, userId: 2 },
            { title: 'Train Ticket', description: 'Comfortable train ticket for intercity travel.', price: 59.99, condition: 'good', location: 'Boston', categoryId: 27, userId: 3 },

            // Collectibles and Hobbies - Collectibles (Category 28)
            { title: 'Vintage Comic Book', description: 'Rare vintage comic book in mint condition.', price: 39.99, condition: 'excellent', location: 'San Francisco', categoryId: 28, userId: 1 },
            { title: 'Antique Coin', description: 'Ancient coin with historical value.', price: 99.99, condition: 'good', location: 'New York', categoryId: 28, userId: 2 },

            // Collectibles and Hobbies - Arts & Crafts (Category 29)
            { title: 'Handmade Ceramic Vase', description: 'Beautifully crafted vase, perfect for home decor.', price: 49.99, condition: 'like_new', location: 'Los Angeles', categoryId: 29, userId: 3 },
            { title: 'DIY Craft Kit', description: 'Complete kit for creating unique handmade crafts.', price: 29.99, condition: 'new', location: 'Chicago', categoryId: 29, userId: 1 },

            // Collectibles and Hobbies - Toys & Games (Category 30)
            { title: 'Board Game', description: 'Fun board game for family game nights.', price: 39.99, condition: 'good', location: 'Seattle', categoryId: 30, userId: 2 },
            { title: 'Puzzle Set', description: '1000-piece puzzle with a challenging design.', price: 19.99, condition: 'like_new', location: 'Denver', categoryId: 30, userId: 3 },

            // Services - Professional Services (Category 31)
            { title: 'Web Design Service', description: 'Professional web design for small businesses.', price: 999.99, condition: 'new', location: 'San Francisco', categoryId: 31, userId: 1 },
            { title: 'Accounting Consultation', description: 'Expert accounting services for startups.', price: 499.99, condition: 'good', location: 'New York', categoryId: 31, userId: 2 },

            // Services - Tutoring & Lessons (Category 32)
            { title: 'Math Tutoring', description: 'Experienced tutor offering math lessons for high school students.', price: 29.99, condition: 'new', location: 'Chicago', categoryId: 32, userId: 3 },
            { title: 'Music Lessons', description: 'Guitar lessons for beginners and intermediate players.', price: 39.99, condition: 'good', location: 'Los Angeles', categoryId: 32, userId: 1 },

            // Miscellaneous - Free Items (Category 33)
            { title: 'Free Books', description: 'Collection of used books available for free.', price: 0.00, condition: 'good', location: 'New York', categoryId: 33, userId: 2 },
            { title: 'Free Furniture', description: 'Gently used furniture items available for pickup.', price: 0.00, condition: 'good', location: 'Boston', categoryId: 33, userId: 3 },

            // Miscellaneous - Other (Category 34)
            { title: 'Miscellaneous Item A', description: 'An item that does not fit into any specific category.', price: 19.99, condition: 'new', location: 'Chicago', categoryId: 34, userId: 1 },
            { title: 'Miscellaneous Item B', description: 'Another diverse item from the miscellaneous category.', price: 14.99, condition: 'good', location: 'Los Angeles', categoryId: 34, userId: 2 }
        ];

        for (const item of sampleItems) {
            const managementKey = generateManagementKey();
            await runAsync(
                `INSERT OR IGNORE INTO items 
                (user_id, category_id, title, description, price, condition, location, management_key)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [item.userId, item.categoryId, item.title, item.description, item.price, item.condition, item.location, managementKey]
            );
        }

        // Get all items to add payment methods and images
        const [dbItems] = await handle(allAsync('SELECT id FROM items'));
        
        // Add payment methods for each item
        for (const item of dbItems) {
            for (let i = 1; i <= 2; i++) {
                await runAsync(
                    'INSERT OR IGNORE INTO item_payment_methods (item_id, payment_method_id) VALUES (?, ?)',
                    [item.id, i]
                );
            }
        }

        // Item Images
        const images = [
            { itemId: 1, url: 'https://example.com/iphone.jpg', isPrimary: true },
            { itemId: 1, url: 'https://example.com/iphone2.jpg', isPrimary: false },
            { itemId: 2, url: 'https://example.com/sofa.jpg', isPrimary: true },
            { itemId: 3, url: 'https://example.com/books.jpg', isPrimary: true },
            { itemId: 4, url: 'https://example.com/shoes.jpg', isPrimary: true }
        ];

        for (const image of images) {
            await runAsync(
                'INSERT OR IGNORE INTO item_images (item_id, url, is_primary) VALUES (?, ?, ?)',
                [image.itemId, image.url, image.isPrimary]
            );
        }

        // Favorites
        const favorites = [
            { userId: 1, itemId: 2 },
            { userId: 2, itemId: 1 },
            { userId: 3, itemId: 4 }
        ];

        for (const favorite of favorites) {
            await runAsync(
                'INSERT OR IGNORE INTO favorites (user_id, item_id) VALUES (?, ?)',
                [favorite.userId, favorite.itemId]
            );
        }

        // Messages
        const messages = [
            { senderId: 1, receiverId: 2, itemId: 1, message: 'Is this still available?' },
            { senderId: 2, receiverId: 1, itemId: 1, message: 'Yes, it is!' },
            { senderId: 3, receiverId: 1, itemId: 4, message: 'Would you accept $80?' }
        ];

        for (const message of messages) {
            await runAsync(
                'INSERT OR IGNORE INTO messages (sender_id, receiver_id, item_id, message) VALUES (?, ?, ?, ?)',
                [message.senderId, message.receiverId, message.itemId, message.message]
            );
        }

        console.log('Database seeded with example data successfully!');
    } catch (error) {
        console.error('Error seeding database with example data:', error);
        throw error;
    }
}

// Maintain backwards compatibility
export const seed = seedExampleData;

// Run the seed function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    seedExampleData().then(() => {
        console.log('Seeding complete');
        process.exit(0);
    }).catch(error => {
        console.error('Seeding failed:', error);
        process.exit(1);
    });
} 