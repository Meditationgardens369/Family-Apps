import { Category } from '../store/useStore';

export const CATEGORIES: Record<Category, string[]> = {
  'Cleaning Products': [
    'Dishwasher salt', 'Dishwasher shine liquid', 'Dishwasher tablets',
    'Fairy liquid soap', 'Hanging toilet fresheners', 'Stain remover for colours',
    'Stain remover for whites', 'Sponges', 'Vinegar', 'Washing detergent powder'
  ],
  'Oils & Fats': [
    'Coconut Oil', 'Margarine', 'Olive oil (extra virgin)', 'Vegetable oil'
  ],
  'Plant-based Dairy': [
    'Coconut yoghurt'
  ],
  'Dried Herbs & Spices': [
    'Bay leaves', 'Black pepper corns', 'Black pepper (ground)', 'Cayenne powder',
    'Cinnamon sticks', 'Cinnamon (ground)', 'Dried parsley', 'Garam masala curry powder',
    'Garlic powder', 'Himalayan salt', 'Madras curry powder', 'Nutmeg'
  ],
  'Meats & Fish': [
    'Beef', 'Chicken breast', 'Chicken thighs and drumsticks', 'Fish', 'Sausage'
  ],
  'Sweeteners': [
    'Raw honey', 'Stevia'
  ],
  'Condiments & Spreads': [
    'Bovril', 'Jam', 'Ketchup', 'Marmite', 'Mustard', 'Peanut butter', 'Almond butter', 'Tomato Puree'
  ],
  'Vegetables': [
    'Cucumber', 'Garlic', 'Leek', 'Mushrooms', 'Onions', 'Potatoes', 'Spring onions',
    'Sweet Potatoes', 'Zucchini', 'Red pepper', 'Beetroot', 'Aubergine', 'Peas', 'Ground ginger', 'Spinach'
  ],
  'Tinned Food': [
    'Chick peas', 'Coconut Milk', 'Tinned Tuna', 'Tomato pulp', 'Refried Beans'
  ],
  'Cosmetics & Toiletries': [
    'Toothpaste', 'Shampoo', 'Conditioner', 'Body wash', 'Deodorant', 'Razor blades', 'Shaving cream', 'Moisturizer'
  ],
  'Pharmaceuticals': [
    'Actifed', 'Animal plasters', 'Bandages', 'Desloratadina syrup', 'Diarolyte',
    'Forlax', 'Hydrating eyedrops', 'Ibuprofen syrup (adults)', 'Ibuprofen syrup (kids)',
    'Nasal wash sachets', 'Plasters', 'Surgical tape (fabric)', 'Visine eyedrops'
  ],
  'Baking': [
    'Baking powder', 'Chickpea flour', 'Cornstarch', 'Flour gluten free self-raising', 'Oat flour'
  ],
  'Drinks & Beverages': [
    'Apple juice', 'Beer', 'Cacau powder', 'Coffee', 'Ginger ale', 'Pear juice',
    'Peppermint tea', 'Tea', 'Lemon grass tea', 'Tutti Frutti', 'Water'
  ],
  'Fruits': [
    'Apples', 'Avocado', 'Bananas', 'Blueberries', 'Dates', 'Grapes', 'Lemons',
    'Melon', 'Olives', 'Oranges', 'Pears', 'Pineapple', 'Raspberries', 'Strawberries',
    'Tangerine', 'Tomatoes', 'Watermelon'
  ],
  'Dried Fruit, Nuts & Seeds': [
    'Cashews', 'Chia seeds', 'Peanuts', 'Pumpkin seeds', 'Raisins', 'Sunflower seed', 'Walnuts'
  ],
  'Pastas & Grains': [
    'Arborio/Risotto/Pudding rice', 'Basmati rice', 'Macaroni', 'Oats', 'Rolls', 'Rye bread', 'Spaghetti', 'Wide french loaf'
  ],
  'Miscellaneous': [
    'Mint Chocoloat', 'Puffed Millet', 'Wrapping foil'
  ],
  'Fresh Herbs': [
    'Mint', 'Parsley'
  ]
};

export const CATEGORY_IMAGES: Record<Category, string> = {
  'Cleaning Products': 'https://images.unsplash.com/photo-1585421514284-efb74c2b69ba?w=400&q=80',
  'Oils & Fats': 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80',
  'Plant-based Dairy': 'https://images.unsplash.com/photo-1631300958679-b1d56350e181?w=400&q=80',
  'Dried Herbs & Spices': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80',
  'Meats & Fish': 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=400&q=80',
  'Sweeteners': 'https://images.unsplash.com/photo-1587049352847-4d4b12404110?w=400&q=80',
  'Condiments & Spreads': 'https://images.unsplash.com/photo-1528750717929-32abb73d3bd9?w=400&q=80',
  'Vegetables': 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&q=80',
  'Tinned Food': 'https://images.unsplash.com/photo-1610348725531-843dcf5aad45?w=400&q=80',
  'Cosmetics & Toiletries': 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&q=80',
  'Pharmaceuticals': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&q=80',
  'Baking': 'https://images.unsplash.com/photo-1556910110-a5a63dfd3938?w=400&q=80',
  'Drinks & Beverages': 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&q=80',
  'Fruits': 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=400&q=80',
  'Dried Fruit, Nuts & Seeds': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=400&q=80',
  'Pastas & Grains': 'https://images.unsplash.com/photo-1551228446-3af41b1d6d22?w=400&q=80',
  'Miscellaneous': 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=400&q=80',
  'Fresh Herbs': 'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=400&q=80'
};
