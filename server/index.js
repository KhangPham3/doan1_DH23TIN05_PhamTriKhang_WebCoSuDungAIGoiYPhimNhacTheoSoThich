const express = require('express');
const cors = require('cors');
const sql = require('mssql');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

// Cấu hình Database
const dbConfig = {
    user: 'ADMIN', 
    password: 'KhangPham2005', 
    server: 'localhost', 
    port: 1433, 
    database: 'RecommenderDB', 
    options: {
        encrypt: false,
        trustServerCertificate: true,
    }
};

// ==========================================
// CÁC API NGƯỜI DÙNG (AUTH)
// ==========================================

// 1. API ĐĂNG KÝ
// 1. API ĐĂNG KÝ (Register) - Đã thêm Validate năm sinh
app.post('/api/register', async (req, res) => {
    const { username, password, fullName, email, birthYear, gender } = req.body;

    // --- 👇 LOGIC KIỂM TRA NĂM SINH (MỚI) 👇 ---
    const currentYear = new Date().getFullYear(); // Lấy năm hiện tại (ví dụ: 2026)
    const userBirthYear = parseInt(birthYear); // Chuyển đổi sang số nguyên cho chắc chắn

    // 1. Kiểm tra nếu nhập năm tương lai hoặc năm hiện tại
    if (userBirthYear >= currentYear) {
        return res.status(400).json({ 
            success: false, 
            message: "Năm sinh không hợp lệ!" 
        });
    }

    // 2. Kiểm tra độ tuổi (Phải >= 16 tuổi)
    if (currentYear - userBirthYear < 16) {
        return res.status(400).json({ 
            success: false, 
            message: "Bạn phải từ 16 tuổi trở lên để đăng ký tài khoản!" 
        });
    }   
    
    
        // --- 👆 HẾT PHẦN KIỂM TRA 👆 ---

    try {
        let pool = await sql.connect(dbConfig);
        
        // Kiểm tra xem user đã tồn tại chưa
        const checkUser = await pool.request()
            .input('Username', sql.VarChar(50), username)
            .query("SELECT * FROM Users WHERE Username = @Username");
            
        if (checkUser.recordset.length > 0) {
            return res.status(400).json({ success: false, message: "Tên đăng nhập đã tồn tại!" });
        }

        const checkEmail = await pool.request()
            .input('Email', sql.VarChar(100), email)
            .query("SELECT * FROM Users WHERE Email = @Email");

        if (checkEmail.recordset.length > 0) {
            return res.status(400).json({ success: false, message: "Email đã được sử dụng!" });
        }



        // Lưu vào SQL
        await pool.request()
            .input('Username', sql.VarChar(50), username)
            .input('PasswordHash', sql.VarChar(255), password)
            .input('FullName', sql.NVarChar(100), fullName)
            .input('Email', sql.VarChar(100), email)
            .input('BirthYear', sql.Int, userBirthYear) // Dùng biến đã parse
            .input('Gender', sql.NVarChar(20), gender)
            .query(`
                INSERT INTO Users (Username, PasswordHash, FullName, Email, BirthYear, Gender)
                VALUES (@Username, @PasswordHash, @FullName, @Email, @BirthYear, @Gender)
            `);

        res.json({ success: true, message: "Đăng ký thành công!" });
    } catch (err) {
        console.error("Lỗi Đăng Ký:", err);
        // Kiểm tra lỗi SQL cụ thể
        if (err.message.includes('Invalid column name')) {
            res.status(500).json({ success: false, message: "Lỗi SQL: Thiếu cột BirthYear/Gender trong Database" });
        } else {
            res.status(500).json({ success: false, message: "Lỗi Server" });
        }
    }
});

// 2. API ĐĂNG NHẬP
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        let pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('Username', sql.VarChar(50), username)
            .input('PasswordHash', sql.VarChar(255), password)
            .query("SELECT * FROM Users WHERE Username = @Username AND PasswordHash = @PasswordHash");

        if (result.recordset.length > 0) {
            const user = result.recordset[0];
            res.json({ 
                success: true, 
                user: { 
                    id: user.UserID, 
                    username: user.Username, 
                    fullName: user.FullName 
                } 
            });
        } else {
            res.status(401).json({ success: false, message: "Sai tài khoản hoặc mật khẩu" });
        }
    } catch (err) {
        console.error("Lỗi Đăng Nhập:", err);
        res.status(500).json({ success: false, message: "Lỗi Server" });
    }
});

// 3. API QUÊN MẬT KHẨU (Reset Password)
app.post('/api/forgot-password', async (req, res) => {
    const { username, email, newPassword } = req.body;
    try {
        let pool = await sql.connect(dbConfig);

        // Kiểm tra xem Username và Email có khớp trong CSDL không
        const checkUser = await pool.request()
            .input('Username', sql.VarChar, username)
            .input('Email', sql.VarChar, email)
            .query("SELECT * FROM Users WHERE Username = @Username AND Email = @Email");

        if (checkUser.recordset.length === 0) {
            return res.status(400).json({ success: false, message: "Tên đăng nhập hoặc Email không chính xác!" });
        }

        // Nếu khớp, tiến hành cập nhật mật khẩu mới
        await pool.request()
            .input('Username', sql.VarChar, username)
            .input('NewPassword', sql.VarChar, newPassword)
            .query("UPDATE Users SET PasswordHash = @NewPassword WHERE Username = @Username");

        res.json({ success: true, message: "Đổi mật khẩu thành công! Bạn có thể đăng nhập ngay." });
    } catch (err) {
        console.error("Lỗi Quên Mật Khẩu:", err);
        res.status(500).json({ success: false, message: "Lỗi Server" });
    }
});

// ==========================================
// CÁC API KHÁC (Search, Movies, Logs...)
// ==========================================

app.get('/api/search', async (req, res) => {
    try {
        const keyword = req.query.q; 
        if (!keyword) return res.json({ movies: [], songs: [] });

        let pool = await sql.connect(dbConfig);
        const movieResult = await pool.request()
            .input('kw', sql.NVarChar, `%${keyword}%`)
            .query("SELECT * FROM Movies WHERE Title LIKE @kw OR Tags LIKE @kw");

        const songResult = await pool.request()
            .input('kw', sql.NVarChar, `%${keyword}%`)
            .query("SELECT * FROM Songs WHERE Title LIKE @kw OR Artist LIKE @kw OR Tags LIKE @kw");

        res.json({
            movies: movieResult.recordset,
            songs: songResult.recordset
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 1. API Ghi log (Đã thêm cơ chế UPSERT: Chống spam Like và Rating)
app.post('/api/log-interaction', async (req, res) => {
    try {
        const { userId, itemId, itemType, actionType } = req.body;
        let pool = await sql.connect(dbConfig);

        // NẾU LÀ LIKE / DISLIKE -> Xóa cảm xúc cũ đi trước khi thêm mới
        if (actionType === 'LIKE' || actionType === 'DISLIKE') {
            await pool.request()
                .input('UserID', sql.Int, userId).input('ItemID', sql.NVarChar, itemId).input('ItemType', sql.NVarChar, itemType)
                .query(`DELETE FROM UserInteractions WHERE UserID=@UserID AND ItemID=@ItemID AND ItemType=@ItemType AND (ActionType='LIKE' OR ActionType='DISLIKE')`);
        }
        
        // NẾU LÀ ĐÁNH GIÁ SAO -> Xóa số sao cũ đi trước khi thêm sao mới
        if (actionType.startsWith('RATE_')) {
            await pool.request()
                .input('UserID', sql.Int, userId).input('ItemID', sql.NVarChar, itemId).input('ItemType', sql.NVarChar, itemType)
                .query(`DELETE FROM UserInteractions WHERE UserID=@UserID AND ItemID=@ItemID AND ItemType=@ItemType AND ActionType LIKE 'RATE_%'`);
        }

        // Thêm hành động mới vào
        await pool.request()
            .input('UserID', sql.Int, userId || null)
            .input('ItemID', sql.NVarChar, itemId)
            .input('ItemType', sql.NVarChar, itemType)
            .input('ActionType', sql.NVarChar, actionType)
            .query(`INSERT INTO UserInteractions (UserID, ItemID, ItemType, ActionType) VALUES (@UserID, @ItemID, @ItemType, @ActionType)`);
        
        res.status(200).send({ message: 'Log saved' });
    } catch (err) {
        console.error("Lỗi ghi log:", err);
        res.status(500).send({ error: 'Lỗi Server' });
    }
});

// 2. TÍNH TOÁN THỐNG KÊ (Đã thêm COALESCE để luôn trả về số 0 thay vì NULL)
app.get('/api/stats/:itemType/:itemId', async (req, res) => {
    try {
        const { itemType, itemId } = req.params;
        let pool = await sql.connect(dbConfig);
        
        const statsQuery = await pool.request()
            .input('ItemID', sql.NVarChar, itemId)
            .input('ItemType', sql.NVarChar, itemType)
            .query(`
                SELECT 
                    COALESCE(SUM(CASE WHEN ActionType = 'VIEW' THEN 1 ELSE 0 END), 0) as views,
                    COALESCE(SUM(CASE WHEN ActionType = 'LIKE' THEN 1 ELSE 0 END), 0) as likes,
                    COALESCE(SUM(CASE WHEN ActionType = 'DISLIKE' THEN 1 ELSE 0 END), 0) as dislikes,
                    COALESCE(AVG(CASE WHEN ActionType LIKE 'RATE_%' THEN CAST(SUBSTRING(ActionType, 6, 1) AS FLOAT) ELSE NULL END), 0) as avgRating,
                    COALESCE(SUM(CASE WHEN ActionType LIKE 'RATE_%' THEN 1 ELSE 0 END), 0) as rateCount
                FROM UserInteractions
                WHERE ItemID = @ItemID AND ItemType = @ItemType
            `);
        
        const data = statsQuery.recordset[0];
        res.json({
            views: data.views,
            likes: data.likes,
            dislikes: data.dislikes,
            avgRating: data.avgRating ? data.avgRating.toFixed(1) : "0.0",
            rateCount: data.rateCount
        });
    } catch (err) {
        console.error("Lỗi lấy stats:", err);
        res.status(500).json({ error: 'Lỗi Server' });
    }
});

// API LẤY LỊCH SỬ XEM CỦA NGƯỜI DÙNG (HISTORY)
app.get('/api/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        let pool = await sql.connect(dbConfig);
        
        // Lấy tất cả các ItemID mà user đã 'VIEW', sắp xếp mới nhất lên đầu
        const historyQuery = await pool.request()
            .input('UserID', sql.Int, userId)
            .query(`
                SELECT ItemID, ItemType, MAX(CreatedAt) as LastViewed
                FROM UserInteractions
                WHERE UserID = @UserID AND ActionType = 'VIEW'
                GROUP BY ItemID, ItemType
                ORDER BY LastViewed DESC
            `);
            
        res.json(historyQuery.recordset);
    } catch (err) {
        console.error("Lỗi lấy lịch sử:", err);
        res.status(500).json({ error: 'Lỗi Server' });
    }
});

// ==========================================
// API XÓA LỊCH SỬ (HISTORY)
// ==========================================

// 1. Xóa 1 mục cụ thể
app.delete('/api/history/:userId/:itemType/:itemId', async (req, res) => {
    try {
        const { userId, itemType, itemId } = req.params;
        let pool = await sql.connect(dbConfig);
        
        await pool.request()
            .input('UserID', sql.Int, userId)
            .input('ItemType', sql.NVarChar, itemType)
            .input('ItemID', sql.NVarChar, itemId)
            .query(`
                DELETE FROM UserInteractions 
                WHERE UserID = @UserID AND ItemType = @ItemType AND ItemID = @ItemID AND ActionType = 'VIEW'
            `);
            
        res.json({ success: true, message: "Đã xóa khỏi lịch sử" });
    } catch (err) {
        console.error("Lỗi xóa 1 mục lịch sử:", err);
        res.status(500).json({ success: false, message: "Lỗi Server" });
    }
});

// 2. Xóa toàn bộ lịch sử (theo loại hoặc tất cả)
app.delete('/api/history/:userId/:itemType/all', async (req, res) => {
    try {
        const { userId, itemType } = req.params;
        let pool = await sql.connect(dbConfig);
        
        await pool.request()
            .input('UserID', sql.Int, userId)
            .input('ItemType', sql.NVarChar, itemType)
            .query(`
                DELETE FROM UserInteractions 
                WHERE UserID = @UserID AND ItemType = @ItemType AND ActionType = 'VIEW'
            `);
            
        res.json({ success: true, message: "Đã xóa toàn bộ lịch sử" });
    } catch (err) {
        console.error("Lỗi xóa toàn bộ lịch sử:", err);
        res.status(500).json({ success: false, message: "Lỗi Server" });
    }
});

// ==========================================
// KHỞI CHẠY SERVER (LUÔN ĐỂ CUỐI CÙNG)
// ==========================================
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});