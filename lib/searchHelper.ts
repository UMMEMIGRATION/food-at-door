export interface MenuItem {
  name: string;
  category: string;
  description: string;
  price?: number;
}

export interface SearchRestaurant {
  id: string;
  name: string;
  cuisine: string;
  category: string;
  rating: number;
  deliveryTime: string;
  distance: string;
  avgPrice: string;
  emoji: string;
  isOpen: boolean;
  promo?: string;
  city?: string;
  menuItems?: MenuItem[];
}

export function matchSearch(restaurant: SearchRestaurant, searchTerm: string): boolean {
  if (!searchTerm.trim()) return true;
  const term = searchTerm.toLowerCase();
  
  const matchesRestaurantName = restaurant.name.toLowerCase().includes(term);
  const matchesCuisine = restaurant.cuisine.toLowerCase().includes(term);
  const matchesCategory = restaurant.category.toLowerCase().includes(term);
  
  const matchesMenuItems = !!restaurant.menuItems?.some(item =>
    item.name.toLowerCase().includes(term) ||
    item.category.toLowerCase().includes(term) ||
    item.description.toLowerCase().includes(term)
  );
  
  return matchesRestaurantName || matchesCuisine || matchesCategory || matchesMenuItems;
}
