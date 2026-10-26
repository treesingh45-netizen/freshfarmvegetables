// server/apiApp.ts
import "dotenv/config";
import crypto2 from "node:crypto";
import express from "express";

// server/db.ts
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// src/constants/catalogSeed.ts
var SEED_RATE_DATE = "2026-10-25T08:00:00.000Z";
var INITIAL_PRODUCTS = [
  {
    id: "prod-iceberg-lettuce",
    slug: "iceberg-lettuce",
    name: "Iceberg Lettuce",
    origin: "local",
    categories: ["all", "local", "bestsellers", "iceberg-lettuce", "lettuce-collection"],
    isSpecialty: true,
    featured: true,
    bestseller: true,
    description: "Signature crisphead iceberg lettuce selected for tight leaf structure, clean core, and dependable crunch for burger lines, salad bars, wraps, and high-volume commercial prep.",
    culinaryApplications: "Shredded burger and sandwich builds, cold salad stations, wraps, and catering platters.",
    handlingNotes: "Keep refrigerated between 1 C and 4 C away from ethylene-producing produce.",
    imageUrl: "/images/produce/iceberg-lettuce.jpg",
    galleryUrls: ["/images/produce/iceberg-lettuce.jpg", "/images/produce/hero-produce.jpg"],
    packageOptions: ["1 kg", "0.5 kg", "5 kg"],
    pricingMode: "live",
    pricePkr: 320,
    priceUnit: "per kg",
    priceUpdatedAt: SEED_RATE_DATE,
    stockStatus: "in_stock",
    enabled: true
  },
  {
    id: "prod-vacuum-packed-lettuce",
    slug: "vacuum-packed-lettuce",
    name: "Vacuum-Packed Lettuce",
    origin: "local",
    categories: ["all", "local", "bestsellers", "vacuum-packed-lettuce", "lettuce-collection"],
    isSpecialty: true,
    featured: true,
    bestseller: true,
    description: "Specialty vacuum-packed lettuce prepared for professional kitchens seeking consistent leaf crispness, streamlined cold-room storage, and reduced prep-line handling.",
    culinaryApplications: "Quick-service restaurant lines, hotel banquet prep, cafe sandwich stations, and scheduled kitchen supply.",
    handlingNotes: "Maintain continuous cold storage prior to opening; use promptly after unsealing.",
    imageUrl: "/images/produce/vacuum-packed-lettuce.jpg",
    galleryUrls: [
      "/images/produce/vacuum-packed-lettuce.jpg",
      "/images/produce/iceberg-lettuce.jpg"
    ],
    packageOptions: ["1 kg", "0.5 kg", "5 kg"],
    pricingMode: "live",
    pricePkr: 380,
    priceUnit: "per kg",
    priceUpdatedAt: SEED_RATE_DATE,
    stockStatus: "in_stock",
    enabled: true
  },
  {
    id: "prod-tomatoes",
    slug: "tomatoes",
    name: "Tomatoes - Fresh Local",
    origin: "local",
    categories: ["all", "local", "bestsellers"],
    isSpecialty: false,
    featured: true,
    bestseller: true,
    description: "Firm, ripe local tomatoes suited for both raw slicing on service lines and rich base sauces, gravies, and curries.",
    culinaryApplications: "Burger and sandwich slicing, base sauces, salsas, salads, and daily handi prep.",
    handlingNotes: "Store in a cool, ventilated space; refrigerate once fully ripened.",
    imageUrl: "/images/produce/tomatoes.jpg",
    galleryUrls: ["/images/produce/tomatoes.jpg"],
    packageOptions: ["1 kg", "0.5 kg", "5 kg"],
    pricingMode: "live",
    pricePkr: 180,
    priceUnit: "per kg",
    priceUpdatedAt: SEED_RATE_DATE,
    stockStatus: "in_stock",
    enabled: true
  },
  {
    id: "prod-onions",
    slug: "onions",
    name: "Onions - Dry Cured",
    origin: "local",
    categories: ["all", "local", "bestsellers"],
    isSpecialty: false,
    featured: true,
    bestseller: true,
    description: "Clean, dry-cured local onions selected for uniform bulb firmness and everyday culinary prep across commercial and household kitchens.",
    culinaryApplications: "Stocks, gravies, mirepoix, caramelized toppings, and fresh rings.",
    handlingNotes: "Keep in a dry, well-ventilated storage area away from moisture.",
    imageUrl: "/images/produce/onions.jpg",
    galleryUrls: ["/images/produce/onions.jpg"],
    packageOptions: ["1 kg", "0.5 kg", "5 kg"],
    pricingMode: "live",
    pricePkr: 160,
    priceUnit: "per kg",
    priceUpdatedAt: SEED_RATE_DATE,
    stockStatus: "in_stock",
    enabled: true
  },
  {
    id: "prod-red-carrots",
    slug: "red-carrots",
    name: "Carrots - Red (Local)",
    origin: "local",
    categories: ["all", "local"],
    isSpecialty: false,
    featured: false,
    bestseller: false,
    description: "Seasonal local red carrots prized for natural sweetness, vibrant color, and tender crunch.",
    culinaryApplications: "Fresh juices, slaws, stir-fries, pickles, and traditional desserts.",
    handlingNotes: "Store chilled in breathable produce bags to preserve moisture.",
    imageUrl: "/images/produce/red-carrots.jpg",
    galleryUrls: ["/images/produce/red-carrots.jpg"],
    packageOptions: ["1 kg", "0.5 kg", "5 kg"],
    pricingMode: "live",
    pricePkr: 120,
    priceUnit: "per kg",
    priceUpdatedAt: SEED_RATE_DATE,
    stockStatus: "in_stock",
    enabled: true
  },
  {
    id: "prod-orange-carrots",
    slug: "orange-carrots",
    name: "Carrots - Orange",
    origin: "local",
    categories: ["all", "local"],
    isSpecialty: false,
    featured: false,
    bestseller: false,
    description: "Crisp orange carrots suited for year-round culinary prep, julienne garnishes, stocks, and roasting.",
    culinaryApplications: "Mirepoix, roasted sides, julienne slaws, soups, and salad mixes.",
    handlingNotes: "Keep refrigerated under high humidity for lasting firmness.",
    imageUrl: "/images/produce/orange-carrots.jpg",
    galleryUrls: ["/images/produce/orange-carrots.jpg"],
    packageOptions: ["1 kg", "0.5 kg", "5 kg"],
    pricingMode: "live",
    pricePkr: 220,
    priceUnit: "per kg",
    priceUpdatedAt: SEED_RATE_DATE,
    stockStatus: "in_stock",
    enabled: true
  },
  {
    id: "prod-green-capsicum",
    slug: "green-capsicum",
    name: "Capsicum - Green",
    origin: "local",
    categories: ["all", "local", "bestsellers"],
    isSpecialty: false,
    featured: true,
    bestseller: true,
    description: "Glossy, thick-walled local green capsicum with crisp texture for pizza toppings, wok dishes, fajitas, and salads.",
    culinaryApplications: "Pizza and pasta stations, stir-fries, kebabs, and diced cold salads.",
    handlingNotes: "Keep dry and cool; avoid crushing during crate stacking.",
    imageUrl: "/images/produce/green-capsicum.jpg",
    galleryUrls: ["/images/produce/green-capsicum.jpg"],
    packageOptions: ["0.5 kg", "0.25 kg", "1 kg"],
    pricingMode: "live",
    pricePkr: 260,
    priceUnit: "per kg",
    priceUpdatedAt: SEED_RATE_DATE,
    stockStatus: "in_stock",
    enabled: true
  },
  {
    id: "prod-garlic",
    slug: "garlic",
    name: "Garlic - Local",
    origin: "local",
    categories: ["all", "local", "bestsellers"],
    isSpecialty: false,
    featured: false,
    bestseller: true,
    description: "Aromatic local garlic bulbs with tight cloves for marinades, sauces, tadka, and roasting.",
    culinaryApplications: "Garlic butter, marinades, confit, pan sauces, and savory bases.",
    handlingNotes: "Store in cool, dry airflow away from direct sunlight.",
    imageUrl: "/images/produce/garlic.jpg",
    galleryUrls: ["/images/produce/garlic.jpg"],
    packageOptions: ["0.25 kg", "0.5 kg", "1 kg"],
    pricingMode: "live",
    pricePkr: 560,
    priceUnit: "per kg",
    priceUpdatedAt: SEED_RATE_DATE,
    stockStatus: "in_stock",
    enabled: true
  },
  {
    id: "prod-ginger",
    slug: "ginger",
    name: "Ginger - Fresh",
    origin: "local",
    categories: ["all", "local"],
    isSpecialty: false,
    featured: false,
    bestseller: false,
    description: "Fresh, fibrous-light ginger rhizomes with bright warmth for savory kitchens, marinades, wok cookery, and beverages.",
    culinaryApplications: "Ginger-garlic pastes, Asian stir-fries, marinades, soups, and infusions.",
    handlingNotes: "Store cool and dry or wrapped in cold storage.",
    imageUrl: "/images/produce/ginger.jpg",
    galleryUrls: ["/images/produce/ginger.jpg"],
    packageOptions: ["0.25 kg", "0.5 kg", "1 kg"],
    pricingMode: "live",
    pricePkr: 620,
    priceUnit: "per kg",
    priceUpdatedAt: SEED_RATE_DATE,
    stockStatus: "in_stock",
    enabled: true
  },
  {
    id: "prod-cabbage",
    slug: "cabbage",
    name: "Cabbage - Green",
    origin: "local",
    categories: ["all", "local"],
    isSpecialty: false,
    featured: false,
    bestseller: false,
    description: "Dense, clean local green cabbage heads delivering reliable shred yield for slaws, dumplings, and wok service.",
    culinaryApplications: "Coleslaw, pan-seared sides, momos, spring rolls, and noodle bowls.",
    handlingNotes: "Hold whole heads chilled; wrap cut halves tightly.",
    imageUrl: "/images/produce/cabbage.jpg",
    galleryUrls: ["/images/produce/cabbage.jpg"],
    packageOptions: ["1 kg", "0.5 kg", "5 kg"],
    pricingMode: "live",
    pricePkr: 140,
    priceUnit: "per kg",
    priceUpdatedAt: SEED_RATE_DATE,
    stockStatus: "in_stock",
    enabled: true
  },
  {
    id: "prod-lemons",
    slug: "lemons",
    name: "Lemons - Fresh Juicy",
    origin: "local",
    categories: ["all", "local", "bestsellers"],
    isSpecialty: false,
    featured: true,
    bestseller: true,
    description: "Juicy local lemons selected for thin rinds and bright acidity across dressings, marinades, seafood, and beverage bars.",
    culinaryApplications: "Vinaigrettes, marinades, garnish wedges, and fresh beverage service.",
    handlingNotes: "Refrigerate for extended juiciness and rind freshness.",
    imageUrl: "/images/produce/lemons.jpg",
    galleryUrls: ["/images/produce/lemons.jpg"],
    packageOptions: ["0.25 kg", "0.5 kg", "1 kg"],
    pricingMode: "live",
    pricePkr: 360,
    priceUnit: "per kg",
    priceUpdatedAt: SEED_RATE_DATE,
    stockStatus: "in_stock",
    enabled: true
  },
  {
    id: "prod-broccoli",
    slug: "broccoli",
    name: "Broccoli - Fresh Crown",
    origin: "local",
    categories: ["all", "local", "bestsellers"],
    isSpecialty: false,
    featured: true,
    bestseller: true,
    description: "Compact, deep-green broccoli crowns trimmed for floret consistency in continental mains, stir-fries, and healthy bowls.",
    culinaryApplications: "Blanched and seared sides, pasta dishes, stir-fries, and roasted platters.",
    handlingNotes: "Keep cold and misted or wrapped to preserve tight green buds.",
    imageUrl: "/images/produce/broccoli.jpg",
    galleryUrls: ["/images/produce/broccoli.jpg"],
    packageOptions: ["0.5 kg", "0.25 kg", "1 kg"],
    pricingMode: "live",
    pricePkr: 440,
    priceUnit: "per kg",
    priceUpdatedAt: SEED_RATE_DATE,
    stockStatus: "in_stock",
    enabled: true
  },
  {
    id: "prod-potatoes",
    slug: "potatoes",
    name: "Potatoes - Graded Local",
    origin: "local",
    categories: ["all", "local", "bestsellers"],
    isSpecialty: false,
    featured: true,
    bestseller: true,
    description: "Versatile, smooth-skinned local potatoes graded for uniform peeling, frying, mashing, and roasting.",
    culinaryApplications: "Hand-cut fries, mash, wedges, curries, and banquet sides.",
    handlingNotes: "Keep in dark, cool, ventilated storage away from onions.",
    imageUrl: "/images/produce/potatoes.jpg",
    galleryUrls: ["/images/produce/potatoes.jpg"],
    packageOptions: ["1 kg", "0.5 kg", "5 kg"],
    pricingMode: "live",
    pricePkr: 110,
    priceUnit: "per kg",
    priceUpdatedAt: SEED_RATE_DATE,
    stockStatus: "in_stock",
    enabled: true
  },
  {
    id: "prod-coriander",
    slug: "coriander",
    name: "Coriander - Fresh Bunch",
    origin: "local",
    categories: ["all", "local"],
    isSpecialty: false,
    featured: false,
    bestseller: false,
    description: "Fragrant, tender-stemmed fresh coriander bunches for chutneys, garnishes, salads, and finishing.",
    culinaryApplications: "Green chutneys, curries, herb dressings, salsas, and plate garnish.",
    handlingNotes: "Keep chilled with stems lightly dampened and leaves dry.",
    imageUrl: "/images/produce/coriander.jpg",
    galleryUrls: ["/images/produce/coriander.jpg"],
    packageOptions: ["250 g", "100 g", "1 kg"],
    pricingMode: "live",
    pricePkr: 240,
    priceUnit: "per kg",
    priceUpdatedAt: SEED_RATE_DATE,
    stockStatus: "in_stock",
    enabled: true
  },
  {
    id: "prod-cucumbers",
    slug: "cucumbers",
    name: "Cucumbers - Crisp Local",
    origin: "local",
    categories: ["all", "local"],
    isSpecialty: false,
    featured: true,
    bestseller: false,
    description: "Crisp, refreshing local cucumbers selected for firm skins and clean slicing on salad bars, sandwiches, and mezze platters.",
    culinaryApplications: "Green salads, raita, cold sandwiches, pickles, and beverage garnishes.",
    handlingNotes: "Store cool around 7 C to 10 C to avoid chilling pitting.",
    imageUrl: "/images/produce/cucumbers.jpg",
    galleryUrls: ["/images/produce/cucumbers.jpg"],
    packageOptions: ["1 kg", "0.5 kg", "5 kg"],
    pricingMode: "live",
    pricePkr: 150,
    priceUnit: "per kg",
    priceUpdatedAt: SEED_RATE_DATE,
    stockStatus: "in_stock",
    enabled: true
  },
  {
    id: "prod-green-chillies",
    slug: "green-chillies",
    name: "Green Chillies",
    origin: "local",
    categories: ["all", "local"],
    isSpecialty: false,
    featured: false,
    bestseller: false,
    description: "Firm, pungent fresh green chillies delivering sharp heat and vegetal aroma for commercial kitchens.",
    culinaryApplications: "Tadka, chutneys, marinades, stir-fries, and table condiments.",
    handlingNotes: "Store dry and ventilated under refrigeration.",
    imageUrl: "/images/produce/green-chillies.jpg",
    galleryUrls: ["/images/produce/green-chillies.jpg"],
    packageOptions: ["0.25 kg", "0.5 kg", "1 kg"],
    pricingMode: "live",
    pricePkr: 280,
    priceUnit: "per kg",
    priceUpdatedAt: SEED_RATE_DATE,
    stockStatus: "in_stock",
    enabled: true
  },
  {
    id: "prod-red-capsicum",
    slug: "red-capsicum",
    name: "Capsicum - Red (Imported)",
    origin: "imported",
    categories: ["all", "imported", "bestsellers"],
    isSpecialty: false,
    featured: true,
    bestseller: true,
    description: "Sweet, thick-fleshed imported red bell peppers with vibrant color for grilling, roasting, salads, and gourmet plating.",
    culinaryApplications: "Chargrilled antipasti, fajitas, coulis, salads, and gourmet pizzas.",
    handlingNotes: "Store chilled in dry crisper crates.",
    imageUrl: "/images/produce/red-capsicum.jpg",
    galleryUrls: ["/images/produce/red-capsicum.jpg"],
    packageOptions: ["0.5 kg", "0.25 kg", "1 kg"],
    pricingMode: "live",
    pricePkr: 980,
    priceUnit: "per kg",
    priceUpdatedAt: SEED_RATE_DATE,
    stockStatus: "in_stock",
    enabled: true
  },
  {
    id: "prod-yellow-capsicum",
    slug: "yellow-capsicum",
    name: "Capsicum - Yellow (Imported)",
    origin: "imported",
    categories: ["all", "imported"],
    isSpecialty: false,
    featured: false,
    bestseller: false,
    description: "Bright, sweet imported yellow bell peppers adding vivid color contrast and crisp bite to continental and Asian dishes.",
    culinaryApplications: "Mixed pepper sautes, skewers, crudites, and cold pasta salads.",
    handlingNotes: "Keep refrigerated and dry.",
    imageUrl: "/images/produce/yellow-capsicum.jpg",
    galleryUrls: ["/images/produce/yellow-capsicum.jpg"],
    packageOptions: ["0.5 kg", "0.25 kg", "1 kg"],
    pricingMode: "live",
    pricePkr: 980,
    priceUnit: "per kg",
    priceUpdatedAt: SEED_RATE_DATE,
    stockStatus: "in_stock",
    enabled: true
  },
  {
    id: "prod-cherry-tomatoes",
    slug: "cherry-tomatoes",
    name: "Cherry Tomatoes",
    origin: "imported",
    categories: ["all", "imported", "bestsellers"],
    isSpecialty: false,
    featured: true,
    bestseller: true,
    description: "Sweet, bite-sized imported cherry tomatoes with glossy skins for salads, bruschetta, pasta pan-tosses, and garnish.",
    culinaryApplications: "Caprese salads, blistered pasta toppings, flatbreads, and canapes.",
    handlingNotes: "Handle gently in punnets or shallow trays to prevent splitting.",
    imageUrl: "/images/produce/cherry-tomatoes.jpg",
    galleryUrls: ["/images/produce/cherry-tomatoes.jpg"],
    packageOptions: ["0.25 kg", "0.5 kg", "1 kg"],
    pricingMode: "live",
    pricePkr: 960,
    priceUnit: "per kg",
    priceUpdatedAt: SEED_RATE_DATE,
    stockStatus: "in_stock",
    enabled: true
  },
  {
    id: "prod-rocket-arugula",
    slug: "rocket-arugula",
    name: "Rocket (Arugula)",
    origin: "imported",
    categories: ["all", "imported"],
    isSpecialty: false,
    featured: false,
    bestseller: false,
    description: "Peppery, tender imported rocket leaves sought after by Italian kitchens, pizzerias, and specialty cafes.",
    culinaryApplications: "Wood-fired pizza finishing, parmesan-rocket salads, and artisan sandwiches.",
    handlingNotes: "Keep strictly chilled in protective containers; wash immediately prior to service.",
    imageUrl: "/images/produce/rocket-arugula.jpg",
    galleryUrls: ["/images/produce/rocket-arugula.jpg"],
    packageOptions: ["250 g", "100 g", "1 kg"],
    pricingMode: "live",
    pricePkr: 1200,
    priceUnit: "per kg",
    priceUpdatedAt: SEED_RATE_DATE,
    stockStatus: "in_stock",
    enabled: true
  },
  {
    id: "prod-parsley",
    slug: "parsley",
    name: "Parsley - Imported",
    origin: "imported",
    categories: ["all", "imported"],
    isSpecialty: false,
    featured: false,
    bestseller: false,
    description: "Clean, aromatic imported parsley bunches for tabbouleh, chimichurri, compound butters, and continental finishing.",
    culinaryApplications: "Tabbouleh, gremolata, herb sauces, stocks, and warm dish garnish.",
    handlingNotes: "Store upright or wrapped lightly damp under refrigeration.",
    imageUrl: "/images/produce/parsley.jpg",
    galleryUrls: ["/images/produce/parsley.jpg"],
    packageOptions: ["250 g", "100 g", "1 kg"],
    pricingMode: "live",
    pricePkr: 880,
    priceUnit: "per kg",
    priceUpdatedAt: SEED_RATE_DATE,
    stockStatus: "in_stock",
    enabled: true
  },
  {
    id: "prod-basil-leaves",
    slug: "basil-leaves",
    name: "Basil Leaves - Sweet",
    origin: "imported",
    categories: ["all", "imported", "bestsellers"],
    isSpecialty: false,
    featured: false,
    bestseller: true,
    description: "Fragrant sweet basil leaves essential for pesto, Neapolitan pizza, Thai stir-fries, and Italian sauces.",
    culinaryApplications: "Fresh pesto, Margherita pizza, caprese, pasta sauces, and infusions.",
    handlingNotes: "Protect from extreme cold below 8 C to prevent leaf darkening.",
    imageUrl: "/images/produce/basil-leaves.jpg",
    galleryUrls: ["/images/produce/basil-leaves.jpg"],
    packageOptions: ["250 g", "100 g", "1 kg"],
    pricingMode: "live",
    pricePkr: 1400,
    priceUnit: "per kg",
    priceUpdatedAt: SEED_RATE_DATE,
    stockStatus: "in_stock",
    enabled: true
  },
  {
    id: "prod-leeks",
    slug: "leeks",
    name: "Leeks - Imported",
    origin: "imported",
    categories: ["all", "imported"],
    isSpecialty: false,
    featured: false,
    bestseller: false,
    description: "Mild, sweet imported leeks with long white-to-pale-green shafts for soups, quiches, braises, and stocks.",
    culinaryApplications: "Potato-leek soup, savory tarts, seafood poaching bases, and sautes.",
    handlingNotes: "Rinse thoroughly between layers during prep; store chilled.",
    imageUrl: "/images/produce/leeks.jpg",
    galleryUrls: ["/images/produce/leeks.jpg"],
    packageOptions: ["0.5 kg", "0.25 kg", "1 kg"],
    pricingMode: "live",
    pricePkr: 760,
    priceUnit: "per kg",
    priceUpdatedAt: SEED_RATE_DATE,
    stockStatus: "in_stock",
    enabled: true
  },
  {
    id: "prod-lolo-rose-lettuce",
    slug: "lolo-rose-lettuce",
    name: "Lolo Rose Lettuce",
    origin: "imported",
    categories: ["all", "imported", "lettuce-collection"],
    isSpecialty: false,
    featured: false,
    bestseller: false,
    description: "Frilled, burgundy-tipped Lolo Rose lettuce leaves adding loft, color contrast, and tender texture to gourmet salads.",
    culinaryApplications: "Composed bistro salads, fine-dining plating, and open-faced sandwiches.",
    handlingNotes: "Store in rigid chilled containers to protect delicate frilled edges.",
    imageUrl: "/images/produce/lolo-rose-lettuce.jpg",
    galleryUrls: ["/images/produce/lolo-rose-lettuce.jpg"],
    packageOptions: ["0.5 kg", "0.25 kg", "1 kg"],
    pricingMode: "live",
    pricePkr: 840,
    priceUnit: "per kg",
    priceUpdatedAt: SEED_RATE_DATE,
    stockStatus: "in_stock",
    enabled: true
  },
  {
    id: "prod-celery-leaves",
    slug: "celery-leaves",
    name: "Celery Leaves",
    origin: "imported",
    categories: ["all", "imported"],
    isSpecialty: false,
    featured: false,
    bestseller: false,
    description: "Crisp, aromatic imported celery stalks and leaves for classic mirepoix, stocks, juices, and Waldorf-style salads.",
    culinaryApplications: "Continental mirepoix, braises, cold salads, and cold-pressed juices.",
    handlingNotes: "Store chilled with moisture retention wrap.",
    imageUrl: "/images/produce/celery-leaves.jpg",
    galleryUrls: ["/images/produce/celery-leaves.jpg"],
    packageOptions: ["0.5 kg", "0.25 kg", "1 kg"],
    pricingMode: "live",
    pricePkr: 720,
    priceUnit: "per kg",
    priceUpdatedAt: SEED_RATE_DATE,
    stockStatus: "in_stock",
    enabled: true
  },
  {
    id: "prod-romaine-lettuce",
    slug: "romaine-lettuce",
    name: "Romaine Lettuce",
    origin: "imported",
    categories: ["all", "imported", "bestsellers", "lettuce-collection"],
    isSpecialty: false,
    featured: true,
    bestseller: true,
    description: "Sturdy, elongated imported Romaine hearts and leaves with crisp ribs, essential for classic Caesar salads and wraps.",
    culinaryApplications: "Classic Caesar salad, grilled romaine halves, grain bowls, and wraps.",
    handlingNotes: "Refrigerate at 1 C to 4 C; keep outer leaves dry.",
    imageUrl: "/images/produce/romaine-lettuce.jpg",
    galleryUrls: ["/images/produce/romaine-lettuce.jpg"],
    packageOptions: ["0.5 kg", "0.25 kg", "1 kg"],
    pricingMode: "live",
    pricePkr: 780,
    priceUnit: "per kg",
    priceUpdatedAt: SEED_RATE_DATE,
    stockStatus: "in_stock",
    enabled: true
  },
  {
    id: "prod-mushrooms",
    slug: "mushrooms",
    name: "Mushrooms - Button",
    origin: "imported",
    categories: ["all", "imported", "bestsellers"],
    isSpecialty: false,
    featured: true,
    bestseller: true,
    description: "Firm, clean mushrooms selected for smooth caps and meaty texture across steaks, risottos, pizzas, and sauces.",
    culinaryApplications: "Mushroom ragout, steakhouse sides, creamy pasta, pizza, and omelettes.",
    handlingNotes: "Keep chilled in breathable paper or vented punnets; brush clean before cooking.",
    imageUrl: "/images/produce/mushrooms.jpg",
    galleryUrls: ["/images/produce/mushrooms.jpg"],
    packageOptions: ["0.25 kg", "0.5 kg", "1 kg"],
    pricingMode: "live",
    pricePkr: 1280,
    priceUnit: "per kg",
    priceUpdatedAt: SEED_RATE_DATE,
    stockStatus: "in_stock",
    enabled: true
  },
  {
    id: "prod-rosemary",
    slug: "rosemary",
    name: "Rosemary - Fresh",
    origin: "imported",
    categories: ["all", "imported"],
    isSpecialty: false,
    featured: false,
    bestseller: false,
    description: "Resinous, pine-fragrant imported rosemary sprigs for roasted meats, focaccia, infused oils, and potatoes.",
    culinaryApplications: "Roast lamb and poultry, rosemary potatoes, focaccia, and herb oils.",
    handlingNotes: "Wrap lightly in breathable paper and store refrigerated.",
    imageUrl: "/images/produce/rosemary.jpg",
    galleryUrls: ["/images/produce/rosemary.jpg"],
    packageOptions: ["100 g", "250 g", "1 kg"],
    pricingMode: "live",
    pricePkr: 1800,
    priceUnit: "per kg",
    priceUpdatedAt: SEED_RATE_DATE,
    stockStatus: "in_stock",
    enabled: true
  }
];
var DEFAULT_BUSINESS_SETTINGS = {
  businessName: "Fresh Farm Vegetables",
  tagline: "Premium Quality, Farm-Fresh Produce for Professional Kitchens",
  address: "Commercial CCA, Phase 6, Defence Housing Authority (DHA), Lahore, Pakistan",
  city: "Lahore",
  province: "Punjab",
  country: "Pakistan",
  phoneDisplay: "0333-4934403",
  whatsappIntl: "+923334934403",
  email: "farmfreshvegetables@gmail.com",
  emailVerified: true,
  instagramUrl: "",
  facebookUrl: "",
  businessHours: "Contact via phone or WhatsApp to confirm daily dispatch hours",
  codEnabled: true,
  qrPaymentEnabled: true,
  paymentProviderTitle: "QR Code & Official Account Transfer",
  paymentAccountTitle: "Fresh Farm Vegetables",
  paymentBankOrWalletName: "",
  paymentAccountNumber: "",
  paymentQrImageUrl: "",
  paymentLinkUrl: "",
  paymentInstructions: "Scan our official payment QR code or open the official payment link to transfer the exact PKR order total, then enter your Transaction ID or upload your payment receipt below. Orders remain Pending Verification until confirmed by Fresh Farm Vegetables.",
  onlineCardEnabled: false,
  onlineCardProviderName: "",
  taxRatePercent: 0,
  deliveryZones: [
    {
      id: "lahore-dha",
      name: "DHA Phases 1 to 8 & Commercial CCA, Lahore",
      city: "Lahore",
      enabled: true,
      deliveryFeePkr: 150,
      codEnabled: true,
      notes: "Standard DHA & Commercial CCA dispatch fee."
    },
    {
      id: "lahore-gulberg-cantt",
      name: "Gulberg, Cantt & Mall Road Commercial Corridor, Lahore",
      city: "Lahore",
      enabled: true,
      deliveryFeePkr: 250,
      codEnabled: true,
      notes: "Central Lahore dispatch fee."
    },
    {
      id: "lahore-johar-model-bahria",
      name: "Model Town, Johar Town & Bahria Town, Lahore",
      city: "Lahore",
      enabled: true,
      deliveryFeePkr: 250,
      codEnabled: true,
      notes: "Scheduled Lahore route dispatch fee."
    },
    {
      id: "lahore-other",
      name: "Other Commercial Kitchens & Areas in Lahore (Subject to Confirmation)",
      city: "Lahore",
      enabled: true,
      deliveryFeePkr: null,
      codEnabled: false,
      notes: "Your delivery options and charges will be confirmed by our team."
    }
  ],
  lastDailyRatesPublishedAt: SEED_RATE_DATE
};

// server/db.ts
var DATA_DIR = process.env.VERCEL ? path.join(os.tmpdir(), "freshfarm-data") : path.resolve(process.cwd(), "data");
var DB_FILE = path.join(DATA_DIR, "freshfarm-store.json");
function hashPassword(password, salt) {
  const actualSalt = salt || crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, actualSalt, 64).toString("hex");
  return { hash, salt: actualSalt };
}
function verifyPassword(password, hash, salt) {
  const computed = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(computed, "hex"), Buffer.from(hash, "hex"));
}
function toPublicUser(user) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    businessName: user.businessName,
    role: user.role,
    savedAddresses: user.savedAddresses,
    favoriteProductIds: user.favoriteProductIds,
    createdAt: user.createdAt
  };
}
function createInitialState() {
  const adminCreds = hashPassword(process.env.INITIAL_ADMIN_PASSWORD || "FreshFarmDHA6!");
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const initialAdmin = {
    id: "usr-admin-1",
    fullName: "Fresh Farm Administrator",
    email: "admin@freshfarmvegetables.pk",
    phone: "0333-4934403",
    businessName: "Fresh Farm Vegetables \u2014 DHA Phase 6",
    role: "admin",
    savedAddresses: [],
    favoriteProductIds: [],
    createdAt: now,
    passwordHash: adminCreds.hash,
    passwordSalt: adminCreds.salt
  };
  return {
    products: structuredClone(INITIAL_PRODUCTS),
    settings: structuredClone(DEFAULT_BUSINESS_SETTINGS),
    users: [initialAdmin],
    orders: [],
    quotes: [],
    auditLogs: [
      {
        id: `aud-${Date.now()}`,
        actorEmail: "system",
        action: "STORE_INITIALIZED",
        details: "Initialized catalog with 28 local and imported vegetables with PKR pricing.",
        createdAt: now
      }
    ],
    sessionSecret: crypto.randomBytes(32).toString("hex")
  };
}
var cachedDb = null;
function getDb() {
  if (cachedDb) return cachedDb;
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {
    cachedDb = createInitialState();
    return cachedDb;
  }
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      const seedMap = new Map(INITIAL_PRODUCTS.map((p) => [p.id, p]));
      let didBackfill = false;
      for (const existing of parsed.products) {
        const seed = seedMap.get(existing.id);
        if (!seed) continue;
        if (!existing.packageOptions || existing.packageOptions.length === 0) {
          existing.packageOptions = [...seed.packageOptions];
          didBackfill = true;
        }
        if (existing.pricePkr === null && seed.pricePkr !== null) {
          existing.pricingMode = "live";
          existing.pricePkr = seed.pricePkr;
          existing.priceUnit = seed.priceUnit;
          existing.priceUpdatedAt = seed.priceUpdatedAt;
          if (existing.stockStatus === "unverified") {
            existing.stockStatus = "in_stock";
          }
          didBackfill = true;
        }
      }
      const existingIds = new Set(parsed.products.map((p) => p.id));
      for (const seedProd of INITIAL_PRODUCTS) {
        if (!existingIds.has(seedProd.id)) {
          parsed.products.push(structuredClone(seedProd));
          didBackfill = true;
        }
      }
      parsed.settings = {
        ...structuredClone(DEFAULT_BUSINESS_SETTINGS),
        ...parsed.settings
      };
      if (!parsed.settings.email) {
        parsed.settings.email = DEFAULT_BUSINESS_SETTINGS.email;
        parsed.settings.emailVerified = DEFAULT_BUSINESS_SETTINGS.emailVerified;
        didBackfill = true;
      }
      if (!parsed.settings.lastDailyRatesPublishedAt) {
        parsed.settings.lastDailyRatesPublishedAt = DEFAULT_BUSINESS_SETTINGS.lastDailyRatesPublishedAt;
        didBackfill = true;
      }
      const seedZones = new Map(DEFAULT_BUSINESS_SETTINGS.deliveryZones.map((z) => [z.id, z]));
      if (Array.isArray(parsed.settings.deliveryZones)) {
        for (const z of parsed.settings.deliveryZones) {
          const sz = seedZones.get(z.id);
          if (sz && z.deliveryFeePkr === null && sz.deliveryFeePkr !== null) {
            z.deliveryFeePkr = sz.deliveryFeePkr;
            z.notes = sz.notes;
            didBackfill = true;
          }
        }
      }
      cachedDb = parsed;
      if (didBackfill) {
        saveDb();
      }
      return cachedDb;
    } catch {
      cachedDb = createInitialState();
      saveDb();
      return cachedDb;
    }
  }
  cachedDb = createInitialState();
  saveDb();
  return cachedDb;
}
function saveDb() {
  if (!cachedDb) return;
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const tmpFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(cachedDb, null, 2), "utf-8");
    fs.renameSync(tmpFile, DB_FILE);
  } catch {
  }
}
function appendAuditLog(actorEmail, action, details) {
  const db = getDb();
  db.auditLogs.unshift({
    id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    actorEmail,
    action,
    details,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  if (db.auditLogs.length > 250) {
    db.auditLogs = db.auditLogs.slice(0, 250);
  }
  saveDb();
}
function signAuthToken(userId, role) {
  const db = getDb();
  const exp = Date.now() + 1e3 * 60 * 60 * 24 * 7;
  const payload = Buffer.from(JSON.stringify({ sub: userId, role, exp })).toString("base64url");
  const sig = crypto.createHmac("sha256", db.sessionSecret).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}
function verifyAuthToken(token) {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const db = getDb();
  const expected = crypto.createHmac("sha256", db.sessionSecret).update(payload).digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf-8"));
    if (Date.now() > decoded.exp) return null;
    return db.users.find((u) => u.id === decoded.sub) || null;
  } catch {
    return null;
  }
}
function createSavedAddressId() {
  return `addr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}
function sanitizeAddress(input, existingId) {
  return {
    id: existingId || createSavedAddressId(),
    label: String(input.label || "Delivery Address").trim(),
    firstName: String(input.firstName || "").trim(),
    lastName: String(input.lastName || "").trim(),
    phone: String(input.phone || "").trim(),
    streetAddress: String(input.streetAddress || "").trim(),
    apartment: String(input.apartment || "").trim(),
    city: String(input.city || "Lahore").trim(),
    province: String(input.province || "Punjab").trim(),
    postalCode: String(input.postalCode || "").trim(),
    zoneId: String(input.zoneId || "lahore-dha").trim()
  };
}

// server/gemini.ts
import { GoogleGenAI, ThinkingLevel, Type } from "@google/genai";
function createGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error("Gemini API key is not configured on the server.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
}
async function generateKitchenProcurementPlan(kitchenBrief, catalog) {
  const ai = createGeminiClient();
  const activeProducts = catalog.filter((p) => p.enabled).map((p) => ({
    productId: p.id,
    productName: p.name,
    origin: p.origin,
    isSpecialty: p.isSpecialty,
    applications: p.culinaryApplications
  }));
  const systemInstruction = `You are a senior culinary procurement specialist for Fresh Farm Vegetables in DHA Phase 6, Lahore.
Analyze the restaurant, hotel, cafe, or catering kitchen brief and calculate practical fresh vegetable requirements.
Rules:
1. ONLY recommend products that exist in the provided Fresh Farm Vegetables catalog JSON, using exact productId and productName values.
2. Account for realistic kitchen prep trim loss, portion weights, and cold-chain practicality (for example, highlighting Vacuum-Packed Lettuce or Iceberg Lettuce when high-volume burger, wrap, or banquet salad prep is involved).
3. Never invent prices, discounts, or delivery time promises.
4. Keep text concise, plain, and strictly free of emojis.`;
  const prompt = `Available Fresh Farm Vegetables Catalog:
${JSON.stringify(activeProducts)}

Customer Kitchen / Menu / Event Requirement:
${kitchenBrief}`;
  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      summary: {
        type: Type.STRING,
        description: "Brief 1-2 sentence procurement overview tailored to the kitchen brief."
      },
      recommendations: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            productId: { type: Type.STRING },
            productName: { type: Type.STRING },
            recommendedQuantity: { type: Type.INTEGER },
            unitSuggestion: {
              type: Type.STRING,
              description: "Practical ordering unit such as kg, heads, packs, or bunches."
            },
            culinaryReasoning: {
              type: Type.STRING,
              description: "Short explanation of yield and menu usage."
            }
          },
          required: [
            "productId",
            "productName",
            "recommendedQuantity",
            "unitSuggestion",
            "culinaryReasoning"
          ]
        }
      }
    },
    required: ["summary", "recommendations"]
  };
  const validIds = new Set(activeProducts.map((p) => p.productId));
  const runWithModel = async (modelName) => {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH
        },
        responseMimeType: "application/json",
        responseSchema
      }
    });
    const parsed = JSON.parse((response.text || "{}").trim());
    const filteredRecs = (parsed.recommendations || []).filter(
      (r) => validIds.has(r.productId) && r.recommendedQuantity > 0
    );
    return {
      summary: String(parsed.summary || "").trim(),
      recommendations: filteredRecs,
      modelUsed: modelName
    };
  };
  try {
    return await runWithModel("gemini-4-argon");
  } catch {
    return await runWithModel("gemini-3.8-flash");
  }
}
async function parseQuickProduceList(rawText, catalog) {
  const ai = createGeminiClient();
  const activeProducts = catalog.filter((p) => p.enabled).map((p) => ({ productId: p.id, productName: p.name, origin: p.origin }));
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite",
    contents: `Catalog: ${JSON.stringify(activeProducts)}

Customer text list:
${rawText}`,
    config: {
      systemInstruction: "Match each requested vegetable in the customer text list to the exact productId and productName from the Fresh Farm Vegetables catalog. Default quantity to 1 if unspecified. List any unavailable items in unmatchedNotes. Never use emojis.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          matchedItems: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                productId: { type: Type.STRING },
                productName: { type: Type.STRING },
                quantity: { type: Type.INTEGER },
                unitOrPackage: { type: Type.STRING }
              },
              required: ["productId", "productName", "quantity", "unitOrPackage"]
            }
          },
          unmatchedNotes: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["matchedItems", "unmatchedNotes"]
      }
    }
  });
  const validIds = new Set(activeProducts.map((p) => p.productId));
  const parsed = JSON.parse((response.text || "{}").trim());
  return {
    matchedItems: (parsed.matchedItems || []).filter(
      (m) => validIds.has(m.productId) && m.quantity > 0
    ),
    unmatchedNotes: Array.isArray(parsed.unmatchedNotes) ? parsed.unmatchedNotes : []
  };
}
async function parseAdminRateSheet(rawRatesText, catalog) {
  const ai = createGeminiClient();
  const catalogRef = catalog.map((p) => ({
    productId: p.id,
    productName: p.name,
    currentUnit: p.priceUnit
  }));
  const response = await ai.models.generateContent({
    model: "gemini-3.8-flash",
    contents: `Catalog: ${JSON.stringify(catalogRef)}

Raw market rate sheet:
${rawRatesText}`,
    config: {
      systemInstruction: "Extract confirmed PKR rates from the administrator market rate note and map them strictly to matching productId entries in the catalog. Only include items where a clear numeric PKR price was stated in the input.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          updates: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                productId: { type: Type.STRING },
                productName: { type: Type.STRING },
                pricePkr: { type: Type.NUMBER },
                priceUnit: { type: Type.STRING }
              },
              required: ["productId", "productName", "pricePkr", "priceUnit"]
            }
          }
        },
        required: ["updates"]
      }
    }
  });
  const validIds = new Set(catalogRef.map((p) => p.productId));
  const parsed = JSON.parse((response.text || "{}").trim());
  return {
    updates: (parsed.updates || []).filter(
      (u) => validIds.has(u.productId) && u.pricePkr > 0
    )
  };
}

// src/utils/commerce.ts
function formatPkr(amount) {
  return `PKR ${Math.round(amount).toLocaleString("en-PK")}`;
}
function normalizeDigitsPhone(phone) {
  return phone.replace(/[^\d]/g, "");
}
function resolvePackageUnitPricePkr(product, selectedPackage) {
  if (!product || product.pricingMode !== "live" || typeof product.pricePkr !== "number" || product.pricePkr <= 0) {
    return null;
  }
  const basePrice = product.pricePkr;
  const unitLower = (product.priceUnit || "per kg").toLowerCase();
  const pkgLower = (selectedPackage || "").trim().toLowerCase();
  if (!pkgLower || !unitLower.includes("kg")) {
    return Math.round(basePrice);
  }
  const kgMatch = pkgLower.match(/^(\d+(?:\.\d+)?)\s*kg$/);
  if (kgMatch) {
    const kg = parseFloat(kgMatch[1]);
    if (kg > 0) {
      return Math.max(10, Math.round(basePrice * kg));
    }
  }
  const gramMatch = pkgLower.match(/^(\d+(?:\.\d+)?)\s*g$/);
  if (gramMatch) {
    const grams = parseFloat(gramMatch[1]);
    if (grams > 0) {
      return Math.max(10, Math.round(basePrice * grams / 1e3));
    }
  }
  return Math.round(basePrice);
}
function formatPaymentStatusLabel(status) {
  switch (status) {
    case "pending_verification":
      return "Payment Verification Pending";
    case "cod_pending":
      return "Cash on Delivery (Uncollected)";
    case "paid":
      return "Verified & Paid";
    case "rejected":
      return "Verification Declined \u2014 Action Needed";
    case "refunded":
      return "Refunded";
    case "unpaid":
    default:
      return "Unpaid";
  }
}
function formatPaymentMethodLabel(method, settings) {
  switch (method) {
    case "qr_transfer":
      return settings?.paymentProviderTitle || "QR Code & Official Account Transfer";
    case "online_card":
      return settings?.onlineCardProviderName ? `Online Card (${settings.onlineCardProviderName})` : "Online Card Payment";
    case "cod":
    default:
      return "Cash on Delivery (COD)";
  }
}
function calculateCartSummary(cartItems, products, settings, selectedZoneId) {
  const productMap = new Map(products.map((p) => [p.id, p]));
  const enriched = cartItems.map((item) => {
    const product = productMap.get(item.productId) || null;
    const isUnavailable = !product || !product.enabled || product.stockStatus === "out_of_stock";
    const resolvedUnitPrice = !isUnavailable ? resolvePackageUnitPricePkr(product, item.selectedPackage) : null;
    const hasConfirmedPrice = typeof resolvedUnitPrice === "number" && resolvedUnitPrice > 0;
    const unitPricePkr = hasConfirmedPrice ? resolvedUnitPrice : null;
    const isUnpriced = !isUnavailable && !hasConfirmedPrice;
    const priceChanged = !isUnavailable && (item.snapshotPricingMode === "live" && item.snapshotPricePkr !== null && hasConfirmedPrice && item.snapshotPricePkr !== unitPricePkr || item.snapshotPricingMode === "live" && !hasConfirmedPrice);
    const lineTotalPkr = !isUnavailable && unitPricePkr !== null ? unitPricePkr * item.quantity : null;
    return {
      productId: item.productId,
      product,
      quantity: item.quantity,
      selectedPackage: item.selectedPackage,
      unitPricePkr,
      lineTotalPkr,
      isUnpriced,
      isUnavailable,
      priceChanged,
      previousPricePkr: item.snapshotPricePkr
    };
  });
  const totalItemCount = enriched.reduce((sum, i) => sum + i.quantity, 0);
  const distinctCount = enriched.length;
  const hasUnpricedItems = enriched.some((i) => i.isUnpriced);
  const hasUnavailableItems = enriched.some((i) => i.isUnavailable);
  const hasPriceChanges = enriched.some((i) => i.priceChanged);
  const canCalculateMonetaryTotals = distinctCount > 0 && !hasUnpricedItems && !hasUnavailableItems;
  const subtotalPkr = canCalculateMonetaryTotals ? enriched.reduce((sum, i) => sum + (i.lineTotalPkr || 0), 0) : null;
  const zone = selectedZoneId ? settings.deliveryZones.find((z) => z.id === selectedZoneId && z.enabled) : void 0;
  const deliveryFeePkr = canCalculateMonetaryTotals && zone && typeof zone.deliveryFeePkr === "number" ? zone.deliveryFeePkr : null;
  const deliveryPendingConfirmation = !zone || zone.deliveryFeePkr === null || typeof zone.deliveryFeePkr !== "number";
  const taxPkr = subtotalPkr !== null && settings.taxRatePercent > 0 ? Math.round(subtotalPkr * settings.taxRatePercent / 100) : subtotalPkr !== null ? 0 : null;
  const grandTotalPkr = subtotalPkr !== null && !deliveryPendingConfirmation ? subtotalPkr + (deliveryFeePkr || 0) + (taxPkr || 0) : subtotalPkr !== null ? subtotalPkr + (taxPkr || 0) : null;
  const canProceedToCheckout = distinctCount > 0 && !hasUnpricedItems && !hasUnavailableItems && !hasPriceChanges;
  return {
    items: enriched,
    totalItemCount,
    distinctCount,
    hasUnpricedItems,
    hasUnavailableItems,
    hasPriceChanges,
    canProceedToCheckout,
    subtotalPkr,
    deliveryFeePkr,
    deliveryPendingConfirmation,
    taxPkr,
    grandTotalPkr
  };
}
function formatOrderWhatsAppMessage(order, settings) {
  const paymentStatusText = formatPaymentStatusLabel(order.paymentStatus);
  const paymentMethodText = formatPaymentMethodLabel(order.paymentMethod, settings);
  const txnRef = order.paymentDetails?.transactionId?.trim() ? order.paymentDetails.transactionId.trim() : order.paymentMethod === "cod" ? "Cash on Delivery (Payable at delivery)" : "Receipt uploaded for verification";
  const receiptStatus = order.paymentDetails?.receiptDataUrl ? `Receipt Uploaded (${order.paymentDetails.receiptFileName || "Image attached in Admin"})` : "No receipt file attached";
  const itemLines = order.items.map(
    (item, index) => `${index + 1}. ${item.productName} (${item.selectedPackage}) x ${item.quantity} = ${formatPkr(
      item.lineTotalPkr
    )}`
  );
  const zoneIncludesCity = Boolean(order.shippingAddress.zoneName) && Boolean(order.shippingAddress.city) && order.shippingAddress.zoneName.toLowerCase().includes(order.shippingAddress.city.trim().toLowerCase());
  const addressParts = [
    order.shippingAddress.streetAddress,
    order.shippingAddress.apartment,
    order.shippingAddress.zoneName,
    zoneIncludesCity ? "" : order.shippingAddress.city,
    order.shippingAddress.province
  ].map((s) => (s || "").trim()).filter(Boolean).join(", ");
  const totalLine = order.grandTotalPkr !== null ? `${formatPkr(order.grandTotalPkr)} (Subtotal: ${formatPkr(order.subtotalPkr)}${order.deliveryFeePkr !== null ? `, Delivery: ${formatPkr(order.deliveryFeePkr)}` : ", Delivery: To be confirmed"})` : `${formatPkr(order.subtotalPkr)} + Delivery confirmation`;
  const lines = [
    "NEW ORDER NOTIFICATION - Fresh Farm Vegetables",
    `Order Number: ${order.reference}`,
    `Payment Status: ${paymentStatusText}`,
    "",
    "Customer Details:",
    `Name: ${order.contact.fullName}`,
    `Phone: ${order.contact.phone}`,
    order.shippingAddress.phone && order.shippingAddress.phone !== order.contact.phone ? `Receiving Phone: ${order.shippingAddress.phone}` : "",
    "",
    "Ordered Products:",
    ...itemLines,
    "",
    `Total Amount (PKR): ${totalLine}`,
    "",
    "Delivery Address:",
    addressParts,
    order.shippingAddress.deliveryInstructions ? `Delivery Notes: ${order.shippingAddress.deliveryInstructions}` : "",
    "",
    "Payment & Reference:",
    `Payment Method: ${paymentMethodText}`,
    `Transaction Reference: ${txnRef}`,
    order.paymentMethod === "qr_transfer" ? `Receipt Status: ${receiptStatus}` : ""
  ].filter((line, idx, arr) => {
    if (line !== "") return true;
    return idx > 0 && arr[idx - 1] !== "";
  });
  return lines.join("\n");
}
function buildOrderWhatsAppUrl(whatsappIntl, order, settings) {
  const digits = normalizeDigitsPhone(whatsappIntl || "+923334934403");
  const message = formatOrderWhatsAppMessage(order, settings);
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
function validateCheckoutInput(input, summary, settings) {
  const errors = {};
  if (summary.distinctCount === 0) {
    errors.cart = "Your cart is empty.";
  } else if (summary.hasUnpricedItems) {
    errors.cart = "One or more items require price confirmation. Please submit a quote inquiry instead.";
  } else if (summary.hasUnavailableItems) {
    errors.cart = "Please remove unavailable items before placing your order.";
  } else if (summary.hasPriceChanges) {
    errors.cart = "Product prices were updated. Please review and confirm the updated rates.";
  }
  if (!input.fullName.trim()) errors.fullName = "Full name is required.";
  if (!input.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    errors.email = "Enter a valid email address for order confirmation.";
  }
  if (normalizeDigitsPhone(input.phone).length < 10) {
    errors.phone = "Enter a valid phone or WhatsApp number (at least 10 digits).";
  }
  if (!input.firstName.trim()) errors.firstName = "First name is required.";
  if (!input.lastName.trim()) errors.lastName = "Last name is required.";
  if (normalizeDigitsPhone(input.shippingPhone).length < 10) {
    errors.shippingPhone = "Delivery contact number is required.";
  }
  if (!input.streetAddress.trim()) errors.streetAddress = "Street address is required.";
  if (!input.city.trim()) errors.city = "City is required.";
  if (!input.province.trim()) errors.province = "Province is required.";
  const zone = settings.deliveryZones.find((z) => z.id === input.zoneId && z.enabled);
  if (!zone) {
    errors.zoneId = "Select an active delivery zone served by Fresh Farm Vegetables.";
  }
  if (!input.paymentMethod) {
    errors.paymentMethod = "Select an approved payment method.";
  } else if (input.paymentMethod === "qr_transfer") {
    if (!settings.qrPaymentEnabled) {
      errors.paymentMethod = "QR & online account transfer is currently disabled.";
    } else {
      const cleanTxn = (input.transactionId || "").trim();
      const hasValidTxn = cleanTxn.length >= 4;
      const hasReceipt = Boolean(input.hasPaymentReceipt);
      if (!hasValidTxn && !hasReceipt) {
        errors.paymentProof = "Enter your payment Transaction ID (min 4 characters) or upload a payment receipt image so our team can verify your payment.";
      }
    }
  } else if (input.paymentMethod === "cod") {
    if (!settings.codEnabled || zone && !zone.codEnabled) {
      errors.paymentMethod = "Cash on Delivery is not enabled for the selected service zone.";
    }
  } else if (input.paymentMethod === "online_card") {
    if (!settings.onlineCardEnabled) {
      errors.paymentMethod = "Online card payment is not currently configured.";
    }
  }
  return errors;
}
function validateWholesaleQuoteInput(input) {
  const errors = {};
  if (!input.contactName.trim()) {
    errors.contactName = "Contact person name is required.";
  }
  if (!input.businessType.trim()) {
    errors.businessType = "Select a customer or business type.";
  }
  if (normalizeDigitsPhone(input.phone).length < 10) {
    errors.phone = "Enter a valid phone or WhatsApp number.";
  }
  if (input.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  if (!input.deliveryAddress.trim()) {
    errors.deliveryAddress = "Delivery location or area in Lahore is required.";
  }
  const validItems = input.items.filter((i) => i.productName.trim() && i.quantity > 0);
  if (validItems.length === 0) {
    errors.items = "Add at least one vegetable with a valid quantity.";
  }
  return errors;
}

// server/whatsapp.ts
function getWhatsAppIntegrationStatus(defaultRecipient = "+923334934403") {
  const recipient = (process.env.WHATSAPP_RECIPIENT_NUMBER || defaultRecipient || "+923334934403").trim();
  const hasMetaCloud = Boolean(process.env.WHATSAPP_ACCESS_TOKEN?.trim()) && Boolean(process.env.WHATSAPP_PHONE_NUMBER_ID?.trim());
  const hasWebhook = Boolean(process.env.WHATSAPP_WEBHOOK_URL?.trim());
  if (hasMetaCloud) {
    return {
      configured: true,
      provider: "meta_cloud_api",
      recipientPhone: recipient,
      description: `Official Meta WhatsApp Cloud API active -> dispatching automatic order alerts to ${recipient}.`
    };
  }
  if (hasWebhook) {
    return {
      configured: true,
      provider: "webhook_provider",
      recipientPhone: recipient,
      description: `Compatible WhatsApp Webhook provider active -> dispatching automatic order alerts to ${recipient}.`
    };
  }
  return {
    configured: false,
    provider: "manual_wa_link",
    recipientPhone: recipient,
    description: `WhatsApp Business API env vars not set \u2014 prefilled WhatsApp notification button (${recipient}) enabled on Order Confirmation and Admin Dashboard.`
  };
}
async function sendWhatsAppOrderNotification(order, settings) {
  const recipientRaw = (process.env.WHATSAPP_RECIPIENT_NUMBER || settings.whatsappIntl || "+923334934403").trim();
  const recipientDigits = normalizeDigitsPhone(recipientRaw) || "923334934403";
  const recipientDisplay = recipientRaw.startsWith("+") ? recipientRaw : `+${recipientDigits}`;
  const attemptedAt = (/* @__PURE__ */ new Date()).toISOString();
  const messageBody = formatOrderWhatsAppMessage(order, settings);
  const prefilledUrl = buildOrderWhatsAppUrl(recipientDisplay, order, settings);
  const metaToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const metaPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const webhookUrl = process.env.WHATSAPP_WEBHOOK_URL?.trim();
  const webhookAuth = process.env.WHATSAPP_WEBHOOK_AUTH_TOKEN?.trim();
  if (metaToken && metaPhoneId) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v21.0/${encodeURIComponent(metaPhoneId)}/messages`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${metaToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: recipientDigits,
            type: "text",
            text: {
              preview_url: false,
              body: messageBody
            }
          })
        }
      );
      if (response.ok) {
        return {
          configured: true,
          deliveredAutomatically: true,
          provider: "meta_cloud_api",
          recipientPhone: recipientDisplay,
          attemptedAt,
          prefilledUrl,
          statusMessage: `Order notification automatically sent to ${recipientDisplay} via WhatsApp Business Cloud API.`
        };
      }
      return {
        configured: true,
        deliveredAutomatically: false,
        provider: "meta_cloud_api",
        recipientPhone: recipientDisplay,
        attemptedAt,
        prefilledUrl,
        statusMessage: `WhatsApp Cloud API returned HTTP ${response.status}. Use the prefilled WhatsApp button below to send your order details directly to ${recipientDisplay}.`
      };
    } catch {
      return {
        configured: true,
        deliveredAutomatically: false,
        provider: "meta_cloud_api",
        recipientPhone: recipientDisplay,
        attemptedAt,
        prefilledUrl,
        statusMessage: `Automatic WhatsApp dispatch could not reach Cloud API. Use the prefilled WhatsApp button below to notify ${recipientDisplay}.`
      };
    }
  }
  if (webhookUrl) {
    try {
      const headers = {
        "Content-Type": "application/json"
      };
      if (webhookAuth) {
        headers.Authorization = `Bearer ${webhookAuth}`;
      }
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          to: recipientDisplay,
          toDigits: recipientDigits,
          message: messageBody,
          orderReference: order.reference,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
          transactionReference: order.paymentDetails?.transactionId || "",
          totalAmountPkr: order.grandTotalPkr ?? order.subtotalPkr,
          customer: {
            name: order.contact.fullName,
            phone: order.contact.phone
          }
        })
      });
      if (response.ok) {
        return {
          configured: true,
          deliveredAutomatically: true,
          provider: "webhook_provider",
          recipientPhone: recipientDisplay,
          attemptedAt,
          prefilledUrl,
          statusMessage: `Order notification automatically dispatched to ${recipientDisplay} via WhatsApp provider.`
        };
      }
      return {
        configured: true,
        deliveredAutomatically: false,
        provider: "webhook_provider",
        recipientPhone: recipientDisplay,
        attemptedAt,
        prefilledUrl,
        statusMessage: `WhatsApp provider returned HTTP ${response.status}. Use the prefilled WhatsApp button below to send order details to ${recipientDisplay}.`
      };
    } catch {
      return {
        configured: true,
        deliveredAutomatically: false,
        provider: "webhook_provider",
        recipientPhone: recipientDisplay,
        attemptedAt,
        prefilledUrl,
        statusMessage: `Could not reach WhatsApp webhook provider. Use the prefilled WhatsApp button below to send order details to ${recipientDisplay}.`
      };
    }
  }
  return {
    configured: false,
    deliveredAutomatically: false,
    provider: "manual_wa_link",
    recipientPhone: recipientDisplay,
    attemptedAt,
    prefilledUrl,
    statusMessage: `Ready to send on WhatsApp (${recipientDisplay}) with your prefilled order summary.`
  };
}

// server/apiApp.ts
var VALID_RECEIPT_DATA_URL = /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/;
var MAX_RECEIPT_DATA_URL_LENGTH = 45e5;
function sanitizeTransactionId(raw) {
  return String(raw || "").trim().replace(/[^\w\-./:# ]+/g, "").slice(0, 80);
}
function validateReceiptDataUrl(raw) {
  const str = String(raw || "").trim();
  if (!str) {
    return { valid: true, cleaned: "" };
  }
  if (str.length > MAX_RECEIPT_DATA_URL_LENGTH) {
    return {
      valid: false,
      cleaned: "",
      error: "Uploaded payment receipt exceeds the 3 MB image limit. Please choose a smaller screenshot."
    };
  }
  if (!VALID_RECEIPT_DATA_URL.test(str)) {
    return {
      valid: false,
      cleaned: "",
      error: "Payment receipt must be a valid PNG, JPG, or WEBP image."
    };
  }
  return { valid: true, cleaned: str };
}
function attachUser(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    req.user = verifyAuthToken(token);
  } else {
    req.user = null;
  }
  next();
}
function requireAuth(req, res, next) {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required. Please sign in." });
    return;
  }
  next();
}
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ error: "Administrator authorization required." });
    return;
  }
  next();
}
function makeSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function canViewOrder(req, order) {
  const isAdmin = req.user?.role === "admin";
  const isOwner = Boolean(req.user && order.customerId === req.user.id);
  const tokenParam = String(req.query.token || req.body?.token || "").trim();
  const emailParam = String(req.query.email || req.body?.email || "").trim().toLowerCase();
  const matchesToken = Boolean(
    tokenParam && order.accessToken && tokenParam === order.accessToken
  );
  const matchesEmail = Boolean(
    emailParam && order.contact.email.toLowerCase() === emailParam
  );
  return isAdmin || isOwner || matchesToken || matchesEmail;
}
function createApiApp() {
  const app2 = express();
  app2.use(express.json({ limit: "8mb" }));
  app2.use(attachUser);
  getDb();
  app2.get("/api/bootstrap", (req, res) => {
    const db = getDb();
    const isAdmin = req.user?.role === "admin";
    const products = isAdmin ? db.products : db.products.filter((p) => p.enabled);
    res.json({
      products,
      settings: db.settings,
      user: req.user ? toPublicUser(req.user) : null
    });
  });
  app2.get("/api/products", (req, res) => {
    const db = getDb();
    const isAdmin = req.user?.role === "admin";
    res.json({
      products: isAdmin ? db.products : db.products.filter((p) => p.enabled),
      lastDailyRatesPublishedAt: db.settings.lastDailyRatesPublishedAt
    });
  });
  app2.post("/api/auth/register", (req, res) => {
    const { fullName, email, password, phone, businessName } = req.body || {};
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanName = String(fullName || "").trim();
    const cleanPhone = String(phone || "").trim();
    if (!cleanName || cleanName.length < 2) {
      res.status(400).json({ error: "Full name is required." });
      return;
    }
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      res.status(400).json({ error: "A valid email address is required." });
      return;
    }
    if (!password || String(password).length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters." });
      return;
    }
    const db = getDb();
    if (db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      res.status(409).json({ error: "An account with this email already exists." });
      return;
    }
    const creds = hashPassword(String(password));
    const newUser = {
      id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      fullName: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      businessName: String(businessName || "").trim(),
      role: "customer",
      savedAddresses: [],
      favoriteProductIds: [],
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      passwordHash: creds.hash,
      passwordSalt: creds.salt
    };
    db.users.push(newUser);
    saveDb();
    const token = signAuthToken(newUser.id, newUser.role);
    res.status(201).json({ token, user: toPublicUser(newUser) });
  });
  app2.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body || {};
    const cleanEmail = String(email || "").trim().toLowerCase();
    const db = getDb();
    const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user || !password || !verifyPassword(String(password), user.passwordHash, user.passwordSalt)) {
      res.status(401).json({ error: "Invalid email address or password." });
      return;
    }
    const token = signAuthToken(user.id, user.role);
    if (user.role === "admin") {
      appendAuditLog(user.email, "ADMIN_SIGN_IN", "Administrator signed in.");
    }
    res.json({ token, user: toPublicUser(user) });
  });
  app2.post("/api/auth/password-reset/request", (req, res) => {
    const { email, phone } = req.body || {};
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanPhoneDigits = String(phone || "").replace(/[^\d]/g, "");
    if (!cleanEmail) {
      res.status(400).json({ error: "Enter your registered email address." });
      return;
    }
    const db = getDb();
    const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user || user.role === "admin") {
      res.status(404).json({
        error: "No matching customer account found, or contact Fresh Farm Vegetables on WhatsApp for assistance."
      });
      return;
    }
    const userDigits = user.phone.replace(/[^\d]/g, "");
    if (!userDigits || cleanPhoneDigits.slice(-7) !== userDigits.slice(-7)) {
      res.status(400).json({
        error: "Phone number does not match the contact number registered on this account."
      });
      return;
    }
    const code = String(Math.floor(1e5 + Math.random() * 9e5));
    user.resetCode = code;
    user.resetExpiresAt = Date.now() + 1e3 * 60 * 15;
    saveDb();
    res.json({
      verificationReady: true,
      resetCode: code,
      message: "Identity verified against your registered phone number. Enter a new password below to complete your reset."
    });
  });
  app2.post("/api/auth/password-reset/confirm", (req, res) => {
    const { email, resetCode, newPassword } = req.body || {};
    const cleanEmail = String(email || "").trim().toLowerCase();
    if (!newPassword || String(newPassword).length < 6) {
      res.status(400).json({ error: "New password must be at least 6 characters." });
      return;
    }
    const db = getDb();
    const user = db.users.find((u) => u.email.toLowerCase() === cleanEmail);
    if (!user || !user.resetCode || user.resetCode !== String(resetCode || "").trim() || !user.resetExpiresAt || Date.now() > user.resetExpiresAt) {
      res.status(400).json({ error: "Invalid or expired reset code." });
      return;
    }
    const creds = hashPassword(String(newPassword));
    user.passwordHash = creds.hash;
    user.passwordSalt = creds.salt;
    user.resetCode = null;
    user.resetExpiresAt = null;
    saveDb();
    const token = signAuthToken(user.id, user.role);
    res.json({ token, user: toPublicUser(user) });
  });
  app2.get("/api/account/me", requireAuth, (req, res) => {
    const db = getDb();
    const user = req.user;
    const myOrders = db.orders.filter((o) => o.customerId === user.id);
    const myQuotes = db.quotes.filter((q) => q.customerId === user.id);
    res.json({
      user: toPublicUser(user),
      orders: myOrders,
      quotes: myQuotes
    });
  });
  app2.put("/api/account/profile", requireAuth, (req, res) => {
    const user = req.user;
    const { fullName, phone, businessName } = req.body || {};
    if (!String(fullName || "").trim()) {
      res.status(400).json({ error: "Full name cannot be empty." });
      return;
    }
    user.fullName = String(fullName).trim();
    user.phone = String(phone || "").trim();
    user.businessName = String(businessName || "").trim();
    saveDb();
    res.json({ user: toPublicUser(user) });
  });
  app2.post("/api/account/favorites/toggle", requireAuth, (req, res) => {
    const user = req.user;
    const { productId } = req.body || {};
    const pid = String(productId || "");
    if (!pid) {
      res.status(400).json({ error: "Product ID is required." });
      return;
    }
    const idx = user.favoriteProductIds.indexOf(pid);
    if (idx >= 0) {
      user.favoriteProductIds.splice(idx, 1);
    } else {
      user.favoriteProductIds.push(pid);
    }
    saveDb();
    res.json({ favoriteProductIds: user.favoriteProductIds, user: toPublicUser(user) });
  });
  app2.post("/api/account/addresses", requireAuth, (req, res) => {
    const user = req.user;
    const addr = sanitizeAddress(req.body || {});
    if (!addr.streetAddress || !addr.firstName) {
      res.status(400).json({ error: "Recipient first name and street address are required." });
      return;
    }
    user.savedAddresses.push(addr);
    saveDb();
    res.status(201).json({ savedAddresses: user.savedAddresses, user: toPublicUser(user) });
  });
  app2.delete("/api/account/addresses/:id", requireAuth, (req, res) => {
    const user = req.user;
    user.savedAddresses = user.savedAddresses.filter((a) => a.id !== req.params.id);
    saveDb();
    res.json({ savedAddresses: user.savedAddresses, user: toPublicUser(user) });
  });
  app2.post("/api/orders", async (req, res) => {
    const db = getDb();
    const {
      cartItems,
      contact,
      shippingAddress,
      paymentMethod,
      paymentProof,
      saveAddressToAccount
    } = req.body || {};
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      res.status(400).json({ error: "Your cart is empty." });
      return;
    }
    const receiptCheck = validateReceiptDataUrl(paymentProof?.receiptDataUrl);
    if (!receiptCheck.valid) {
      res.status(400).json({
        error: receiptCheck.error,
        validationErrors: { paymentProof: receiptCheck.error || "Invalid receipt image." }
      });
      return;
    }
    const cleanTxnId = sanitizeTransactionId(paymentProof?.transactionId);
    const cleanReceiptFileName = String(paymentProof?.receiptFileName || "").trim().replace(/[^\w\- .()]+/g, "").slice(0, 100);
    const cleanSenderInfo = String(paymentProof?.senderInfo || "").trim().slice(0, 120);
    const summary = calculateCartSummary(
      cartItems,
      db.products,
      db.settings,
      shippingAddress?.zoneId
    );
    const allowedMethod = paymentMethod === "qr_transfer" || paymentMethod === "cod" || paymentMethod === "online_card" ? paymentMethod : "";
    const validationErrors = validateCheckoutInput(
      {
        fullName: String(contact?.fullName || ""),
        email: String(contact?.email || ""),
        phone: String(contact?.phone || ""),
        firstName: String(shippingAddress?.firstName || ""),
        lastName: String(shippingAddress?.lastName || ""),
        shippingPhone: String(shippingAddress?.phone || ""),
        streetAddress: String(shippingAddress?.streetAddress || ""),
        city: String(shippingAddress?.city || ""),
        province: String(shippingAddress?.province || ""),
        zoneId: String(shippingAddress?.zoneId || ""),
        paymentMethod: allowedMethod,
        transactionId: cleanTxnId,
        hasPaymentReceipt: Boolean(receiptCheck.cleaned)
      },
      summary,
      db.settings
    );
    if (Object.keys(validationErrors).length > 0) {
      res.status(400).json({
        error: Object.values(validationErrors)[0],
        validationErrors,
        summary
      });
      return;
    }
    const zone = db.settings.deliveryZones.find((z) => z.id === shippingAddress.zoneId);
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const seq = 1001 + db.orders.length;
    const reference = `FFV-ORD-${seq}`;
    const accessToken = crypto2.randomBytes(16).toString("hex");
    const orderItems = summary.items.map((item) => ({
      productId: item.productId,
      productName: item.product.name,
      origin: item.product.origin,
      quantity: item.quantity,
      selectedPackage: item.selectedPackage || item.product.priceUnit || "Standard",
      unitPricePkr: item.unitPricePkr,
      priceUnit: item.product.priceUnit || "per unit",
      lineTotalPkr: item.lineTotalPkr
    }));
    const initialPaymentStatus = allowedMethod === "qr_transfer" ? "pending_verification" : allowedMethod === "cod" ? "cod_pending" : "unpaid";
    const newOrder = {
      id: `ord-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      reference,
      accessToken,
      customerId: req.user ? req.user.id : null,
      contact: {
        fullName: String(contact.fullName).trim(),
        email: String(contact.email).trim(),
        phone: String(contact.phone).trim(),
        marketingConsent: Boolean(contact.marketingConsent)
      },
      shippingAddress: {
        country: String(shippingAddress.country || "Pakistan").trim(),
        firstName: String(shippingAddress.firstName).trim(),
        lastName: String(shippingAddress.lastName).trim(),
        phone: String(shippingAddress.phone).trim(),
        streetAddress: String(shippingAddress.streetAddress).trim(),
        apartment: String(shippingAddress.apartment || "").trim(),
        city: String(shippingAddress.city).trim(),
        province: String(shippingAddress.province).trim(),
        postalCode: String(shippingAddress.postalCode || "").trim(),
        zoneId: zone.id,
        zoneName: zone.name,
        deliveryInstructions: String(shippingAddress.deliveryInstructions || "").trim()
      },
      items: orderItems,
      subtotalPkr: summary.subtotalPkr,
      deliveryFeePkr: summary.deliveryFeePkr,
      deliveryNote: summary.deliveryPendingConfirmation ? "Your delivery options and charges will be confirmed by our team." : `Confirmed zone delivery charge applied (${zone.name}).`,
      taxPkr: summary.taxPkr || 0,
      discountPkr: 0,
      grandTotalPkr: summary.grandTotalPkr,
      paymentMethod: allowedMethod,
      paymentStatus: initialPaymentStatus,
      paymentDetails: {
        transactionId: cleanTxnId,
        receiptDataUrl: receiptCheck.cleaned,
        receiptFileName: receiptCheck.cleaned ? cleanReceiptFileName || "payment-receipt.png" : "",
        senderInfo: cleanSenderInfo,
        submittedAt: cleanTxnId || receiptCheck.cleaned ? now : null,
        verifiedAt: null,
        verifiedBy: null,
        verificationNote: ""
      },
      status: "pending_confirmation",
      createdAt: now,
      updatedAt: now
    };
    const waNotification = await sendWhatsAppOrderNotification(newOrder, db.settings);
    newOrder.whatsappNotification = waNotification;
    db.orders.unshift(newOrder);
    if (saveAddressToAccount && req.user) {
      req.user.savedAddresses.push(
        sanitizeAddress({
          label: zone.name,
          firstName: newOrder.shippingAddress.firstName,
          lastName: newOrder.shippingAddress.lastName,
          phone: newOrder.shippingAddress.phone,
          streetAddress: newOrder.shippingAddress.streetAddress,
          apartment: newOrder.shippingAddress.apartment,
          city: newOrder.shippingAddress.city,
          province: newOrder.shippingAddress.province,
          postalCode: newOrder.shippingAddress.postalCode,
          zoneId: zone.id
        })
      );
    }
    appendAuditLog(
      newOrder.contact.email,
      "ORDER_PLACED",
      `Order ${newOrder.reference} placed (${newOrder.paymentMethod}, status=${newOrder.paymentStatus}, total=${newOrder.grandTotalPkr ?? newOrder.subtotalPkr} PKR, WhatsApp=${waNotification.deliveredAutomatically ? "auto-sent" : "prefilled-link"}).`
    );
    saveDb();
    res.status(201).json({ order: newOrder });
  });
  app2.get("/api/orders/:reference", (req, res) => {
    const db = getDb();
    const order = db.orders.find(
      (o) => o.reference === req.params.reference || o.id === req.params.reference
    );
    if (!order) {
      res.status(404).json({ error: "Order not found." });
      return;
    }
    if (!canViewOrder(req, order)) {
      res.status(403).json({
        error: "Provide the order email address or sign in to view full order details."
      });
      return;
    }
    res.json({ order });
  });
  app2.post("/api/orders/:reference/payment-proof", async (req, res) => {
    const db = getDb();
    const order = db.orders.find(
      (o) => o.reference === req.params.reference || o.id === req.params.reference
    );
    if (!order) {
      res.status(404).json({ error: "Order not found." });
      return;
    }
    if (!canViewOrder(req, order)) {
      res.status(403).json({ error: "Unauthorized to update payment proof for this order." });
      return;
    }
    if (order.paymentStatus === "paid") {
      res.status(400).json({ error: "Payment for this order has already been verified." });
      return;
    }
    const receiptCheck = validateReceiptDataUrl(req.body?.receiptDataUrl);
    if (!receiptCheck.valid) {
      res.status(400).json({ error: receiptCheck.error });
      return;
    }
    const nextTxnId = sanitizeTransactionId(req.body?.transactionId);
    const nextReceipt = receiptCheck.cleaned || order.paymentDetails?.receiptDataUrl || "";
    const nextFileName = receiptCheck.cleaned ? String(req.body?.receiptFileName || "payment-receipt.png").trim().replace(/[^\w\- .()]+/g, "").slice(0, 100) : order.paymentDetails?.receiptFileName || "";
    const nextSender = String(req.body?.senderInfo ?? order.paymentDetails?.senderInfo ?? "").trim().slice(0, 120);
    if (nextTxnId.length < 4 && !nextReceipt) {
      res.status(400).json({
        error: "Provide a Transaction ID (at least 4 characters) or upload a payment receipt image."
      });
      return;
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    order.paymentMethod = "qr_transfer";
    order.paymentStatus = "pending_verification";
    order.paymentDetails = {
      transactionId: nextTxnId || order.paymentDetails?.transactionId || "",
      receiptDataUrl: nextReceipt,
      receiptFileName: nextFileName,
      senderInfo: nextSender,
      submittedAt: now,
      verifiedAt: null,
      verifiedBy: null,
      verificationNote: order.paymentDetails?.verificationNote || ""
    };
    order.updatedAt = now;
    order.whatsappNotification = await sendWhatsAppOrderNotification(order, db.settings);
    appendAuditLog(
      order.contact.email,
      "PAYMENT_PROOF_SUBMITTED",
      `Updated payment proof on ${order.reference} (txn=${order.paymentDetails.transactionId || "none"}, receipt=${order.paymentDetails.receiptDataUrl ? "yes" : "no"}). Status remains pending_verification.`
    );
    saveDb();
    res.json({ order });
  });
  app2.post("/api/quotes", (req, res) => {
    const db = getDb();
    const body = req.body || {};
    const validationErrors = validateWholesaleQuoteInput({
      businessName: String(body.businessName || ""),
      contactName: String(body.contactName || ""),
      businessType: String(body.businessType || ""),
      phone: String(body.phone || ""),
      email: String(body.email || ""),
      deliveryAddress: String(body.deliveryAddress || ""),
      items: Array.isArray(body.items) ? body.items : []
    });
    if (Object.keys(validationErrors).length > 0) {
      res.status(400).json({
        error: Object.values(validationErrors)[0],
        validationErrors
      });
      return;
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const seq = 2001 + db.quotes.length;
    const reference = `FFV-Q-${seq}`;
    const cleanItems = body.items.filter((i) => String(i.productName || "").trim() && Number(i.quantity) > 0).map((i) => ({
      productId: String(i.productId || ""),
      productName: String(i.productName).trim(),
      quantity: Math.max(1, Math.round(Number(i.quantity))),
      unitOrPackage: String(i.unitOrPackage || "Standard").trim(),
      quotedUnitPricePkr: null
    }));
    const inquiry = {
      id: `qte-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      reference,
      customerId: req.user ? req.user.id : null,
      source: body.source === "cart_inquiry" ? "cart_inquiry" : "wholesale_form",
      businessName: String(body.businessName || "").trim(),
      contactName: String(body.contactName).trim(),
      businessType: String(body.businessType).trim(),
      phone: String(body.phone).trim(),
      email: String(body.email || "").trim(),
      deliveryAddress: String(body.deliveryAddress).trim(),
      preferredDeliveryDate: String(body.preferredDeliveryDate || "").trim(),
      packagingRequirements: String(body.packagingRequirements || "").trim(),
      additionalNotes: String(body.additionalNotes || "").trim(),
      items: cleanItems,
      status: "new",
      adminResponseNotes: "",
      createdAt: now,
      updatedAt: now
    };
    db.quotes.unshift(inquiry);
    saveDb();
    res.status(201).json({ inquiry });
  });
  app2.get("/api/admin/overview", requireAdmin, (_req, res) => {
    const db = getDb();
    res.json({
      products: db.products,
      orders: db.orders,
      quotes: db.quotes,
      settings: db.settings,
      auditLogs: db.auditLogs,
      whatsappApiStatus: getWhatsAppIntegrationStatus(db.settings.whatsappIntl)
    });
  });
  app2.post("/api/admin/products", requireAdmin, (req, res) => {
    const db = getDb();
    const body = req.body || {};
    const name = String(body.name || "").trim();
    if (!name) {
      res.status(400).json({ error: "Product name is required." });
      return;
    }
    const baseSlug = makeSlug(name);
    const slug = db.products.some((p) => p.slug === baseSlug) ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;
    const origin = body.origin === "imported" ? "imported" : "local";
    const pricingMode = body.pricingMode === "live" ? "live" : "quote";
    const rawPrice = pricingMode === "live" && body.pricePkr !== null && body.pricePkr !== "" ? Number(body.pricePkr) : null;
    if (pricingMode === "live" && (!rawPrice || rawPrice <= 0)) {
      res.status(400).json({
        error: "Enter a valid positive PKR rate for live-priced products, or select Request Today's Rate."
      });
      return;
    }
    const categories = ["all", origin];
    if (body.bestseller) categories.push("bestsellers");
    if (Array.isArray(body.extraCategories)) {
      for (const c of body.extraCategories) {
        if (!categories.includes(c)) categories.push(c);
      }
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const product = {
      id: `prod-${slug}`,
      slug,
      name,
      origin,
      categories,
      isSpecialty: Boolean(body.isSpecialty),
      featured: Boolean(body.featured),
      bestseller: Boolean(body.bestseller),
      description: String(
        body.description || `${name} supplied fresh by Fresh Farm Vegetables.`
      ).trim(),
      culinaryApplications: String(
        body.culinaryApplications || "Commercial and household kitchen prep."
      ).trim(),
      handlingNotes: String(body.handlingNotes || "Store in clean, cool conditions.").trim(),
      imageUrl: String(body.imageUrl || "/images/produce/hero-produce.jpg").trim(),
      galleryUrls: Array.isArray(body.galleryUrls) && body.galleryUrls.length > 0 ? body.galleryUrls : [String(body.imageUrl || "/images/produce/hero-produce.jpg").trim()],
      packageOptions: Array.isArray(body.packageOptions) ? body.packageOptions.map((s) => String(s).trim()).filter(Boolean) : ["1 kg", "0.5 kg", "5 kg"],
      pricingMode,
      pricePkr: rawPrice,
      priceUnit: String(body.priceUnit || "per kg").trim(),
      priceUpdatedAt: pricingMode === "live" ? now : null,
      stockStatus: ["unverified", "in_stock", "limited", "out_of_stock"].includes(body.stockStatus) ? body.stockStatus : "in_stock",
      enabled: body.enabled !== false
    };
    db.products.unshift(product);
    saveDb();
    appendAuditLog(
      req.user.email,
      "PRODUCT_CREATED",
      `Created product "${product.name}" (${product.origin}).`
    );
    res.status(201).json({ product });
  });
  app2.put("/api/admin/products/:id", requireAdmin, (req, res) => {
    const db = getDb();
    const product = db.products.find((p) => p.id === req.params.id);
    if (!product) {
      res.status(404).json({ error: "Product not found." });
      return;
    }
    const body = req.body || {};
    if (body.name !== void 0) {
      const cleanName = String(body.name).trim();
      if (!cleanName) {
        res.status(400).json({ error: "Product name cannot be empty." });
        return;
      }
      product.name = cleanName;
    }
    if (body.origin === "local" || body.origin === "imported") {
      product.origin = body.origin;
    }
    if (body.description !== void 0) product.description = String(body.description).trim();
    if (body.culinaryApplications !== void 0)
      product.culinaryApplications = String(body.culinaryApplications).trim();
    if (body.handlingNotes !== void 0)
      product.handlingNotes = String(body.handlingNotes).trim();
    if (body.imageUrl !== void 0 && String(body.imageUrl).trim()) {
      product.imageUrl = String(body.imageUrl).trim();
      if (!product.galleryUrls.includes(product.imageUrl)) {
        product.galleryUrls = [product.imageUrl, ...product.galleryUrls.slice(0, 3)];
      }
    }
    if (Array.isArray(body.packageOptions)) {
      product.packageOptions = body.packageOptions.map((s) => String(s).trim()).filter(Boolean);
    }
    if (body.featured !== void 0) product.featured = Boolean(body.featured);
    if (body.bestseller !== void 0) product.bestseller = Boolean(body.bestseller);
    if (body.isSpecialty !== void 0) product.isSpecialty = Boolean(body.isSpecialty);
    if (body.enabled !== void 0) product.enabled = Boolean(body.enabled);
    const preserved = product.categories.filter(
      (c) => c === "iceberg-lettuce" || c === "vacuum-packed-lettuce" || c === "lettuce-collection"
    );
    product.categories = ["all", product.origin, ...preserved];
    if (product.bestseller && !product.categories.includes("bestsellers")) {
      product.categories.push("bestsellers");
    }
    if (body.stockStatus && ["unverified", "in_stock", "limited", "out_of_stock"].includes(body.stockStatus)) {
      product.stockStatus = body.stockStatus;
    }
    if (body.priceUnit !== void 0) {
      product.priceUnit = String(body.priceUnit || "per kg").trim();
    }
    if (body.pricingMode === "quote") {
      product.pricingMode = "quote";
      product.pricePkr = null;
    } else if (body.pricingMode === "live") {
      const num = Number(body.pricePkr);
      if (!num || num <= 0) {
        res.status(400).json({ error: "Valid positive PKR price required for live pricing." });
        return;
      }
      product.pricingMode = "live";
      product.pricePkr = Math.round(num);
      product.priceUpdatedAt = (/* @__PURE__ */ new Date()).toISOString();
      db.settings.lastDailyRatesPublishedAt = product.priceUpdatedAt;
    }
    saveDb();
    appendAuditLog(
      req.user.email,
      "PRODUCT_UPDATED",
      `Updated "${product.name}" \u2014 mode=${product.pricingMode}, price=${product.pricePkr ?? "quote"}`
    );
    res.json({ product, lastDailyRatesPublishedAt: db.settings.lastDailyRatesPublishedAt });
  });
  app2.post("/api/admin/prices/bulk-publish", requireAdmin, (req, res) => {
    const db = getDb();
    const updates = Array.isArray(req.body?.updates) ? req.body.updates : [];
    const now = (/* @__PURE__ */ new Date()).toISOString();
    let count = 0;
    for (const upd of updates) {
      const prod = db.products.find((p) => p.id === upd.productId);
      if (!prod) continue;
      if (upd.pricingMode === "quote" || upd.pricePkr === null || upd.pricePkr === "") {
        prod.pricingMode = "quote";
        prod.pricePkr = null;
        count++;
      } else {
        const val = Math.round(Number(upd.pricePkr));
        if (val > 0) {
          prod.pricingMode = "live";
          prod.pricePkr = val;
          if (upd.priceUnit) prod.priceUnit = String(upd.priceUnit).trim();
          if (upd.stockStatus && ["unverified", "in_stock", "limited", "out_of_stock"].includes(upd.stockStatus)) {
            prod.stockStatus = upd.stockStatus;
          } else if (prod.stockStatus === "unverified") {
            prod.stockStatus = "in_stock";
          }
          prod.priceUpdatedAt = now;
          count++;
        }
      }
    }
    db.settings.lastDailyRatesPublishedAt = now;
    saveDb();
    appendAuditLog(
      req.user.email,
      "DAILY_RATES_PUBLISHED",
      `Published daily price updates across ${count} products.`
    );
    res.json({
      products: db.products,
      lastDailyRatesPublishedAt: now,
      updatedCount: count
    });
  });
  app2.put("/api/admin/orders/:id", requireAdmin, (req, res) => {
    const db = getDb();
    const order = db.orders.find((o) => o.id === req.params.id);
    if (!order) {
      res.status(404).json({ error: "Order not found." });
      return;
    }
    const { status, paymentStatus, deliveryFeePkr, deliveryNote, verificationNote } = req.body || {};
    const prevPaymentStatus = order.paymentStatus;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (status) order.status = status;
    if (paymentStatus) {
      order.paymentStatus = paymentStatus;
      if (!order.paymentDetails) {
        order.paymentDetails = {
          transactionId: "",
          receiptDataUrl: "",
          receiptFileName: "",
          senderInfo: "",
          submittedAt: null,
          verifiedAt: null,
          verifiedBy: null,
          verificationNote: ""
        };
      }
      if (paymentStatus === "paid" && prevPaymentStatus !== "paid") {
        order.paymentDetails.verifiedAt = now;
        order.paymentDetails.verifiedBy = req.user.email;
        if (order.status === "pending_confirmation") {
          order.status = "confirmed";
        }
      } else if (paymentStatus !== "paid") {
        order.paymentDetails.verifiedAt = null;
        order.paymentDetails.verifiedBy = null;
      }
    }
    if (verificationNote !== void 0 && order.paymentDetails) {
      order.paymentDetails.verificationNote = String(verificationNote).trim().slice(0, 240);
    }
    if (deliveryFeePkr !== void 0) {
      const fee = deliveryFeePkr === null || deliveryFeePkr === "" ? null : Math.round(Number(deliveryFeePkr));
      order.deliveryFeePkr = fee;
      order.grandTotalPkr = order.subtotalPkr + (fee || 0) + order.taxPkr - order.discountPkr;
    }
    if (deliveryNote !== void 0) order.deliveryNote = String(deliveryNote).trim();
    order.updatedAt = now;
    saveDb();
    appendAuditLog(
      req.user.email,
      paymentStatus === "paid" && prevPaymentStatus !== "paid" ? "PAYMENT_VERIFIED" : "ORDER_UPDATED",
      `Order ${order.reference} updated \u2014 status=${order.status}, payment=${order.paymentStatus}.`
    );
    res.json({ order });
  });
  app2.put("/api/admin/quotes/:id", requireAdmin, (req, res) => {
    const db = getDb();
    const quote = db.quotes.find((q) => q.id === req.params.id);
    if (!quote) {
      res.status(404).json({ error: "Quote request not found." });
      return;
    }
    const { status, adminResponseNotes, items } = req.body || {};
    if (status) quote.status = status;
    if (adminResponseNotes !== void 0) {
      quote.adminResponseNotes = String(adminResponseNotes).trim();
    }
    if (Array.isArray(items)) {
      quote.items = items.map((item) => ({
        productId: String(item.productId || ""),
        productName: String(item.productName || "").trim(),
        quantity: Math.max(1, Number(item.quantity) || 1),
        unitOrPackage: String(item.unitOrPackage || "Standard").trim(),
        quotedUnitPricePkr: item.quotedUnitPricePkr === null || item.quotedUnitPricePkr === "" || item.quotedUnitPricePkr === void 0 ? null : Math.round(Number(item.quotedUnitPricePkr))
      }));
    }
    quote.updatedAt = (/* @__PURE__ */ new Date()).toISOString();
    saveDb();
    appendAuditLog(
      req.user.email,
      "QUOTE_UPDATED",
      `Updated quote ${quote.reference} to status=${quote.status}.`
    );
    res.json({ quote });
  });
  app2.put("/api/admin/settings", requireAdmin, (req, res) => {
    const db = getDb();
    const body = req.body || {};
    const cleanPaymentLink = String(body.paymentLinkUrl ?? db.settings.paymentLinkUrl).trim();
    if (cleanPaymentLink && !/^https?:\/\//i.test(cleanPaymentLink)) {
      res.status(400).json({
        error: "Official payment link must start with https:// or http://."
      });
      return;
    }
    db.settings = {
      ...db.settings,
      phoneDisplay: String(body.phoneDisplay ?? db.settings.phoneDisplay).trim(),
      whatsappIntl: String(body.whatsappIntl ?? db.settings.whatsappIntl).trim(),
      email: String(body.email ?? db.settings.email).trim(),
      emailVerified: Boolean(body.emailVerified),
      address: String(body.address ?? db.settings.address).trim(),
      instagramUrl: String(body.instagramUrl ?? db.settings.instagramUrl).trim(),
      facebookUrl: String(body.facebookUrl ?? db.settings.facebookUrl).trim(),
      businessHours: String(body.businessHours ?? db.settings.businessHours).trim(),
      codEnabled: Boolean(body.codEnabled),
      qrPaymentEnabled: body.qrPaymentEnabled !== void 0 ? Boolean(body.qrPaymentEnabled) : db.settings.qrPaymentEnabled,
      paymentProviderTitle: String(
        body.paymentProviderTitle ?? db.settings.paymentProviderTitle
      ).trim(),
      paymentAccountTitle: String(
        body.paymentAccountTitle ?? db.settings.paymentAccountTitle
      ).trim(),
      paymentBankOrWalletName: String(
        body.paymentBankOrWalletName ?? db.settings.paymentBankOrWalletName
      ).trim(),
      paymentAccountNumber: String(
        body.paymentAccountNumber ?? db.settings.paymentAccountNumber
      ).trim(),
      paymentQrImageUrl: String(body.paymentQrImageUrl ?? db.settings.paymentQrImageUrl).trim(),
      paymentLinkUrl: cleanPaymentLink,
      paymentInstructions: String(
        body.paymentInstructions ?? db.settings.paymentInstructions
      ).trim(),
      onlineCardEnabled: Boolean(body.onlineCardEnabled),
      onlineCardProviderName: String(
        body.onlineCardProviderName ?? db.settings.onlineCardProviderName
      ).trim(),
      taxRatePercent: Math.max(0, Number(body.taxRatePercent ?? db.settings.taxRatePercent) || 0),
      deliveryZones: Array.isArray(body.deliveryZones) ? body.deliveryZones : db.settings.deliveryZones
    };
    saveDb();
    appendAuditLog(
      req.user.email,
      "SETTINGS_UPDATED",
      "Updated business, payment QR/link, and delivery zone settings."
    );
    res.json({ settings: db.settings });
  });
  app2.post("/api/ai/procurement-plan", async (req, res) => {
    const brief = String(req.body?.kitchenBrief || "").trim();
    if (!brief || brief.length < 5) {
      res.status(400).json({
        error: "Describe your kitchen menu, event covers, or daily produce needs first."
      });
      return;
    }
    try {
      const db = getDb();
      const result = await generateKitchenProcurementPlan(brief, db.products);
      res.json(result);
    } catch (err) {
      res.status(502).json({
        error: err?.message || "Unable to generate kitchen procurement plan right now. You can still select products manually below."
      });
    }
  });
  app2.post("/api/ai/quick-order-parse", async (req, res) => {
    const rawText = String(req.body?.rawText || "").trim();
    if (!rawText) {
      res.status(400).json({ error: "Paste or type at least one vegetable and quantity." });
      return;
    }
    try {
      const db = getDb();
      const result = await parseQuickProduceList(rawText, db.products);
      res.json(result);
    } catch (err) {
      res.status(502).json({
        error: err?.message || "Unable to parse list automatically right now."
      });
    }
  });
  app2.post(
    "/api/admin/ai/parse-rates",
    requireAdmin,
    async (req, res) => {
      const rawRatesText = String(req.body?.rawRatesText || "").trim();
      if (!rawRatesText) {
        res.status(400).json({ error: "Paste daily market rate notes first." });
        return;
      }
      try {
        const db = getDb();
        const result = await parseAdminRateSheet(rawRatesText, db.products);
        res.json(result);
      } catch (err) {
        res.status(502).json({
          error: err?.message || "Unable to parse daily rate notes automatically."
        });
      }
    }
  );
  return app2;
}

// server/vercelEntry.ts
var app = createApiApp();
function handler(req, res) {
  if (req.url && !req.url.startsWith("/api")) {
    req.url = `/api${req.url.startsWith("/") ? "" : "/"}${req.url}`;
  }
  return app(req, res);
}
export {
  handler as default
};
