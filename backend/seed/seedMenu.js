// Seed Apna Baithak 81-item menu (INR) into MongoDB.
// Run:  node seed/seedMenu.js
// Uses MONGO_URI from backend/.env (same folder level ../.env).
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import foodModel from "../models/foodModel.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// [name, category, price, half, full, isPizza, description, bestSeller]
const MENU = [
  // 1. CHAI & COFFEE
  ["Chai", "Chai & Coffee", 15, null, null, false, "Kadak desi chai", true],
  ["Khullad Chai", "Chai & Coffee", 20, null, null, false, "Kulhad wali chai", true],
  ["Coffee", "Chai & Coffee", 30, null, null, false, "Hot coffee", false],
  ["Cold Coffee", "Chai & Coffee", 140, null, null, false, "Chilled cold coffee", true],
  // 2. BREAKFAST
  ["Samosa", "Breakfast", 15, null, null, false, "Crispy aloo samosa", true],
  ["Bread Pakora", "Breakfast", 20, null, null, false, "1 pc", false],
  ["Chole Samosa", "Breakfast", 25, null, null, false, "Samosa with chole", false],
  ["Aloo Patties", "Breakfast", 30, null, null, false, "1 pc", false],
  ["Paneer Patties", "Breakfast", 40, null, null, false, "1 pc", false],
  ["Chole Puri", "Breakfast", 60, null, null, false, "4 pcs puri with chole", true],
  ["Namak Para", "Breakfast", 60, null, null, false, "250 g", false],
  ["Chole Chawal", "Breakfast", 80, null, null, false, "Chole with steamed rice", false],
  ["Chole", "Breakfast", 80, null, null, false, "Breakfast chole bowl", false],
  ["Aloo Pakora", "Breakfast", 80, null, null, false, "16 pcs", false],
  ["Pyaz Pakora", "Breakfast", 90, null, null, false, "16 pcs", false],
  ["Paneer Pakora", "Breakfast", 140, null, null, false, "16 pcs", true],
  // 3. MAGGI (HALF/FULL)
  ["Plain Maggi", "Maggi", 40, 40, 80, false, "Classic plain maggi", true],
  ["Double Masala Maggi", "Maggi", 50, 50, 100, false, "Extra masala", false],
  ["Butter Veggies Maggi", "Maggi", 60, 60, 120, false, "Butter + mixed veggies", false],
  ["Paneer Maggi", "Maggi", 70, 70, 140, false, "With paneer cubes", false],
  ["Cheese Maggi", "Maggi", 80, 80, 150, false, "Cheesy maggi", true],
  // 4. SANDWICH
  ["Veg Sandwich", "Sandwich", 50, null, null, false, "Grilled veg sandwich", false],
  ["Paneer Sandwich", "Sandwich", 80, null, null, false, "Paneer filling", false],
  ["Cheese Sandwich", "Sandwich", 80, null, null, false, "Cheese filling", false],
  // 5. BURGER
  ["Aloo Tikki Burger", "Burger", 60, null, null, false, "Crispy aloo tikki", true],
  ["Veg Burger", "Burger", 70, null, null, false, "Veg patty burger", false],
  ["Paneer Burger", "Burger", 90, null, null, false, "Paneer patty burger", false],
  ["Cheese Burger", "Burger", 90, null, null, false, "Cheese slice burger", false],
  // 6. PIZZA (SMALL/REGULAR)
  ["Onion Pizza", "Pizza", 120, 120, 200, true, "Small Rs.120 / Regular Rs.200", true],
  ["Paneer Pizza", "Pizza", 130, 130, 220, true, "Small Rs.130 / Regular Rs.220", true],
  // 7. CHINESE (HALF/FULL)
  ["Veg Noodles", "Chinese", 60, 60, 110, false, "Classic veg noodles", true],
  ["Chilli Garlic Noodles", "Chinese", 70, 70, 130, false, "Spicy garlic flavour", false],
  ["Butter Noodles", "Chinese", 70, 70, 130, false, "Buttery noodles", false],
  ["Fried Rice", "Chinese", 70, 70, 130, false, "Veg fried rice", false],
  ["Paneer Noodles", "Chinese", 70, 70, 130, false, "With paneer", false],
  ["Schezwan Noodles", "Chinese", 70, 70, 150, false, "Schezwan style", true],
  ["Manchurian", "Chinese", 80, 80, 150, false, "Veg manchurian", true],
  ["Schezwan Fried Rice", "Chinese", 80, 80, 150, false, "Schezwan rice", false],
  ["Paneer Fried Rice", "Chinese", 80, 80, 150, false, "With paneer", false],
  ["Chilli Potato", "Chinese", 80, 80, 150, false, "Crispy chilli potato", true],
  ["Paneer Manchurian", "Chinese", 90, 90, 170, false, "Paneer manchurian", false],
  ["Chilli Paneer", "Chinese", 100, 100, 190, false, "Restaurant style chilli paneer", true],
  ["Honey Chilli Potato", "Chinese", 100, 100, 190, false, "Sweet-spicy", true],
  // 8. SNACKS
  ["Kebab Tikki", "Snacks", 20, null, null, false, "1 pc", false],
  ["Kebab Paratha", "Snacks", 20, null, null, false, "Kebab with paratha", false],
  ["Kebab Roll", "Snacks", 40, null, null, false, "Veg kebab roll", true],
  ["Biryani", "Snacks", 50, 50, 100, false, "Veg biryani", true],
  ["Finger Chips", "Snacks", 50, 50, 100, false, "Crispy fries", false],
  ["Spring Roll", "Snacks", 50, 50, 100, false, "Veg spring roll", false],
  ["Steam Momos", "Snacks", 50, 50, 100, false, "Steamed veg momos", true],
  ["Fried Momos", "Snacks", 60, 60, 120, false, "Crispy fried momos", false],
  ["Chilli Momos", "Snacks", 70, 70, 130, false, "Spicy chilli momos", false],
  ["Paneer Momos Steam", "Snacks", 80, 80, 150, false, "Steamed paneer momos", true],
  ["Paneer Fried", "Snacks", 90, 90, 160, false, "Fried paneer momos", false],
  ["Chilli Paneer Momos", "Snacks", 100, 100, 180, false, "Chilli paneer momos", true],
  // 9. PARATHA & ROTI
  ["Tawa Roti", "Paratha & Roti", 10, null, null, false, "Fresh tawa roti", false],
  ["Butter Roti", "Paratha & Roti", 15, null, null, false, "Tawa roti with butter", false],
  ["Plain Paratha", "Paratha & Roti", 25, null, null, false, "Tawa plain paratha", false],
  ["Lachha Paratha", "Paratha & Roti", 40, null, null, false, "Layered lachha paratha", true],
  ["Aloo Paratha", "Paratha & Roti", 50, null, null, false, "Stuffed aloo paratha", true],
  ["Pyaz Paratha", "Paratha & Roti", 60, null, null, false, "Onion stuffed paratha", false],
  ["Paneer Paratha", "Paratha & Roti", 100, null, null, false, "Paneer stuffed paratha", true],
  // 10. DAL & SABZI (HALF/FULL)
  ["Aloo Jeera", "Dal & Sabzi", 70, 70, 130, false, "Jeera aloo", false],
  ["Aloo Matar", "Dal & Sabzi", 70, 70, 130, false, "Aloo matar sabzi", false],
  ["Aloo Matar Tamatar", "Dal & Sabzi", 70, 70, 130, false, "With tomato gravy", false],
  ["Chole", "Dal & Sabzi", 70, 70, 130, false, "Chole masala", true],
  ["Arhar Dal Fry", "Dal & Sabzi", 80, 80, 150, false, "Tadka arhar dal", false],
  ["Matar Paneer", "Dal & Sabzi", 100, 100, 180, false, "Matar paneer curry", true],
  ["Matar Mushroom", "Dal & Sabzi", 110, 110, 200, false, "Mushroom matar", false],
  ["Kadai Paneer", "Dal & Sabzi", 120, 120, 220, false, "Kadai masala paneer", true],
  ["Shahi Paneer", "Dal & Sabzi", 120, 120, 220, false, "Rich shahi paneer", true],
  // 11. RAITA
  ["Boondi Raita", "Raita", 70, null, null, false, "Boondi raita bowl", false],
  ["Kheera Raita", "Raita", 70, null, null, false, "Cucumber raita", false],
  // 12. DESSERT
  ["Gulab Jamun", "Dessert", 25, null, null, false, "1 pc", true],
  ["Rasgulla", "Dessert", 25, null, null, false, "1 pc", false],
  ["Dahi Bada", "Dessert", 30, null, null, false, "1 pc", false],
  ["Kheer", "Dessert", 100, null, null, false, "Rice kheer bowl", true],
  // 13. THALI
  ["Thali", "Thali", 120, null, null, false, "4 Roti + Daal + Sabji + Jeera Rice + Salad + Raita", true],
  ["Special Thali", "Thali", 200, null, null, false, "Paneer Sabji/Mushroom + Daal Fry/Makhni + Papad + 1 Lachha Paratha + 2 Tawa Roti + Jeera Rice + Salad + Raita + 1 Rasgulla", true],
  // 14. COMBO
  ["Combo 140", "Combo", 140, null, null, false, "Veg Noodles + Finger Chips + Chilli Paneer + Cold Drink", true],
  ["Combo 160", "Combo", 160, null, null, false, "Manchurian + Fried Rice + Chilli Paneer + Cold Drink", true],
];

const run = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error("Set MONGO_URI in backend/.env first");
  await mongoose.connect(uri);
  console.log("DB connected, seeding", MENU.length, "items...");
  let i = 0;
  for (const [name, category, price, half, full, isPizza, description, bestSeller] of MENU) {
    await foodModel.findOneAndUpdate(
      { name, category },
      {
        name, category, description,
        price, halfPrice: half, fullPrice: full, isPizza,
        image: "seed.png", isVeg: true, bestSeller, available: true, sortOrder: i
      },
      { upsert: true }
    );
    i++;
  }
  console.log("Seed done:", i, "items. (Photos: upload real ones from Admin panel later.)");
  await mongoose.disconnect();
};

run().catch((e) => { console.error(e.message); process.exit(1); });
