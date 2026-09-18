import basket_icon from "./basket_icon.png";
import header_img from "./header_img.png";
import logo from "./logo.png";
import logo2 from "./logo2.png";
import baithakLogo from "./baithak-logo.svg";
import search_icon from "./search_icon.png";

//my image start

import cakelogo from "./cakelogo.jpg";
import chickenlogo from "./chickenlogo.jpg";
import fishlogo from "./fishlogo.jpg";
import muttonlogo from "./muttonlogo.jpg";
import pureveglogo from "./pureveglogo.jpg";
import rollslogo from "./rollslogo.jpg";

//for veg
import butterpaner from "./butterpaner.jpg";
import chilipaner from "./chilipaner.jpg";
import masalapaner from "./masalapaner.jpg";

//for cake
import chocolatecake from "./chocolatecake.jpg";
import redcake from "./redcake.jpg";
import vanilacake from "./vanilacake.jpg";

//for fish
import butterfish from "./butterfish.jpg";
import fishfry from "./fishfry.jpg";
import masalafish from "./masalafish.jpg";

//for chicken
import butterchicken from "./butterchicken.jpg";
import chilichicken from "./chilichicken.jpg";
import roastchicken from "./roastchicken.jpg";

//for mutton
import chilimutton from "./chilimutton.jpg";
import masalamutton from "./masalamutton.jpg";
import tandurimutton from "./tandurimutton.jpg";

//for rolls
import chickenroll from "./chickenroll.jpg";
import eggroll from "./eggroll.jpg";
import panerroll from "./panerroll.jpg";

//my image end

import add_icon_green from "./add_icon_green.png";
import add_icon_white from "./add_icon_white.png";
import app_store from "./app_store.png";
import bag_icon from "./bag_icon.png";
import cross_icon from "./cross_icon.png";
import facebook_icon from "./facebook_icon.png";
import linkedin_icon from "./linkedin_icon.png";
import logout_icon from "./logout_icon.png";
import parcel_icon from "./parcel_icon.png";
import play_store from "./play_store.png";
import profile_icon from "./profile_icon.png";
import rating_starts from "./rating_starts.png";
import remove_icon_red from "./remove_icon_red.png";
import selector_icon from "./selector_icon.png";
import twitter_icon from "./twitter_icon.png";

export const assets = {
  logo2,
  logo,
  baithakLogo,
  basket_icon,
  header_img,
  search_icon,
  rating_starts,
  add_icon_green,
  add_icon_white,
  remove_icon_red,
  app_store,
  play_store,
  linkedin_icon,
  facebook_icon,
  twitter_icon,
  cross_icon,
  selector_icon,
  profile_icon,
  logout_icon,
  bag_icon,
  parcel_icon,
};

export const menu_list = [
  { menu_name: "Chai & Coffee", menu_image: vanilacake },
  { menu_name: "Breakfast", menu_image: panerroll },
  { menu_name: "Maggi", menu_image: masalapaner },
  { menu_name: "Sandwich", menu_image: pureveglogo },
  { menu_name: "Burger", menu_image: rollslogo },
  { menu_name: "Pizza", menu_image: cakelogo },
  { menu_name: "Chinese", menu_image: chilipaner },
  { menu_name: "Snacks", menu_image: butterpaner },
  { menu_name: "Paratha & Roti", menu_image: pureveglogo },
  { menu_name: "Dal & Sabzi", menu_image: masalapaner },
  { menu_name: "Raita", menu_image: vanilacake },
  { menu_name: "Dessert", menu_image: chocolatecake },
  { menu_name: "Thali", menu_image: butterpaner },
  { menu_name: "Combo", menu_image: chilipaner },
];

export const food_list = [
  //own data
  {
    _id: "33",
    name: "Butter Paner",
    image: butterpaner,
    price: 5,
    description:
      "Butter Paneer is a rich & creamy curry made with paneer, spices, onions, tomatoes, cashews and butter.",
    category: "Pure Veg",
  },
  {
    _id: "34",
    name: "Chili Paner",
    image: chilipaner,
    price: 4,
    description:
      "Butter Paneer is a rich & creamy curry made with paneer, spices, onions, tomatoes, cashews and butter.",
    category: "Pure Veg",
  },
  {
    _id: "35",
    name: "Masala Paner",
    image: masalapaner,
    price: 6,
    description:
      "Butter Paneer is a rich & creamy curry made with paneer, spices, onions, tomatoes, cashews and butter.",
    category: "Pure Veg",
  },
  {
    _id: "36",
    name: "Chocolate Cake",
    image: chocolatecake,
    price: 6,
    description:
      "Butter Paneer is a rich & creamy curry made with paneer, spices, onions, tomatoes, cashews and butter.",
    category: "Cake",
  },
  {
    _id: "37",
    name: "Red Velvet Cake",
    image: redcake,
    price: 5,
    description:
      "Butter Paneer is a rich & creamy curry made with paneer, spices, onions, tomatoes, cashews and butter.",
    category: "Cake",
  },
  {
    _id: "38",
    name: "Vanilla Cake",
    image: vanilacake,
    price: 4,
    description:
      "Butter Paneer is a rich & creamy curry made with paneer, spices, onions, tomatoes, cashews and butter.",
    category: "Cake",
  },
  {
    _id: "39",
    name: "Fish Fry",
    image: fishfry,
    price: 5,
    description: "Butter, spices, onions, tomatoes, cashews and butter.",
    category: "Fish",
  },
  {
    _id: "40",
    name: "Masala Fish",
    image: masalafish,
    price: 6,
    description: "Butter, spices, onions, tomatoes, cashews and butter.",
    category: "Fish",
  },
  {
    _id: "41",
    name: "Butter Fish",
    image: butterfish,
    price: 7,
    description: "Butter, spices, onions, tomatoes, cashews and butter.",
    category: "Fish",
  },
  {
    _id: "42",
    name: "Chilli Chicken",
    image: chilichicken,
    price: 7,
    description: "Butter, spices, onions, tomatoes, cashews and butter.",
    category: "Chicken",
  },
  {
    _id: "43",
    name: "Roast Chicken",
    image: roastchicken,
    price: 8,
    description: "Butter, spices, onions, tomatoes, cashews and butter.",
    category: "Chicken",
  },
  {
    _id: "44",
    name: "Butter Chicken",
    image: butterchicken,
    price: 10,
    description: "Butter, spices, onions, tomatoes, cashews and butter.",
    category: "Chicken",
  },
  {
    _id: "45",
    name: "Mutton Masala",
    image: masalamutton,
    price: 12,
    description: "Butter, spices, onions, tomatoes, cashews and butter.",
    category: "Mutton",
  },
  {
    _id: "46",
    name: "Chili Mutton",
    image: chilimutton,
    price: 11,
    description: "Butter, spices, onions, tomatoes, cashews and butter.",
    category: "Mutton",
  },
  {
    _id: "47",
    name: "Mutton Tanduri",
    image: tandurimutton,
    price: 15,
    description: "Butter, spices, onions, tomatoes, cashews and butter.",
    category: "Mutton",
  },
  {
    _id: "48",
    name: "Egg Roll",
    image: eggroll,
    price: 7,
    description: "Butter, spices, onions, tomatoes, cashews and butter.",
    category: "Rolls",
  },
  {
    _id: "49",
    name: "Paner Roll",
    image: panerroll,
    price: 8,
    description: "Butter, spices, onions, tomatoes, cashews and butter.",
    category: "Rolls",
  },
  {
    _id: "50",
    name: "Chicken Roll",
    image: chickenroll,
    price: 10,
    description: "Butter, spices, onions, tomatoes, cashews and butter.",
    category: "Rolls",
  },
];
