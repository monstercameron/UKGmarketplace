CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    condition TEXT NOT NULL,
    location TEXT,
    category_id INTEGER,
    shipping TEXT,
    negotiable INTEGER DEFAULT 0,
    email TEXT,
    phone TEXT,
    teams_link TEXT,
    management_key TEXT NOT NULL,
    sold INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id)
); 