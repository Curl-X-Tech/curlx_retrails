"""
Seed Fake Orders into PostgreSQL orders_db.

Generates 150 realistic orders using create_fake_orders.py and
persists them into the orders table in orders_db.
"""

import asyncio
from datetime import datetime, timezone
import os
import sys

import asyncpg

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from create_fake_orders import get_orders

DB_USER = os.getenv("POSTGRES_USER", "waypoint")
DB_PASS = os.getenv("POSTGRES_PASSWORD", "waypoint")
DB_HOST = os.getenv("POSTGRES_HOST", "127.0.0.1")
DB_PORT = os.getenv("POSTGRES_PORT", "5432")
DB_NAME = os.getenv("ORDERS_DB_NAME", "orders_db")


async def seed_orders(count: int = 150):
    print(f"Generating {count} fake orders using create_fake_orders.get_orders...")
    orders = get_orders(count=count)
    print(f"Generated {len(orders)} orders in memory.")

    # 1. Connect to PostgreSQL
    conn = await asyncpg.connect(
        user=DB_USER,
        password=DB_PASS,
        host=DB_HOST,
        port=DB_PORT,
        database=DB_NAME,
    )

    try:
        # 2. Ensure orders table exists
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS orders (
                "ID" VARCHAR(64) PRIMARY KEY,
                "CreateTime" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
                "UpdateTime" TIMESTAMP WITHOUT TIME ZONE NOT NULL,
                "CreatedBy" VARCHAR(64),
                "UpdatedBy" VARCHAR(64),
                "IsActive" BOOLEAN NOT NULL DEFAULT TRUE,
                outlet_id VARCHAR(64) NOT NULL,
                order_date DATE NOT NULL,
                order_time VARCHAR(10) NOT NULL,
                weight_kg DOUBLE PRECISION NOT NULL,
                volume_m3 DOUBLE PRECISION NOT NULL,
                temp_condition VARCHAR(20) NOT NULL,
                status VARCHAR(20) NOT NULL DEFAULT 'pending',
                allocation_day INTEGER
            );
            CREATE INDEX IF NOT EXISTS ix_orders_outlet_id ON orders(outlet_id);
            CREATE INDEX IF NOT EXISTS ix_orders_order_date ON orders(order_date);
            CREATE INDEX IF NOT EXISTS ix_orders_temp_condition ON orders(temp_condition);
            CREATE INDEX IF NOT EXISTS ix_orders_status ON orders(status);
        """)

        # 3. Insert or update the orders
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        inserted = 0

        for o in orders:
            order_time_str = (
                o.order_time.strftime("%H:%M")
                if hasattr(o.order_time, "strftime")
                else str(o.order_time)[:5]
            )

            await conn.execute(
                """
                INSERT INTO orders (
                    "ID", "CreateTime", "UpdateTime", "CreatedBy", "UpdatedBy", "IsActive",
                    outlet_id, order_date, order_time, weight_kg, volume_m3, temp_condition,
                    status, allocation_day
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                ON CONFLICT ("ID") DO UPDATE SET
                    "UpdateTime" = EXCLUDED."UpdateTime",
                    "UpdatedBy" = EXCLUDED."UpdatedBy",
                    "IsActive" = EXCLUDED."IsActive",
                    outlet_id = EXCLUDED.outlet_id,
                    order_date = EXCLUDED.order_date,
                    order_time = EXCLUDED.order_time,
                    weight_kg = EXCLUDED.weight_kg,
                    volume_m3 = EXCLUDED.volume_m3,
                    temp_condition = EXCLUDED.temp_condition,
                    status = EXCLUDED.status,
                    allocation_day = EXCLUDED.allocation_day;
                """,
                o.ID,
                now,
                now,
                "create_fake_orders",
                "create_fake_orders",
                True,
                o.outlet_id,
                o.order_date,
                order_time_str,
                float(o.weight_kg),
                float(o.volume_m3),
                str(o.temp_condition),
                getattr(o, "status", "pending") or "pending",
                getattr(o, "allocation_day", None),
            )
            inserted += 1

        print(f"Successfully upserted {inserted} orders into {DB_NAME}.orders.")

        # 4. Verification queries
        total_count = await conn.fetchval('SELECT count(*) FROM orders WHERE "IsActive" = true;')
        by_temp = await conn.fetch(
            'SELECT temp_condition, count(*) as count, round(sum(weight_kg)::numeric, 1) as total_weight '
            'FROM orders WHERE "IsActive" = true GROUP BY temp_condition ORDER BY count DESC;'
        )
        by_date = await conn.fetchval(
            'SELECT order_date FROM orders WHERE "IsActive" = true LIMIT 1;'
        )

        print("\n--- DB Verification ---")
        print(f"Total Active Orders in DB: {total_count}")
        print(f"Order Date: {by_date}")
        print("Breakdown by Temperature Condition:")
        for r in by_temp:
            print(f"  - {r['temp_condition']:<10}: {r['count']} orders, {r['total_weight']} kg")

    finally:
        await conn.close()


if __name__ == "__main__":
    count = 150
    if len(sys.argv) > 1:
        try:
            count = int(sys.argv[1])
        except ValueError:
            pass
    asyncio.run(seed_orders(count))
