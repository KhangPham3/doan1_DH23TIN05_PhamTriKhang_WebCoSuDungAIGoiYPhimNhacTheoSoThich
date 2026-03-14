const express = require('express');
const cors = require('cors');
const sql = require('mssql');
const nodemailer = require('nodemailer');
const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5000;

// 1. Cấu hình Database (Đã thêm requestTimeout để tránh lỗi đứt gánh giữa chừng)
const dbConfig = {
    user: 'ADMIN', 
    password: 'KhangPham2005', 
    server: 'localhost', 
    port: 1433, 
    database: 'RecommenderDB', 
    requestTimeout: 30000, 
    options: {
        encrypt: false,
        trustServerCertificate: true,
    }
};

// 2. TẠO CONNECTION POOL DÙNG CHUNG TỐI ƯU HIỆU SUẤT (KHÔNG MỞ KẾT NỐI LIÊN TỤC)
const appPool = new sql.ConnectionPool(dbConfig);
const poolConnect = appPool.connect()
    .then(() => console.log("✅ Đã kết nối SQL Server thành công với Connection Pool!"))
    .catch(err => console.log("❌ Lỗi kết nối SQL Server ban đầu:", err));


// ==========================================
// CÁC API NGƯỜI DÙNG (AUTH)
// ==========================================

// API LƯU SỞ THÍCH BAN ĐẦU (ONBOARDING)
app.post('/api/onboarding', async (req, res) => {
    try {
        const { userId, movieGenres, songGenres } = req.body;
        await poolConnect;
        
        // 1. Lưu sở thích Phim (Dùng ActionType là 'PREFER_MOVIE')
        for (const genre of movieGenres) {
            await appPool.request()
                .input('UserID', sql.Int, userId).input('ItemID', sql.NVarChar, String(genre.id))
                .input('ItemType', sql.NVarChar, 'movie').input('ActionType', sql.NVarChar, 'PREFER_MOVIE')
                .query(`INSERT INTO UserInteractions (UserID, ItemID, ItemType, ActionType) VALUES (@UserID, @ItemID, @ItemType, @ActionType)`);
        }

        // 2. Lưu sở thích Nhạc (Dùng ActionType là 'PREFER_SONG')
        for (const genre of songGenres) {
            await appPool.request()
                .input('UserID', sql.Int, userId).input('ItemID', sql.NVarChar, genre.name)
                .input('ItemType', sql.NVarChar, 'song').input('ActionType', sql.NVarChar, 'PREFER_SONG')
                .query(`INSERT INTO UserInteractions (UserID, ItemID, ItemType, ActionType) VALUES (@UserID, @ItemID, @ItemType, @ActionType)`);
        }

        // 3. Đánh dấu đã hoàn thành Onboarding
        await appPool.request().input('UserID', sql.Int, userId).query("UPDATE Users SET IsOnboarded = 1 WHERE UserID = @UserID");

        res.json({ success: true, message: "Lưu sở thích thành công!" });
    } catch (err) {
        console.error("Lỗi Onboarding:", err);
        res.status(500).json({ error: 'Lỗi Server' });
    }
});

// 1. API ĐĂNG KÝ
app.post('/api/register', async (req, res) => {
    const { username, password, fullName, email, birthYear, gender } = req.body;

    const currentYear = new Date().getFullYear();
    const userBirthYear = parseInt(birthYear); 

    if (userBirthYear >= currentYear) {
        return res.status(400).json({ success: false, message: "Năm sinh không hợp lệ!" });
    }

    if (currentYear - userBirthYear < 16) {
        return res.status(400).json({ success: false, message: "Bạn phải từ 16 tuổi trở lên để đăng ký tài khoản!" });
    }   

    try {
        await poolConnect; // Chờ pool sẵn sàng
        
        const checkUser = await appPool.request()
            .input('Username', sql.VarChar(50), username)
            .query("SELECT * FROM Users WHERE Username = @Username");
            
        if (checkUser.recordset.length > 0) {
            return res.status(400).json({ success: false, message: "Tên đăng nhập đã tồn tại!" });
        }

        const checkEmail = await appPool.request()
            .input('Email', sql.VarChar(100), email)
            .query("SELECT * FROM Users WHERE Email = @Email");

        if (checkEmail.recordset.length > 0) {
            return res.status(400).json({ success: false, message: "Email đã được sử dụng!" });
        }

        await appPool.request()
            .input('Username', sql.VarChar(50), username)
            .input('PasswordHash', sql.VarChar(255), password)
            .input('FullName', sql.NVarChar(100), fullName)
            .input('Email', sql.VarChar(100), email)
            .input('BirthYear', sql.Int, userBirthYear) 
            .input('Gender', sql.NVarChar(20), gender)
            .query(`
                INSERT INTO Users (Username, PasswordHash, FullName, Email, BirthYear, Gender)
                VALUES (@Username, @PasswordHash, @FullName, @Email, @BirthYear, @Gender)
            `);

        res.json({ success: true, message: "Đăng ký thành công!" });
    } catch (err) {
        console.error("Lỗi Đăng Ký:", err);
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
        await poolConnect;
        const result = await appPool.request()
            .input('Username', sql.VarChar(50), username)
            .input('PasswordHash', sql.VarChar(255), password)
            .query("SELECT * FROM Users WHERE Username = @Username AND PasswordHash = @PasswordHash");

        if (result.recordset.length > 0) {
            const user = result.recordset[0];
            res.json({ 
                success: true, 
                user: { id: user.UserID, username: user.Username, fullName: user.FullName, role: user.Role, isOnboarded: user.IsOnboarded} 
            });
        } else {
            res.status(401).json({ success: false, message: "Sai tài khoản hoặc mật khẩu" });
        }
    } catch (err) {
        console.error("Lỗi Đăng Nhập:", err);
        res.status(500).json({ success: false, message: "Lỗi Server" });
    }
});

// 🟢 API LUỒNG QUÊN MẬT KHẨU MỚI
// ==========================================

// 3.1. API Gửi OTP đến Email
app.post('/api/forgot-password/send-otp', async (req, res) => {
    const { email } = req.body;
    try {
        await poolConnect;
        
        // Kiểm tra xem Email có tồn tại trong Database không
        const checkEmail = await appPool.request()
            .input('Email', sql.VarChar(100), email)
            .query("SELECT * FROM Users WHERE Email = @Email");

        if (checkEmail.recordset.length === 0) {
            return res.status(400).json({ success: false, message: "Email này chưa được đăng ký trong hệ thống!" });
        }

        // Tạo mã OTP ngẫu nhiên 6 số
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Lưu OTP vào bộ nhớ tạm (Hết hạn sau 5 phút)
        otpStore[email] = { code: otpCode, expires: Date.now() + 5 * 60000 };

        // Cấu hình nội dung Email
        const mailOptions = {
            from: '"Hệ Thống Giải Trí" <YOUR_EMAIL@gmail.com>', // Đổi thành Email của bạn
            to: email,
            subject: 'Mã xác thực khôi phục mật khẩu',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px; max-width: 500px; margin: auto;">
                    <h2 style="color: #e50914; text-align: center;">KHÔI PHỤC MẬT KHẨU</h2>
                    <p>Chào bạn,</p>
                    <p>Bạn vừa yêu cầu đặt lại mật khẩu. Vui lòng sử dụng mã xác thực bên dưới. Mã này có hiệu lực trong vòng <strong>5 phút</strong>:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <span style="font-size: 28px; font-weight: bold; background: #f4f4f4; color: #333; padding: 15px 25px; border-radius: 8px; letter-spacing: 5px;">
                            ${otpCode}
                        </span>
                    </div>
                    <p>Nếu bạn không yêu cầu điều này, xin vui lòng bỏ qua email.</p>
                </div>
            `
        };

        // Gửi email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error("Lỗi gửi mail Nodemailer:", error);
                return res.status(500).json({ success: false, message: "Không thể gửi email. Hãy kiểm tra cấu hình Gmail!" });
            }
            console.log("Đã gửi OTP:", otpCode, "tới", email);
            res.json({ success: true, message: "Mã OTP đã được gửi đến email của bạn!" });
        });

    } catch (err) {
        console.error("Lỗi Send OTP:", err);
        res.status(500).json({ success: false, message: "Lỗi Server Database" });
    }
});

// 3.2. API Xác thực OTP
app.post('/api/forgot-password/verify-otp', (req, res) => {
    const { email, otp } = req.body;

    const record = otpStore[email];
    if (!record) return res.status(400).json({ success: false, message: "Bạn chưa yêu cầu mã hoặc mã đã hết hạn." });
    
    if (Date.now() > record.expires) {
        delete otpStore[email];
        return res.status(400).json({ success: false, message: "Mã OTP đã hết hạn, vui lòng gửi lại." });
    }

    if (record.code !== otp) {
        return res.status(400).json({ success: false, message: "Mã OTP không chính xác!" });
    }

    // OTP đúng -> Xóa để không dùng lại
    delete otpStore[email];
    res.json({ success: true, message: "Xác thực thành công!" });
});

// 3.3. API Đặt lại mật khẩu mới
app.post('/api/forgot-password/reset-password', async (req, res) => {
    const { email, newPassword } = req.body;
    try {
        await poolConnect;
        await appPool.request()
            .input('Email', sql.VarChar(100), email)
            .input('NewPassword', sql.VarChar(255), newPassword) // Ở thực tế nên băm (hash) mật khẩu
            .query("UPDATE Users SET PasswordHash = @NewPassword WHERE Email = @Email");

        res.json({ success: true, message: "Đặt lại mật khẩu thành công!" });
    } catch (err) {
        console.error("Lỗi Reset Pass:", err);
        res.status(500).json({ success: false, message: "Lỗi Server" });
    }
});

// 🟢 CẤU HÌNH GỬI EMAIL (NODEMAILER)
// ==========================================
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        // Hãy thay bằng email và Mật khẩu ứng dụng (App Password) của bạn
        user: 'khangkgfc123456@gmail.com', 
        pass: 'bsdjeeheezslhdbl' 
    }
});

// Lưu tạm mã OTP vào bộ nhớ (Trong thực tế nên lưu vào Redis hoặc Database có thời hạn)
const otpStore = {};

// ==========================================
// CÁC API KHÁC (Search, Logs, Stats, History)
// ==========================================

app.get('/api/search', async (req, res) => {
    try {
        const keyword = req.query.q; 
        if (!keyword) return res.json({ movies: [], songs: [] });

        await poolConnect;
        const movieResult = await appPool.request()
            .input('kw', sql.NVarChar, `%${keyword}%`)
            .query("SELECT * FROM Movies WHERE Title LIKE @kw OR Tags LIKE @kw");

        const songResult = await appPool.request()
            .input('kw', sql.NVarChar, `%${keyword}%`)
            .query("SELECT * FROM Songs WHERE Title LIKE @kw OR Artist LIKE @kw OR Tags LIKE @kw");

        res.json({ movies: movieResult.recordset, songs: songResult.recordset });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API Ghi log 
app.post('/api/log-interaction', async (req, res) => {
    try {
        const { userId, itemId, itemType, actionType } = req.body;
        await poolConnect;

        if (actionType === 'LIKE' || actionType === 'DISLIKE') {
            await appPool.request()
                .input('UserID', sql.Int, userId).input('ItemID', sql.NVarChar, itemId).input('ItemType', sql.NVarChar, itemType)
                .query(`DELETE FROM UserInteractions WHERE UserID=@UserID AND ItemID=@ItemID AND ItemType=@ItemType AND (ActionType='LIKE' OR ActionType='DISLIKE')`);
        }
        
        if (actionType.startsWith('RATE_')) {
            await appPool.request()
                .input('UserID', sql.Int, userId).input('ItemID', sql.NVarChar, itemId).input('ItemType', sql.NVarChar, itemType)
                .query(`DELETE FROM UserInteractions WHERE UserID=@UserID AND ItemID=@ItemID AND ItemType=@ItemType AND ActionType LIKE 'RATE_%'`);
        }

        await appPool.request()
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

// API THỐNG KÊ 
app.get('/api/stats/:itemType/:itemId', async (req, res) => {
    try {
        const { itemType, itemId } = req.params;
        await poolConnect;
        
        const statsQuery = await appPool.request()
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

// API LẤY LỊCH SỬ XEM
app.get('/api/history/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        await poolConnect;
        
        const historyQuery = await appPool.request()
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

// Xóa 1 mục cụ thể
app.delete('/api/history/:userId/:itemType/:itemId', async (req, res) => {
    try {
        const { userId, itemType, itemId } = req.params;
        await poolConnect;
        
        await appPool.request()
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

// Xóa toàn bộ lịch sử
app.delete('/api/history/:userId/:itemType/all', async (req, res) => {
    try {
        const { userId, itemType } = req.params;
        await poolConnect;
        
        await appPool.request()
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
// API QUẢN LÝ TÀI KHOẢN CÁ NHÂN (PROFILE)
// ==========================================

// 1. Lấy thông tin chi tiết của User
app.get('/api/user/:id', async (req, res) => {
    try {
        await poolConnect;
        const user = await appPool.request()
            .input('UserID', sql.Int, req.params.id)
            .query("SELECT UserID, Username, FullName, Email, BirthYear, Gender, CreatedAt FROM Users WHERE UserID = @UserID");
            
        if (user.recordset.length > 0) {
            res.json({ success: true, user: user.recordset[0] });
        } else {
            res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }
    } catch (err) {
        console.error("Lỗi lấy thông tin user:", err);
        res.status(500).json({ error: 'Lỗi Server' });
    }
});

// 2. Cập nhật thông tin cá nhân (Có validate điều kiện)
app.put('/api/user/:id', async (req, res) => {
    const { fullName, birthYear, gender } = req.body;
    const currentYear = new Date().getFullYear();
    const userBirthYear = parseInt(birthYear);

    // Validate quy định website: Phải từ 16 tuổi trở lên
    if (userBirthYear >= currentYear || (currentYear - userBirthYear < 16)) {
        return res.status(400).json({ success: false, message: "Tuổi không hợp lệ. Bạn phải từ 16 tuổi trở lên!" });
    }

    try {
        await poolConnect;
        await appPool.request()
            .input('UserID', sql.Int, req.params.id)
            .input('FullName', sql.NVarChar(100), fullName)
            .input('BirthYear', sql.Int, userBirthYear)
            .input('Gender', sql.NVarChar(20), gender)
            .query("UPDATE Users SET FullName = @FullName, BirthYear = @BirthYear, Gender = @Gender WHERE UserID = @UserID");

        res.json({ success: true, message: "Cập nhật thông tin thành công!" });
    } catch (err) {
        console.error("Lỗi cập nhật user:", err);
        res.status(500).json({ success: false, message: "Lỗi Server" });
    }
});

// ==========================================
// CÁC API DÀNH RIÊNG CHO ADMIN
// ==========================================

// 1. Lấy thống kê tổng quan
app.get('/api/admin/stats', async (req, res) => {
    try {
        await poolConnect;
        
        // Đếm tổng số người dùng
        const usersCount = await appPool.request().query("SELECT COUNT(*) as total FROM Users");
        
        // Đếm tổng số lượt tương tác (View, Like...)
        const interactionsCount = await appPool.request().query("SELECT COUNT(*) as total FROM UserInteractions");

        res.json({
            totalUsers: usersCount.recordset[0].total,
            totalInteractions: interactionsCount.recordset[0].total
        });
    } catch (err) {
        console.error("Lỗi lấy Admin Stats:", err);
        res.status(500).json({ error: 'Lỗi Server' });
    }
});

// 2. Lấy danh sách người dùng
app.get('/api/admin/users', async (req, res) => {
    try {
        await poolConnect;
        // Lấy danh sách user, sắp xếp mới nhất lên đầu
        const users = await appPool.request().query("SELECT UserID, Username, FullName, Email, BirthYear, Gender, Role, Status FROM Users ORDER BY UserID DESC");
        res.json(users.recordset);
    } catch (err) {
        console.error("Lỗi lấy danh sách User:", err);
        res.status(500).json({ error: 'Lỗi Server' });
    }
});

// API thay đổi trạng thái User (Khóa / Mở khóa) ---
app.put('/api/admin/users/:userId/status', async (req, res) => {
    try {
        const { userId } = req.params;
        const { status, reason } = req.body; 
        await poolConnect;
        
        await appPool.request()
            .input('UserID', sql.Int, userId)
            .input('Status', sql.VarChar(20), status)
            .input('BanReason', sql.NVarChar(255), reason || '')
            .query("UPDATE Users SET Status = @Status, BanReason = @BanReason WHERE UserID = @UserID AND Role != 'admin'");
            
        res.json({ success: true, message: "Cập nhật trạng thái thành công!" });
    } catch (err) {
        res.status(500).json({ error: 'Lỗi Server' });
    }
});


// 3. API lấy dữ liệu biểu đồ (Thống kê tương tác 7 ngày qua)
app.get('/api/admin/chart-data', async (req, res) => {
    try {
        await poolConnect;
        
        // Truy vấn gộp nhóm số lượng tương tác theo từng ngày (7 ngày gần nhất)
        const chartQuery = await appPool.request().query(`
            SELECT 
                CAST(CreatedAt AS DATE) as date,
                ItemType,
                COUNT(*) as count
            FROM UserInteractions
            WHERE CreatedAt >= DATEADD(day, -7, GETDATE())
            GROUP BY CAST(CreatedAt AS DATE), ItemType
            ORDER BY date ASC
        `);

        // Xử lý dữ liệu trả về cho Frontend dễ vẽ biểu đồ
        const rawData = chartQuery.recordset;
        let formattedData = {};
        
        // Gom nhóm theo ngày
        rawData.forEach(row => {
            const dateStr = row.date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
            if(!formattedData[dateStr]) formattedData[dateStr] = { date: dateStr, movie: 0, song: 0 };
            
            if(row.ItemType === 'movie') formattedData[dateStr].movie = row.count;
            if(row.ItemType === 'song') formattedData[dateStr].song = row.count;
        });

        res.json(Object.values(formattedData));
    } catch (err) {
        console.error("Lỗi lấy dữ liệu biểu đồ:", err);
        res.status(500).json({ error: 'Lỗi Server' });
    }
});

// API lấy dữ liệu Biểu đồ (Tỉ lệ Nam/Nữ và Lượng đăng ký)
app.get('/api/admin/demographics', async (req, res) => {
    try {
        await poolConnect;
        const genderQuery = await appPool.request().query("SELECT Gender, COUNT(*) as count FROM Users GROUP BY Gender");
        
        // FORMAT NGÀY THÁNG TRỰC TIẾP TỪ SQL (YYYY-MM-DD) ĐỂ TRÁNH LỖI BÊN REACT
        const regQuery = await appPool.request().query(`
            SELECT CONVERT(varchar(10), CreatedAt, 120) as date, COUNT(*) as count 
            FROM Users 
            WHERE CreatedAt IS NOT NULL
            GROUP BY CONVERT(varchar(10), CreatedAt, 120) 
            ORDER BY date ASC
        `);
        res.json({ genders: genderQuery.recordset, registrations: regQuery.recordset });
    } catch (err) {
        res.status(500).json({ error: 'Lỗi Server' });
    }
});

// API Quản lý Trending (Thêm, Xóa, Lấy danh sách)
app.post('/api/admin/trending', async (req, res) => {
    try {
        const { itemId, itemType, itemTitle, itemImage } = req.body;
        await poolConnect;
        
        // Kiểm tra xem đã có trong trending chưa
        const check = await appPool.request()
            .input('ItemID', sql.NVarChar, itemId)
            .input('ItemType', sql.NVarChar, itemType)
            .query("SELECT * FROM AdminTrending WHERE ItemID=@ItemID AND ItemType=@ItemType");
            
        if(check.recordset.length > 0) {
            return res.status(400).json({success: false, message: "Tác phẩm này đã có trong danh sách trending!"});
        }

        // Tự động gán ảnh mặc định nếu bị null
        const finalImage = itemImage || 'https://via.placeholder.com/200x300?text=No+Image';
        const finalTitle = itemTitle || 'Unknown Title';

        await appPool.request()
            .input('ItemID', sql.NVarChar, itemId)
            .input('ItemType', sql.NVarChar, itemType)
            .input('ItemTitle', sql.NVarChar, finalTitle)
            .input('ItemImage', sql.NVarChar, finalImage)
            .query("INSERT INTO AdminTrending (ItemID, ItemType, ItemTitle, ItemImage) VALUES (@ItemID, @ItemType, @ItemTitle, @ItemImage)");
            
        res.json({ success: true, message: "Đã thêm vào Trending!" });
    } catch (err) { 
        console.error("Lỗi thêm Trending:", err);
        res.status(500).json({ error: 'Lỗi Server' }); 
    }
});

app.get('/api/admin/trending/:type', async (req, res) => {
    try {
        await poolConnect;
        const result = await appPool.request().input('Type', sql.NVarChar, req.params.type)
            .query("SELECT * FROM AdminTrending WHERE ItemType = @Type ORDER BY CreatedAt DESC");
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: 'Lỗi Server' }); }
});

app.delete('/api/admin/trending/:id', async (req, res) => {
    try {
        await poolConnect;
        await appPool.request().input('ID', sql.Int, req.params.id).query("DELETE FROM AdminTrending WHERE ID = @ID");
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Lỗi Server' }); }
});

// API Lấy danh sách Top Phim/Nhạc có lượt xem cao nhất
app.get('/api/admin/top-items/:itemType', async (req, res) => {
    try {
        await poolConnect;
        const { itemType } = req.params;
        
        // Lấy top 20 tác phẩm được xem nhiều nhất
        const topItemsQuery = await appPool.request()
            .input('ItemType', sql.NVarChar, itemType)
            .query(`
                SELECT TOP 20
                    ItemID,
                    COUNT(*) as TotalViews,
                    SUM(CASE WHEN ActionType = 'LIKE' THEN 1 ELSE 0 END) as TotalLikes,
                    AVG(CASE WHEN ActionType LIKE 'RATE_%' THEN CAST(SUBSTRING(ActionType, 6, 1) AS FLOAT) ELSE NULL END) as AvgRating
                FROM UserInteractions
                WHERE ItemType = @ItemType AND ActionType = 'VIEW'
                GROUP BY ItemID
                ORDER BY TotalViews DESC
            `);
            
        res.json(topItemsQuery.recordset);
    } catch (err) {
        console.error("Lỗi lấy Top Items:", err);
        res.status(500).json({ error: 'Lỗi Server' });
    }
});

// ==========================================
// API WATCHLIST (XEM SAU)
// ==========================================

// 1. Lấy danh sách Watchlist của User
app.get('/api/watchlist/:userId', async (req, res) => {
    try {
        await poolConnect;
        const result = await appPool.request()
            .input('UserID', sql.Int, req.params.userId)
            .query("SELECT * FROM Watchlist WHERE UserID = @UserID ORDER BY AddedAt DESC");
        res.json(result.recordset);
    } catch (err) { res.status(500).json({ error: 'Lỗi Server' }); }
});

// 2. Thêm / Xóa khỏi Watchlist (Toggle)
app.post('/api/watchlist/toggle', async (req, res) => {
    const { userId, itemId, itemType, itemTitle, itemImage } = req.body;
    try {
        await poolConnect;
        // Kiểm tra xem đã có chưa
        const check = await appPool.request()
            .input('UserID', sql.Int, userId).input('ItemID', sql.NVarChar, itemId).input('ItemType', sql.NVarChar, itemType)
            .query("SELECT ID FROM Watchlist WHERE UserID=@UserID AND ItemID=@ItemID AND ItemType=@ItemType");
        
        if (check.recordset.length > 0) {
            // Nếu có rồi -> Xóa (Bỏ lưu)
            await appPool.request().input('ID', sql.Int, check.recordset[0].ID).query("DELETE FROM Watchlist WHERE ID=@ID");
            res.json({ success: true, action: 'removed', message: "Đã xóa khỏi danh sách xem sau" });
        } else {
            // Nếu chưa có -> Thêm mới
            await appPool.request()
                .input('UserID', sql.Int, userId).input('ItemID', sql.NVarChar, itemId)
                .input('ItemType', sql.NVarChar, itemType).input('ItemTitle', sql.NVarChar, itemTitle)
                .input('ItemImage', sql.NVarChar, itemImage)
                .query("INSERT INTO Watchlist (UserID, ItemID, ItemType, ItemTitle, ItemImage) VALUES (@UserID, @ItemID, @ItemType, @ItemTitle, @ItemImage)");
            res.json({ success: true, action: 'added', message: "Đã thêm vào xem sau" });
        }
    } catch (err) { res.status(500).json({ error: 'Lỗi Server' }); }
});

// 3. Xóa toàn bộ Watchlist
app.delete('/api/watchlist/:userId/clear', async (req, res) => {
    try {
        await poolConnect;
        await appPool.request().input('UserID', sql.Int, req.params.userId).query("DELETE FROM Watchlist WHERE UserID=@UserID");
        res.json({ success: true, message: "Đã làm sạch danh sách" });
    } catch (err) { res.status(500).json({ error: 'Lỗi Server' }); }
});

// 4. Xóa 1 item cụ thể
app.delete('/api/watchlist/item/:id', async (req, res) => {
    try {
        await poolConnect;
        await appPool.request().input('ID', sql.Int, req.params.id).query("DELETE FROM Watchlist WHERE ID=@ID");
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Lỗi Server' }); }
});

// ==========================================
// KHỞI CHẠY SERVER 
// ==========================================
app.listen(PORT, () => {
    console.log(`🚀 Node Server đang chạy tại cổng: ${PORT}`);
});