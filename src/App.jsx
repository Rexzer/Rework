import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Home as HomeIcon, Utensils, Dumbbell, TrendingUp, User, Plus, Search, X, Check,
  ChevronRight, ChevronLeft, ChevronDown, Flame, Sun, Moon, Settings as SettingsIcon,
  Star, Clock, Play, Trophy, Scale, Edit2, Trash2, Download, ArrowLeft, Timer,
  BarChart3, Filter, Calendar, Pause, RotateCcw, Sparkles, Target, Zap, ChevronUp,
  Copy, AlertCircle, LayoutGrid, ListFilter, Camera, Upload, RefreshCw, Barcode
} from "lucide-react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar as RBar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { loadKey as storageLoadKey, saveKey as storageSaveKey, deleteKey as storageDeleteKey } from "./lib/storage.js";

/* ============================================================================
   REWORK — Eat. Train. Rework.
   Single-file React app. Colors via CSS variables (see <style> block below),
   Tailwind used only for layout/spacing/typography, never for custom color.
============================================================================ */

/* ---------------------------- THEME TOKENS ------------------------------- */
const THEME_CSS = `
  :root {
    --bg: #F5F6F8;
    --card: #FFFFFF;
    --card-alt: #FAFBFC;
    --text-primary: #14161A;
    --text-secondary: #6B7280;
    --text-tertiary: #9CA3AF;
    --border: #E7E9EC;
    --track: #EEF0F3;
    --nav-bg: rgba(255,255,255,0.92);
    --primary: #FF5A36;
    --primary-dark: #E64A28;
    --secondary: #5B5FEF;
    --protein: #FF5A36;
    --carbs: #FFB020;
    --fat: #5B5FEF;
    --success: #00C875;
    --danger: #EF4444;
    --shadow-card: 0 1px 2px rgba(20,22,26,0.04), 0 8px 24px -12px rgba(20,22,26,0.08);
  }
  [data-theme="dark"] {
    --bg: #0D0F12;
    --card: #191C21;
    --card-alt: #15171B;
    --text-primary: #F4F5F7;
    --text-secondary: #9BA1AC;
    --text-tertiary: #6B7280;
    --border: #262A31;
    --track: #23262C;
    --nav-bg: rgba(21,23,27,0.92);
    --primary: #FF6B45;
    --primary-dark: #FF5A36;
    --secondary: #7B7FFF;
    --protein: #FF6B45;
    --carbs: #FFC24D;
    --fat: #7B7FFF;
    --success: #1FE08A;
    --danger: #F76A6A;
    --shadow-card: 0 1px 2px rgba(0,0,0,0.2), 0 12px 28px -14px rgba(0,0,0,0.55);
  }
  .rework-root {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background: var(--bg);
    color: var(--text-primary);
    min-height: 100vh;
    min-height: 100dvh;
    transition: background 0.25s ease, color 0.25s ease;
  }
  .rework-root * { box-sizing: border-box; }
  .rw-display { font-family: 'Space Grotesk', 'Inter', sans-serif; }
  .rw-card {
    background: var(--card);
    border: 1px solid var(--border);
    box-shadow: var(--shadow-card);
  }
  .rw-scroll::-webkit-scrollbar { display: none; }
  .rw-scroll { -ms-overflow-style: none; scrollbar-width: none; }
  @keyframes rw-pop { 0% { transform: scale(0.85); opacity:0; } 60% { transform: scale(1.06); opacity:1;} 100% { transform: scale(1);} }
  @keyframes rw-fade-up { from { opacity:0; transform: translateY(6px);} to { opacity:1; transform: translateY(0);} }
  @keyframes rw-check { 0% { stroke-dashoffset: 40;} 100% { stroke-dashoffset: 0;} }
  @keyframes rw-flash { 0%,100% { box-shadow: 0 0 0 0 rgba(255,90,54,0);} 50% { box-shadow: 0 0 0 8px rgba(255,90,54,0.12);} }
  .rw-pop { animation: rw-pop 0.35s cubic-bezier(.2,1.4,.4,1); }
  .rw-fade-up { animation: rw-fade-up 0.3s ease; }
  .rw-input {
    background: var(--card-alt);
    border: 1px solid var(--border);
    color: var(--text-primary);
  }
  .rw-input::placeholder { color: var(--text-tertiary); }
  .rw-input:focus { outline: none; border-color: var(--primary); }
  .rw-btn-primary {
    background: linear-gradient(135deg, var(--primary), var(--primary-dark));
    color: white;
    box-shadow: 0 8px 20px -8px rgba(255,90,54,0.55);
  }
  .rw-btn-primary:active { transform: scale(0.98); }
  .rw-tab-active { color: var(--primary) !important; }
  .rw-fs-9 { font-size: 9px; line-height: 1.4; }
  .rw-fs-10 { font-size: 10px; line-height: 1.4; }
  .rw-fs-11 { font-size: 11px; line-height: 1.4; }
  .rw-set-grid { display: grid; grid-template-columns: 32px 1fr 1fr 36px; gap: 8px; }
  .rw-bottom-nav { padding-bottom: env(safe-area-inset-bottom, 0px); }
`;

const GOOGLE_FONTS = `@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700;800&display=swap');`;

// USDA FoodData Central — get a free personal API key at
// https://fdc.nal.usda.gov/api-key-signup.html, then put it in a local
// ".env" file (copy .env.example) as VITE_USDA_API_KEY=your_key_here.
// Vite only exposes env vars prefixed VITE_ to client code, and only at
// build/dev time -- it is sent nowhere except directly from the visitor's
// own browser to api.nal.usda.gov. If left blank, USDA results are simply
// skipped; your local library and Open Food Facts still work fully.
const USDA_API_KEY = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_USDA_API_KEY) || "";
const USDA_DATA_TYPES = "Foundation,SR Legacy,Survey (FNDDS)";
// Live search against USDA / Open Food Facts. This only actually does
// anything in a normal browser with real network access -- it fails soft
// and shows local results only if fetch is unavailable or blocked for any
// reason (e.g. if this code somehow runs inside the claude.ai artifact
// sandbox, which blocks third-party fetch() entirely).
const LIVE_SEARCH_ENABLED = true;



/* ---------------------------- STATIC DATA -------------------------------- */
const ACTIVITY_LEVELS = [
  { id: "sedentary", label: "Sedentary", desc: "Little or no exercise", factor: 1.2 },
  { id: "light", label: "Lightly active", desc: "Light exercise 1–3 days/week", factor: 1.375 },
  { id: "moderate", label: "Moderately active", desc: "Moderate exercise 3–5 days/week", factor: 1.55 },
  { id: "very", label: "Very active", desc: "Hard exercise 6–7 days/week", factor: 1.725 },
  { id: "extreme", label: "Extremely active", desc: "Physical job or 2x/day training", factor: 1.9 },
];

const GOALS = [
  { id: "cut", label: "Lose weight", sub: "Cut", calAdj: -0.20, proteinPerKg: 2.0, icon: "↓" },
  { id: "maintain", label: "Maintain weight", sub: "Stay the course", calAdj: 0, proteinPerKg: 1.8, icon: "→" },
  { id: "bulk", label: "Gain weight", sub: "Bulk", calAdj: 0.15, proteinPerKg: 1.8, icon: "↑" },
  { id: "muscle", label: "Build muscle", sub: "Lean gain", calAdj: 0.10, proteinPerKg: 2.2, icon: "＋" },
  { id: "fitness", label: "Improve fitness", sub: "General health", calAdj: 0, proteinPerKg: 1.6, icon: "★" },
  { id: "custom", label: "Custom goal", sub: "Set it yourself", calAdj: 0, proteinPerKg: 1.8, icon: "✎" },
];

const MUSCLES = ["Chest","Back","Shoulders","Biceps","Triceps","Forearms","Abs","Quads","Hamstrings","Glutes","Calves","Full Body"];
const EQUIPMENT = ["Barbell","Dumbbell","Cable","Machine","Smith Machine","Bodyweight","Kettlebell","Band"];

function ex(name, muscle, secondary, equipment, type, difficulty, instructions) {
  return { id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"), name, muscle, secondary, equipment, type, difficulty, instructions };
}

const EXERCISES = [
  // Chest
  ex("Barbell Bench Press","Chest",["Triceps","Shoulders"],"Barbell","Strength","Intermediate","Lie on a flat bench, lower the bar to mid-chest, press up until arms are extended."),
  ex("Incline Bench Press","Chest",["Shoulders","Triceps"],"Barbell","Strength","Intermediate","Set bench to 30–45°, press the bar from upper chest to lockout."),
  ex("Dumbbell Bench Press","Chest",["Triceps","Shoulders"],"Dumbbell","Hypertrophy","Beginner","Press dumbbells from chest level to full extension, control the descent."),
  ex("Incline Dumbbell Press","Chest",["Shoulders","Triceps"],"Dumbbell","Hypertrophy","Intermediate","On an incline bench, press dumbbells up and slightly inward."),
  ex("Chest Fly","Chest",["Shoulders"],"Dumbbell","Hypertrophy","Beginner","Lie flat, arc dumbbells out and up with a slight elbow bend."),
  ex("Cable Fly","Chest",["Shoulders"],"Cable","Hypertrophy","Beginner","Stand between cable towers, bring handles together in front of chest."),
  ex("Pec Deck","Chest",["Shoulders"],"Machine","Hypertrophy","Beginner","Sit with elbows on pads, bring arms together in front of chest."),
  ex("Push Ups","Chest",["Triceps","Shoulders","Abs"],"Bodyweight","Bodyweight","Beginner","Lower chest to the floor keeping a straight line, press back up."),
  ex("Dips","Chest",["Triceps","Shoulders"],"Bodyweight","Bodyweight","Intermediate","Lower body between parallel bars until shoulders stretch, press up."),
  // Back
  ex("Deadlift","Back",["Hamstrings","Glutes","Forearms"],"Barbell","Strength","Advanced","Hinge at the hips, keep the bar close, drive through the floor to stand tall."),
  ex("Lat Pulldown","Back",["Biceps"],"Cable","Hypertrophy","Beginner","Pull the bar to upper chest, squeezing the shoulder blades together."),
  ex("Pull Ups","Back",["Biceps","Forearms"],"Bodyweight","Bodyweight","Advanced","Hang from a bar, pull chin above the bar, lower with control."),
  ex("Chin Ups","Back",["Biceps"],"Bodyweight","Bodyweight","Intermediate","Underhand grip pull up, emphasizes biceps along with lats."),
  ex("Barbell Row","Back",["Biceps","Forearms"],"Barbell","Strength","Intermediate","Hinge forward, row the bar to your lower ribs, squeeze at the top."),
  ex("Dumbbell Row","Back",["Biceps"],"Dumbbell","Hypertrophy","Beginner","Support one knee on a bench, row the dumbbell to your hip."),
  ex("Seated Cable Row","Back",["Biceps"],"Cable","Hypertrophy","Beginner","Sit tall, pull handle to your torso, squeeze shoulder blades."),
  ex("T-Bar Row","Back",["Biceps"],"Barbell","Strength","Intermediate","Hinge over the bar, row the weight to your chest."),
  ex("Straight Arm Pulldown","Back",["Triceps"],"Cable","Hypertrophy","Beginner","Keep arms straight, pull the bar down in an arc to your thighs."),
  // Shoulders
  ex("Overhead Press","Shoulders",["Triceps"],"Barbell","Strength","Intermediate","Press the bar from shoulders to full overhead lockout."),
  ex("Dumbbell Shoulder Press","Shoulders",["Triceps"],"Dumbbell","Hypertrophy","Beginner","Press dumbbells overhead from shoulder height."),
  ex("Arnold Press","Shoulders",["Triceps"],"Dumbbell","Hypertrophy","Intermediate","Rotate dumbbells from palms-in to palms-out as you press overhead."),
  ex("Lateral Raise","Shoulders",[],"Dumbbell","Hypertrophy","Beginner","Raise dumbbells out to the sides to shoulder height."),
  ex("Cable Lateral Raise","Shoulders",[],"Cable","Hypertrophy","Beginner","Raise a low cable handle out to the side for constant tension."),
  ex("Front Raise","Shoulders",[],"Dumbbell","Hypertrophy","Beginner","Raise dumbbells in front of you to shoulder height."),
  ex("Rear Delt Fly","Shoulders",["Back"],"Dumbbell","Hypertrophy","Beginner","Bend forward, raise dumbbells out to the sides targeting rear delts."),
  ex("Face Pull","Shoulders",["Back"],"Cable","Hypertrophy","Beginner","Pull rope to face height, elbows high, externally rotating shoulders."),
  // Biceps
  ex("Barbell Curl","Biceps",["Forearms"],"Barbell","Hypertrophy","Beginner","Curl the bar up keeping elbows pinned to your sides."),
  ex("Dumbbell Curl","Biceps",["Forearms"],"Dumbbell","Hypertrophy","Beginner","Curl each dumbbell up with control, avoid swinging."),
  ex("Hammer Curl","Biceps",["Forearms"],"Dumbbell","Hypertrophy","Beginner","Curl with a neutral palms-in grip."),
  ex("Preacher Curl","Biceps",[],"Barbell","Hypertrophy","Intermediate","Curl on a preacher bench to isolate the biceps."),
  ex("Cable Curl","Biceps",["Forearms"],"Cable","Hypertrophy","Beginner","Curl a cable bar keeping constant tension throughout."),
  ex("Incline Dumbbell Curl","Biceps",[],"Dumbbell","Hypertrophy","Intermediate","On an incline bench, curl dumbbells for a deep stretch."),
  // Triceps
  ex("Tricep Pushdown","Triceps",[],"Cable","Hypertrophy","Beginner","Push the cable attachment down until arms are straight."),
  ex("Overhead Tricep Extension","Triceps",[],"Dumbbell","Hypertrophy","Beginner","Lower a dumbbell behind your head, extend back overhead."),
  ex("Skull Crushers","Triceps",[],"Barbell","Hypertrophy","Intermediate","Lying down, lower the bar to your forehead, extend back up."),
  ex("Close Grip Bench Press","Triceps",["Chest"],"Barbell","Strength","Intermediate","Bench press with a narrow grip to emphasize triceps."),
  // Legs
  ex("Barbell Squat","Quads",["Glutes","Hamstrings"],"Barbell","Strength","Intermediate","Squat down keeping chest up and knees tracking over toes, drive up."),
  ex("Front Squat","Quads",["Glutes"],"Barbell","Strength","Advanced","Bar rests on front delts, squat down keeping torso upright."),
  ex("Goblet Squat","Quads",["Glutes"],"Dumbbell","Bodyweight","Beginner","Hold a dumbbell at your chest, squat down between your knees."),
  ex("Leg Press","Quads",["Glutes","Hamstrings"],"Machine","Strength","Beginner","Press the platform away by extending your knees and hips."),
  ex("Romanian Deadlift","Hamstrings",["Glutes","Back"],"Barbell","Strength","Intermediate","Hinge at the hips with a slight knee bend, lower the bar along your legs."),
  ex("Leg Curl","Hamstrings",[],"Machine","Hypertrophy","Beginner","Curl the pad toward your glutes, control the return."),
  ex("Leg Extension","Quads",[],"Machine","Hypertrophy","Beginner","Extend your knees against the pad until legs are straight."),
  ex("Bulgarian Split Squat","Quads",["Glutes"],"Dumbbell","Hypertrophy","Intermediate","Rear foot elevated, lunge down on the front leg."),
  ex("Lunges","Quads",["Glutes","Hamstrings"],"Dumbbell","Hypertrophy","Beginner","Step forward and lower your back knee toward the floor."),
  ex("Step Ups","Quads",["Glutes"],"Dumbbell","Hypertrophy","Beginner","Step onto a bench or box, driving through the lead leg."),
  ex("Hip Thrust","Glutes",["Hamstrings"],"Barbell","Strength","Intermediate","Shoulders on a bench, drive hips up, squeeze glutes at the top."),
  ex("Calf Raise","Calves",[],"Machine","Hypertrophy","Beginner","Rise onto your toes, pause, then lower with control."),
  // Abs
  ex("Plank","Abs",["Back"],"Bodyweight","Bodyweight","Beginner","Hold a straight line from head to heels on forearms and toes."),
  ex("Side Plank","Abs",[],"Bodyweight","Bodyweight","Beginner","Hold a straight line supported on one forearm, hips lifted."),
  ex("Crunches","Abs",[],"Bodyweight","Bodyweight","Beginner","Curl your shoulders toward your pelvis, squeezing your abs."),
  ex("Hanging Leg Raise","Abs",["Forearms"],"Bodyweight","Bodyweight","Advanced","Hang from a bar, raise straight legs to hip height or above."),
  ex("Cable Crunch","Abs",[],"Cable","Hypertrophy","Beginner","Kneel below a cable, crunch down bringing elbows toward knees."),
  ex("Russian Twist","Abs",[],"Bodyweight","Bodyweight","Beginner","Seated, lean back slightly and rotate your torso side to side."),
  ex("Ab Wheel Rollout","Abs",["Back"],"Bodyweight","Bodyweight","Advanced","Roll the wheel out keeping your core braced, roll back in."),
  ex("Mountain Climbers","Abs",["Quads"],"Bodyweight","Cardio","Beginner","From a plank, drive knees toward your chest rapidly alternating legs."),
  // Forearms
  ex("Wrist Curl","Forearms",[],"Barbell","Hypertrophy","Beginner","Curl the bar using only your wrists, forearms resting on a bench."),
  ex("Reverse Wrist Curl","Forearms",[],"Barbell","Hypertrophy","Beginner","Extend the wrists upward with palms facing down."),
  ex("Farmer's Carry","Forearms",["Abs","Back"],"Dumbbell","Strength","Beginner","Carry heavy dumbbells at your sides for distance or time."),
  // Full body / Cardio
  ex("Burpees","Full Body",["Abs","Quads"],"Bodyweight","Cardio","Intermediate","Squat, kick back to a plank, push up, jump feet in, jump up."),
  ex("Kettlebell Swing","Full Body",["Glutes","Back"],"Kettlebell","Cardio","Intermediate","Hinge and swing the kettlebell to shoulder height using hip drive."),
  ex("Treadmill Run","Full Body",[],"Machine","Cardio","Beginner","Steady-state or interval running at a chosen pace and incline."),
  ex("Rowing Machine","Full Body",["Back","Quads"],"Machine","Cardio","Beginner","Drive with the legs, lean back, pull the handle to your torso."),
  ex("Jump Rope","Full Body",["Calves"],"Bodyweight","Cardio","Beginner","Skip continuously, staying light on your feet."),
  ex("Battle Ropes","Full Body",["Shoulders","Abs"],"Bodyweight","Cardio","Intermediate","Alternate slamming ropes up and down in a wave pattern."),
];

function food(name, brand, category, region, servingSize, servingUnit, cal, p, c, f, fiber, sugar, sodium, reliability) {
  return {
    id: (brand ? brand + "-" + name : name).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name, brand: brand || null, category, region, servingSize, servingUnit,
    calories: cal, protein: p, carbs: c, fat: f, fiber: fiber || 0, sugar: sugar || 0, sodium: sodium || 0,
    reliability, source: reliability === "verified" ? "Reference nutrition values (generic food)" : "Estimated — typical preparation",
  };
}

const FOODS = [
  food("Chicken breast, cooked",null,"Protein","Generic",100,"g",165,31,0,3.6,0,0,74,"verified"),
  food("Brown rice, cooked",null,"Grain","Generic",100,"g",112,2.6,23.5,0.9,1.8,0,4,"verified"),
  food("White rice, cooked",null,"Grain","Generic",100,"g",130,2.7,28,0.3,0.4,0,1,"verified"),
  food("Egg, large",null,"Protein","Generic",50,"piece",72,6.3,0.4,4.8,0,0.2,71,"verified"),
  food("Banana",null,"Fruit","Generic",118,"piece",105,1.3,27,0.4,3.1,14,1,"verified"),
  food("Apple",null,"Fruit","Generic",182,"piece",95,0.5,25,0.3,4.4,19,2,"verified"),
  food("Greek yogurt, plain",null,"Dairy","Generic",170,"cup",100,17,6,0.7,0,6,55,"verified"),
  food("Broccoli, steamed",null,"Vegetable","Generic",100,"g",35,2.4,7,0.4,3.3,1.7,33,"verified"),
  food("Sweet potato, baked",null,"Vegetable","Generic",150,"piece",129,2.3,30,0.2,4,9,53,"verified"),
  food("Oats, dry",null,"Grain","Generic",40,"g",150,5,27,3,4,1,0,"verified"),
  food("Almonds",null,"Snack","Generic",28,"oz",164,6,6,14,3.5,1.2,0,"verified"),
  food("Salmon, cooked",null,"Protein","Generic",100,"g",208,20,0,13,0,0,59,"verified"),
  food("Ground beef 90/10, cooked",null,"Protein","Generic",100,"g",217,26,0,12,0,0,75,"verified"),
  food("Whole milk",null,"Dairy","Generic",250,"ml",149,8,12,8,0,12,105,"verified"),
  food("Skim milk",null,"Dairy","Generic",250,"ml",90,9,12,0.5,0,12,103,"verified"),
  food("Peanut butter",null,"Snack","Generic",32,"tbsp",190,7,7,16,2,3,140,"verified"),
  food("Avocado",null,"Fruit","Generic",150,"piece",240,3,13,22,10,1,11,"verified"),
  food("Whole wheat bread",null,"Grain","Generic",28,"slice",69,3.6,12,1,2,1.5,132,"verified"),
  food("Protein shake, whey",null,"Protein","Generic",300,"ml",120,24,3,1.5,0.5,2,90,"verified"),
  food("Cottage cheese",null,"Dairy","Generic",226,"cup",163,28,6,2.3,0,6,819,"verified"),
  food("Spinach, raw",null,"Vegetable","Generic",100,"g",23,2.9,3.6,0.4,2.2,0.4,79,"verified"),
  food("Carrot, raw",null,"Vegetable","Generic",60,"piece",25,0.6,6,0.1,1.7,3,42,"verified"),
  food("Blueberries",null,"Fruit","Generic",100,"g",57,0.7,14,0.3,2.4,10,1,"verified"),
  food("Strawberries",null,"Fruit","Generic",100,"g",32,0.7,7.7,0.3,2,4.9,1,"verified"),
  food("Cucumber",null,"Vegetable","Generic",100,"g",15,0.7,3.6,0.1,0.5,1.7,2,"verified"),
  food("Bell pepper",null,"Vegetable","Generic",100,"g",31,1,6,0.3,2.1,4.2,4,"verified"),
  food("Tofu, firm",null,"Protein","Generic",100,"g",144,17,3,8,2,0.6,14,"verified"),
  food("Turkey breast, sliced",null,"Protein","Generic",100,"g",104,22,0,1,0,0,700,"verified"),
  food("Shrimp, cooked",null,"Protein","Generic",100,"g",99,24,0.2,0.3,0,0,190,"verified"),
  food("Tuna, canned in water",null,"Protein","Generic",100,"g",116,26,0,0.8,0,0,247,"verified"),
  food("Quinoa, cooked",null,"Grain","Generic",100,"g",120,4.4,21,1.9,2.8,0.9,7,"verified"),
  food("Lentils, cooked",null,"Legume","Generic",100,"g",116,9,20,0.4,7.9,1.8,2,"verified"),
  food("Black beans, cooked",null,"Legume","Generic",100,"g",132,8.9,24,0.5,8.7,0.3,2,"verified"),
  food("Hummus",null,"Snack","Generic",30,"tbsp",70,2,6,5,1.5,0.1,115,"verified"),
  food("Cheddar cheese",null,"Dairy","Generic",28,"g",113,7,0.4,9,0,0.1,174,"verified"),
  food("Butter",null,"Fat","Generic",14,"tbsp",102,0.1,0,11.5,0,0,82,"verified"),
  food("Olive oil",null,"Fat","Generic",14,"tbsp",119,0,0,13.5,0,0,0,"verified"),
  food("Almond milk, unsweetened",null,"Dairy","Generic",250,"ml",40,1,2,3,1,0,180,"verified"),
  food("Big Mac","McDonald's","Fast Food","USA",219,"burger",550,25,45,30,3,9,1010,"estimated"),
  food("Medium Fries","McDonald's","Fast Food","USA",117,"serving",340,4,44,16,4,0,260,"estimated"),
  food("Caffe Latte (Grande, 2% milk)","Starbucks","Drink","USA",473,"cup",190,13,19,7,0,17,170,"estimated"),
  food("Chicken Burrito Bowl","Chipotle","Fast Food","USA",500,"bowl",685,45,68,26,9,4,1580,"estimated"),
  food("6\" Turkey Sub","Subway","Fast Food","USA",230,"sandwich",280,18,46,3.5,4,7,760,"estimated"),
  food("Chicken rice (Hainanese)",null,"Regional Dish","Singapore",400,"plate",620,30,75,22,3,4,900,"estimated"),
  food("Nasi lemak with egg & sambal",null,"Regional Dish","Singapore",350,"plate",550,15,65,26,3,6,780,"estimated"),
  food("Pad Thai with chicken",null,"Regional Dish","Thailand",350,"plate",620,28,70,24,3,12,1100,"estimated"),
  food("Chicken ramen",null,"Regional Dish","Japan",500,"bowl",480,24,60,15,3,4,1800,"estimated"),
  food("California roll",null,"Regional Dish","Japan",250,"8 pieces",380,9,60,10,3,8,620,"estimated"),
  food("Beef tacos (3)",null,"Regional Dish","Mexico",300,"serving",510,26,42,26,6,4,780,"estimated"),
  food("Spaghetti bolognese",null,"Regional Dish","Italy",350,"plate",560,28,60,22,4,9,650,"estimated"),
  food("Margherita pizza slice",null,"Regional Dish","Italy",120,"slice",285,12,36,10,2,4,560,"estimated"),
  food("Butter chicken with rice",null,"Regional Dish","India",400,"plate",700,32,55,38,3,8,1200,"estimated"),
  food("Pho, beef noodle soup",null,"Regional Dish","Vietnam",500,"bowl",450,28,55,10,2,5,1450,"estimated"),
  food("Fried rice with egg",null,"Regional Dish","Generic",300,"plate",520,14,72,18,2,3,850,"estimated"),
  food("Caesar salad with chicken",null,"Salad","Generic",350,"bowl",480,35,15,30,3,3,900,"estimated"),
  food("Greek salad",null,"Salad","Greece",300,"bowl",280,7,14,22,4,7,650,"estimated"),
  food("Falafel wrap",null,"Regional Dish","Middle East",280,"wrap",520,15,65,22,8,5,780,"estimated"),
  food("Beef burger with cheese",null,"Fast Food","Generic",250,"burger",600,32,40,34,2,7,980,"estimated"),
  food("Protein bar",null,"Snack","Generic",60,"bar",220,20,22,8,8,6,180,"estimated"),
  food("Potato chips",null,"Snack","Generic",30,"g",160,2,15,10,1,0.2,170,"estimated"),
  food("Dark chocolate 70%",null,"Snack","Generic",30,"g",170,2,13,12,3,8,5,"verified"),
  food("Ice cream, vanilla",null,"Dessert","Generic",100,"g",207,3.5,24,11,0.7,21,80,"verified"),
  food("Cola",null,"Drink","Generic",355,"can",140,0,39,0,0,39,45,"verified"),
  food("Orange juice",null,"Drink","Generic",250,"cup",110,2,26,0.5,0.5,22,2,"verified"),
  food("Black coffee",null,"Drink","Generic",250,"cup",2,0.3,0,0,0,0,5,"verified"),
  food("Beer, regular",null,"Drink","Generic",355,"can",153,1.6,13,0,0,0,14,"verified"),
  food("Croissant",null,"Bakery","France",60,"piece",231,5,26,12,1.5,6,270,"estimated"),
  food("Granola bar",null,"Snack","Generic",35,"bar",140,3,20,5,2,8,95,"estimated"),
  // Singapore hawker & local favourites
  food("Laksa",null,"Regional Dish","Singapore",500,"bowl",600,20,55,32,4,8,1350,"estimated"),
  food("Char kway teow",null,"Regional Dish","Singapore",350,"plate",740,20,70,40,3,7,1500,"estimated"),
  food("Hokkien mee",null,"Regional Dish","Singapore",350,"plate",600,25,65,26,3,4,1200,"estimated"),
  food("Bak chor mee",null,"Regional Dish","Singapore",400,"bowl",550,28,65,18,3,5,1400,"estimated"),
  food("Wanton mee",null,"Regional Dish","Singapore",350,"bowl",500,22,60,18,3,4,1250,"estimated"),
  food("Roti prata with curry (2 pcs)",null,"Regional Dish","Singapore",200,"serving",450,8,55,20,2,3,700,"estimated"),
  food("Chwee kueh (5 pcs)",null,"Regional Dish","Singapore",200,"serving",280,6,45,8,2,3,650,"estimated"),
  food("Chai tow kway, white",null,"Regional Dish","Singapore",300,"plate",460,10,55,22,2,4,900,"estimated"),
  food("Satay, chicken (6 sticks w/ sauce)",null,"Regional Dish","Singapore",180,"serving",420,30,18,25,3,10,650,"estimated"),
  food("Rojak",null,"Regional Dish","Singapore",300,"plate",380,8,55,14,6,30,850,"estimated"),
  food("Mee goreng",null,"Regional Dish","Singapore",350,"plate",550,18,68,22,3,8,1000,"estimated"),
  food("Fish soup, sliced fish (no rice)",null,"Regional Dish","Singapore",450,"bowl",220,28,10,6,1,2,900,"estimated"),
  food("Bak kut teh",null,"Regional Dish","Singapore",400,"bowl",380,30,6,25,1,1,1600,"estimated"),
  food("Popiah",null,"Regional Dish","Singapore",150,"roll",220,6,32,7,3,6,500,"estimated"),
  food("Kaya toast set (2 slices)",null,"Regional Dish","Singapore",100,"set",350,7,45,15,1,18,420,"estimated"),
  food("Soft-boiled eggs (2, w/ soy sauce)",null,"Protein","Singapore",100,"serving",140,12,1,10,0,0.5,380,"estimated"),
  food("Curry puff",null,"Snack","Singapore",80,"piece",220,5,22,12,2,3,320,"estimated"),
  food("Ice kacang",null,"Dessert","Singapore",300,"bowl",300,3,65,3,1,45,80,"estimated"),
  food("Chendol",null,"Dessert","Singapore",250,"bowl",280,3,50,8,2,35,60,"estimated"),
  food("Teh tarik",null,"Drink","Singapore",250,"cup",130,3,20,4,0,18,60,"estimated"),
  food("Kopi",null,"Drink","Singapore",200,"cup",90,2,14,3,0,14,40,"estimated"),
  food("Nasi padang, mixed rice",null,"Regional Dish","Singapore",450,"plate",750,30,70,38,4,6,1400,"estimated"),
  food("Economy rice, 2 dishes",null,"Regional Dish","Singapore",400,"plate",600,25,70,22,3,5,1100,"estimated"),
  food("Prawn mee",null,"Regional Dish","Singapore",450,"bowl",480,24,60,15,2,4,1500,"estimated"),
  food("Yong tau foo, non-fried, w/ noodles",null,"Regional Dish","Singapore",400,"bowl",350,22,45,8,4,4,1300,"estimated"),
  food("Otah (2 pieces)",null,"Regional Dish","Singapore",100,"serving",160,12,6,10,1,3,420,"estimated"),
  food("Murtabak, chicken",null,"Regional Dish","Singapore",150,"slice",380,15,35,20,2,4,650,"estimated"),
  food("Fish head curry",null,"Regional Dish","Singapore",400,"serving",480,32,20,30,3,8,1300,"estimated"),
  food("Claypot rice, chicken & sausage",null,"Regional Dish","Singapore",400,"pot",650,25,80,24,3,6,1350,"estimated"),
  food("Char siu rice",null,"Regional Dish","Singapore",350,"plate",650,28,75,24,2,15,1200,"estimated"),
  food("Roast duck rice",null,"Regional Dish","Singapore",350,"plate",600,25,65,26,2,5,1100,"estimated"),
  food("Har gow, dim sum (4 pcs)",null,"Regional Dish","Singapore",120,"serving",180,8,22,6,1,1,420,"estimated"),
  food("Nasi briyani, chicken",null,"Regional Dish","Singapore",450,"plate",720,32,85,26,3,5,1100,"estimated"),
];

/* ---------------------------- UTILITIES ---------------------------------- */
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
const todayStr = () => new Date().toISOString().slice(0, 10);
const dateLabel = (d) => {
  const today = todayStr();
  const yest = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (d === today) return "Today";
  if (d === yest) return "Yesterday";
  return new Date(d + "T00:00:00").toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
};
const round1 = (n) => Math.round(n * 10) / 10;
const kgToLb = (kg) => kg * 2.20462;
const lbToKg = (lb) => lb / 2.20462;
const cmToFtIn = (cm) => { const totalIn = cm / 2.54; const ft = Math.floor(totalIn / 12); const inch = Math.round(totalIn % 12); return { ft, inch }; };
const ftInToCm = (ft, inch) => (ft * 12 + inch) * 2.54;
const fmtWeight = (kg, units) => units === "imperial" ? `${round1(kgToLb(kg))} lb` : `${round1(kg)} kg`;

function calcBMR({ sex, weightKg, heightCm, age }) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  if (sex === "male") return Math.round(base + 5);
  if (sex === "female") return Math.round(base - 161);
  return Math.round(base - 78);
}
function calcTargets(profile) {
  const bmr = calcBMR(profile);
  const activity = ACTIVITY_LEVELS.find((a) => a.id === profile.activityLevel) || ACTIVITY_LEVELS[1];
  const tdee = Math.round(bmr * activity.factor);
  const goal = GOALS.find((g) => g.id === profile.goal) || GOALS[1];
  let calories = Math.round(tdee * (1 + goal.calAdj));
  const minSafe = profile.sex === "male" ? 1500 : 1200;
  calories = Math.max(calories, minSafe);
  const protein = Math.round(goal.proteinPerKg * profile.weightKg);
  const fat = Math.round((calories * 0.25) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
  const weeklyDeltaKg = round1(((calories - tdee) * 7) / 7700);
  return { bmr, tdee, calories, protein, carbs, fat, weeklyDeltaKg, goal };
}
function estimate1RM(weight, reps) {
  if (!weight || !reps) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

/* ---------------------------- STORAGE KEYS -------------------------------- */
const KEYS = {
  profile: "rework:profile",
  foodlog: "rework:foodlog",
  customFoods: "rework:customFoods",
  favorites: "rework:favorites",
  routines: "rework:routines",
  sessions: "rework:sessions",
  measurements: "rework:measurements",
};
async function loadKey(key, fallback) {
  return storageLoadKey(key, fallback);
}
async function saveKey(key, value) {
  return storageSaveKey(key, value);
}

/* ---------------------------- SMALL UI PRIMITIVES -------------------------- */
function Ring({ pct, size = 116, stroke = 10, color, children }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, pct || 0));
  const offset = c - clamped * c;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--track)" strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.7s cubic-bezier(.2,.8,.2,1)" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0 }} className="flex items-center justify-center">{children}</div>
    </div>
  );
}
function MacroBar({ label, value, target, unit, color }) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between items-baseline mb-1.5">
        <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{label}</span>
        <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{Math.round(value)}<span style={{ color: "var(--text-tertiary)" }}>/{Math.round(target)}{unit}</span></span>
      </div>
      <div className="w-full rounded-full overflow-hidden" style={{ height: 7, background: "var(--track)" }}>
        <div style={{ width: `${pct}%`, background: color, height: "100%", borderRadius: 999, transition: "width .5s ease" }} />
      </div>
    </div>
  );
}
function Card({ children, className = "", style = {}, onClick }) {
  return (
    <div onClick={onClick} className={`rw-card rounded-2xl ${className}`} style={style}>
      {children}
    </div>
  );
}
function Sheet({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center" style={{ background: "rgba(10,10,12,0.55)" }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className={`rw-fade-up w-full ${wide ? "md:max-w-2xl" : "md:max-w-md"} md:rounded-3xl rounded-t-3xl flex flex-col`}
        style={{ background: "var(--bg)", maxHeight: "88vh", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
          <h3 className="rw-display font-semibold text-lg">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-full" style={{ background: "var(--card-alt)" }}><X size={18} /></button>
        </div>
        <div className="overflow-y-auto rw-scroll px-5 py-4">{children}</div>
      </div>
    </div>
  );
}
function EmptyState({ title, sub, actionLabel, onAction, icon }) {
  return (
    <div className="flex flex-col items-center text-center py-12 px-6">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "var(--card-alt)", color: "var(--primary)" }}>
        {icon}
      </div>
      <p className="rw-display font-semibold text-base mb-1">{title}</p>
      <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>{sub}</p>
      {actionLabel && (
        <button onClick={onAction} className="rw-btn-primary px-5 py-2.5 rounded-full text-sm font-semibold">{actionLabel}</button>
      )}
    </div>
  );
}
function Pill({ active, children, onClick }) {
  return (
    <button onClick={onClick} className="px-3.5 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 transition"
      style={active
        ? { background: "var(--primary)", color: "#fff" }
        : { background: "var(--card-alt)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
      {children}
    </button>
  );
}
function SectionTitle({ children, right }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="rw-display font-semibold text-base">{children}</h2>
      {right}
    </div>
  );
}
function Field({ label, children }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-secondary)" }}>{label}</label>
      {children}
    </div>
  );
}
function TextInput(props) {
  return <input {...props} className={`rw-input w-full rounded-xl px-3.5 py-2.5 text-sm ${props.className || ""}`} />;
}

/* ============================================================================
   ONBOARDING
============================================================================ */
function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    name: "", age: "", sex: "male", heightCm: "", weightKg: "",
    activityLevel: "moderate", goal: "maintain", targetWeightKg: "",
    units: "metric", trainingFreq: "4", workoutDuration: "45",
  });
  const set = (k, v) => setData((d) => ({ ...d, [k]: v }));
  const steps = ["Welcome", "About you", "Body stats", "Activity", "Goal", "Summary"];
  const canNext = () => {
    if (step === 1) return data.name.trim().length > 0 && data.age;
    if (step === 2) return data.heightCm && data.weightKg;
    return true;
  };
  const preview = useMemo(() => {
    if (!data.heightCm || !data.weightKg || !data.age) return null;
    return calcTargets({ sex: data.sex, weightKg: parseFloat(data.weightKg), heightCm: parseFloat(data.heightCm), age: parseFloat(data.age), activityLevel: data.activityLevel, goal: data.goal });
  }, [data]);

  const heightImperial = cmToFtIn(parseFloat(data.heightCm) || 0);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <div className="flex items-center gap-2 px-6 pt-8 pb-2 flex-wrap">
        {steps.map((s, i) => (
          <div key={s} className="h-1.5 rounded-full flex-1" style={{ minWidth: 20, background: i <= step ? "var(--primary)" : "var(--track)", transition: "background .3s" }} />
        ))}
      </div>
      <div className="flex-1 px-6 py-6 max-w-lg mx-auto w-full">
        {step === 0 && (
          <div className="rw-fade-up flex flex-col items-center text-center pt-10">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6" style={{ background: "linear-gradient(135deg, var(--primary), var(--secondary))" }}>
              <Zap size={36} color="#fff" />
            </div>
            <h1 className="rw-display font-bold text-3xl mb-2">Welcome to Rework</h1>
            <p className="text-base mb-1" style={{ color: "var(--text-secondary)" }}>Eat. Train. Rework.</p>
            <p className="text-sm mt-4" style={{ color: "var(--text-secondary)" }}>Let's set up your targets. Takes about a minute — you can change any of this later in Profile.</p>
          </div>
        )}
        {step === 1 && (
          <div className="rw-fade-up">
            <h2 className="rw-display font-bold text-2xl mb-1">About you</h2>
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>This helps us calculate your baseline energy needs.</p>
            <Field label="Name"><TextInput placeholder="Your name" value={data.name} onChange={(e) => set("name", e.target.value)} /></Field>
            <Field label="Age"><TextInput type="number" placeholder="28" value={data.age} onChange={(e) => set("age", e.target.value)} /></Field>
            <Field label="Sex (used for BMR calculation)">
              <div className="flex gap-2">
                {["male", "female", "other"].map((s) => (
                  <Pill key={s} active={data.sex === s} onClick={() => set("sex", s)}>{s[0].toUpperCase() + s.slice(1)}</Pill>
                ))}
              </div>
            </Field>
          </div>
        )}
        {step === 2 && (
          <div className="rw-fade-up">
            <h2 className="rw-display font-bold text-2xl mb-1">Body stats</h2>
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>Used to calculate your calorie and macro targets.</p>
            <Field label="Units">
              <div className="flex gap-2">
                <Pill active={data.units === "metric"} onClick={() => set("units", "metric")}>Metric (kg/cm)</Pill>
                <Pill active={data.units === "imperial"} onClick={() => set("units", "imperial")}>Imperial (lb/ft)</Pill>
              </div>
            </Field>
            {data.units === "metric" ? (
              <>
                <Field label="Height (cm)"><TextInput type="number" placeholder="175" value={data.heightCm} onChange={(e) => set("heightCm", e.target.value)} /></Field>
                <Field label="Weight (kg)"><TextInput type="number" placeholder="72" value={data.weightKg} onChange={(e) => set("weightKg", e.target.value)} /></Field>
              </>
            ) : (
              <>
                <Field label="Height (ft / in)">
                  <div className="flex gap-2">
                    <TextInput type="number" placeholder="5" value={heightImperial.ft || ""} onChange={(e) => set("heightCm", String(ftInToCm(parseFloat(e.target.value) || 0, heightImperial.inch)))} />
                    <TextInput type="number" placeholder="9" value={heightImperial.inch || ""} onChange={(e) => set("heightCm", String(ftInToCm(heightImperial.ft, parseFloat(e.target.value) || 0)))} />
                  </div>
                </Field>
                <Field label="Weight (lb)"><TextInput type="number" placeholder="160" value={data.weightKg ? round1(kgToLb(parseFloat(data.weightKg))) : ""} onChange={(e) => set("weightKg", String(lbToKg(parseFloat(e.target.value) || 0)))} /></Field>
              </>
            )}
          </div>
        )}
        {step === 3 && (
          <div className="rw-fade-up">
            <h2 className="rw-display font-bold text-2xl mb-1">Activity level</h2>
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>How active are you outside of workouts?</p>
            <div className="flex flex-col gap-2">
              {ACTIVITY_LEVELS.map((a) => (
                <button key={a.id} onClick={() => set("activityLevel", a.id)} className="text-left px-4 py-3 rounded-xl flex items-center justify-between"
                  style={{ background: data.activityLevel === a.id ? "var(--primary)" : "var(--card-alt)", border: "1px solid " + (data.activityLevel === a.id ? "var(--primary)" : "var(--border)") }}>
                  <div>
                    <p className="font-semibold text-sm" style={{ color: data.activityLevel === a.id ? "#fff" : "var(--text-primary)" }}>{a.label}</p>
                    <p className="text-xs" style={{ color: data.activityLevel === a.id ? "rgba(255,255,255,0.85)" : "var(--text-secondary)" }}>{a.desc}</p>
                  </div>
                  {data.activityLevel === a.id && <Check size={18} color="#fff" />}
                </button>
              ))}
            </div>
          </div>
        )}
        {step === 4 && (
          <div className="rw-fade-up">
            <h2 className="rw-display font-bold text-2xl mb-1">Your goal</h2>
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>We'll tailor calorie and macro targets to this.</p>
            <div className="grid grid-cols-2 gap-2">
              {GOALS.map((g) => (
                <button key={g.id} onClick={() => set("goal", g.id)} className="text-left px-4 py-3.5 rounded-xl"
                  style={{ background: data.goal === g.id ? "var(--primary)" : "var(--card-alt)", border: "1px solid " + (data.goal === g.id ? "var(--primary)" : "var(--border)") }}>
                  <p className="text-lg mb-1">{g.icon}</p>
                  <p className="font-semibold text-sm" style={{ color: data.goal === g.id ? "#fff" : "var(--text-primary)" }}>{g.label}</p>
                  <p className="text-xs" style={{ color: data.goal === g.id ? "rgba(255,255,255,0.85)" : "var(--text-secondary)" }}>{g.sub}</p>
                </button>
              ))}
            </div>
            <Field label="Training days per week (optional)"><TextInput type="number" value={data.trainingFreq} onChange={(e) => set("trainingFreq", e.target.value)} /></Field>
          </div>
        )}
        {step === 5 && preview && (
          <div className="rw-fade-up">
            <h2 className="rw-display font-bold text-2xl mb-1">Your targets</h2>
            <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>Based on Mifflin-St Jeor. These are estimates, not medical advice — adjust anytime in Profile.</p>
            <Card className="p-5 mb-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Daily calorie target</p>
                  <p className="rw-display font-bold text-3xl">{preview.calories.toLocaleString()} <span className="text-base font-medium" style={{ color: "var(--text-secondary)" }}>kcal</span></p>
                </div>
                <div className="text-right">
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Est. weekly change</p>
                  <p className="font-semibold" style={{ color: preview.weeklyDeltaKg < 0 ? "var(--success)" : preview.weeklyDeltaKg > 0 ? "var(--primary)" : "var(--text-primary)" }}>
                    {preview.weeklyDeltaKg > 0 ? "+" : ""}{preview.weeklyDeltaKg} kg/wk
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="rounded-xl p-3" style={{ background: "var(--card-alt)" }}>
                  <p className="text-xs mb-0.5" style={{ color: "var(--protein)" }}>Protein</p>
                  <p className="font-bold text-sm">{preview.protein}g</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: "var(--card-alt)" }}>
                  <p className="text-xs mb-0.5" style={{ color: "var(--carbs)" }}>Carbs</p>
                  <p className="font-bold text-sm">{preview.carbs}g</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: "var(--card-alt)" }}>
                  <p className="text-xs mb-0.5" style={{ color: "var(--fat)" }}>Fat</p>
                  <p className="font-bold text-sm">{preview.fat}g</p>
                </div>
              </div>
              <div className="flex justify-between text-xs" style={{ color: "var(--text-secondary)" }}>
                <span>BMR: {preview.bmr} kcal</span>
                <span>TDEE: {preview.tdee} kcal</span>
              </div>
            </Card>
            <p className="text-xs text-center" style={{ color: "var(--text-tertiary)" }}>These figures are estimates for general fitness purposes only.</p>
          </div>
        )}
      </div>
      <div className="px-6 pb-8 pt-2 flex gap-3 max-w-lg mx-auto w-full">
        {step > 0 && (
          <button onClick={() => setStep(step - 1)} className="px-5 py-3 rounded-full font-semibold text-sm" style={{ background: "var(--card-alt)", border: "1px solid var(--border)" }}>Back</button>
        )}
        <button
          disabled={!canNext()}
          onClick={() => {
            if (step === steps.length - 1) {
              onComplete({ ...data, age: parseFloat(data.age), heightCm: parseFloat(data.heightCm), weightKg: parseFloat(data.weightKg), targetWeightKg: data.targetWeightKg ? parseFloat(data.targetWeightKg) : null });
            } else setStep(step + 1);
          }}
          className="rw-btn-primary flex-1 py-3 rounded-full font-semibold text-sm disabled:opacity-40"
        >
          {step === steps.length - 1 ? "Start using Rework" : "Continue"}
        </button>
      </div>
    </div>
  );
}

/* ============================================================================
   NAVIGATION
============================================================================ */
const TABS = [
  { id: "home", label: "Home", icon: HomeIcon },
  { id: "nutrition", label: "Nutrition", icon: Utensils },
  { id: "workouts", label: "Workouts", icon: Dumbbell },
  { id: "progress", label: "Progress", icon: TrendingUp },
  { id: "profile", label: "Profile", icon: User },
];
function BottomNav({ tab, setTab }) {
  return (
    <div className="rw-bottom-nav md:hidden fixed bottom-0 left-0 right-0 z-30 flex justify-around items-center px-2"
      style={{ background: "var(--nav-bg)", backdropFilter: "blur(16px)", borderTop: "1px solid var(--border)", height: 64 }}>
      {TABS.map((t) => {
        const Icon = t.icon;
        const active = tab === t.id;
        return (
          <button key={t.id} onClick={() => setTab(t.id)} className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full">
            <Icon size={22} strokeWidth={active ? 2.5 : 2} color={active ? "var(--primary)" : "var(--text-tertiary)"} />
            <span className="rw-fs-10 font-medium" style={{ color: active ? "var(--primary)" : "var(--text-tertiary)" }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}
function Sidebar({ tab, setTab, profile }) {
  return (
    <div className="hidden md:flex flex-col w-60 flex-shrink-0 h-screen sticky top-0 px-4 py-6" style={{ borderRight: "1px solid var(--border)" }}>
      <div className="flex items-center gap-2.5 px-2 mb-8">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--primary), var(--secondary))" }}>
          <Zap size={18} color="#fff" />
        </div>
        <span className="rw-display font-bold text-lg">Rework</span>
      </div>
      <div className="flex flex-col gap-1">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition"
              style={{ background: active ? "var(--card-alt)" : "transparent", color: active ? "var(--primary)" : "var(--text-secondary)" }}>
              <Icon size={19} />{t.label}
            </button>
          );
        })}
      </div>
      <div className="mt-auto px-2">
        <div className="flex items-center gap-2.5 py-3" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs" style={{ background: "var(--primary)", color: "#fff" }}>
            {(profile.name || "?")[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{profile.name}</p>
            <p className="text-xs truncate" style={{ color: "var(--text-tertiary)" }}>{GOALS.find(g => g.id === profile.goal)?.label}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
function TopBar({ title, right }) {
  return (
    <div className="hidden md:flex items-center justify-between px-8 pt-8 pb-2">
      <h1 className="rw-display font-bold text-2xl">{title}</h1>
      <div>{right}</div>
    </div>
  );
}

/* ============================================================================
   HOME
============================================================================ */
function Home({ profile, foodLog, routines, sessions, measurements, setTab, openFoodSearch, startWorkout, openPhotoLog }) {
  const today = todayStr();
  const todayLog = foodLog[today] || { breakfast: [], lunch: [], dinner: [], snacks: [] };
  const totals = useMemo(() => {
    const all = [...todayLog.breakfast, ...todayLog.lunch, ...todayLog.dinner, ...todayLog.snacks];
    return all.reduce((acc, e) => ({ calories: acc.calories + e.calories, protein: acc.protein + e.protein, carbs: acc.carbs + e.carbs, fat: acc.fat + e.fat }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [todayLog]);
  const remaining = Math.max(0, profile.calorieTarget - totals.calories);
  const pct = profile.calorieTarget > 0 ? totals.calories / profile.calorieTarget : 0;

  const suggestedRoutine = useMemo(() => {
    if (!routines.length) return null;
    const sorted = [...routines].sort((a, b) => (b.lastUsed || "").localeCompare(a.lastUsed || ""));
    return sorted[0];
  }, [routines]);

  const recentFoods = useMemo(() => {
    const dates = Object.keys(foodLog).sort().reverse().slice(0, 7);
    const items = [];
    for (const d of dates) {
      const day = foodLog[d];
      for (const meal of ["breakfast", "lunch", "dinner", "snacks"]) {
        for (const e of (day[meal] || [])) items.push(e);
      }
    }
    const seen = new Map();
    for (const it of items.slice().reverse()) if (!seen.has(it.name)) seen.set(it.name, it);
    return Array.from(seen.values()).slice(0, 6);
  }, [foodLog]);

  const weekData = useMemo(() => {
    const arr = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
      const day = foodLog[d] || { breakfast: [], lunch: [], dinner: [], snacks: [] };
      const cals = [...day.breakfast, ...day.lunch, ...day.dinner, ...day.snacks].reduce((s, e) => s + e.calories, 0);
      const trained = sessions.some((s) => s.date === d);
      arr.push({ date: d.slice(5), cals, trained });
    }
    return arr;
  }, [foodLog, sessions]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="px-5 md:px-8 pb-28 md:pb-10 pt-6 md:pt-2 max-w-5xl mx-auto">
      <h1 className="rw-display font-bold text-2xl mb-5 md:hidden">{greeting()}, {profile.name?.split(" ")[0]}</h1>
      <p className="hidden md:block text-sm mb-6" style={{ color: "var(--text-secondary)" }}>{greeting()}, {profile.name?.split(" ")[0]}. Here's today.</p>

      <div className="grid md:grid-cols-3 gap-4 mb-5">
        <Card className="p-5 md:col-span-1">
          <div className="flex items-center gap-5">
            <Ring pct={pct} color="var(--primary)" size={104} stroke={9}>
              <div className="text-center">
                <p className="rw-display font-bold text-xl leading-none">{remaining.toLocaleString()}</p>
                <p className="rw-fs-10 mt-1" style={{ color: "var(--text-tertiary)" }}>left</p>
              </div>
            </Ring>
            <div className="flex-1">
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Calories</p>
              <p className="font-bold text-lg mb-2">{totals.calories.toLocaleString()} <span className="text-sm font-medium" style={{ color: "var(--text-tertiary)" }}>/ {profile.calorieTarget.toLocaleString()}</span></p>
              <button onClick={openFoodSearch} className="flex items-center gap-1 text-xs font-semibold" style={{ color: "var(--primary)" }}><Plus size={14} />Log food</button>
            </div>
          </div>
        </Card>

        <Card className="p-5 md:col-span-1 flex flex-col justify-center gap-3">
          <MacroBar label="Protein" value={totals.protein} target={profile.macroTargets.protein} unit="g" color="var(--protein)" />
          <MacroBar label="Carbs" value={totals.carbs} target={profile.macroTargets.carbs} unit="g" color="var(--carbs)" />
          <MacroBar label="Fat" value={totals.fat} target={profile.macroTargets.fat} unit="g" color="var(--fat)" />
        </Card>

        <Card className="p-5 md:col-span-1 flex flex-col justify-between">
          <div>
            <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>{suggestedRoutine ? "Suggested workout" : "No routines yet"}</p>
            <p className="font-bold text-lg">{suggestedRoutine ? suggestedRoutine.name : "Build a routine"}</p>
            {suggestedRoutine && <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{suggestedRoutine.exercises.length} exercises</p>}
          </div>
          <button onClick={() => { setTab("workouts"); if (suggestedRoutine) startWorkout(suggestedRoutine); }}
            className="rw-btn-primary mt-3 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5">
            <Play size={15} fill="#fff" />{suggestedRoutine ? "Start Workout" : "Go to Workouts"}
          </button>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
        {[
          { label: "Log Food", icon: Utensils, action: openFoodSearch },
          { label: "Scan Food", icon: Camera, action: openPhotoLog },
          { label: "Start Workout", icon: Dumbbell, action: () => setTab("workouts") },
          { label: "Add Weight", icon: Scale, action: () => setTab("progress") },
          { label: "View Progress", icon: TrendingUp, action: () => setTab("progress") },
        ].map((qa) => (
          <button key={qa.label} onClick={qa.action} className="rw-card rounded-2xl p-4 flex flex-col items-center gap-2 text-center">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "var(--card-alt)", color: "var(--primary)" }}>
              <qa.icon size={18} />
            </div>
            <span className="text-xs font-semibold">{qa.label}</span>
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5">
          <SectionTitle right={<span className="text-xs" style={{ color: "var(--text-tertiary)" }}>Last 7 days</span>}>Weekly overview</SectionTitle>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={weekData}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--text-tertiary)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }} />
              <RBar dataKey="cals" radius={[6, 6, 0, 0]} fill="var(--primary)" />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-1.5 mt-2">
            {weekData.map((d, i) => (
              <div key={i} className="flex-1 h-1 rounded-full" style={{ background: d.trained ? "var(--success)" : "var(--track)" }} title={d.trained ? "Trained" : ""} />
            ))}
          </div>
          <p className="rw-fs-10 mt-1.5" style={{ color: "var(--text-tertiary)" }}>Green bar = workout day</p>
        </Card>

        <Card className="p-5">
          <SectionTitle>Recent foods</SectionTitle>
          {recentFoods.length === 0 ? (
            <p className="text-sm py-6 text-center" style={{ color: "var(--text-tertiary)" }}>Nothing logged yet — start by logging a meal.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {recentFoods.map((f, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{f.name}</p>
                    <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{f.qty} {f.unit}</p>
                  </div>
                  <span className="text-xs font-semibold flex-shrink-0" style={{ color: "var(--text-secondary)" }}>{Math.round(f.calories)} kcal</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

/* ============================================================================
   NUTRITION
============================================================================ */
function scaleFood(f, qty) {
  const ratio = qty / f.servingSize;
  return {
    calories: Math.round(f.calories * ratio), protein: round1(f.protein * ratio),
    carbs: round1(f.carbs * ratio), fat: round1(f.fat * ratio), fiber: round1((f.fiber || 0) * ratio),
    sugar: round1((f.sugar || 0) * ratio), sodium: Math.round((f.sodium || 0) * ratio),
  };
}

function reliabilityLabel(r) {
  if (r === "estimated") return "Estimated";
  if (r === "usda") return "USDA · Live";
  if (r === "live") return "Live · Open Food Facts";
  if (r === "user-entered") return "Custom";
  return "Reference";
}

// Maps a raw Open Food Facts product record onto Rework's internal food shape.
// Values are per 100g/100ml as returned by the API, so servingSize is fixed at 100.
function mapOFFProduct(p) {
  const n = p.nutriments || {};
  let kcal = n["energy-kcal_100g"];
  if (kcal == null && n["energy_100g"] != null) kcal = n["energy_100g"] / 4.184; // kJ -> kcal fallback
  if (kcal == null || isNaN(kcal)) return null;
  const name = (p.product_name || "").trim();
  if (!name) return null;
  return {
    id: "off-" + (p.code || p._id || name),
    name: name.length > 70 ? name.slice(0, 70) + "…" : name,
    brand: p.brands ? p.brands.split(",")[0].trim() : null,
    category: "Live result", region: "Open Food Facts",
    servingSize: 100, servingUnit: "g",
    calories: Math.round(kcal), protein: round1(n["proteins_100g"] || 0),
    carbs: round1(n["carbohydrates_100g"] || 0), fat: round1(n["fat_100g"] || 0),
    fiber: round1(n["fiber_100g"] || 0), sugar: round1(n["sugars_100g"] || 0),
    sodium: Math.round((n["sodium_100g"] || 0) * 1000),
    reliability: "live", source: "Open Food Facts (community database), per 100g",
  };
}

// Barcode scanning (free, no API key): decode a product barcode with the
// device camera client-side, then look the code up in Open Food Facts. This
// is more accurate than any photo estimate for packaged goods -- it reads the
// actual label. The result is shaped into the SAME object the photo/AI flow
// produces, so both feed the one editable review screen in PhotoLogSheet.
async function lookupBarcode(code) {
  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=code,product_name,brands,serving_size,nutriments`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("bad response");
  const data = await res.json();
  if (!data || data.status === 0 || !data.product) return null;
  return offProductToScanResult(data.product);
}

function offProductToScanResult(p) {
  const n = p.nutriments || {};
  const num = (v) => (typeof v === "number" && !isNaN(v) ? v : null);
  const kcalServing = num(n["energy-kcal_serving"]);
  const kcal100 = num(n["energy-kcal_100g"]) != null
    ? num(n["energy-kcal_100g"])
    : (num(n["energy_100g"]) != null ? n["energy_100g"] / 4.184 : null);
  // Prefer per-serving values (closer to what you actually eat); else per 100g.
  let calories, protein, carbs, fat, servingDescription;
  if (kcalServing != null) {
    calories = kcalServing;
    protein = num(n["proteins_serving"]) || 0;
    carbs = num(n["carbohydrates_serving"]) || 0;
    fat = num(n["fat_serving"]) || 0;
    servingDescription = p.serving_size ? `1 serving (${p.serving_size})` : "1 serving";
  } else {
    if (kcal100 == null) return null;
    calories = kcal100;
    protein = num(n["proteins_100g"]) || 0;
    carbs = num(n["carbohydrates_100g"]) || 0;
    fat = num(n["fat_100g"]) || 0;
    servingDescription = "per 100 g — adjust to your portion below";
  }
  const name = (p.product_name || "").trim();
  if (!name) return null;
  const brand = p.brands ? p.brands.split(",")[0].trim() : "";
  return {
    foodName: brand ? `${name} · ${brand}` : name,
    servingDescription,
    calories: Math.round(calories),
    protein: round1(protein),
    carbs: round1(carbs),
    fat: round1(fat),
    confidence: "high",
    notes: "Read from the product label via Open Food Facts — adjust the amount if you ate more or less than one serving.",
  };
}

// USDA's /foods/search endpoint returns nutrients as a flat array keyed by
// nutrientNumber (a stable USDA code), not by name -- name is used only as a fallback.
function findUSDANutrient(foodNutrients, number, nameSubstr) {
  if (!foodNutrients) return 0;
  let hit = foodNutrients.find((n) => n.nutrientNumber === number);
  if (!hit && nameSubstr) hit = foodNutrients.find((n) => (n.nutrientName || "").toLowerCase().includes(nameSubstr));
  return hit && typeof hit.value === "number" ? hit.value : 0;
}
// Maps a raw USDA FoodData Central search result onto Rework's internal food shape.
// Foundation/SR Legacy/Survey nutrient values are per 100g, so servingSize is fixed at 100.
function mapUSDAFood(item) {
  const fn = item.foodNutrients || [];
  const kcal = findUSDANutrient(fn, "208", "energy");
  const name = (item.description || "").trim();
  if (!name || !kcal) return null;
  return {
    id: "usda-" + item.fdcId,
    name: name.length > 70 ? name.slice(0, 70) + "…" : name,
    brand: item.brandOwner || null,
    category: item.dataType || "USDA", region: "USDA",
    servingSize: 100, servingUnit: "g",
    calories: Math.round(kcal), protein: round1(findUSDANutrient(fn, "203", "protein")),
    carbs: round1(findUSDANutrient(fn, "205", "carbohydrate")), fat: round1(findUSDANutrient(fn, "204", "total lipid")),
    fiber: round1(findUSDANutrient(fn, "291", "fiber")), sugar: round1(findUSDANutrient(fn, "269", "sugars")),
    sodium: Math.round(findUSDANutrient(fn, "307", "sodium")),
    reliability: "usda", source: "USDA FoodData Central (" + (item.dataType || "reference") + "), per 100g",
  };
}

function FoodRow({ f, onPick }) {
  const badge = f.custom ? { label: "Custom", color: "var(--secondary)" }
    : f.reliability === "usda" ? { label: "USDA", color: "var(--primary)" }
    : f.reliability === "live" ? { label: "Live", color: "var(--success)" }
    : null;
  return (
    <button onClick={() => onPick(f)} className="flex items-center justify-between px-3 py-3 rounded-xl text-left w-full" style={{ borderBottom: "1px solid var(--border)" }}>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium truncate">{f.name}</p>
          {badge && <span className="rw-fs-9 px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: "var(--card-alt)", color: badge.color }}>{badge.label}</span>}
        </div>
        <p className="text-xs truncate" style={{ color: "var(--text-tertiary)" }}>{f.brand ? f.brand + " · " : ""}{f.servingSize}{f.servingUnit === "g" || f.servingUnit === "ml" ? f.servingUnit : " " + f.servingUnit} · {reliabilityLabel(f.reliability)}</p>
      </div>
      <span className="text-xs font-semibold flex-shrink-0 ml-2" style={{ color: "var(--text-secondary)" }}>{f.calories} kcal</span>
    </button>
  );
}

function FoodSearchSheet({ onClose, foods, customFoods, onPick, favorites, onCreateCustom }) {
  const [q, setQ] = useState("");
  const [region, setRegion] = useState("All");
  const [liveResults, setLiveResults] = useState([]);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState(false);
  const [usdaResults, setUsdaResults] = useState([]);
  const [usdaLoading, setUsdaLoading] = useState(false);
  const [usdaError, setUsdaError] = useState(false);
  const [usdaNoKey, setUsdaNoKey] = useState(false);

  const regions = useMemo(() => {
    const priority = ["Singapore", "Generic"];
    const set = new Set();
    [...customFoods, ...foods].forEach((f) => set.add(f.region || "Generic"));
    const arr = Array.from(set).sort((a, b) => {
      const pa = priority.indexOf(a), pb = priority.indexOf(b);
      if (pa !== -1 || pb !== -1) return (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb);
      return a.localeCompare(b);
    });
    return ["All", ...arr];
  }, [foods, customFoods]);

  const results = useMemo(() => {
    const all = [...customFoods.map(f => ({ ...f, custom: true })), ...foods];
    let pool = region === "All" ? all : all.filter((f) => (f.region || "Generic") === region);
    if (!q.trim()) {
      const favSet = new Set(favorites);
      const favs = pool.filter((f) => favSet.has(f.id));
      return favs.length ? favs : pool.slice(0, 24);
    }
    const query = q.toLowerCase();
    return pool.filter((f) => f.name.toLowerCase().includes(query) || (f.brand && f.brand.toLowerCase().includes(query)) || (f.category && f.category.toLowerCase().includes(query)) || (f.region && f.region.toLowerCase().includes(query))).slice(0, 40);
  }, [q, region, foods, customFoods, favorites]);

  // Debounced live lookups against USDA FoodData Central and Open Food Facts,
  // run in parallel. Gated by LIVE_SEARCH_ENABLED (see note near that constant).
  useEffect(() => {
    if (!LIVE_SEARCH_ENABLED || !q.trim() || q.trim().length < 2) {
      setLiveResults([]); setLiveLoading(false); setLiveError(false);
      setUsdaResults([]); setUsdaLoading(false); setUsdaError(false); setUsdaNoKey(false);
      return;
    }
    let cancelled = false;
    setLiveLoading(true); setLiveError(false);
    setUsdaLoading(true); setUsdaError(false); setUsdaNoKey(false);
    const handle = setTimeout(async () => {
      const query = q.trim();
      (async () => {
        try {
          const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=15`;
          const res = await fetch(url);
          if (!res.ok) throw new Error("bad response");
          const data = await res.json();
          if (cancelled) return;
          setLiveResults((data.products || []).map(mapOFFProduct).filter(Boolean).slice(0, 10));
        } catch (e) {
          if (!cancelled) { setLiveError(true); setLiveResults([]); }
        } finally {
          if (!cancelled) setLiveLoading(false);
        }
      })();
      (async () => {
        if (!USDA_API_KEY) { if (!cancelled) { setUsdaLoading(false); setUsdaNoKey(true); } return; }
        try {
          const url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${USDA_API_KEY}&query=${encodeURIComponent(query)}&pageSize=10&dataType=${encodeURIComponent(USDA_DATA_TYPES)}`;
          const res = await fetch(url);
          if (!res.ok) throw new Error("bad response");
          const data = await res.json();
          if (cancelled) return;
          setUsdaResults((data.foods || []).map(mapUSDAFood).filter(Boolean).slice(0, 10));
        } catch (e) {
          if (!cancelled) { setUsdaError(true); setUsdaResults([]); }
        } finally {
          if (!cancelled) setUsdaLoading(false);
        }
      })();
    }, 450);
    return () => { cancelled = true; clearTimeout(handle); };
  }, [q]);

  return (
    <Sheet title="Log food" onClose={onClose} wide>
      <div className="relative mb-2">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
        <TextInput autoFocus placeholder="Search foods, brands, dishes..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" />
      </div>
      {LIVE_SEARCH_ENABLED && <p className="rw-fs-11 mb-3" style={{ color: "var(--text-tertiary)" }}>Also searches USDA FoodData Central and Open Food Facts live.</p>}
      {regions.length > 2 && (
        <div className="flex gap-2 mb-3 overflow-x-auto rw-scroll pb-1">
          {regions.map((r) => <Pill key={r} active={region === r} onClick={() => setRegion(r)}>{r}</Pill>)}
        </div>
      )}
      {!q.trim() && <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>{favorites.length ? "Your favorites" : "Popular"}</p>}
      <div className="flex flex-col gap-1">
        {results.map((f) => <FoodRow key={f.id} f={f} onPick={onPick} />)}
        {results.length === 0 && q.trim().length >= 2 && (
          <div className="text-center py-6">
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>We couldn't find that food.</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-tertiary)" }}>Try a different search, or create it below — it only takes a few seconds.</p>
          </div>
        )}
      </div>

      {LIVE_SEARCH_ENABLED && q.trim().length >= 2 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>From USDA FoodData Central</p>
            {usdaLoading && <span className="rw-fs-11" style={{ color: "var(--text-tertiary)" }}>Searching…</span>}
          </div>
          {usdaNoKey && <p className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>Add a free USDA API key to your .env file to enable this — see README.</p>}
          {usdaError && <p className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>USDA lookup isn't reachable right now — local results above still work fine.</p>}
          {!usdaLoading && !usdaError && !usdaNoKey && usdaResults.length === 0 && (
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>No USDA matches for this search.</p>
          )}
          <div className="flex flex-col gap-1">
            {usdaResults.map((f) => <FoodRow key={f.id} f={f} onPick={onPick} />)}
          </div>
        </div>
      )}

      {LIVE_SEARCH_ENABLED && q.trim().length >= 2 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>From Open Food Facts</p>
            {liveLoading && <span className="rw-fs-11" style={{ color: "var(--text-tertiary)" }}>Searching…</span>}
          </div>
          {liveError && <p className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>Live lookup isn't reachable right now — local results above still work fine.</p>}
          {!liveLoading && !liveError && liveResults.length === 0 && (
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>No live matches for this search.</p>
          )}
          <div className="flex flex-col gap-1">
            {liveResults.map((f) => <FoodRow key={f.id} f={f} onPick={onPick} />)}
          </div>
        </div>
      )}

      <button onClick={onCreateCustom} className="w-full py-3 rounded-xl text-sm font-semibold mt-4 flex items-center justify-center gap-1.5 flex-shrink-0"
        style={{ background: "var(--card-alt)", border: "1px dashed var(--border)", color: "var(--primary)" }}>
        <Plus size={16} />Can't find it? Create a custom food
      </button>
    </Sheet>
  );
}

function FoodDetailSheet({ food: f, onClose, onConfirm, isFavorite, onToggleFavorite }) {
  const [qty, setQty] = useState(f.servingSize);
  const [meal, setMeal] = useState("breakfast");
  const scaled = scaleFood(f, qty || 0);
  return (
    <Sheet title={f.name} onClose={onClose}>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{f.brand ? f.brand + " · " : ""}{reliabilityLabel(f.reliability)} nutrition</p>
        <button onClick={() => onToggleFavorite(f.id)}>
          <Star size={20} fill={isFavorite ? "var(--primary)" : "none"} color={isFavorite ? "var(--primary)" : "var(--text-tertiary)"} />
        </button>
      </div>
      <Field label={`Quantity (${f.servingUnit})`}>
        <div className="flex items-center gap-2">
          <button onClick={() => setQty(Math.max(0, qty - (f.servingUnit === "g" || f.servingUnit === "ml" ? 10 : 1)))} className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--card-alt)" }}>−</button>
          <TextInput type="number" value={qty} onChange={(e) => setQty(parseFloat(e.target.value) || 0)} className="text-center" />
          <button onClick={() => setQty(qty + (f.servingUnit === "g" || f.servingUnit === "ml" ? 10 : 1))} className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "var(--card-alt)" }}>+</button>
        </div>
        <p className="rw-fs-11 mt-1.5" style={{ color: "var(--text-tertiary)" }}>1 serving = {f.servingSize}{f.servingUnit}</p>
      </Field>
      <Card className="p-4 mb-4" style={{ background: "var(--card-alt)", border: "none" }}>
        <div className="flex justify-between items-baseline mb-3">
          <span className="text-sm font-semibold">Calories</span>
          <span className="rw-display font-bold text-xl">{scaled.calories}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div><p className="rw-fs-10" style={{ color: "var(--protein)" }}>Protein</p><p className="font-semibold text-sm">{scaled.protein}g</p></div>
          <div><p className="rw-fs-10" style={{ color: "var(--carbs)" }}>Carbs</p><p className="font-semibold text-sm">{scaled.carbs}g</p></div>
          <div><p className="rw-fs-10" style={{ color: "var(--fat)" }}>Fat</p><p className="font-semibold text-sm">{scaled.fat}g</p></div>
        </div>
      </Card>
      <Field label="Add to">
        <div className="flex gap-2 flex-wrap">
          {["breakfast", "lunch", "dinner", "snacks"].map((m) => (
            <Pill key={m} active={meal === m} onClick={() => setMeal(m)}>{m[0].toUpperCase() + m.slice(1)}</Pill>
          ))}
        </div>
      </Field>
      <button onClick={() => onConfirm({ meal, qty, scaled })} className="rw-btn-primary w-full py-3 rounded-full font-semibold text-sm mt-2">Add to {meal[0].toUpperCase() + meal.slice(1)}</button>
    </Sheet>
  );
}

function CustomFoodSheet({ onClose, onSave }) {
  const [f, setF] = useState({ name: "", calories: "", protein: "", carbs: "", fat: "", fiber: "", sugar: "", sodium: "", servingSize: "1", servingUnit: "serving" });
  const set = (k, v) => setF((d) => ({ ...d, [k]: v }));
  const valid = f.name.trim() && f.calories !== "";
  return (
    <Sheet title="Create custom food" onClose={onClose}>
      <Field label="Food name"><TextInput placeholder="e.g. Mom's chicken curry" value={f.name} onChange={(e) => set("name", e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Serving size"><TextInput type="number" value={f.servingSize} onChange={(e) => set("servingSize", e.target.value)} /></Field>
        <Field label="Unit"><TextInput value={f.servingUnit} onChange={(e) => set("servingUnit", e.target.value)} placeholder="g, ml, serving" /></Field>
      </div>
      <Field label="Calories (kcal)"><TextInput type="number" value={f.calories} onChange={(e) => set("calories", e.target.value)} /></Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Protein (g)"><TextInput type="number" value={f.protein} onChange={(e) => set("protein", e.target.value)} /></Field>
        <Field label="Carbs (g)"><TextInput type="number" value={f.carbs} onChange={(e) => set("carbs", e.target.value)} /></Field>
        <Field label="Fat (g)"><TextInput type="number" value={f.fat} onChange={(e) => set("fat", e.target.value)} /></Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Fiber (g)"><TextInput type="number" value={f.fiber} onChange={(e) => set("fiber", e.target.value)} /></Field>
        <Field label="Sugar (g)"><TextInput type="number" value={f.sugar} onChange={(e) => set("sugar", e.target.value)} /></Field>
        <Field label="Sodium (mg)"><TextInput type="number" value={f.sodium} onChange={(e) => set("sodium", e.target.value)} /></Field>
      </div>
      <button disabled={!valid} onClick={() => onSave({
        id: "custom-" + uid(), name: f.name, brand: null, category: "Custom", region: "Custom",
        servingSize: parseFloat(f.servingSize) || 1, servingUnit: f.servingUnit || "serving",
        calories: parseFloat(f.calories) || 0, protein: parseFloat(f.protein) || 0, carbs: parseFloat(f.carbs) || 0, fat: parseFloat(f.fat) || 0,
        fiber: parseFloat(f.fiber) || 0, sugar: parseFloat(f.sugar) || 0, sodium: parseFloat(f.sodium) || 0,
        reliability: "user-entered", source: "User created", createdAt: Date.now(),
      })} className="rw-btn-primary w-full py-3 rounded-full font-semibold text-sm mt-2 disabled:opacity-40">Save food</button>
    </Sheet>
  );
}

// Downscales a photo client-side before sending it to the analysis backend
// -- keeps requests small/fast and cheaper to run through the vision model.
// Runs entirely in the browser via canvas; no library needed.
function resizeImageToBase64(file, maxDim = 1024, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) { height = Math.round((height * maxDim) / width); width = maxDim; }
        else { width = Math.round((width * maxDim) / height); height = maxDim; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve({ base64: dataUrl.split(",")[1], dataUrl, mediaType: "image/jpeg" });
    };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

// Two free ways to log food here, feeding one shared editable review screen:
//   1. Barcode scan -> Open Food Facts lookup (no API key, reads the real
//      label; most accurate for packaged goods). Runs fully client-side.
//   2. Photo -> AI nutrition estimate via a backend serverless function
//      (api/analyze-food.js, Gemini free tier). No API key ever touches this
//      browser-side code -- it lives server-side only.
function PhotoLogSheet({ onClose, onLog }) {
  const [stage, setStage] = useState("capture"); // capture | scanning | looking-up | analyzing | result | error
  const [imageDataUrl, setImageDataUrl] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState(null);
  const [meal, setMeal] = useState("breakfast");
  const cameraInputRef = useRef(null);
  const libraryInputRef = useRef(null);
  const videoRef = useRef(null);
  const barcodeControlsRef = useRef(null);

  const resetToCapture = () => {
    try { barcodeControlsRef.current && barcodeControlsRef.current.stop(); } catch (e) {}
    barcodeControlsRef.current = null;
    setImageDataUrl(null); setResult(null); setErrorMsg(""); setStage("capture");
  };

  // Start the live camera barcode reader once the <video> for the "scanning"
  // stage is mounted. ZXing is dynamically imported so it only downloads when
  // barcode scanning is actually used, keeping the initial bundle small.
  useEffect(() => {
    if (stage !== "scanning") return;
    let cancelled = false;
    (async () => {
      try {
        const { BrowserMultiFormatReader } = await import("@zxing/browser");
        const reader = new BrowserMultiFormatReader();
        // Prefer the rear ("environment") camera on phones for barcode scanning.
        const constraints = { video: { facingMode: { ideal: "environment" } } };
        const controls = await reader.decodeFromConstraints(constraints, videoRef.current, (res, err, ctrl) => {
          if (cancelled || !res) return;
          const text = typeof res.getText === "function" ? res.getText() : res.text;
          if (text) { ctrl.stop(); handleBarcode(text); }
        });
        if (cancelled) { controls.stop(); return; }
        barcodeControlsRef.current = controls;
      } catch (e) {
        if (!cancelled) {
          setErrorMsg("Couldn't start the camera for barcode scanning. Allow camera access (scanning needs HTTPS), or use photo scanning instead.");
          setStage("error");
        }
      }
    })();
    return () => {
      cancelled = true;
      try { barcodeControlsRef.current && barcodeControlsRef.current.stop(); } catch (e) {}
      barcodeControlsRef.current = null;
    };
  }, [stage]);

  const handleBarcode = async (code) => {
    setErrorMsg("");
    setStage("looking-up");
    try {
      const r = await lookupBarcode(code);
      if (!r) {
        setErrorMsg(`No product found for barcode ${code} in Open Food Facts. Try snapping a photo instead, or add it as a custom food.`);
        setStage("error");
        return;
      }
      setResult(r);
      setStage("result");
    } catch (e) {
      setErrorMsg("Couldn't reach Open Food Facts to look up that barcode. Check your connection and try again.");
      setStage("error");
    }
  };

  const analyze = async (file) => {
    setErrorMsg("");
    try {
      const { base64, dataUrl, mediaType } = await resizeImageToBase64(file);
      setImageDataUrl(dataUrl);
      setStage("analyzing");
      const res = await fetch("/api/analyze-food", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ image: base64, mediaType }),
      });
      let data;
      try { data = await res.json(); } catch (e) { data = null; }
      if (!res.ok || !data || data.error) {
        setErrorMsg((data && data.error) || "Photo analysis isn't available right now.");
        setStage("error");
        return;
      }
      setResult({
        foodName: data.result.foodName || "Unknown food",
        servingDescription: data.result.servingDescription || "",
        calories: Math.round(data.result.calories) || 0,
        protein: round1(data.result.protein) || 0,
        carbs: round1(data.result.carbs) || 0,
        fat: round1(data.result.fat) || 0,
        confidence: data.result.confidence || "medium",
        notes: data.result.notes || "",
      });
      setStage("result");
    } catch (e) {
      setErrorMsg("Couldn't reach the photo analysis backend. If you haven't set this up yet, see the README (it needs a free GEMINI_API_KEY on the server and won't work with plain `npm run dev`). Barcode scanning works without any of that.");
      setStage("error");
    }
  };

  const setField = (k, v) => setResult((r) => ({ ...r, [k]: v }));

  return (
    <Sheet title="Scan food" onClose={onClose}>
      {stage === "capture" && (
        <div className="flex flex-col items-center text-center py-6">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "var(--card-alt)", color: "var(--primary)" }}>
            <Camera size={28} />
          </div>
          <p className="rw-display font-semibold text-base mb-1">Scan a barcode or a photo</p>
          <p className="text-sm mb-6" style={{ color: "var(--text-secondary)" }}>Scan a product barcode for exact label data (free, most accurate), or snap a photo and let AI estimate the food, calories, and macros. You can adjust everything before logging.</p>
          <button onClick={() => { setErrorMsg(""); setStage("scanning"); }} className="rw-btn-primary w-full py-3 rounded-full text-sm font-semibold flex items-center justify-center gap-1.5 mb-3">
            <Barcode size={16} />Scan barcode
          </button>
          <div className="flex gap-3 w-full">
            <button onClick={() => cameraInputRef.current && cameraInputRef.current.click()} className="flex-1 py-3 rounded-full text-sm font-semibold flex items-center justify-center gap-1.5" style={{ background: "var(--card-alt)", border: "1px solid var(--border)" }}>
              <Camera size={16} />Photo
            </button>
            <button onClick={() => libraryInputRef.current && libraryInputRef.current.click()} className="flex-1 py-3 rounded-full text-sm font-semibold flex items-center justify-center gap-1.5" style={{ background: "var(--card-alt)", border: "1px solid var(--border)" }}>
              <Upload size={16} />Upload
            </button>
          </div>
          <p className="rw-fs-11 mt-3" style={{ color: "var(--text-tertiary)" }}>Barcode scanning works with no setup. Photo scanning needs a free Gemini key on the server — see the README.</p>
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) analyze(f); e.target.value = ""; }} />
          <input ref={libraryInputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files && e.target.files[0]; if (f) analyze(f); e.target.value = ""; }} />
        </div>
      )}

      {stage === "scanning" && (
        <div className="flex flex-col items-center text-center py-2">
          <div className="w-full rounded-2xl overflow-hidden mb-4" style={{ background: "#000", aspectRatio: "3 / 4", maxHeight: 320, position: "relative" }}>
            <video ref={videoRef} playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <div style={{ position: "absolute", left: "10%", right: "10%", top: "50%", height: 2, background: "var(--primary)", boxShadow: "0 0 0 9999px rgba(0,0,0,0.15)" }} />
          </div>
          <p className="text-sm font-medium mb-1">Point at a product barcode</p>
          <p className="rw-fs-11 mb-4" style={{ color: "var(--text-tertiary)" }}>Hold steady — it scans automatically.</p>
          <button onClick={resetToCapture} className="px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-1.5" style={{ background: "var(--card-alt)", border: "1px solid var(--border)" }}>
            <ChevronLeft size={14} />Back
          </button>
        </div>
      )}

      {stage === "looking-up" && (
        <div className="flex flex-col items-center text-center py-10">
          <div className="w-8 h-8 rounded-full animate-pulse mb-3" style={{ background: "linear-gradient(135deg, var(--primary), var(--secondary))" }} />
          <p className="text-sm font-medium">Looking up that barcode…</p>
        </div>
      )}

      {stage === "analyzing" && (
        <div className="flex flex-col items-center text-center py-6">
          {imageDataUrl && <img src={imageDataUrl} alt="Food to analyze" className="w-full rounded-2xl mb-5" style={{ maxHeight: 240, objectFit: "cover" }} />}
          <div className="w-8 h-8 rounded-full animate-pulse mb-3" style={{ background: "linear-gradient(135deg, var(--primary), var(--secondary))" }} />
          <p className="text-sm font-medium">Analyzing your photo…</p>
        </div>
      )}

      {stage === "error" && (
        <div className="flex flex-col items-center text-center py-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: "var(--card-alt)", color: "var(--danger)" }}>
            <AlertCircle size={24} />
          </div>
          <p className="text-sm mb-5" style={{ color: "var(--text-secondary)" }}>{errorMsg}</p>
          <button onClick={resetToCapture} className="rw-btn-primary px-5 py-2.5 rounded-full text-sm font-semibold flex items-center gap-1.5">
            <RefreshCw size={14} />Try again
          </button>
        </div>
      )}

      {stage === "result" && result && (
        <div>
          {imageDataUrl && <img src={imageDataUrl} alt="Analyzed food" className="w-full rounded-2xl mb-4" style={{ maxHeight: 200, objectFit: "cover" }} />}
          <div className="flex items-center justify-between mb-1">
            <TextInput value={result.foodName} onChange={(e) => setField("foodName", e.target.value)} className="font-semibold text-base" />
          </div>
          <div className="flex items-center gap-2 mb-4">
            <span className="rw-fs-10 px-2 py-0.5 rounded-full font-semibold" style={{ background: "var(--card-alt)", color: result.confidence === "high" ? "var(--success)" : result.confidence === "low" ? "var(--danger)" : "var(--carbs)" }}>
              {result.confidence} confidence
            </span>
            {result.servingDescription && <span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{result.servingDescription}</span>}
          </div>
          {result.notes && (
            <p className="text-xs mb-4 rounded-xl p-3" style={{ background: "var(--card-alt)", color: "var(--text-secondary)" }}>{result.notes}</p>
          )}
          <Field label="Calories (kcal)"><TextInput type="number" value={result.calories} onChange={(e) => setField("calories", parseFloat(e.target.value) || 0)} /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Protein (g)"><TextInput type="number" value={result.protein} onChange={(e) => setField("protein", parseFloat(e.target.value) || 0)} /></Field>
            <Field label="Carbs (g)"><TextInput type="number" value={result.carbs} onChange={(e) => setField("carbs", parseFloat(e.target.value) || 0)} /></Field>
            <Field label="Fat (g)"><TextInput type="number" value={result.fat} onChange={(e) => setField("fat", parseFloat(e.target.value) || 0)} /></Field>
          </div>
          <Field label="Add to">
            <div className="flex gap-2 flex-wrap">
              {["breakfast", "lunch", "dinner", "snacks"].map((m) => (
                <Pill key={m} active={meal === m} onClick={() => setMeal(m)}>{m[0].toUpperCase() + m.slice(1)}</Pill>
              ))}
            </div>
          </Field>
          <div className="flex gap-3 mt-2">
            <button onClick={resetToCapture} className="px-5 py-3 rounded-full text-sm font-semibold flex items-center gap-1.5" style={{ background: "var(--card-alt)", border: "1px solid var(--border)" }}>
              <RefreshCw size={14} />Scan again
            </button>
            <button onClick={() => onLog({ meal, result })} className="rw-btn-primary flex-1 py-3 rounded-full text-sm font-semibold">Log {result.foodName}</button>
          </div>
          <p className="rw-fs-11 mt-3 text-center" style={{ color: "var(--text-tertiary)" }}>Estimate — always spot-check against what you actually ate.</p>
        </div>
      )}
    </Sheet>
  );
}

function MealSection({ title, entries, onAdd, onRemove }) {
  const totals = entries.reduce((a, e) => ({ cal: a.cal + e.calories, p: a.p + e.protein, c: a.c + e.carbs, f: a.f + e.fat }), { cal: 0, p: 0, c: 0, f: 0 });
  return (
    <Card className="p-4 mb-3">
      <div className="flex items-center justify-between mb-2.5">
        <div>
          <p className="font-semibold text-sm">{title}</p>
          {entries.length > 0 && <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{Math.round(totals.cal)} kcal · P{Math.round(totals.p)} C{Math.round(totals.c)} F{Math.round(totals.f)}</p>}
        </div>
        <button onClick={onAdd} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--card-alt)", color: "var(--primary)" }}><Plus size={16} /></button>
      </div>
      {entries.length === 0 ? (
        <p className="text-xs py-1" style={{ color: "var(--text-tertiary)" }}>Nothing logged</p>
      ) : (
        <div className="flex flex-col gap-2">
          {entries.map((e) => (
            <div key={e.id} className="flex items-center justify-between group">
              <div className="min-w-0">
                <p className="text-sm truncate">{e.name}</p>
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{e.qty}{e.unit === "g" || e.unit === "ml" ? e.unit : " " + e.unit}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{Math.round(e.calories)} kcal</span>
                <button onClick={() => onRemove(e.id)}><X size={14} color="var(--text-tertiary)" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function Nutrition({ profile, foodLog, customFoods, favorites, addFoodEntry, removeFoodEntry, addCustomFood, toggleFavorite, copyDay, openPhotoLog }) {
  const [view, setView] = useState("log"); // log | search | history | myfoods
  const [pickedFood, setPickedFood] = useState(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [historyDate, setHistoryDate] = useState(null);

  const today = todayStr();
  const todayLog = foodLog[today] || { breakfast: [], lunch: [], dinner: [], snacks: [] };
  const totals = useMemo(() => {
    const all = [...todayLog.breakfast, ...todayLog.lunch, ...todayLog.dinner, ...todayLog.snacks];
    return all.reduce((acc, e) => ({ calories: acc.calories + e.calories, protein: acc.protein + e.protein, carbs: acc.carbs + e.carbs, fat: acc.fat + e.fat }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  }, [todayLog]);

  const frequentFoods = useMemo(() => {
    const counts = new Map();
    for (const day of Object.values(foodLog)) {
      for (const meal of ["breakfast", "lunch", "dinner", "snacks"]) {
        for (const e of (day[meal] || [])) counts.set(e.name, (counts.get(e.name) || 0) + 1);
      }
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, count]) => ({ name, count }));
  }, [foodLog]);

  const pastDates = useMemo(() => Object.keys(foodLog).filter(d => d !== today).sort().reverse(), [foodLog, today]);

  const commitEntry = ({ meal, qty, scaled }) => {
    addFoodEntry(today, meal, {
      id: uid(), name: pickedFood.name, foodId: pickedFood.id, qty, unit: pickedFood.servingUnit,
      calories: scaled.calories, protein: scaled.protein, carbs: scaled.carbs, fat: scaled.fat, loggedAt: Date.now(),
    });
    setPickedFood(null);
  };

  return (
    <div className="px-5 md:px-8 pb-28 md:pb-10 pt-6 md:pt-2 max-w-5xl mx-auto">
      <TopBar title="Nutrition" right={
        <div className="flex items-center gap-2">
          <button onClick={openPhotoLog} className="px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1.5" style={{ background: "var(--card-alt)", border: "1px solid var(--border)" }}><Camera size={16} />Scan</button>
          <button onClick={() => setShowSearch(true)} className="rw-btn-primary px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1.5"><Plus size={16} />Log food</button>
        </div>
      } />
      <div className="flex md:hidden items-center justify-between mb-4">
        <h1 className="rw-display font-bold text-2xl">Nutrition</h1>
        <div className="flex items-center gap-2">
          <button onClick={openPhotoLog} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "var(--card-alt)", border: "1px solid var(--border)" }}><Camera size={17} /></button>
          <button onClick={() => setShowSearch(true)} className="rw-btn-primary w-10 h-10 rounded-full flex items-center justify-center"><Plus size={18} /></button>
        </div>
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto rw-scroll">
        <Pill active={view === "log"} onClick={() => setView("log")}>Today</Pill>
        <Pill active={view === "myfoods"} onClick={() => setView("myfoods")}>My Foods</Pill>
        <Pill active={view === "history"} onClick={() => setView("history")}>History</Pill>
      </div>

      {view === "log" && (
        <div className="md:grid md:grid-cols-3 md:gap-5">
          <Card className="p-5 mb-4 md:col-span-1 md:h-fit">
            <SectionTitle>Today's totals</SectionTitle>
            <div className="flex items-center gap-4 mb-4">
              <Ring pct={profile.calorieTarget > 0 ? totals.calories / profile.calorieTarget : 0} color="var(--primary)" size={88} stroke={8}>
                <div className="text-center"><p className="font-bold text-sm">{Math.round(totals.calories)}</p><p className="rw-fs-9" style={{ color: "var(--text-tertiary)" }}>kcal</p></div>
              </Ring>
              <div className="flex-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                <p>Target: {profile.calorieTarget.toLocaleString()} kcal</p>
                <p>Remaining: {Math.max(0, profile.calorieTarget - totals.calories).toLocaleString()} kcal</p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <MacroBar label="Protein" value={totals.protein} target={profile.macroTargets.protein} unit="g" color="var(--protein)" />
              <MacroBar label="Carbs" value={totals.carbs} target={profile.macroTargets.carbs} unit="g" color="var(--carbs)" />
              <MacroBar label="Fat" value={totals.fat} target={profile.macroTargets.fat} unit="g" color="var(--fat)" />
            </div>
            {frequentFoods.length > 0 && (
              <div className="mt-5">
                <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "var(--text-tertiary)" }}>Frequently eaten</p>
                <div className="flex flex-wrap gap-1.5">
                  {frequentFoods.map((f) => (
                    <button key={f.name} onClick={() => {
                      const match = FOODS.find(x => x.name === f.name) || customFoods.find(x => x.name === f.name);
                      if (match) setPickedFood(match);
                    }} className="text-xs px-2.5 py-1.5 rounded-lg" style={{ background: "var(--card-alt)", border: "1px solid var(--border)" }}>{f.name}</button>
                  ))}
                </div>
              </div>
            )}
          </Card>
          <div className="md:col-span-2">
            <MealSection title="Breakfast" entries={todayLog.breakfast} onAdd={() => setShowSearch(true)} onRemove={(id) => removeFoodEntry(today, "breakfast", id)} />
            <MealSection title="Lunch" entries={todayLog.lunch} onAdd={() => setShowSearch(true)} onRemove={(id) => removeFoodEntry(today, "lunch", id)} />
            <MealSection title="Dinner" entries={todayLog.dinner} onAdd={() => setShowSearch(true)} onRemove={(id) => removeFoodEntry(today, "dinner", id)} />
            <MealSection title="Snacks" entries={todayLog.snacks} onAdd={() => setShowSearch(true)} onRemove={(id) => removeFoodEntry(today, "snacks", id)} />
          </div>
        </div>
      )}

      {view === "myfoods" && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <SectionTitle>My Foods</SectionTitle>
            <button onClick={() => setShowCustom(true)} className="text-xs font-semibold flex items-center gap-1" style={{ color: "var(--primary)" }}><Plus size={14} />New custom food</button>
          </div>
          {customFoods.length === 0 && favorites.length === 0 ? (
            <EmptyState icon={<Star size={26} />} title="No saved foods yet" sub="Favorite foods from search, or create your own custom food." actionLabel="Create custom food" onAction={() => setShowCustom(true)} />
          ) : (
            <div className="grid md:grid-cols-2 gap-2">
              {[...customFoods, ...FOODS.filter(f => favorites.includes(f.id))].map((f) => (
                <button key={f.id} onClick={() => setPickedFood(f)} className="rw-card rounded-xl p-3.5 flex items-center justify-between text-left">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{f.name}</p>
                    <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{f.servingSize}{f.servingUnit} · {f.calories} kcal</p>
                  </div>
                  <Star size={16} fill="var(--primary)" color="var(--primary)" className="flex-shrink-0 ml-2" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {view === "history" && !historyDate && (
        <div>
          <SectionTitle>Daily history</SectionTitle>
          {pastDates.length === 0 ? (
            <EmptyState icon={<Calendar size={26} />} title="No history yet" sub="Once you log a few days, you'll be able to browse them here." />
          ) : (
            <div className="flex flex-col gap-2">
              {pastDates.map((d) => {
                const day = foodLog[d];
                const cal = [...day.breakfast, ...day.lunch, ...day.dinner, ...day.snacks].reduce((s, e) => s + e.calories, 0);
                return (
                  <button key={d} onClick={() => setHistoryDate(d)} className="rw-card rounded-xl p-4 flex items-center justify-between text-left">
                    <span className="text-sm font-medium">{dateLabel(d)}</span>
                    <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{Math.round(cal)} kcal</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {view === "history" && historyDate && (
        <div>
          <button onClick={() => setHistoryDate(null)} className="flex items-center gap-1.5 text-sm font-medium mb-4" style={{ color: "var(--text-secondary)" }}><ArrowLeft size={16} />Back to history</button>
          <SectionTitle right={
            <button onClick={() => { copyDay(historyDate, today); setView("log"); }} className="text-xs font-semibold flex items-center gap-1" style={{ color: "var(--primary)" }}><Copy size={13} />Copy to today</button>
          }>{dateLabel(historyDate)}</SectionTitle>
          {["breakfast", "lunch", "dinner", "snacks"].map((m) => (
            <MealSection key={m} title={m[0].toUpperCase() + m.slice(1)} entries={foodLog[historyDate][m] || []} onAdd={() => {}} onRemove={() => {}} />
          ))}
        </div>
      )}

      {showSearch && (
        <FoodSearchSheet onClose={() => setShowSearch(false)} foods={FOODS} customFoods={customFoods} favorites={favorites}
          onPick={(f) => { setShowSearch(false); setPickedFood(f); }}
          onCreateCustom={() => { setShowSearch(false); setShowCustom(true); }} />
      )}
      {pickedFood && (
        <FoodDetailSheet food={pickedFood} onClose={() => setPickedFood(null)} isFavorite={favorites.includes(pickedFood.id)}
          onToggleFavorite={toggleFavorite} onConfirm={commitEntry} />
      )}
      {showCustom && (
        <CustomFoodSheet onClose={() => setShowCustom(false)} onSave={(f) => { addCustomFood(f); setShowCustom(false); setPickedFood(f); }} />
      )}
    </div>
  );
}

/* ============================================================================
   WORKOUTS
============================================================================ */
function ExerciseBrowserSheet({ onClose, onPick }) {
  const [q, setQ] = useState("");
  const [muscle, setMuscle] = useState("All");
  const results = useMemo(() => {
    return EXERCISES.filter((e) =>
      (muscle === "All" || e.muscle === muscle) &&
      (q.trim() === "" || e.name.toLowerCase().includes(q.toLowerCase()))
    );
  }, [q, muscle]);
  return (
    <Sheet title="Add exercise" onClose={onClose} wide>
      <div className="relative mb-3">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
        <TextInput autoFocus placeholder="Search exercises..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-10" />
      </div>
      <div className="flex gap-2 mb-3 overflow-x-auto rw-scroll pb-1">
        <Pill active={muscle === "All"} onClick={() => setMuscle("All")}>All</Pill>
        {MUSCLES.map((m) => <Pill key={m} active={muscle === m} onClick={() => setMuscle(m)}>{m}</Pill>)}
      </div>
      <div className="flex flex-col gap-1">
        {results.map((e) => (
          <button key={e.id} onClick={() => onPick(e)} className="flex items-center justify-between px-3 py-3 rounded-xl text-left" style={{ borderBottom: "1px solid var(--border)" }}>
            <div>
              <p className="text-sm font-medium">{e.name}</p>
              <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{e.muscle} · {e.equipment} · {e.difficulty}</p>
            </div>
            <Plus size={16} color="var(--primary)" />
          </button>
        ))}
      </div>
    </Sheet>
  );
}

function RoutineBuilder({ onClose, onSave, existing }) {
  const [name, setName] = useState(existing?.name || "");
  const [items, setItems] = useState(existing?.exercises || []);
  const [showBrowser, setShowBrowser] = useState(false);

  const addExercise = (ex) => {
    setItems((it) => [...it, { exerciseId: ex.id, name: ex.name, muscle: ex.muscle, sets: 3, targetReps: 10, targetWeight: 0, restSec: 90, notes: "" }]);
    setShowBrowser(false);
  };
  const update = (i, patch) => setItems((it) => it.map((x, idx) => idx === i ? { ...x, ...patch } : x));
  const remove = (i) => setItems((it) => it.filter((_, idx) => idx !== i));
  const move = (i, dir) => setItems((it) => {
    const arr = [...it]; const j = i + dir;
    if (j < 0 || j >= arr.length) return arr;
    [arr[i], arr[j]] = [arr[j], arr[i]]; return arr;
  });

  return (
    <Sheet title={existing ? "Edit routine" : "New routine"} onClose={onClose} wide>
      <Field label="Routine name"><TextInput placeholder="e.g. Push Day" value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <div className="flex flex-col gap-3 mb-4">
        {items.map((it, i) => (
          <Card key={i} className="p-3.5">
            <div className="flex items-center justify-between mb-2.5">
              <div>
                <p className="font-semibold text-sm">{i + 1}. {it.name}</p>
                <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{it.muscle}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => move(i, -1)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--card-alt)" }}><ChevronUp size={14} /></button>
                <button onClick={() => move(i, 1)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--card-alt)" }}><ChevronDown size={14} /></button>
                <button onClick={() => remove(i)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--card-alt)" }}><Trash2 size={13} color="var(--danger)" /></button>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div><label className="rw-fs-10" style={{ color: "var(--text-tertiary)" }}>Sets</label><TextInput type="number" value={it.sets} onChange={(e) => update(i, { sets: parseInt(e.target.value) || 0 })} className="text-center py-1.5" /></div>
              <div><label className="rw-fs-10" style={{ color: "var(--text-tertiary)" }}>Reps</label><TextInput type="number" value={it.targetReps} onChange={(e) => update(i, { targetReps: parseInt(e.target.value) || 0 })} className="text-center py-1.5" /></div>
              <div><label className="rw-fs-10" style={{ color: "var(--text-tertiary)" }}>Weight</label><TextInput type="number" value={it.targetWeight} onChange={(e) => update(i, { targetWeight: parseFloat(e.target.value) || 0 })} className="text-center py-1.5" /></div>
              <div><label className="rw-fs-10" style={{ color: "var(--text-tertiary)" }}>Rest(s)</label><TextInput type="number" value={it.restSec} onChange={(e) => update(i, { restSec: parseInt(e.target.value) || 0 })} className="text-center py-1.5" /></div>
            </div>
          </Card>
        ))}
      </div>
      <button onClick={() => setShowBrowser(true)} className="w-full py-3 rounded-xl text-sm font-semibold mb-4 flex items-center justify-center gap-1.5" style={{ background: "var(--card-alt)", border: "1px dashed var(--border)", color: "var(--primary)" }}>
        <Plus size={16} />Add exercise
      </button>
      <button disabled={!name.trim() || items.length === 0} onClick={() => onSave({ id: existing?.id || uid(), name, exercises: items, createdAt: existing?.createdAt || Date.now(), lastUsed: existing?.lastUsed || null })}
        className="rw-btn-primary w-full py-3 rounded-full font-semibold text-sm disabled:opacity-40">Save routine</button>
      {showBrowser && <ExerciseBrowserSheet onClose={() => setShowBrowser(false)} onPick={addExercise} />}
    </Sheet>
  );
}

function ActiveWorkout({ routine, sessions, onFinish, onCancel }) {
  const [startedAt] = useState(Date.now());
  const [exIndex, setExIndex] = useState(0);
  const [log, setLog] = useState(() => routine.exercises.map((e) => ({
    exerciseId: e.exerciseId, name: e.name,
    sets: Array.from({ length: e.sets }, () => ({ weight: e.targetWeight || 0, reps: e.targetReps || 0, completed: false })),
  })));
  const [restLeft, setRestLeft] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(t);
  }, [startedAt]);

  useEffect(() => {
    if (restLeft <= 0) { if (timerRef.current) clearInterval(timerRef.current); return; }
    timerRef.current = setInterval(() => setRestLeft((r) => (r <= 1 ? 0 : r - 1)), 1000);
    return () => clearInterval(timerRef.current);
  }, [restLeft > 0]);

  const current = routine.exercises[exIndex];
  const currentLog = log[exIndex];

  const prevPerformance = useMemo(() => {
    const past = sessions.filter((s) => s.exercises.some((e) => e.exerciseId === current.exerciseId)).sort((a, b) => b.date.localeCompare(a.date));
    if (!past.length) return null;
    const exLog = past[0].exercises.find((e) => e.exerciseId === current.exerciseId);
    return exLog ? exLog.sets : null;
  }, [current, sessions]);

  const updateSet = (si, patch) => {
    setLog((l) => l.map((ex, i) => i !== exIndex ? ex : { ...ex, sets: ex.sets.map((s, j) => j === si ? { ...s, ...patch } : s) }));
  };
  const completeSet = (si) => {
    updateSet(si, { completed: true });
    setRestLeft(current.restSec || 60);
  };

  const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  const totalVolume = log.reduce((sum, ex) => sum + ex.sets.reduce((s, set) => s + (set.completed ? set.weight * set.reps : 0), 0), 0);
  const allDone = log.every(ex => ex.sets.every(s => s.completed));

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: "var(--bg)" }}>
      <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
        <button onClick={onCancel} className="p-2 -ml-2"><X size={20} /></button>
        <div className="text-center">
          <p className="font-semibold text-sm">{routine.name}</p>
          <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{fmtTime(elapsed)} elapsed</p>
        </div>
        <div style={{ width: 36 }} />
      </div>

      {restLeft > 0 && (
        <div className="flex items-center justify-center gap-3 py-3 flex-shrink-0" style={{ background: "var(--card-alt)", borderBottom: "1px solid var(--border)" }}>
          <Timer size={16} color="var(--primary)" />
          <span className="font-bold text-lg" style={{ color: "var(--primary)" }}>{fmtTime(restLeft)}</span>
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>rest</span>
          <button onClick={() => setRestLeft(0)} className="text-xs font-semibold ml-2" style={{ color: "var(--text-secondary)" }}>Skip</button>
        </div>
      )}

      <div className="flex gap-2 px-5 py-3 overflow-x-auto rw-scroll flex-shrink-0">
        {routine.exercises.map((e, i) => (
          <button key={i} onClick={() => setExIndex(i)} className="px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 flex items-center gap-1.5"
            style={{ background: i === exIndex ? "var(--primary)" : "var(--card-alt)", color: i === exIndex ? "#fff" : "var(--text-secondary)" }}>
            {log[i].sets.every(s => s.completed) && <Check size={11} />}{e.name}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto rw-scroll px-5 pb-32">
        <h2 className="rw-display font-bold text-xl mb-1">{current.name}</h2>
        <p className="text-xs mb-4" style={{ color: "var(--text-tertiary)" }}>Target: {current.sets} × {current.targetReps} reps</p>

        {prevPerformance && (
          <Card className="p-3.5 mb-4" style={{ background: "var(--card-alt)", border: "none" }}>
            <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>Last workout</p>
            <div className="flex gap-3 flex-wrap">
              {prevPerformance.map((s, i) => (
                <span key={i} className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>{s.weight}kg × {s.reps}</span>
              ))}
            </div>
            <p className="rw-fs-11 mt-1.5" style={{ color: "var(--primary)" }}>Try matching or beating your previous performance.</p>
          </Card>
        )}

        <div className="flex flex-col gap-2">
          <div className="rw-set-grid rw-fs-10 font-semibold px-1" style={{ color: "var(--text-tertiary)" }}>
            <span>SET</span><span>WEIGHT (kg)</span><span>REPS</span><span></span>
          </div>
          {currentLog.sets.map((s, si) => (
            <div key={si} className="rw-set-grid items-center">
              <span className="text-sm font-semibold text-center">{si + 1}</span>
              <TextInput type="number" value={s.weight} onChange={(e) => updateSet(si, { weight: parseFloat(e.target.value) || 0 })} className="text-center py-2" />
              <TextInput type="number" value={s.reps} onChange={(e) => updateSet(si, { reps: parseInt(e.target.value) || 0 })} className="text-center py-2" />
              <button onClick={() => completeSet(si)} className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: s.completed ? "var(--success)" : "var(--card-alt)", border: s.completed ? "none" : "1px solid var(--border)" }}>
                <Check size={16} color={s.completed ? "#fff" : "var(--text-tertiary)"} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 py-4 flex-shrink-0 flex gap-3" style={{ borderTop: "1px solid var(--border)", background: "var(--bg)" }}>
        {exIndex < routine.exercises.length - 1 ? (
          <button onClick={() => setExIndex(exIndex + 1)} className="flex-1 py-3 rounded-full font-semibold text-sm flex items-center justify-center gap-1.5" style={{ background: "var(--card-alt)" }}>
            Next exercise <ChevronRight size={16} />
          </button>
        ) : <div className="flex-1" />}
        <button onClick={() => onFinish({ log, elapsed, totalVolume })} className="rw-btn-primary flex-1 py-3 rounded-full font-semibold text-sm">
          {allDone ? "Finish workout" : "End workout"}
        </button>
      </div>
    </div>
  );
}

function computePRs(sessions) {
  const prs = {};
  for (const s of sessions) {
    for (const ex of s.exercises) {
      for (const set of ex.sets) {
        if (!set.completed) continue;
        const est1rm = estimate1RM(set.weight, set.reps);
        if (!prs[ex.exerciseId] || set.weight > prs[ex.exerciseId].weight) {
          prs[ex.exerciseId] = { name: ex.name, weight: set.weight, reps: set.reps, est1rm, date: s.date };
        }
      }
    }
  }
  return prs;
}

function Workouts({ routines, sessions, saveRoutine, deleteRoutine, saveSession, launchRoutine, activeRoutine, setActiveRoutine }) {
  const [view, setView] = useState("routines"); // routines | exercises | history | prs
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState(null);
  const [openSession, setOpenSession] = useState(null);
  const [exMuscle, setExMuscle] = useState("All");
  const [exQuery, setExQuery] = useState("");
  const [justFinished, setJustFinished] = useState(null);

  const prs = useMemo(() => computePRs(sessions), [sessions]);

  const filteredExercises = useMemo(() => EXERCISES.filter(e =>
    (exMuscle === "All" || e.muscle === exMuscle) && (exQuery.trim() === "" || e.name.toLowerCase().includes(exQuery.toLowerCase()))
  ), [exMuscle, exQuery]);

  const finishWorkout = ({ log, elapsed, totalVolume }) => {
    const session = {
      id: uid(), routineId: activeRoutine.id, routineName: activeRoutine.name, date: todayStr(),
      durationSec: elapsed, exercises: log, totalVolume,
    };
    const priorPRs = computePRs(sessions);
    const newPRs = [];
    for (const ex of log) {
      for (const set of ex.sets) {
        if (set.completed && (!priorPRs[ex.exerciseId] || set.weight > priorPRs[ex.exerciseId].weight)) {
          newPRs.push({ name: ex.name, weight: set.weight });
        }
      }
    }
    saveSession(session);
    setActiveRoutine(null);
    setJustFinished({ session, newPRs: Array.from(new Map(newPRs.map(p => [p.name, p])).values()) });
  };

  if (activeRoutine) {
    return <ActiveWorkout routine={activeRoutine} sessions={sessions} onFinish={finishWorkout} onCancel={() => setActiveRoutine(null)} />;
  }

  return (
    <div className="px-5 md:px-8 pb-28 md:pb-10 pt-6 md:pt-2 max-w-5xl mx-auto">
      <TopBar title="Workouts" right={
        <button onClick={() => { setEditingRoutine(null); setBuilderOpen(true); }} className="rw-btn-primary px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1.5"><Plus size={16} />New routine</button>
      } />
      <div className="flex md:hidden items-center justify-between mb-4">
        <h1 className="rw-display font-bold text-2xl">Workouts</h1>
        <button onClick={() => { setEditingRoutine(null); setBuilderOpen(true); }} className="rw-btn-primary w-10 h-10 rounded-full flex items-center justify-center"><Plus size={18} /></button>
      </div>

      <div className="flex gap-2 mb-5 overflow-x-auto rw-scroll">
        <Pill active={view === "routines"} onClick={() => setView("routines")}>Routines</Pill>
        <Pill active={view === "exercises"} onClick={() => setView("exercises")}>Exercises</Pill>
        <Pill active={view === "history"} onClick={() => setView("history")}>History</Pill>
        <Pill active={view === "prs"} onClick={() => setView("prs")}>Records</Pill>
      </div>

      {view === "routines" && (
        routines.length === 0 ? (
          <EmptyState icon={<Dumbbell size={26} />} title="Ready to put in the work?" sub="Build your first routine — Push Day, Leg Day, whatever gets you moving." actionLabel="Build a routine" onAction={() => setBuilderOpen(true)} />
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {routines.map((r) => (
              <Card key={r.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold rw-display">{r.name}</p>
                    <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{r.exercises.length} exercises · {r.exercises.reduce((s, e) => s + e.sets, 0)} sets</p>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingRoutine(r); setBuilderOpen(true); }} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--card-alt)" }}><Edit2 size={12} /></button>
                    <button onClick={() => deleteRoutine(r.id)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--card-alt)" }}><Trash2 size={12} color="var(--danger)" /></button>
                  </div>
                </div>
                <p className="text-xs mb-3 truncate" style={{ color: "var(--text-secondary)" }}>{r.exercises.map(e => e.name).join(" · ")}</p>
                <button onClick={() => launchRoutine(r)} className="rw-btn-primary w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5"><Play size={14} fill="#fff" />Start Workout</button>
              </Card>
            ))}
          </div>
        )
      )}

      {view === "exercises" && (
        <div>
          <div className="relative mb-3">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
            <TextInput placeholder="Search exercises..." value={exQuery} onChange={(e) => setExQuery(e.target.value)} className="pl-10" />
          </div>
          <div className="flex gap-2 mb-4 overflow-x-auto rw-scroll pb-1">
            <Pill active={exMuscle === "All"} onClick={() => setExMuscle("All")}>All</Pill>
            {MUSCLES.map((m) => <Pill key={m} active={exMuscle === m} onClick={() => setExMuscle(m)}>{m}</Pill>)}
          </div>
          <div className="grid md:grid-cols-2 gap-2">
            {filteredExercises.map((e) => (
              <Card key={e.id} className="p-3.5">
                <p className="font-semibold text-sm">{e.name}</p>
                <p className="text-xs mb-1.5" style={{ color: "var(--text-tertiary)" }}>{e.muscle}{e.secondary.length ? " + " + e.secondary.join(", ") : ""} · {e.equipment}</p>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{e.instructions}</p>
                <div className="flex gap-1.5 mt-2">
                  <span className="rw-fs-10 px-2 py-0.5 rounded-full" style={{ background: "var(--card-alt)", color: "var(--text-tertiary)" }}>{e.type}</span>
                  <span className="rw-fs-10 px-2 py-0.5 rounded-full" style={{ background: "var(--card-alt)", color: "var(--text-tertiary)" }}>{e.difficulty}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {view === "history" && (
        sessions.length === 0 ? (
          <EmptyState icon={<Clock size={26} />} title="No workouts logged yet" sub="Complete a workout and it'll show up here." />
        ) : (
          <div className="flex flex-col gap-2">
            {[...sessions].sort((a, b) => b.date.localeCompare(a.date)).map((s) => (
              <button key={s.id} onClick={() => setOpenSession(s)} className="rw-card rounded-xl p-4 text-left flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{s.routineName}</p>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{dateLabel(s.date)} · {Math.round(s.durationSec / 60)} min</p>
                </div>
                <span className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>{Math.round(s.totalVolume).toLocaleString()} kg vol</span>
              </button>
            ))}
          </div>
        )
      )}

      {view === "prs" && (
        Object.keys(prs).length === 0 ? (
          <EmptyState icon={<Trophy size={26} />} title="No records yet" sub="Your personal records will appear here as you train." />
        ) : (
          <div className="grid md:grid-cols-2 gap-2">
            {Object.entries(prs).sort((a, b) => b[1].weight - a[1].weight).map(([id, pr]) => (
              <Card key={id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-sm">{pr.name}</p>
                  <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>{pr.reps} reps · Est. 1RM {pr.est1rm}kg</p>
                </div>
                <div className="text-right flex items-center gap-1.5">
                  <Trophy size={15} color="var(--primary)" />
                  <span className="rw-display font-bold">{pr.weight}kg</span>
                </div>
              </Card>
            ))}
          </div>
        )
      )}

      {builderOpen && (
        <RoutineBuilder existing={editingRoutine} onClose={() => setBuilderOpen(false)} onSave={(r) => { saveRoutine(r); setBuilderOpen(false); }} />
      )}

      {openSession && (
        <Sheet title={openSession.routineName} onClose={() => setOpenSession(null)}>
          <p className="text-xs mb-4" style={{ color: "var(--text-secondary)" }}>{dateLabel(openSession.date)} · {Math.round(openSession.durationSec / 60)} min · {Math.round(openSession.totalVolume).toLocaleString()} kg total volume</p>
          {openSession.exercises.map((ex, i) => (
            <div key={i} className="mb-4">
              <p className="font-semibold text-sm mb-1.5">{ex.name}</p>
              <div className="flex flex-wrap gap-1.5">
                {ex.sets.map((s, j) => (
                  <span key={j} className="text-xs px-2 py-1 rounded-lg" style={{ background: s.completed ? "var(--card-alt)" : "var(--track)", color: s.completed ? "var(--text-primary)" : "var(--text-tertiary)" }}>{s.weight}kg × {s.reps}</span>
                ))}
              </div>
            </div>
          ))}
        </Sheet>
      )}

      {justFinished && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-6" style={{ background: "rgba(10,10,12,0.6)" }} onClick={() => setJustFinished(null)}>
          <Card className="rw-pop p-7 max-w-sm w-full text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "linear-gradient(135deg, var(--primary), var(--secondary))" }}>
              <Check size={28} color="#fff" />
            </div>
            <h3 className="rw-display font-bold text-xl mb-1">Workout complete</h3>
            <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>{Math.round(justFinished.session.totalVolume).toLocaleString()} kg total volume · {Math.round(justFinished.session.durationSec / 60)} min</p>
            {justFinished.newPRs.length > 0 && (
              <div className="rounded-xl p-3 mb-4" style={{ background: "var(--card-alt)" }}>
                <p className="text-xs font-semibold mb-1.5" style={{ color: "var(--primary)" }}>🏆 New personal records</p>
                {justFinished.newPRs.map((p, i) => <p key={i} className="text-sm font-medium">{p.name} — {p.weight}kg</p>)}
              </div>
            )}
            <button onClick={() => setJustFinished(null)} className="rw-btn-primary w-full py-3 rounded-full font-semibold text-sm">Done</button>
          </Card>
        </div>
      )}
    </div>
  );
}

/* ============================================================================
   PROGRESS
============================================================================ */
function Progress({ profile, measurements, addMeasurement, sessions, foodLog }) {
  const [showAdd, setShowAdd] = useState(false);

  const weightData = useMemo(() => {
    const sorted = [...measurements].sort((a, b) => a.date.localeCompare(b.date));
    let rolling = [];
    return sorted.map((m, i) => {
      rolling.push(m.weightKg);
      if (rolling.length > 7) rolling.shift();
      const avg = rolling.reduce((a, b) => a + b, 0) / rolling.length;
      return { date: m.date.slice(5), weight: round1(m.weightKg), avg: round1(avg) };
    });
  }, [measurements]);

  const latest = measurements.length ? [...measurements].sort((a, b) => b.date.localeCompare(a.date))[0] : null;
  const starting = measurements.length ? [...measurements].sort((a, b) => a.date.localeCompare(b.date))[0] : null;

  const volumeData = useMemo(() => {
    const byWeek = {};
    for (const s of sessions) {
      const d = new Date(s.date + "T00:00:00");
      const week = `W${Math.ceil(d.getDate() / 7)} ${d.toLocaleDateString(undefined, { month: "short" })}`;
      byWeek[week] = (byWeek[week] || 0) + s.totalVolume;
    }
    return Object.entries(byWeek).slice(-8).map(([week, vol]) => ({ week, vol: Math.round(vol) }));
  }, [sessions]);

  const calorieTrend = useMemo(() => {
    const dates = Object.keys(foodLog).sort().slice(-14);
    return dates.map((d) => {
      const day = foodLog[d];
      const cal = [...day.breakfast, ...day.lunch, ...day.dinner, ...day.snacks].reduce((s, e) => s + e.calories, 0);
      return { date: d.slice(5), cal, target: profile.calorieTarget };
    });
  }, [foodLog, profile]);

  const workoutFreq = useMemo(() => {
    const last30 = sessions.filter(s => (Date.now() - new Date(s.date).getTime()) < 30 * 86400000);
    return last30.length;
  }, [sessions]);

  return (
    <div className="px-5 md:px-8 pb-28 md:pb-10 pt-6 md:pt-2 max-w-5xl mx-auto">
      <TopBar title="Progress" right={
        <button onClick={() => setShowAdd(true)} className="rw-btn-primary px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-1.5"><Plus size={16} />Add weigh-in</button>
      } />
      <div className="flex md:hidden items-center justify-between mb-5">
        <h1 className="rw-display font-bold text-2xl">Progress</h1>
        <button onClick={() => setShowAdd(true)} className="rw-btn-primary w-10 h-10 rounded-full flex items-center justify-center"><Plus size={18} /></button>
      </div>

      {measurements.length === 0 ? (
        <EmptyState icon={<TrendingUp size={26} />} title="Your journey starts here" sub="Add your first weigh-in to start tracking progress." actionLabel="Add your first weigh-in" onAction={() => setShowAdd(true)} />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-5">
            <Card className="p-4 text-center">
              <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>Current</p>
              <p className="rw-display font-bold text-lg">{fmtWeight(latest.weightKg, profile.units)}</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>Starting</p>
              <p className="rw-display font-bold text-lg">{fmtWeight(starting.weightKg, profile.units)}</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-xs mb-1" style={{ color: "var(--text-secondary)" }}>Goal</p>
              <p className="rw-display font-bold text-lg">{profile.targetWeightKg ? fmtWeight(profile.targetWeightKg, profile.units) : "—"}</p>
            </Card>
          </div>

          <Card className="p-5 mb-4">
            <SectionTitle right={<span className="text-xs" style={{ color: "var(--text-tertiary)" }}>7-day rolling average</span>}>Weight trend</SectionTitle>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={weightData}>
                <defs>
                  <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--text-tertiary)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--text-tertiary)" }} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }} />
                <Area type="monotone" dataKey="avg" stroke="var(--primary)" strokeWidth={2.5} fill="url(#weightGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="p-5">
          <SectionTitle>Calorie trend</SectionTitle>
          {calorieTrend.length === 0 ? <p className="text-sm py-6 text-center" style={{ color: "var(--text-tertiary)" }}>Log some meals to see this chart.</p> : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={calorieTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--text-tertiary)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--text-tertiary)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }} />
                <Line type="monotone" dataKey="cal" stroke="var(--secondary)" strokeWidth={2.5} dot={false} />
                <Line type="monotone" dataKey="target" stroke="var(--text-tertiary)" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-5">
          <SectionTitle right={<span className="text-xs" style={{ color: "var(--text-tertiary)" }}>{workoutFreq} workouts / 30d</span>}>Training volume</SectionTitle>
          {volumeData.length === 0 ? <p className="text-sm py-6 text-center" style={{ color: "var(--text-tertiary)" }}>Complete workouts to see volume trends.</p> : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={volumeData}>
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: "var(--text-tertiary)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12 }} />
                <RBar dataKey="vol" fill="var(--secondary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {showAdd && (
        <Sheet title="Add weigh-in" onClose={() => setShowAdd(false)}>
          <MeasurementForm units={profile.units} onSave={(m) => { addMeasurement(m); setShowAdd(false); }} />
        </Sheet>
      )}
    </div>
  );
}
function MeasurementForm({ units, onSave }) {
  const [weight, setWeight] = useState("");
  const [bf, setBf] = useState("");
  const [waist, setWaist] = useState("");
  const valid = weight !== "";
  return (
    <div>
      <Field label={`Weight (${units === "imperial" ? "lb" : "kg"})`}><TextInput type="number" value={weight} onChange={(e) => setWeight(e.target.value)} autoFocus /></Field>
      <Field label="Body fat % (optional)"><TextInput type="number" value={bf} onChange={(e) => setBf(e.target.value)} /></Field>
      <Field label={`Waist (optional, ${units === "imperial" ? "in" : "cm"})`}><TextInput type="number" value={waist} onChange={(e) => setWaist(e.target.value)} /></Field>
      <button disabled={!valid} onClick={() => {
        const weightKg = units === "imperial" ? lbToKg(parseFloat(weight)) : parseFloat(weight);
        onSave({ id: uid(), date: todayStr(), weightKg, bodyFatPct: bf ? parseFloat(bf) : null, waist: waist ? parseFloat(waist) : null });
      }} className="rw-btn-primary w-full py-3 rounded-full font-semibold text-sm mt-1 disabled:opacity-40">Save</button>
    </div>
  );
}

/* ============================================================================
   PROFILE / SETTINGS
============================================================================ */
function ProfileScreen({ profile, updateProfile, theme, setTheme, onReset }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(profile);
  useEffect(() => setForm(profile), [profile]);
  const set = (k, v) => setForm((d) => ({ ...d, [k]: v }));

  const recalced = useMemo(() => calcTargets(form), [form]);

  const saveEdits = () => {
    updateProfile({ ...form, calorieTarget: form.customMacros ? profile.calorieTarget : recalced.calories,
      macroTargets: form.customMacros ? profile.macroTargets : { protein: recalced.protein, carbs: recalced.carbs, fat: recalced.fat } });
    setEditing(false);
  };

  const exportData = async () => {
    const all = {};
    for (const [k, storageKey] of Object.entries(KEYS)) all[k] = await loadKey(storageKey, null);
    const blob = new Blob([JSON.stringify(all, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "rework-data.json"; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="px-5 md:px-8 pb-28 md:pb-10 pt-6 md:pt-2 max-w-3xl mx-auto">
      <TopBar title="Profile" />
      <h1 className="rw-display font-bold text-2xl mb-5 md:hidden">Profile</h1>

      <Card className="p-5 mb-4 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0" style={{ background: "linear-gradient(135deg, var(--primary), var(--secondary))", color: "#fff" }}>
          {(profile.name || "?")[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-lg truncate">{profile.name}</p>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>{GOALS.find(g => g.id === profile.goal)?.label} · {profile.activityLevel && ACTIVITY_LEVELS.find(a => a.id === profile.activityLevel)?.label}</p>
        </div>
        <button onClick={() => setEditing(!editing)} className="px-3.5 py-2 rounded-full text-xs font-semibold flex-shrink-0" style={{ background: "var(--card-alt)" }}>{editing ? "Cancel" : "Edit"}</button>
      </Card>

      {editing ? (
        <Card className="p-5 mb-4">
          <SectionTitle>Edit profile</SectionTitle>
          <Field label="Name"><TextInput value={form.name} onChange={(e) => set("name", e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Age"><TextInput type="number" value={form.age} onChange={(e) => set("age", parseFloat(e.target.value) || 0)} /></Field>
            <Field label="Sex">
              <select value={form.sex} onChange={(e) => set("sex", e.target.value)} className="rw-input w-full rounded-xl px-3.5 py-2.5 text-sm">
                <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Height (cm)"><TextInput type="number" value={form.heightCm} onChange={(e) => set("heightCm", parseFloat(e.target.value) || 0)} /></Field>
            <Field label="Weight (kg)"><TextInput type="number" value={form.weightKg} onChange={(e) => set("weightKg", parseFloat(e.target.value) || 0)} /></Field>
          </div>
          <Field label="Activity level">
            <select value={form.activityLevel} onChange={(e) => set("activityLevel", e.target.value)} className="rw-input w-full rounded-xl px-3.5 py-2.5 text-sm">
              {ACTIVITY_LEVELS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
            </select>
          </Field>
          <Field label="Goal">
            <select value={form.goal} onChange={(e) => set("goal", e.target.value)} className="rw-input w-full rounded-xl px-3.5 py-2.5 text-sm">
              {GOALS.map(g => <option key={g.id} value={g.id}>{g.label}</option>)}
            </select>
          </Field>
          <Card className="p-4 mb-4" style={{ background: "var(--card-alt)", border: "none" }}>
            <p className="text-xs mb-2" style={{ color: "var(--text-secondary)" }}>Recalculated target</p>
            <p className="font-bold text-lg mb-1">{recalced.calories.toLocaleString()} kcal · P{recalced.protein} C{recalced.carbs} F{recalced.fat}</p>
            <p className="text-xs" style={{ color: "var(--text-tertiary)" }}>BMR {recalced.bmr} · TDEE {recalced.tdee} · Est. {recalced.weeklyDeltaKg > 0 ? "+" : ""}{recalced.weeklyDeltaKg} kg/week</p>
          </Card>
          <button onClick={saveEdits} className="rw-btn-primary w-full py-3 rounded-full font-semibold text-sm">Save changes</button>
        </Card>
      ) : (
        <Card className="p-5 mb-4">
          <SectionTitle>Daily targets</SectionTitle>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div><p className="text-xs mb-1" style={{ color: "var(--text-tertiary)" }}>Calories</p><p className="font-bold text-sm">{profile.calorieTarget}</p></div>
            <div><p className="text-xs mb-1" style={{ color: "var(--protein)" }}>Protein</p><p className="font-bold text-sm">{profile.macroTargets.protein}g</p></div>
            <div><p className="text-xs mb-1" style={{ color: "var(--carbs)" }}>Carbs</p><p className="font-bold text-sm">{profile.macroTargets.carbs}g</p></div>
            <div><p className="text-xs mb-1" style={{ color: "var(--fat)" }}>Fat</p><p className="font-bold text-sm">{profile.macroTargets.fat}g</p></div>
          </div>
        </Card>
      )}

      <Card className="p-5 mb-4">
        <SectionTitle>Appearance</SectionTitle>
        <div className="flex gap-2">
          <Pill active={theme === "light"} onClick={() => setTheme("light")}><span className="flex items-center gap-1.5"><Sun size={13} />Light</span></Pill>
          <Pill active={theme === "dark"} onClick={() => setTheme("dark")}><span className="flex items-center gap-1.5"><Moon size={13} />Dark</span></Pill>
        </div>
      </Card>

      <Card className="p-5 mb-4">
        <SectionTitle>Units</SectionTitle>
        <div className="flex gap-2">
          <Pill active={profile.units === "metric"} onClick={() => updateProfile({ units: "metric" })}>Metric</Pill>
          <Pill active={profile.units === "imperial"} onClick={() => updateProfile({ units: "imperial" })}>Imperial</Pill>
        </div>
      </Card>

      <Card className="p-5 mb-4">
        <SectionTitle>Data</SectionTitle>
        <button onClick={exportData} className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 mb-2" style={{ background: "var(--card-alt)" }}><Download size={15} />Export my data (JSON)</button>
        <button onClick={onReset} className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2" style={{ background: "var(--card-alt)", color: "var(--danger)" }}><Trash2 size={15} />Reset all data</button>
      </Card>

      <p className="text-xs text-center mt-4" style={{ color: "var(--text-tertiary)" }}>Rework · Eat. Train. Rework.</p>
    </div>
  );
}

/* ============================================================================
   ROOT APP
============================================================================ */
export default function ReworkApp() {
  const [loaded, setLoaded] = useState(false);
  const [profile, setProfile] = useState(null);
  const [foodLog, setFoodLog] = useState({});
  const [customFoods, setCustomFoods] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [routines, setRoutines] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [measurements, setMeasurements] = useState([]);
  const [theme, setThemeState] = useState("light");
  const [tab, setTab] = useState("home");
  const [showFoodSearchGlobal, setShowFoodSearchGlobal] = useState(false);
  const [globalPickedFood, setGlobalPickedFood] = useState(null);
  const [showCustomGlobal, setShowCustomGlobal] = useState(false);
  const [showPhotoLogGlobal, setShowPhotoLogGlobal] = useState(false);
  const [activeRoutine, setActiveRoutine] = useState(null);

  useEffect(() => {
    (async () => {
      const [p, fl, cf, fav, rt, ss, ms] = await Promise.all([
        loadKey(KEYS.profile, null), loadKey(KEYS.foodlog, {}), loadKey(KEYS.customFoods, []),
        loadKey(KEYS.favorites, []), loadKey(KEYS.routines, []), loadKey(KEYS.sessions, []), loadKey(KEYS.measurements, []),
      ]);
      setProfile(p); setFoodLog(fl); setCustomFoods(cf); setFavorites(fav); setRoutines(rt); setSessions(ss); setMeasurements(ms);
      if (p?.theme) setThemeState(p.theme);
      setLoaded(true);
    })();
  }, []);

  const setTheme = (t) => { setThemeState(t); if (profile) updateProfile({ theme: t }); };

  const completeOnboarding = (data) => {
    const targets = calcTargets(data);
    const newProfile = {
      ...data, onboarded: true, theme: "light", customMacros: false,
      calorieTarget: targets.calories, macroTargets: { protein: targets.protein, carbs: targets.carbs, fat: targets.fat },
      createdAt: Date.now(),
    };
    setProfile(newProfile); saveKey(KEYS.profile, newProfile);
  };
  const updateProfile = (patch) => setProfile((p) => { const np = { ...p, ...patch }; saveKey(KEYS.profile, np); return np; });

  const addFoodEntry = (date, meal, entry) => setFoodLog((fl) => {
    const day = fl[date] || { breakfast: [], lunch: [], dinner: [], snacks: [] };
    const nfl = { ...fl, [date]: { ...day, [meal]: [...day[meal], entry] } };
    saveKey(KEYS.foodlog, nfl); return nfl;
  });
  const removeFoodEntry = (date, meal, id) => setFoodLog((fl) => {
    const day = fl[date]; if (!day) return fl;
    const nfl = { ...fl, [date]: { ...day, [meal]: day[meal].filter((e) => e.id !== id) } };
    saveKey(KEYS.foodlog, nfl); return nfl;
  });
  const copyDay = (fromDate, toDate) => setFoodLog((fl) => {
    const from = fl[fromDate]; if (!from) return fl;
    const to = fl[toDate] || { breakfast: [], lunch: [], dinner: [], snacks: [] };
    const clone = (arr) => arr.map((e) => ({ ...e, id: uid(), loggedAt: Date.now() }));
    const nfl = { ...fl, [toDate]: { breakfast: [...to.breakfast, ...clone(from.breakfast)], lunch: [...to.lunch, ...clone(from.lunch)], dinner: [...to.dinner, ...clone(from.dinner)], snacks: [...to.snacks, ...clone(from.snacks)] } };
    saveKey(KEYS.foodlog, nfl); return nfl;
  });
  const addCustomFood = (f) => setCustomFoods((cf) => { const n = [...cf, f]; saveKey(KEYS.customFoods, n); return n; });
  const toggleFavorite = (id) => setFavorites((fav) => { const n = fav.includes(id) ? fav.filter((x) => x !== id) : [...fav, id]; saveKey(KEYS.favorites, n); return n; });
  const saveRoutine = (r) => setRoutines((rs) => { const exists = rs.some((x) => x.id === r.id); const n = exists ? rs.map((x) => x.id === r.id ? r : x) : [...rs, r]; saveKey(KEYS.routines, n); return n; });
  const deleteRoutine = (id) => setRoutines((rs) => { const n = rs.filter((x) => x.id !== id); saveKey(KEYS.routines, n); return n; });
  const saveSession = (s) => {
    setSessions((ss) => { const n = [...ss, s]; saveKey(KEYS.sessions, n); return n; });
    setRoutines((rs) => { const n = rs.map((r) => r.id === s.routineId ? { ...r, lastUsed: s.date } : r); saveKey(KEYS.routines, n); return n; });
  };
  const addMeasurement = (m) => setMeasurements((ms) => { const n = [...ms, m]; saveKey(KEYS.measurements, n); return n; });

  const launchRoutine = (r) => setActiveRoutine(r);
  const openFoodSearch = () => setShowFoodSearchGlobal(true);
  const openPhotoLog = () => setShowPhotoLogGlobal(true);

  const resetAll = async () => {
    for (const k of Object.values(KEYS)) {
      await storageDeleteKey(k);
    }
    window.location.reload();
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: "var(--bg)" }}>
        <style>{GOOGLE_FONTS + THEME_CSS}</style>
        <div className="w-12 h-12 rounded-2xl animate-pulse" style={{ background: "linear-gradient(135deg, var(--primary), var(--secondary))" }} />
      </div>
    );
  }

  if (!profile || !profile.onboarded) {
    return (
      <div data-theme="light" className="rework-root min-h-screen">
        <style>{GOOGLE_FONTS + THEME_CSS}</style>
        <Onboarding onComplete={completeOnboarding} />
      </div>
    );
  }

  const todayEntry = (f) => {
    setGlobalPickedFood(f);
    setShowFoodSearchGlobal(false);
  };

  return (
    <div data-theme={theme} className="rework-root min-h-screen">
      <style>{GOOGLE_FONTS + THEME_CSS}</style>
      <div className="flex">
        <Sidebar tab={tab} setTab={setTab} profile={profile} />
        <div className="flex-1 min-w-0">
          {tab === "home" && (
            <Home profile={profile} foodLog={foodLog} routines={routines} sessions={sessions} measurements={measurements}
              setTab={setTab} openFoodSearch={openFoodSearch} startWorkout={launchRoutine} openPhotoLog={openPhotoLog} />
          )}
          {tab === "nutrition" && (
            <Nutrition profile={profile} foodLog={foodLog} customFoods={customFoods} favorites={favorites}
              addFoodEntry={addFoodEntry} removeFoodEntry={removeFoodEntry} addCustomFood={addCustomFood}
              toggleFavorite={toggleFavorite} copyDay={copyDay} openPhotoLog={openPhotoLog} />
          )}
          {tab === "workouts" && (
            <Workouts routines={routines} sessions={sessions} saveRoutine={saveRoutine} deleteRoutine={deleteRoutine}
              saveSession={saveSession} launchRoutine={launchRoutine} activeRoutine={activeRoutine} setActiveRoutine={setActiveRoutine} />
          )}
          {tab === "progress" && (
            <Progress profile={profile} measurements={measurements} addMeasurement={addMeasurement} sessions={sessions} foodLog={foodLog} />
          )}
          {tab === "profile" && (
            <ProfileScreen profile={profile} updateProfile={updateProfile} theme={theme} setTheme={setTheme} onReset={resetAll} />
          )}
        </div>
      </div>
      <BottomNav tab={tab} setTab={setTab} />

      {showFoodSearchGlobal && (
        <FoodSearchSheet onClose={() => setShowFoodSearchGlobal(false)} foods={FOODS} customFoods={customFoods} favorites={favorites} onPick={todayEntry}
          onCreateCustom={() => { setShowFoodSearchGlobal(false); setShowCustomGlobal(true); }} />
      )}
      {globalPickedFood && (
        <FoodDetailSheet food={globalPickedFood} onClose={() => setGlobalPickedFood(null)} isFavorite={favorites.includes(globalPickedFood.id)}
          onToggleFavorite={toggleFavorite}
          onConfirm={({ meal, qty, scaled }) => {
            addFoodEntry(todayStr(), meal, { id: uid(), name: globalPickedFood.name, foodId: globalPickedFood.id, qty, unit: globalPickedFood.servingUnit, calories: scaled.calories, protein: scaled.protein, carbs: scaled.carbs, fat: scaled.fat, loggedAt: Date.now() });
            setGlobalPickedFood(null);
          }} />
      )}
      {showCustomGlobal && (
        <CustomFoodSheet onClose={() => setShowCustomGlobal(false)} onSave={(f) => { addCustomFood(f); setShowCustomGlobal(false); setGlobalPickedFood(f); }} />
      )}
      {showPhotoLogGlobal && (
        <PhotoLogSheet onClose={() => setShowPhotoLogGlobal(false)}
          onLog={({ meal, result }) => {
            addFoodEntry(todayStr(), meal, {
              id: uid(), name: result.foodName, foodId: null,
              qty: "", unit: result.servingDescription || "estimated serving",
              calories: result.calories, protein: result.protein, carbs: result.carbs, fat: result.fat,
              loggedAt: Date.now(), source: "photo",
            });
            setShowPhotoLogGlobal(false);
          }} />
      )}
    </div>
  );
}
