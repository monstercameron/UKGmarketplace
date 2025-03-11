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
      name: 'Electronics', 
      description: 'Consumer electronics and gadgets. Examples: TVs, cameras, speakers, headphones, smart home devices, gaming consoles, drones, and other electronic accessories.'
    },
    { 
      id: 2, 
      name: 'Computers', 
      description: 'Computing devices and accessories. Examples: laptops, desktops, monitors, keyboards, mice, webcams, hard drives, and computer components.'
    },
    { 
      id: 3, 
      name: 'Mobile Phones', 
      description: 'Phones and phone accessories. Examples: smartphones (iPhone, Android), cases, chargers, screen protectors, power banks, and phone stands.'
    },
    { 
      id: 4, 
      name: 'Home & Kitchen', 
      description: 'Kitchen appliances and home essentials. Examples: microwaves, coffee makers, blenders, pots, pans, utensils, dish sets, and small appliances.'
    },
    { 
      id: 5, 
      name: 'Furniture', 
      description: 'Indoor and outdoor furniture. Examples: desks, chairs, sofas, beds, tables, shelves, dressers, and patio furniture. Both new and gently used welcome.'
    },
    { 
      id: 6, 
      name: 'Clothing', 
      description: 'All types of apparel and accessories. Examples: shirts, pants, dresses, shoes, jackets, bags, hats, and fashion accessories. Please note size and condition.'
    },
    { 
      id: 7, 
      name: 'Books & Media', 
      description: 'Educational and entertainment media. Examples: textbooks, novels, study guides, DVDs, video games, vinyl records, and academic materials. Include ISBN when possible.'
    },
    { 
      id: 8, 
      name: 'Sports & Outdoors', 
      description: 'Athletic and outdoor equipment. Examples: bikes, exercise equipment, sports gear, camping gear, hiking equipment, skateboards, and fitness accessories.'
    },
    { 
      id: 9, 
      name: 'Toys & Games', 
      description: 'Games and recreational items. Examples: board games, card games, puzzles, video games and consoles, collectible toys, and hobby items.'
    },
    { 
      id: 10, 
      name: 'Automotive', 
      description: 'Vehicle parts and accessories. Examples: car parts, bike accessories, maintenance tools, car electronics, cleaning supplies, and automotive equipment.'
    },
    { 
      id: 11, 
      name: 'Health & Beauty', 
      description: 'Personal care and wellness items. Examples: skincare products, cosmetics, hair care, fitness equipment, wellness products. Unopened items only for personal care.'
    },
    { 
      id: 12, 
      name: 'Jewelry', 
      description: 'Jewelry and accessories. Examples: necklaces, rings, earrings, watches, bracelets, and other accessories. Please include details about materials and authenticity.'
    },
    { 
      id: 13, 
      name: 'Art & Collectibles', 
      description: 'Unique and collectible items. Examples: artwork, prints, sculptures, antiques, trading cards, stamps, coins, and memorabilia. Include authenticity info if available.'
    },
    { 
      id: 14, 
      name: 'Musical Instruments', 
      description: 'Instruments and music gear. Examples: guitars, keyboards, drums, microphones, amplifiers, music accessories, and sheet music. Include condition details.'
    },
    { 
      id: 15, 
      name: 'Office Supplies', 
      description: 'Work and study supplies. Examples: notebooks, pens, desk organizers, calculators, printer supplies, planners, and office furniture.'
    },
    { 
      id: 16, 
      name: 'Pet Supplies', 
      description: 'Items for pets. Examples: food bowls, beds, carriers, toys, grooming supplies, and accessories. Unopened food/treats only.'
    },
    { 
      id: 17, 
      name: 'Home Improvement', 
      description: 'Tools and home repair items. Examples: power tools, hand tools, hardware, paint supplies, lighting fixtures, and home maintenance equipment.'
    },
    { 
      id: 18, 
      name: 'Garden & Outdoor', 
      description: 'Gardening and outdoor items. Examples: plants, pots, gardening tools, outdoor furniture, grills, lawn care equipment, and landscaping supplies.'
    },
    { 
      id: 19, 
      name: 'Baby & Kids', 
      description: 'Items for babies, children, and parents. Examples: strollers, car seats, toys, children\'s clothing, baby monitors, and educational materials for kids.'
    },
    { 
      id: 20, 
      name: 'Other', 
      description: 'Items that don\'t fit into other categories. Please provide a detailed description of your item.'
    },
    { 
      id: 21, 
      name: 'Housing', 
      description: 'Properties for sale or rent. Examples: apartments, houses, condos, rooms for rent, vacation rentals, and commercial properties. Include location, size, and amenities.'
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
      'computers & laptops': 'Computers',
      'smartphones': 'Mobile Phones',
      'tvs & monitors': 'Electronics',
      'audio equipment': 'Electronics',
      'gaming': 'Toys & Games',
      'home appliances': 'Home & Kitchen',
      'housing rentals': 'Home Improvement',
      'cars & trucks': 'Automotive',
      'clothing & apparel': 'Clothing',
      'books & magazines': 'Books & Media',
      'sports equipment': 'Sports & Outdoors'
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