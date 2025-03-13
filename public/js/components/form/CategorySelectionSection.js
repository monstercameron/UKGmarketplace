import { DARK_TEAL, LIGHT_TEAL, WHITE } from '../../utils/constants.js';
import { categoryIcons, categoryToIconKey } from '../../utils/categoryIcons.js';
import { Popover } from './Popover.js';

export const CategorySelectionSection = ({ 
  darkMode, 
  html, 
  categories = [],
  selectedCategoryId = '',
  onCategorySelect = () => {}
}) => {
  // Define a standard set of 20 categories with detailed descriptions
  const standardCategories = [
    { 
      id: 1, 
      name: 'Electronics & Computers', 
      description: 'Electronics, computers, and tech items including laptops, desktops, TVs, cameras, smart home devices, audio equipment, and accessories'
    },
    { 
      id: 2, 
      name: 'Mobile Phones', 
      description: 'Smartphones, cell phones, and phone accessories including cases, chargers, and screen protectors'
    },
    { 
      id: 3, 
      name: 'Gaming & Consoles', 
      description: 'Video games, consoles, gaming accessories, and related equipment'
    },
    { 
      id: 4, 
      name: 'Furniture', 
      description: 'Indoor and outdoor furniture including desks, chairs, tables, beds, shelves, and patio furniture'
    },
    { 
      id: 5, 
      name: 'Home & Kitchen Appliances', 
      description: 'Kitchen and household appliances including microwaves, blenders, coffee makers, refrigerators, and washing machines'
    },
    { 
      id: 6, 
      name: 'Home Decor & Improvement', 
      description: 'Home decorative items, tools, hardware, and improvement supplies'
    },
    { 
      id: 7, 
      name: 'Housing & Real Estate', 
      description: 'Properties for sale or rent including apartments, houses, condos, rooms for rent, and commercial properties'
    },
    { 
      id: 8, 
      name: 'Vehicles & Automotive', 
      description: 'Cars, trucks, motorcycles, parts, accessories, and other automotive items'
    },
    { 
      id: 9, 
      name: 'Bicycles', 
      description: 'Bicycles, cycling gear, and related accessories'
    },
    { 
      id: 10, 
      name: 'Clothing & Shoes', 
      description: 'All types of apparel including shirts, pants, dresses, outerwear, shoes, and fashion accessories'
    },
    { 
      id: 11, 
      name: 'Jewelry & Accessories', 
      description: 'Jewelry, watches, handbags, purses, backpacks, and personal accessories'
    },
    { 
      id: 12, 
      name: 'Health & Beauty', 
      description: 'Personal care items, beauty products, fitness equipment, and wellness items'
    },
    { 
      id: 13, 
      name: 'Books & Media', 
      description: 'Books, textbooks, magazines, movies, music, and educational materials'
    },
    { 
      id: 14, 
      name: 'Musical Instruments', 
      description: 'Instruments and music gear including guitars, keyboards, percussion, and accessories'
    },
    { 
      id: 15, 
      name: 'Sports & Outdoor Gear', 
      description: 'Athletic equipment, outdoor recreation gear, camping supplies, and fitness accessories'
    },
    { 
      id: 16, 
      name: 'Toys, Games & Hobbies', 
      description: 'Toys, board games, puzzles, collectibles, and hobby supplies'
    },
    { 
      id: 17, 
      name: 'Art & Collectibles', 
      description: 'Artwork, antiques, collectibles, memorabilia, and unique items'
    },
    { 
      id: 18, 
      name: 'Baby & Kids Items', 
      description: 'Products for babies, children, and parents including strollers, toys, clothing, and accessories'
    },
    { 
      id: 19, 
      name: 'Pet Supplies', 
      description: 'Items for pets including food bowls, beds, carriers, toys, and accessories'
    },
    { 
      id: 20, 
      name: 'Other', 
      description: 'Items that don\'t fit into other categories'
    }
  ];
  
  // Helper function to match a custom category name with a standard category.
  const matchStandardCategory = (catName) => {
    const lowerCatName = catName.toLowerCase();
    // Attempt an exact case-insensitive match.
    let match = standardCategories.find(sc => sc.name.toLowerCase() === lowerCatName);
    if(match) return match;

    // Mapping dictionary for common variations.
    const categoryMappings = {
      'computers & laptops': 'Electronics & Computers',
      'electronics': 'Electronics & Computers',
      'computers': 'Electronics & Computers',
      'smartphones': 'Mobile Phones',
      'tvs & monitors': 'Electronics & Computers',
      'audio equipment': 'Electronics & Computers',
      'gaming': 'Gaming & Consoles',
      'home appliances': 'Home & Kitchen Appliances',
      'housing rentals': 'Housing & Real Estate',
      'housing': 'Housing & Real Estate',
      'real estate': 'Housing & Real Estate',
      'cars & trucks': 'Vehicles & Automotive',
      'automotive': 'Vehicles & Automotive',
      'clothing & apparel': 'Clothing & Shoes',
      'clothing': 'Clothing & Shoes',
      'books & magazines': 'Books & Media',
      'sports equipment': 'Sports & Outdoor Gear',
      'sports & outdoors': 'Sports & Outdoor Gear',
      'toys & games': 'Toys, Games & Hobbies'
    };
    if(categoryMappings[lowerCatName]) {
      match = standardCategories.find(sc => sc.name.toLowerCase() === categoryMappings[lowerCatName].toLowerCase());
      if(match) return match;
    }

    // Fallback: normalize by removing non-alphanumeric characters.
    const normalizedName = lowerCatName.replace(/[^a-z0-9]/g, '');
    match = standardCategories.find(sc => sc.name.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedName);
    return match;
  };

  // Determine which categories to display using the provided categories or fallback to the standard list.
  const displayCategories = categories.length > 0
    ? categories.slice(0, 20).map(cat => {
        const matched = matchStandardCategory(cat.name);
        return {
          ...cat,
          description: matched ? matched.description : `Items related to ${cat.name}`
        };
      })
    : standardCategories;
  
  // Sort the categories alphabetically by name
  const sortedDisplayCategories = [...displayCategories].sort((a, b) => 
    a.name.localeCompare(b.name)
  );
  
  // Filter out duplicate categories by id to ensure only a single category can be selected at a time
  const uniqueCategories = sortedDisplayCategories.filter((cat, index, self) =>
    index === self.findIndex((c) => c.id.toString() === cat.id.toString())
  );
  
  // Helper function to get the icon key for a category.
  const getIconKey = (name) => {
    let iconKey = categoryToIconKey[name];
    if(!iconKey) {
      const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
      iconKey = Object.entries(categoryToIconKey).find(([key]) => key.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedName)?.[1] || 'other';
    }
    return iconKey;
  };

  // Category button component
  const CategoryButton = ({ id, name, description }) => {
    const isSelected = selectedCategoryId === id.toString();
    const iconColor = isSelected 
      ? (darkMode ? LIGHT_TEAL : DARK_TEAL) 
      : (darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)');
    
    const [showPopover, setShowPopover] = React.useState(false);
    
    const iconKey = getIconKey(name);
    const svg = categoryIcons[iconKey];
    
    const handleCategorySelect = () => {
      console.log('Category selected:', { id, name, idType: typeof id });
      onCategorySelect(id.toString());
    };
    
    return html`
      <div className="relative">
        <button
          key=${id}
          type="button"
          onClick=${handleCategorySelect}
          onMouseEnter=${() => setShowPopover(true)}
          onMouseLeave=${() => setShowPopover(false)}
          className="flex items-center px-3 py-2 rounded-lg transition-all duration-300 w-full"
          style=${{
            backgroundColor: isSelected 
              ? (darkMode ? 'rgba(102, 163, 210, 0.2)' : 'rgba(102, 163, 210, 0.2)') 
              : (darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.8)'),
            border: '1px solid ' + (isSelected 
              ? (darkMode ? LIGHT_TEAL : DARK_TEAL) 
              : (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')),
            color: darkMode ? WHITE : 'rgba(0, 0, 0, 0.8)',
            height: '40px'
          }}
        >
          <span 
            className="mr-2 flex-shrink-0"
            style=${{ 
              color: iconColor
            }}
            dangerouslySetInnerHTML=${{ __html: svg.replace('currentColor', iconColor) }}
          ></span>
          <span className="text-sm font-medium truncate text-left flex-1">${name}</span>
        </button>
        <${Popover}
          darkMode=${darkMode}
          html=${html}
          content=${description}
          show=${showPopover}
          position="top"
        />
      </div>
    `;
  };

  return html`
    <div className="mb-6">
      <label 
        className="block text-sm font-medium mb-2"
        style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }}
      >
        Category <span style=${{ color: '#EF4444' }}>*</span>
      </label>
      <p
        className="text-sm mb-3"
        style=${{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}
      >
        Select a category for your item
      </p>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
        ${uniqueCategories.map(category => html`
          <${CategoryButton} 
            id=${category.id} 
            name=${category.name}
            description=${category.description}
          />
        `)}
      </div>
    </div>
  `;
}; 