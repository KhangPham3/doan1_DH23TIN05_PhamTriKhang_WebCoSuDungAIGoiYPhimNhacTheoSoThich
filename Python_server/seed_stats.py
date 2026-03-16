import urllib.parse
import random
from sqlalchemy import create_engine, text

# ==========================================
# CẤU HÌNH DATABASE
# ==========================================
conn_str = "DRIVER={ODBC Driver 17 for SQL Server};SERVER=localhost;DATABASE=RecommenderDB;UID=ADMIN;PWD=KhangPham2005"
params = urllib.parse.quote_plus(conn_str)
DB_URL = f"mssql+pyodbc:///?odbc_connect={params}"
engine = create_engine(DB_URL)

def seed_stats():
    with engine.connect() as conn:
        print("Đang tổng hợp dữ liệu thống kê (ItemStats)...")
        
        # Đảm bảo bảng ItemStats tồn tại (Nếu chưa có thì tạo)
        create_table_query = """
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='ItemStats' and xtype='U')
        CREATE TABLE ItemStats (
            ItemID NVARCHAR(50) NOT NULL,
            ItemType NVARCHAR(20) NOT NULL,
            Views INT DEFAULT 0,
            Likes INT DEFAULT 0,
            Dislikes INT DEFAULT 0,
            AvgRating FLOAT DEFAULT 0,
            RateCount INT DEFAULT 0,
            PRIMARY KEY (ItemID, ItemType)
        )
        """
        conn.execute(text(create_table_query))
        conn.execute(text("DELETE FROM ItemStats"))
        conn.commit()

        # Lấy danh sách toàn bộ ItemID từ bảng Interactions
        items_query = text("SELECT DISTINCT ItemID, ItemType FROM UserInteractions WHERE ActionType NOT LIKE 'PREFER_%' AND ActionType != 'SEARCH'")
        items = conn.execute(items_query).fetchall()

        stats_data = []
        for item in items:
            # Tạo dữ liệu ngẫu nhiên nhưng trông thực tế
            views = random.randint(1000, 50000)
            likes = int(views * random.uniform(0.05, 0.15))
            dislikes = int(views * random.uniform(0.001, 0.02))
            rate_count = int(views * random.uniform(0.02, 0.08))
            avg_rating = round(random.uniform(3.5, 4.9), 1)

            stats_data.append({
                "iid": item[0],
                "itype": item[1],
                "v": views,
                "l": likes,
                "d": dislikes,
                "ar": avg_rating,
                "rc": rate_count
            })

        if stats_data:
            insert_query = text("""
                INSERT INTO ItemStats (ItemID, ItemType, Views, Likes, Dislikes, AvgRating, RateCount)
                VALUES (:iid, :itype, :v, :l, :d, :ar, :rc)
            """)
            conn.execute(insert_query, stats_data)
            conn.commit()

        print(f"✅ Hoàn tất! Đã tạo thống kê cho {len(stats_data)} tác phẩm phim & nhạc.")

if __name__ == "__main__":
    seed_stats()