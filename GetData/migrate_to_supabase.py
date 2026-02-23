"""
Migrate prices.json data to Supabase.

Usage:
  pip install supabase
  export SUPABASE_URL=https://xxxxx.supabase.co
  export SUPABASE_SERVICE_KEY=eyJhbGciOi...
  python GetData/migrate_to_supabase.py
"""

import json
import os
from pathlib import Path
from supabase import create_client

SUPABASE_URL = "https://bpihrmnkwhpxmvvtbkos.supabase.co"
SUPABASE_SERVICE_KEY = "REDACTED"

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def main():
    prices_path = Path(__file__).parent / "prices.json"
    with open(prices_path, encoding="utf-8") as f:
        plans = json.load(f)

    print(f"Loaded {len(plans)} plans from prices.json")

    # 1. Extract unique providers and upsert them
    provider_names = sorted(set(p["provider"] for p in plans))
    print(f"Found {len(provider_names)} unique providers")

    for name in provider_names:
        supabase.table("providers").upsert(
            {"name": name},
            on_conflict="name"
        ).execute()
        print(f"  Upserted provider: {name}")

    # 2. Fetch all providers to get their IDs
    result = supabase.table("providers").select("id, name").execute()
    provider_map = {row["name"]: row["id"] for row in result.data}

    # 3. Upsert plans (skip duplicates by provider_id + plan_name)
    seen = set()
    inserted = 0
    skipped = 0

    for plan in plans:
        provider_id = provider_map[plan["provider"]]
        key = (provider_id, plan["plan"])

        if key in seen:
            skipped += 1
            print(f"  Skipping duplicate: {plan['provider']} - {plan['plan']}")
            continue
        seen.add(key)

        supabase.table("plans").upsert(
            {
                "provider_id": provider_id,
                "plan_name": plan["plan"],
                "tariff_type": plan["tariff_type"],
                "price_per_kwh": plan["price_per_kwh"],
                "monthly_fee_eur": plan["monthly_fee_eur"],
            },
            on_conflict="provider_id,plan_name"
        ).execute()
        inserted += 1

    print(f"\nDone! Inserted/updated {inserted} plans, skipped {skipped} duplicates.")

if __name__ == "__main__":
    main()
