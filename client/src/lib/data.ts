/* ============================================================
 * Mountain Rangers — Trip & Booking Data
 * Design: Alpine Glass / Lime-Green Brand Identity
 * All static data for the platform demo
 * ============================================================ */

export interface Trip {
  id: string;
  title: string;
  location: string;
  date: string;
  time: string;
  duration: string;
  difficulty: "Easy" | "Moderate" | "Hard" | "Expert";
  price: number;
  currency: string;
  image: string;
  description: string;
  highlights: string[];
  included: string[];
  meetingPoint: string;
  totalSeats: number;
  bookedSeats: number[];
  rating: number;
  reviewCount: number;
  elevation: string;
  distance: string;
}

export interface Booking {
  id: string;
  tripId: string;
  tripTitle: string;
  tripImage: string;
  date: string;
  time: string;
  passengers: number;
  seats: number[];
  status: "confirmed" | "pending" | "completed" | "cancelled";
  referenceCode: string;
  totalPrice: number;
  paymentMethod: string;
  bookedAt: string;
}

export interface CommunityPost {
  id: string;
  author: string;
  avatar: string;
  tripTitle: string;
  content: string;
  images: string[];
  likes: number;
  comments: number;
  timeAgo: string;
  isLiked: boolean;
}

export interface LoyaltyInfo {
  level: string;
  points: number;
  nextLevel: string;
  nextLevelPoints: number;
  tripsCompleted: number;
  memberSince: string;
  badges: { name: string; icon: string; earned: boolean }[];
}

// Logo URLs
export const LOGOS = {
  iconWhite: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663372447737/SFWHofoIcjJEOiHY.png",
  nameWhite: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663372447737/GFqKysiOnsyqxrbf.png",
  iconDark: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663372447737/oVgeDDYSkuVgoBGH.png",
  nameDark: "https://files.manuscdn.com/user_upload_by_module/session_file/310519663372447737/OACuVQyyVbliBNbf.png",
};

// Image URLs
export const IMAGES = {
  hero: "https://private-us-east-1.manuscdn.com/sessionFile/efZ257f6EEGTTCZt8TtP7e/sandbox/yVtS7ZK5yiZ8PzP8OJUIJX-img-1_1771884265000_na1fn_aGVyby1tb3VudGFpbg.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvZWZaMjU3ZjZFRUdUVENadDhUdFA3ZS9zYW5kYm94L3lWdFM3Wks1eWlaOFB6UDhPSlVJSlgtaW1nLTFfMTc3MTg4NDI2NTAwMF9uYTFmbl9hR1Z5YnkxdGIzVnVkR0ZwYmcuanBnP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=t1Yuxdd1OWIb0-eMTo0E4x6TZM1leN2DiQSHL89SOMyCXYYbB0XcrQeTe6slHtEZ4oSS3vt9s7e4GYtGzUdSEd8frfpF6KUbny2rs5g0e5rOGcKvB8Qts69KmHtg8qaMpEIa7FLCPxcE42IHod3MNV~BeJw9mNouB1K4Ey96Jo9xv6Q9~dKEYzdRmp7V-fziqN8X5BDtXwg-jm2jjfEVg6sa3TpUUJb5cN7JifwmeWfHyoPDrDCflYjvbLohd1qHX9W1qborTPPiEy5HKTfodA-uXh5orE6oS4eLu68UhKJ0cz1vQcxAB6uvn5mDTHX6IylpK4Z7RToe2JwYAxbONw__",
  tripCard1: "https://private-us-east-1.manuscdn.com/sessionFile/efZ257f6EEGTTCZt8TtP7e/sandbox/yVtS7ZK5yiZ8PzP8OJUIJX-img-2_1771884249000_na1fn_dHJpcC1jYXJkLTE.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvZWZaMjU3ZjZFRUdUVENadDhUdFA3ZS9zYW5kYm94L3lWdFM3Wks1eWlaOFB6UDhPSlVJSlgtaW1nLTJfMTc3MTg4NDI0OTAwMF9uYTFmbl9kSEpwY0MxallYSmtMVEUuanBnP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=wCfzM94kszRfs9rmiByoBbjrwKFuUPvY8mwxLT-VW1vCdF0o5z10FleCJfGXN-IvdTOPrldK6Ke2bXG2nRcX6rqYRRBZ1iYQInlHRZxKl4ybczmcdgRo-8uKtHHj5Le0SvTh8TNs7ybs-MRlePhgBl-9p1kmVNUHa1v~wuV7aHc4zkbYZyHUm6BxLrqGxwWap5bYXw4Ur-W9UZUlCVWUiQNkTj-VYQHqGFb51SYbHP6OB9HZYM1JO5GX5dYDGcpzFM~dEz16HyscKn7ELHX19y6ybrRJYQTDNXo-74zdlET4udRyJxyGm1bS1wktrBtnUWVTJBausCR2CxxEuEdxMQ__",
  tripCard2: "https://private-us-east-1.manuscdn.com/sessionFile/efZ257f6EEGTTCZt8TtP7e/sandbox/yVtS7ZK5yiZ8PzP8OJUIJX-img-3_1771884245000_na1fn_dHJpcC1jYXJkLTI.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvZWZaMjU3ZjZFRUdUVENadDhUdFA3ZS9zYW5kYm94L3lWdFM3Wks1eWlaOFB6UDhPSlVJSlgtaW1nLTNfMTc3MTg4NDI0NTAwMF9uYTFmbl9kSEpwY0MxallYSmtMVEkuanBnP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=Cq5IrrzfGrP2j66cyMbzVQyk9n-xPf3Qf-MPfAJiaa6Epn6JCDGdxM8duRDdDZtgk-iWq828WMBW4y936ePOT57ItAT0hdOFQtr8ltppO-Gi6Mi0-X2tH7OZzYNxuBuD781s5T629hC1sJqNq1RKG512snbgnK0eZY6quxYyU91ltouGfXgwxKWsHX~~F8t89fPyJ~-CVndGYouN0Zs92t-qi2CIX4mmWsCj2armh10hspA-8TuONPTW0GMaMNkeznRF7SBDVgtACN4ThLc3-NXM9vLMy5esam1xnuqAAa-1ULFCa2YvpreXAd36mgLeba86Fc1-NnR0Zi4sQVjxlg__",
  tripCard3: "https://private-us-east-1.manuscdn.com/sessionFile/efZ257f6EEGTTCZt8TtP7e/sandbox/yVtS7ZK5yiZ8PzP8OJUIJX-img-4_1771884265000_na1fn_dHJpcC1jYXJkLTM.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvZWZaMjU3ZjZFRUdUVENadDhUdFA3ZS9zYW5kYm94L3lWdFM3Wks1eWlaOFB6UDhPSlVJSlgtaW1nLTRfMTc3MTg4NDI2NTAwMF9uYTFmbl9kSEpwY0MxallYSmtMVE0uanBnP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=bGBON-1wXBw6j0zW3LKP65Mb4QbAn007r2719HoIMVtTagWmkFWbsHYQj08m~Tly6HOcpe~uH9xTsd1tKLQQo87lkQW~Vb4U1uEEs1cnZivFpQ~jZD49RIFHmtGYWPRjvCUXbF2Ec8MQPtDlLhn8Uhcp~LTl32K-QRy-Jl~FPKfAz5DX3-8yH9j1eQQHqqNwtMsq5n03zzXaKHd-Aw5WXfnKEt9SJqIvMFGBrJOsfpGXYILAZtNmgWGKlLxS6MsLrSLIDRf8ETVwyIGrXP-Tqadrz-BMB80f9uxZ3epzphUlXdndTqFldCjSDRxsaKF0riOeJV8FDOnxJLTVJY24~g__",
  community: "https://private-us-east-1.manuscdn.com/sessionFile/efZ257f6EEGTTCZt8TtP7e/sandbox/yVtS7ZK5yiZ8PzP8OJUIJX-img-5_1771884262000_na1fn_Y29tbXVuaXR5LWhlcm8.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvZWZaMjU3ZjZFRUdUVENadDhUdFA3ZS9zYW5kYm94L3lWdFM3Wks1eWlaOFB6UDhPSlVJSlgtaW1nLTVfMTc3MTg4NDI2MjAwMF9uYTFmbl9ZMjl0YlhWdWFYUjVMV2hsY204LmpwZz94LW9zcy1wcm9jZXNzPWltYWdlL3Jlc2l6ZSx3XzE5MjAsaF8xOTIwL2Zvcm1hdCx3ZWJwL3F1YWxpdHkscV84MCIsIkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc5ODc2MTYwMH19fV19&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=h2iU2lvQsgC-1SWIUmKdK4ny5HH6UMewtBe3B7QlTM6KYog4VExbegFYJcYTyMseCLi3c3~QNxJotI01aZ3d928HM3Apx3Msr1oAVGkmKn58jGckPurlxCpQ49O-zD9nsRcs6kYbuUoe5iVqBkQWfGs7qjJV5mQdWcZsPAemXZfrL3Pk2u28zN2YmFMCIcdk3v6jD232ifZfdHmiSGsTo-cihU6VP8BBXDFdfcFFJBl6NocQ7PGXLPcEqwg44o2DB41dJEUYwABAV3kPHrmYLcvHGaZg4cM5aB3pH7oHdngb6fClTq9zdAKUSLemv7uYaWAaRwxPBjNT5ihXXX0nng__",
};

export const TRIPS: Trip[] = [
  {
    id: "1",
    title: "Qadisha Valley Ridge",
    location: "Bcharre, North Lebanon",
    date: "March 8, 2026",
    time: "6:30 AM",
    duration: "8 hours",
    difficulty: "Hard",
    price: 45,
    currency: "USD",
    image: IMAGES.tripCard1,
    description: "Traverse the legendary Qadisha Valley, a UNESCO World Heritage site. This challenging ridge hike offers breathtaking views of the holy valley, ancient monasteries carved into cliff faces, and the towering cedars of God forest. The trail follows ancient shepherd paths along dramatic limestone cliffs with panoramic views of the Mediterranean Sea.",
    highlights: ["UNESCO World Heritage Site", "Ancient Monastery Ruins", "Cedar Forest Trail", "Mediterranean Views", "Cliff-edge Paths"],
    included: ["Round-trip transport", "Professional guide", "Lunch & snacks", "First aid kit", "Photography stops"],
    meetingPoint: "Beirut, Cola Station",
    totalSeats: 24,
    bookedSeats: [1, 2, 5, 6, 9, 10, 13, 17, 21],
    rating: 4.9,
    reviewCount: 127,
    elevation: "1,850m",
    distance: "14 km",
  },
  {
    id: "2",
    title: "Baatara Gorge Waterfall",
    location: "Tannourine, Mount Lebanon",
    date: "March 15, 2026",
    time: "7:00 AM",
    duration: "6 hours",
    difficulty: "Moderate",
    price: 35,
    currency: "USD",
    image: IMAGES.tripCard2,
    description: "Discover the spectacular Baatara Gorge Waterfall, one of the most stunning natural wonders in Lebanon. The waterfall drops 255 meters into a Jurassic limestone cave. The hike winds through lush forests, past natural springs, and offers incredible geological formations millions of years in the making.",
    highlights: ["255m Waterfall Drop", "Jurassic Limestone Cave", "Natural Springs", "Forest Trail", "Geological Wonders"],
    included: ["Round-trip transport", "Professional guide", "Snacks & water", "First aid kit", "Entrance fees"],
    meetingPoint: "Beirut, Charles Helou Station",
    totalSeats: 24,
    bookedSeats: [3, 4, 7, 11, 15, 19],
    rating: 4.8,
    reviewCount: 89,
    elevation: "1,200m",
    distance: "8 km",
  },
  {
    id: "3",
    title: "Sunset at Faqra Ruins",
    location: "Faqra, Kesrwan",
    date: "March 22, 2026",
    time: "2:00 PM",
    duration: "5 hours",
    difficulty: "Easy",
    price: 25,
    currency: "USD",
    image: IMAGES.tripCard3,
    description: "A magical evening hike to the ancient Roman and Phoenician ruins of Faqra, perched high in the mountains of Kesrwan. Watch the sunset paint the Bekaa Valley in gold as you explore temples, altars, and towers dating back thousands of years. Perfect for beginners and photography enthusiasts.",
    highlights: ["Roman & Phoenician Ruins", "Bekaa Valley Sunset", "Ancient Temples", "Photography Paradise", "Beginner Friendly"],
    included: ["Round-trip transport", "Professional guide", "Hot beverages", "First aid kit", "Historical briefing"],
    meetingPoint: "Beirut, Dora Roundabout",
    totalSeats: 24,
    bookedSeats: [1, 2, 3, 8, 12, 16, 20, 22, 23, 24],
    rating: 4.7,
    reviewCount: 203,
    elevation: "1,500m",
    distance: "5 km",
  },
  {
    id: "4",
    title: "Chouf Cedar Reserve",
    location: "Chouf, Mount Lebanon",
    date: "March 29, 2026",
    time: "6:00 AM",
    duration: "9 hours",
    difficulty: "Moderate",
    price: 40,
    currency: "USD",
    image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
    description: "Explore the largest remaining cedar forest in Lebanon, home to trees over 2,000 years old. The Chouf Cedar Reserve covers 5% of Lebanon's total area and offers diverse trails through ancient forests, mountain meadows, and panoramic ridgelines.",
    highlights: ["2000-year-old Cedars", "Largest Cedar Reserve", "Wildlife Spotting", "Mountain Meadows", "Panoramic Ridgelines"],
    included: ["Round-trip transport", "Professional guide", "Lunch & snacks", "First aid kit", "Reserve entrance"],
    meetingPoint: "Beirut, Cola Station",
    totalSeats: 24,
    bookedSeats: [2, 5, 8, 14, 18],
    rating: 4.9,
    reviewCount: 156,
    elevation: "1,900m",
    distance: "12 km",
  },
  {
    id: "5",
    title: "Jeita Grotto & Harissa",
    location: "Jounieh, Mount Lebanon",
    date: "April 5, 2026",
    time: "8:00 AM",
    duration: "7 hours",
    difficulty: "Easy",
    price: 30,
    currency: "USD",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
    description: "A combined adventure visiting two of Lebanon's most iconic landmarks. Start with the magnificent Jeita Grotto, a system of interconnected limestone caves, then ascend to the Our Lady of Lebanon statue in Harissa with breathtaking views of the Bay of Jounieh.",
    highlights: ["Jeita Grotto Caves", "Harissa Statue", "Bay of Jounieh Views", "Cable Car Ride", "Cultural Experience"],
    included: ["Round-trip transport", "Professional guide", "Lunch", "All entrance fees", "Cable car ticket"],
    meetingPoint: "Beirut, Martyrs Square",
    totalSeats: 24,
    bookedSeats: [1, 3, 6, 7, 9, 10, 11, 15, 19, 20, 23],
    rating: 4.6,
    reviewCount: 312,
    elevation: "650m",
    distance: "4 km",
  },
];

export const BOOKINGS: Booking[] = [
  {
    id: "b1",
    tripId: "1",
    tripTitle: "Qadisha Valley Ridge",
    tripImage: IMAGES.tripCard1,
    date: "March 8, 2026",
    time: "6:30 AM",
    passengers: 2,
    seats: [3, 4],
    status: "confirmed",
    referenceCode: "MR-2026-0847",
    totalPrice: 90,
    paymentMethod: "Cash on Bus",
    bookedAt: "Feb 20, 2026",
  },
  {
    id: "b2",
    tripId: "3",
    tripTitle: "Sunset at Faqra Ruins",
    tripImage: IMAGES.tripCard3,
    date: "March 22, 2026",
    time: "2:00 PM",
    passengers: 1,
    seats: [7],
    status: "pending",
    referenceCode: "MR-2026-0923",
    totalPrice: 25,
    paymentMethod: "Whish Money",
    bookedAt: "Feb 22, 2026",
  },
  {
    id: "b3",
    tripId: "2",
    tripTitle: "Baatara Gorge Waterfall",
    tripImage: IMAGES.tripCard2,
    date: "Feb 10, 2026",
    time: "7:00 AM",
    passengers: 3,
    seats: [12, 13, 14],
    status: "completed",
    referenceCode: "MR-2026-0612",
    totalPrice: 105,
    paymentMethod: "Cash on Bus",
    bookedAt: "Jan 28, 2026",
  },
];

export const COMMUNITY_POSTS: CommunityPost[] = [
  {
    id: "p1",
    author: "Sarah M.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80",
    tripTitle: "Qadisha Valley Ridge",
    content: "Absolutely breathtaking experience! The view from the ridge was unlike anything I've ever seen. Our guide Karim was incredibly knowledgeable about the history of the monasteries. Can't wait for the next trip!",
    images: [IMAGES.tripCard1],
    likes: 47,
    comments: 12,
    timeAgo: "2 hours ago",
    isLiked: false,
  },
  {
    id: "p2",
    author: "Ahmad K.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80",
    tripTitle: "Baatara Gorge Waterfall",
    content: "The waterfall was even more impressive in person than in photos. The sound of water echoing through the cave was magical. Highly recommend bringing a good camera — every angle is a masterpiece.",
    images: [IMAGES.tripCard2],
    likes: 35,
    comments: 8,
    timeAgo: "5 hours ago",
    isLiked: true,
  },
  {
    id: "p3",
    author: "Nour H.",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80",
    tripTitle: "Sunset at Faqra Ruins",
    content: "Watching the sunset from the ancient ruins was a spiritual experience. The golden light on the old stones, the valley stretching below... Lebanon is truly magical. Thank you Mountain Rangers for organizing this!",
    images: [IMAGES.tripCard3],
    likes: 62,
    comments: 15,
    timeAgo: "1 day ago",
    isLiked: false,
  },
  {
    id: "p4",
    author: "Maya R.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80",
    tripTitle: "Chouf Cedar Reserve",
    content: "Standing among trees that are over 2,000 years old puts everything in perspective. The forest was so peaceful and the air so fresh. Our group bonded so well during the hike. Already signed up for next month!",
    images: [],
    likes: 28,
    comments: 6,
    timeAgo: "2 days ago",
    isLiked: true,
  },
];

export const LOYALTY: LoyaltyInfo = {
  level: "Trail Blazer",
  points: 2450,
  nextLevel: "Summit Seeker",
  nextLevelPoints: 5000,
  tripsCompleted: 12,
  memberSince: "Sep 2025",
  badges: [
    { name: "First Summit", icon: "mountain", earned: true },
    { name: "Early Bird", icon: "sunrise", earned: true },
    { name: "Social Hiker", icon: "users", earned: true },
    { name: "5 Trips Club", icon: "target", earned: true },
    { name: "10 Trips Legend", icon: "trophy", earned: true },
    { name: "Cedar Guardian", icon: "tree-pine", earned: false },
    { name: "All Regions", icon: "map", earned: false },
    { name: "Mountain Legend", icon: "crown", earned: false },
  ],
};

export const LOYALTY_LEVELS = [
  { name: "Explorer", minPoints: 0, color: "#8B9DAF" },
  { name: "Trail Blazer", minPoints: 1000, color: "#B8D435" },
  { name: "Summit Seeker", minPoints: 5000, color: "#E8913A" },
  { name: "Mountain Legend", minPoints: 10000, color: "#FFD700" },
];
