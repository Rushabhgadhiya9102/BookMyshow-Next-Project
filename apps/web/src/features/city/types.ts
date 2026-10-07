export interface CityItem {
  id?: string;
  name: string;
  slug: string;
  state?: string;
  isPopular?: boolean;
}

export const POPULAR_CITIES: CityItem[] = [
  { name: 'Mumbai', slug: 'mumbai', state: 'Maharashtra', isPopular: true },
  { name: 'Delhi-NCR', slug: 'delhi', state: 'Delhi', isPopular: true },
  { name: 'Bengaluru', slug: 'bengaluru', state: 'Karnataka', isPopular: true },
  { name: 'Hyderabad', slug: 'hyderabad', state: 'Telangana', isPopular: true },
  { name: 'Ahmedabad', slug: 'ahmedabad', state: 'Gujarat', isPopular: true },
  { name: 'Chandigarh', slug: 'chandigarh', state: 'Punjab', isPopular: true },
  { name: 'Chennai', slug: 'chennai', state: 'Tamil Nadu', isPopular: true },
  { name: 'Pune', slug: 'pune', state: 'Maharashtra', isPopular: true },
  { name: 'Kolkata', slug: 'kolkata', state: 'West Bengal', isPopular: true },
  { name: 'Kochi', slug: 'kochi', state: 'Kerala', isPopular: true },
  { name: 'Surat', slug: 'surat', state: 'Gujarat', isPopular: true },
  { name: 'Navsari', slug: 'navsari', state: 'Gujarat', isPopular: true },
];

export const OTHER_CITIES: string[] = [
  'Agra',
  'Amritsar',
  'Bhopal',
  'Bhubaneswar',
  'Coimbatore',
  'Dehradun',
  'Goa',
  'Guwahati',
  'Indore',
  'Jaipur',
  'Jalandhar',
  'Kanpur',
  'Lucknow',
  'Ludhiana',
  'Madurai',
  'Mangalore',
  'Nagpur',
  'Nashik',
  'Patna',
  'Raipur',
  'Rajkot',
  'Ranchi',
  'Surat',
  'Thiruvananthapuram',
  'Vadodara',
  'Varanasi',
  'Vijayawada',
  'Visakhapatnam',
];
