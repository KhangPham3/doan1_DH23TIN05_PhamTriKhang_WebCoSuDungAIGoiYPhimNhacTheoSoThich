import random
import urllib.parse
from datetime import datetime, timedelta
from sqlalchemy import create_engine, text

# ==========================================
# CẤU HÌNH DATABASE
# ==========================================
conn_str = "DRIVER={ODBC Driver 17 for SQL Server};SERVER=localhost;DATABASE=RecommenderDB;UID=ADMIN;PWD=KhangPham2005"
params = urllib.parse.quote_plus(conn_str)
DB_URL = f"mssql+pyodbc:///?odbc_connect={params}"
engine = create_engine(DB_URL)

# ==========================================
# DỮ LIỆU MẪU CHUẨN (REAL IDs)
# ==========================================
MOVIE_IDS = ['299534', '27205', '157336', '496243', '129', '597', '634649', '238', '155', '680', '550', '13', '122', '603', '11', '808', '862', '284053', '24428', '99861', '100402', '118340', '284054', '389', '424']
MOVIE_GENRES = ['28', '12', '16', '35', '80', '99', '18', '10751', '14', '36', '27', '10402', '9648', '10749', '878']

SONG_IDS = ['kJQP7kiw5Fk', 'fJ9rUzIMcZQ', '9bZkp7q19f0', 'gdZLi9oWNZg', '4NRXx6U8ABQ', 'JGwWNGJdvx8', 'RgKAFK5djSk', '09R8_2nJtjg', '2Vv-BfVoq4g', 'CevxZvSJLk8', 'YQHsXMglC9A', 'lp-EO5I60KA', 'OPf0YbXqDm0', '0yW7w8F2TVA', 'PT2_F-1esPk', 'hT_nvWreIhg', '3JZ_D3ELwOQ', 'SlPhMPnQ58k']
SONG_GENRES = ['Pop', 'Rap', 'Ballad', 'R&B', 'EDM', 'Indie', 'Rock', 'Acoustic']

ACTION_TYPES = ['VIEW', 'VIEW', 'VIEW', 'LIKE', 'LIKE', 'DISLIKE', 'RATE_1', 'RATE_2', 'RATE_3', 'RATE_4', 'RATE_5']

def generate_random_date():
    end = datetime.now()
    start = end - timedelta(days=365)
    return start + timedelta(seconds=random.randint(0, int((end - start).total_seconds())))

def seed_data():
    with engine.connect() as conn:
        print("Xóa dữ liệu cũ để tránh trùng lặp...")
        conn.execute(text("DELETE FROM UserInteractions"))
        # Giữ lại admin, chỉ xóa user test (giả sử user test có email dạng test@)
        conn.execute(text("DELETE FROM Users WHERE Email LIKE 'testuser%@gmail.com'"))
        conn.commit()

        print("Đang tạo 50 Users...")
        user_ids = []
        for i in range(1, 51):
            username = f"testuser{i}"
            fullname = f"Người Dùng {i}"
            email = f"testuser{i}@gmail.com"
            gender = random.choice(['Nam', 'Nữ', 'Khác'])
            birth_year = random.randint(1980, 2008)
            
            query = text("""
                INSERT INTO Users (Username, PasswordHash, FullName, Email, BirthYear, Gender, IsOnboarded) 
                OUTPUT INSERTED.UserID
                VALUES (:u, 'hashed_pass', :f, :e, :b, :g, 1)
            """)
            result = conn.execute(query, {"u": username, "f": fullname, "e": email, "b": birth_year, "g": gender})
            user_ids.append(result.scalar())
        conn.commit()

        print("Đang tạo 1000+ Tương tác (Interactions) & Onboarding...")
        interactions = []
        for uid in user_ids:
            # 1. Sinh dữ liệu Onboarding (Sở thích ban đầu)
            num_movie_prefs = random.randint(2, 5)
            for genre in random.sample(MOVIE_GENRES, num_movie_prefs):
                interactions.append({"uid": uid, "iid": genre, "itype": "movie", "act": "PREFER_MOVIE", "dt": generate_random_date()})
                
            num_song_prefs = random.randint(2, 5)
            for genre in random.sample(SONG_GENRES, num_song_prefs):
                interactions.append({"uid": uid, "iid": genre, "itype": "song", "act": "PREFER_SONG", "dt": generate_random_date()})

            # 2. Sinh dữ liệu tương tác thực tế (View, Like, Dislike, Rate)
            num_interactions = random.randint(15, 30) # Mỗi user có 15-30 tương tác
            for _ in range(num_interactions):
                is_movie = random.choice([True, False])
                item_id = random.choice(MOVIE_IDS) if is_movie else random.choice(SONG_IDS)
                item_type = "movie" if is_movie else "song"
                action = random.choice(ACTION_TYPES)
                
                interactions.append({
                    "uid": uid, "iid": item_id, "itype": item_type, "act": action, "dt": generate_random_date()
                })

        # Insert hàng loạt vào DB
        insert_query = text("""
            INSERT INTO UserInteractions (UserID, ItemID, ItemType, ActionType, CreatedAt)
            VALUES (:uid, :iid, :itype, :act, :dt)
        """)
        conn.execute(insert_query, interactions)
        conn.commit()

        print(f"✅ Hoàn tất! Đã tạo 50 Users và {len(interactions)} records tương tác.")

if __name__ == "__main__":
    seed_data()