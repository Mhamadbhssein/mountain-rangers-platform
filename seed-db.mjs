import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import {
  trips,
  communityPosts,
  users,
} from "./drizzle/schema.ts";
import { sql } from "drizzle-orm";

const db = drizzle(process.env.DATABASE_URL);

const IMAGES = {
  tripCard1:
    "https://private-us-east-1.manuscdn.com/sessionFile/efZ257f6EEGTTCZt8TtP7e/sandbox/yVtS7ZK5yiZ8PzP8OJUIJX-img-2_1771884249000_na1fn_dHJpcC1jYXJkLTE.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvZWZaMjU3ZjZFRUdUVENadDhUdFA3ZS9zYW5kYm94L3lWdFM3Wks1eWlaOFB6UDhPSlVJSlgtaW1nLTJfMTc3MTg4NDI0OTAwMF9uYTFmbl9kSEpwY0MxallYSmtMVEUuanBnP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=wCfzM94kszRfs9rmiByoBbjrwKFuUPvY8mwxLT-VW1vCdF0o5z10FleCJfGXN-IvdTOPrldK6Ke2bXG2nRcX6rqYRRBZ1iYQInlHRZxKl4ybczmcdgRo-8uKtHHj5Le0SvTh8TNs7ybs-MRlePhgBl-9p1kmVNUHa1v~wuV7aHc4zkbYZyHUm6BxLrqGxwWap5bYXw4Ur-W9UZUlCVWUiQNkTj-VYQHqGFb51SYbHP6OB9HZYM1JO5GX5dYDGcpzFM~dEz16HyscKn7ELHX19y6ybrRJYQTDNXo-74zdlET4udRyJxyGm1bS1wktrBtnUWVTJBausCR2CxxEuEdxMQ__",
  tripCard2:
    "https://private-us-east-1.manuscdn.com/sessionFile/efZ257f6EEGTTCZt8TtP7e/sandbox/yVtS7ZK5yiZ8PzP8OJUIJX-img-3_1771884245000_na1fn_dHJpcC1jYXJkLTI.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvZWZaMjU3ZjZFRUdUVENadDhUdFA3ZS9zYW5kYm94L3lWdFM3Wks1eWlaOFB6UDhPSlVJSlgtaW1nLTNfMTc3MTg4NDI0NTAwMF9uYTFmbl9kSEpwY0MxallYSmtMVEkuanBnP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=Cq5IrrzfGrP2j66cyMbzVQyk9n-xPf3Qf-MPfAJiaa6Epn6JCDGdxM8duRDdDZtgk-iWq828WMBW4y936ePOT57ItAT0hdOFQtr8ltppO-Gi6Mi0-X2tH7OZzYNxuBuD781s5T629hC1sJqNq1RKG512snbgnK0eZY6quxYyU91ltouGfXgwxKWsHX~~F8t89fPyJ~-CVndGYouN0Zs92t-qi2CIX4mmWsCj2armh10hspA-8TuONPTW0GMaMNkeznRF7SBDVgtACN4ThLc3-NXM9vLMy5esam1xnuqAAa-1ULFCa2YvpreXAd36mgLeba86Fc1-NnR0Zi4sQVjxlg__",
  tripCard3:
    "https://private-us-east-1.manuscdn.com/sessionFile/efZ257f6EEGTTCZt8TtP7e/sandbox/yVtS7ZK5yiZ8PzP8OJUIJX-img-4_1771884265000_na1fn_dHJpcC1jYXJkLTM.jpg?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvZWZaMjU3ZjZFRUdUVENadDhUdFA3ZS9zYW5kYm94L3lWdFM3Wks1eWlaOFB6UDhPSlVJSlgtaW1nLTRfMTc3MTg4NDI2NTAwMF9uYTFmbl9kSEpwY0MxallYSmtMVE0uanBnP3gtb3NzLXByb2Nlc3M9aW1hZ2UvcmVzaXplLHdfMTkyMCxoXzE5MjAvZm9ybWF0LHdlYnAvcXVhbGl0eSxxXzgwIiwiQ29uZGl0aW9uIjp7IkRhdGVMZXNzVGhhbiI6eyJBV1M6RXBvY2hUaW1lIjoxNzk4NzYxNjAwfX19XX0_&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=bGBON-1wXBw6j0zW3LKP65Mb4QbAn007r2719HoIMVtTagWmkFWbsHYQj08m~Tly6HOcpe~uH9xTsd1tKLQQo87lkQW~Vb4U1uEEs1cnZivFpQ~jZD49RIFHmtGYWPRjvCUXbF2Ec8MQPtDlLhn8Uhcp~LTl32K-QRy-Jl~FPKfAz5DX3-8yH9j1eQQHqqNwtMsq5n03zzXaKHd-Aw5WXfnKEt9SJqIvMFGBrJOsfpGXYILAZtNmgWGKlLxS6MsLrSLIDRf8ETVwyIGrXP-Tqadrz-BMB80f9uxZ3epzphUlXdndTqFldCjSDRxsaKF0riOeJV8FDOnxJLTVJY24~g__",
};

async function seed() {
  console.log("🌱 Seeding Mountain Rangers database...");

  // Check if trips already exist
  const existingTrips = await db.select({ count: sql`COUNT(*)` }).from(trips);
  const tripCount = Number(existingTrips[0].count);

  if (tripCount > 0) {
    console.log(`✅ Database already has ${tripCount} trips. Skipping seed.`);
    process.exit(0);
  }

  // Seed trips
  console.log("📍 Inserting trips...");
  await db.insert(trips).values([
    {
      title: "Qadisha Valley Ridge",
      location: "Bcharre, North Lebanon",
      date: new Date("2026-03-08T06:30:00Z"),
      time: "6:30 AM",
      duration: "8 hours",
      difficulty: "Hard",
      price: "45.00",
      currency: "USD",
      imageUrl: IMAGES.tripCard1,
      description:
        "Traverse the legendary Qadisha Valley, a UNESCO World Heritage site. This challenging ridge hike offers breathtaking views of the holy valley, ancient monasteries carved into cliff faces, and the towering cedars of God forest. The trail follows ancient shepherd paths along dramatic limestone cliffs with panoramic views of the Mediterranean Sea.",
      highlights: JSON.stringify([
        "UNESCO World Heritage Site",
        "Ancient Monastery Ruins",
        "Cedar Forest Trail",
        "Mediterranean Views",
        "Cliff-edge Paths",
      ]),
      included: JSON.stringify([
        "Round-trip transport",
        "Professional guide",
        "Lunch & snacks",
        "First aid kit",
        "Photography stops",
      ]),
      meetingPoint: "Beirut, Cola Station",
      totalSeats: 24,
      rating: "4.90",
      reviewCount: 127,
      elevation: "1,850m",
      distance: "14 km",
    },
    {
      title: "Baatara Gorge Waterfall",
      location: "Tannourine, Mount Lebanon",
      date: new Date("2026-03-15T07:00:00Z"),
      time: "7:00 AM",
      duration: "6 hours",
      difficulty: "Moderate",
      price: "35.00",
      currency: "USD",
      imageUrl: IMAGES.tripCard2,
      description:
        "Discover the spectacular Baatara Gorge Waterfall, one of the most stunning natural wonders in Lebanon. The waterfall drops 255 meters into a Jurassic limestone cave. The hike winds through lush forests, past natural springs, and offers incredible geological formations millions of years in the making.",
      highlights: JSON.stringify([
        "255m Waterfall Drop",
        "Jurassic Limestone Cave",
        "Natural Springs",
        "Forest Trail",
        "Geological Wonders",
      ]),
      included: JSON.stringify([
        "Round-trip transport",
        "Professional guide",
        "Snacks & water",
        "First aid kit",
        "Entrance fees",
      ]),
      meetingPoint: "Beirut, Charles Helou Station",
      totalSeats: 24,
      rating: "4.80",
      reviewCount: 89,
      elevation: "1,200m",
      distance: "8 km",
    },
    {
      title: "Sunset at Faqra Ruins",
      location: "Faqra, Kesrwan",
      date: new Date("2026-03-22T14:00:00Z"),
      time: "2:00 PM",
      duration: "5 hours",
      difficulty: "Easy",
      price: "25.00",
      currency: "USD",
      imageUrl: IMAGES.tripCard3,
      description:
        "A magical evening hike to the ancient Roman and Phoenician ruins of Faqra, perched high in the mountains of Kesrwan. Watch the sunset paint the Bekaa Valley in gold as you explore temples, altars, and towers dating back thousands of years. Perfect for beginners and photography enthusiasts.",
      highlights: JSON.stringify([
        "Roman & Phoenician Ruins",
        "Bekaa Valley Sunset",
        "Ancient Temples",
        "Photography Paradise",
        "Beginner Friendly",
      ]),
      included: JSON.stringify([
        "Round-trip transport",
        "Professional guide",
        "Hot beverages",
        "First aid kit",
        "Historical briefing",
      ]),
      meetingPoint: "Beirut, Dora Roundabout",
      totalSeats: 24,
      rating: "4.70",
      reviewCount: 203,
      elevation: "1,500m",
      distance: "5 km",
    },
    {
      title: "Chouf Cedar Reserve",
      location: "Chouf, Mount Lebanon",
      date: new Date("2026-03-29T06:00:00Z"),
      time: "6:00 AM",
      duration: "9 hours",
      difficulty: "Moderate",
      price: "40.00",
      currency: "USD",
      imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80",
      description:
        "Explore the largest remaining cedar forest in Lebanon, home to trees over 2,000 years old. The Chouf Cedar Reserve covers 5% of Lebanon's total area and offers diverse trails through ancient forests, mountain meadows, and panoramic ridgelines.",
      highlights: JSON.stringify([
        "2000-year-old Cedars",
        "Largest Cedar Reserve",
        "Wildlife Spotting",
        "Mountain Meadows",
        "Panoramic Ridgelines",
      ]),
      included: JSON.stringify([
        "Round-trip transport",
        "Professional guide",
        "Lunch & snacks",
        "First aid kit",
        "Reserve entrance",
      ]),
      meetingPoint: "Beirut, Cola Station",
      totalSeats: 24,
      rating: "4.90",
      reviewCount: 156,
      elevation: "1,900m",
      distance: "12 km",
    },
    {
      title: "Jeita Grotto & Harissa",
      location: "Jounieh, Mount Lebanon",
      date: new Date("2026-04-05T08:00:00Z"),
      time: "8:00 AM",
      duration: "7 hours",
      difficulty: "Easy",
      price: "30.00",
      currency: "USD",
      imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
      description:
        "A combined adventure visiting two of Lebanon's most iconic landmarks. Start with the magnificent Jeita Grotto, a system of interconnected limestone caves, then ascend to the Our Lady of Lebanon statue in Harissa with breathtaking views of the Bay of Jounieh.",
      highlights: JSON.stringify([
        "Jeita Grotto Caves",
        "Harissa Statue",
        "Bay of Jounieh Views",
        "Cable Car Ride",
        "Cultural Experience",
      ]),
      included: JSON.stringify([
        "Round-trip transport",
        "Professional guide",
        "Lunch",
        "All entrance fees",
        "Cable car ticket",
      ]),
      meetingPoint: "Beirut, Martyrs Square",
      totalSeats: 24,
      rating: "4.60",
      reviewCount: 312,
      elevation: "650m",
      distance: "4 km",
    },
  ]);

  console.log("✅ 5 trips inserted.");

  // Create demo community users
  console.log("👥 Inserting demo community users...");
  await db.insert(users).values([
    {
      openId: "demo-sarah",
      name: "Sarah M.",
      email: "sarah@demo.com",
      loginMethod: "demo",
      role: "user",
    },
    {
      openId: "demo-ahmad",
      name: "Ahmad K.",
      email: "ahmad@demo.com",
      loginMethod: "demo",
      role: "user",
    },
    {
      openId: "demo-nour",
      name: "Nour H.",
      email: "nour@demo.com",
      loginMethod: "demo",
      role: "user",
    },
    {
      openId: "demo-maya",
      name: "Maya R.",
      email: "maya@demo.com",
      loginMethod: "demo",
      role: "user",
    },
  ]);

  // Get inserted user IDs
  const demoUsers = await db
    .select({ id: users.id, openId: users.openId })
    .from(users)
    .where(sql`${users.openId} LIKE 'demo-%'`);

  const userMap = {};
  for (const u of demoUsers) {
    userMap[u.openId] = u.id;
  }

  // Seed community posts
  console.log("💬 Inserting community posts...");
  await db.insert(communityPosts).values([
    {
      userId: userMap["demo-sarah"],
      tripTitle: "Qadisha Valley Ridge",
      content:
        "Absolutely breathtaking experience! The view from the ridge was unlike anything I've ever seen. Our guide Karim was incredibly knowledgeable about the history of the monasteries. Can't wait for the next trip!",
      images: JSON.stringify([IMAGES.tripCard1]),
      likesCount: 47,
      commentsCount: 12,
    },
    {
      userId: userMap["demo-ahmad"],
      tripTitle: "Baatara Gorge Waterfall",
      content:
        "The waterfall was even more impressive in person than in photos. The sound of water echoing through the cave was magical. Highly recommend bringing a good camera — every angle is a masterpiece.",
      images: JSON.stringify([IMAGES.tripCard2]),
      likesCount: 35,
      commentsCount: 8,
    },
    {
      userId: userMap["demo-nour"],
      tripTitle: "Sunset at Faqra Ruins",
      content:
        "Watching the sunset from the ancient ruins was a spiritual experience. The golden light on the old stones, the valley stretching below... Lebanon is truly magical. Thank you Mountain Rangers for organizing this!",
      images: JSON.stringify([IMAGES.tripCard3]),
      likesCount: 62,
      commentsCount: 15,
    },
    {
      userId: userMap["demo-maya"],
      tripTitle: "Chouf Cedar Reserve",
      content:
        "Standing among trees that are over 2,000 years old puts everything in perspective. The forest was so peaceful and the air so fresh. Our group bonded so well during the hike. Already signed up for next month!",
      images: JSON.stringify([]),
      likesCount: 28,
      commentsCount: 6,
    },
  ]);

  console.log("✅ 4 community posts inserted.");
  console.log("🎉 Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
