"""
Truncate script — clears all products, pricing options, bills, and bill items.
Run: python3 scripts/truncate.py
"""

import sqlite3
import os

_DEFAULT_DB_PATH = os.path.expanduser(
    "~/Library/Application Support/eilaf-pos/eilaf-pos.db"
)
DB_PATH = os.environ.get("SQL_DB_PATH", _DEFAULT_DB_PATH)

if not os.path.exists(DB_PATH):
    raise FileNotFoundError(
        f"DB not found at:\n  {DB_PATH}\n"
        "Set SQL_DB_PATH or launch the app once first so it creates the database."
    )

confirm = input("This will delete ALL products and bills. Type 'yes' to continue: ")
if confirm.strip().lower() != "yes":
    print("Aborted.")
    exit(0)

con = sqlite3.connect(DB_PATH)
cur = con.cursor()
cur.execute("PRAGMA foreign_keys=OFF")

tables = ["bill_items", "bills", "product_pricing_options", "products"]
for table in tables:
    cur.execute(f"DELETE FROM {table}")
    cur.execute(f"DELETE FROM sqlite_sequence WHERE name='{table}'")
    print(f"✓ Cleared {table}")

con.commit()
con.close()
print("\nDone! Re-launch the app to reflect the changes.")
