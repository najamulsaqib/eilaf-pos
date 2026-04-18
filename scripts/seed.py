"""
Seed script — inserts 5000 products and 10000 bills into eilaf-pos SQLite DB.
Run: python3 scripts/seed.py
"""

import sqlite3
import random
import os
from datetime import datetime, timedelta

_DEFAULT_DB_PATH = os.path.expanduser(
    "~/Library/Application Support/eilaf-pos/eilaf-pos.db"
)
DB_PATH = os.environ.get("SQL_DB_PATH", _DEFAULT_DB_PATH)

if not os.path.exists(DB_PATH):
    raise FileNotFoundError(
        f"DB not found at:\n  {DB_PATH}\n"
        "Set SQL_DB_PATH or launch the app once first so it creates the database."
    )

# ── Data pools ────────────────────────────────────────────────────────────────
CATEGORIES = [
    "Grocery", "Bakery", "Dairy", "Beverages", "Snacks",
    "Household", "Personal Care", "Electronics", "Stationery", "Clothing",
    "Frozen Foods", "Meat & Poultry", "Fruits & Vegetables", "Confectionery", "Pharmacy",
]

UNITS = ["piece", "kg", "gram", "litre", "ml", "dozen", "box", "packet", "bottle", "can"]

PRODUCT_NOUNS = {
    "Grocery":             ["Rice", "Flour", "Sugar", "Salt", "Lentils", "Chickpeas", "Oil", "Spices", "Pasta", "Noodles"],
    "Bakery":              ["Bread", "Rolls", "Croissant", "Muffin", "Cake", "Biscuits", "Cookie", "Rusk", "Bagel", "Pita"],
    "Dairy":               ["Milk", "Butter", "Cheese", "Yogurt", "Cream", "Ghee", "Lassi", "Khoya", "Paneer", "Curd"],
    "Beverages":           ["Juice", "Water", "Tea", "Coffee", "Soda", "Energy Drink", "Smoothie", "Shake", "Squash", "Syrup"],
    "Snacks":              ["Chips", "Crackers", "Popcorn", "Pretzels", "Nuts", "Trail Mix", "Wafers", "Puffs", "Rings", "Sticks"],
    "Household":           ["Detergent", "Soap", "Bleach", "Cleaner", "Mop", "Sponge", "Brush", "Cloth", "Bag", "Spray"],
    "Personal Care":       ["Shampoo", "Conditioner", "Lotion", "Cream", "Gel", "Toothpaste", "Brush", "Razor", "Deo", "Powder"],
    "Electronics":         ["Battery", "Bulb", "Adapter", "Cable", "Charger", "Fan", "Torch", "Switch", "Socket", "Plug"],
    "Stationery":          ["Pen", "Pencil", "Notebook", "Eraser", "Ruler", "Tape", "Stapler", "Folder", "Marker", "Highlighter"],
    "Clothing":            ["Shirt", "Pants", "Socks", "Cap", "Scarf", "Gloves", "Jacket", "Belt", "Tie", "Vest"],
    "Frozen Foods":        ["Nuggets", "Fries", "Pizza", "Burger Patty", "Samosa", "Roll", "Ice Cream", "Paratha", "Kebab", "Spring Roll"],
    "Meat & Poultry":      ["Chicken", "Beef", "Mutton", "Fish", "Shrimp", "Mince", "Liver", "Seekh Kebab", "Wings", "Breast"],
    "Fruits & Vegetables": ["Apple", "Banana", "Mango", "Orange", "Potato", "Tomato", "Onion", "Garlic", "Carrot", "Spinach"],
    "Confectionery":       ["Chocolate", "Candy", "Toffee", "Lollipop", "Gummies", "Marshmallow", "Truffle", "Caramel", "Fudge", "Nougat"],
    "Pharmacy":            ["Panadol", "Disprin", "Multivitamin", "Bandage", "Antiseptic", "Antihistamine", "Antacid", "Cough Syrup", "Eye Drops", "Nasal Spray"],
}

ADJECTIVES    = ["Premium", "Fresh", "Organic", "Classic", "Ultra", "Natural", "Special",
                  "Super", "Deluxe", "Original", "Pure", "Royal", "Golden", "Silver", "Mega"]
BRAND_PREFIXES = ["Al-", "Pak-", "Super", "Mega", "Star", "Gold", "Top", "Best", "Pro-", "Maxx"]
SIZES          = ["250g", "500g", "1kg", "2kg", "200ml", "500ml", "1L", "6-pack", "Family", "Mini"]

CUSTOMERS = [
    "Ahmed Khan", "Fatima Ali", "Muhammad Hassan", "Ayesha Malik", "Usman Qureshi",
    "Sara Hussain", "Bilal Ahmed", "Najam UL Saqib", "Tariq Mahmood", "Nadia Siddiqui",
    "Kamran Javed", "Sana Butt", "Imran Raza", "Rabiya Habib", "Asad Mirza",
    None, None, None,  # ~17 % anonymous
]

# ── Connect ───────────────────────────────────────────────────────────────────
con = sqlite3.connect(DB_PATH)
cur = con.cursor()
cur.execute("PRAGMA journal_mode=WAL")
cur.execute("PRAGMA foreign_keys=ON")

# ── Current counters ──────────────────────────────────────────────────────────
cur.execute("SELECT COALESCE(MAX(CAST(REPLACE(bill_number,'BILL-','') AS INTEGER)), 0) FROM bills")
last_bill_num = cur.fetchone()[0]

cur.execute("SELECT name FROM products")
existing_names = {row[0] for row in cur.fetchall()}

cur.execute("SELECT COALESCE(MAX(id), 0) FROM products")
last_product_id = cur.fetchone()[0]

# ── Seed products ─────────────────────────────────────────────────────────────
TOTAL_PRODUCTS = 5000
print(f"Seeding {TOTAL_PRODUCTS} products...")

def make_name(category, seq):
    noun  = random.choice(PRODUCT_NOUNS.get(category, PRODUCT_NOUNS["Grocery"]))
    adj   = random.choice(ADJECTIVES)
    brand = random.choice(BRAND_PREFIXES)
    size  = random.choice(SIZES)
    return f"{brand}{adj} {noun} {size}"

products_inserted = []
product_rows = []
pricing_rows  = []

seq = last_product_id
for _ in range(TOTAL_PRODUCTS):
    seq += 1
    category = random.choice(CATEGORIES)

    name = make_name(category, seq)
    attempts = 0
    while name in existing_names and attempts < 20:
        name = make_name(category, seq)
        attempts += 1
    if name in existing_names:
        name = f"{name} #{seq}"
    existing_names.add(name)

    base_price = round(random.uniform(50, 5000), 2)
    days_ago   = random.randint(0, 365)
    created_at = (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d %H:%M:%S")
    barcode    = str(random.randint(1_000_000_000_000, 9_999_999_999_999)) if random.random() > 0.4 else None

    product_rows.append((name, base_price, category, 1, barcode, created_at))

cur.executemany(
    "INSERT INTO products (name, price, category, is_active, barcode, created_at) VALUES (?,?,?,?,?,?)",
    product_rows,
)
# Fetch the IDs we just inserted (they're contiguous)
cur.execute("SELECT id, price FROM products WHERE id > ?", (last_product_id,))
inserted = cur.fetchall()

for (pid, price) in inserted:
    num_options = random.randint(1, 3)
    used_units: set[str] = set()
    for o in range(num_options):
        unit = random.choice(UNITS)
        while unit in used_units:
            unit = random.choice(UNITS)
        used_units.add(unit)
        opt_price      = price if o == 0 else round(price * random.uniform(0.8, 1.4), 2)
        allows_decimal = 0 if unit == "piece" else 1
        is_default     = 1 if o == 0 else 0
        pricing_rows.append((pid, unit, opt_price, allows_decimal, is_default, o))
    products_inserted.append({"id": pid, "name": None, "price": price})

cur.executemany(
    "INSERT INTO product_pricing_options (product_id, unit, price, allows_decimal, is_default, sort_order) VALUES (?,?,?,?,?,?)",
    pricing_rows,
)

# Refresh product list with names for bill generation
cur.execute("SELECT id, name, price FROM products WHERE id > ?", (last_product_id,))
products_for_bills = cur.fetchall()  # list of (id, name, price)

print(f"✓ Inserted {len(products_for_bills)} products with {len(pricing_rows)} pricing options")

# ── Seed bills ────────────────────────────────────────────────────────────────
TOTAL_BILLS = 10000
print(f"Seeding {TOTAL_BILLS} bills...")

bill_counter = last_bill_num
bill_rows      = []
bill_item_rows = []

for _ in range(TOTAL_BILLS):
    bill_counter += 1
    bill_number   = f"BILL-{bill_counter:04d}"
    customer_name = random.choice(CUSTOMERS)

    num_items = random.randint(1, 8)
    chosen    = random.sample(products_for_bills, min(num_items, len(products_for_bills)))

    items = []
    for (pid, pname, pprice) in chosen:
        unit     = random.choice(UNITS)
        quantity = round(random.randint(1, 10) + (random.random() if random.random() > 0.7 else 0), 2)
        price    = round(pprice * random.uniform(0.9, 1.1), 2)
        total    = round(price * quantity, 2)
        items.append((pid, pname, unit, price, quantity, total))

    subtotal = round(sum(it[5] for it in items), 2)
    discount = round(subtotal * random.randint(5, 20) / 100, 2) if random.random() > 0.7 else 0.0
    total    = round(subtotal - discount, 2)

    days_ago   = random.randint(0, 180)
    hours_ago  = random.randint(0, 23)
    created_at = (datetime.now() - timedelta(days=days_ago, hours=hours_ago)).strftime("%Y-%m-%d %H:%M:%S")
    notes      = "Cash payment" if random.random() > 0.85 else None

    bill_rows.append((bill_number, customer_name, subtotal, discount, total, notes, created_at))

cur.executemany(
    "INSERT INTO bills (bill_number, customer_name, subtotal, discount, total, notes, created_at) VALUES (?,?,?,?,?,?,?)",
    bill_rows,
)

# Fetch the bill IDs we just inserted
cur.execute("SELECT id FROM bills WHERE bill_number >= ? ORDER BY id", (f"BILL-{last_bill_num+1:04d}",))
bill_ids = [row[0] for row in cur.fetchall()]

for i, (bid) in enumerate(bill_ids):
    chosen = random.sample(products_for_bills, min(random.randint(1, 8), len(products_for_bills)))
    for (pid, pname, pprice) in chosen:
        unit     = random.choice(UNITS)
        quantity = round(random.randint(1, 10) + (random.random() if random.random() > 0.7 else 0), 2)
        price    = round(pprice * random.uniform(0.9, 1.1), 2)
        total    = round(price * quantity, 2)
        bill_item_rows.append((bid, pid, pname, unit, price, quantity, total))

cur.executemany(
    "INSERT INTO bill_items (bill_id, product_id, name, unit, price, quantity, total) VALUES (?,?,?,?,?,?,?)",
    bill_item_rows,
)

print(f"✓ Inserted {len(bill_ids)} bills with {len(bill_item_rows)} line items")

con.commit()
con.close()
print("\nDone! Re-launch the app to see the seeded data.")
