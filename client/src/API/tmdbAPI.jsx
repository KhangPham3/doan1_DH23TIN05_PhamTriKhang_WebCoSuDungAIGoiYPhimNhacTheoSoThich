// client/src/API/tmdbAPI.jsx

// 1. CẤU HÌNH (CONSTANTS)
export const API_KEY = '46f87255f304cb323c76a53abf325782'; 
export const BASE_URL = 'https://api.themoviedb.org/3';

// URL ảnh Poster (Dọc - dùng cho danh sách phim)
export const IMAGE_URL = 'https://image.tmdb.org/t/p/w500'; 

// 👇 URL ảnh Nền (Ngang - dùng cho HeroSection) - Lấy khổ 'original' cho nét căng
export const BACKDROP_URL = 'https://image.tmdb.org/t/p/original'; 

// 2. HÀM GỌI DANH SÁCH PHIM (Có hỗ trợ lấy nhiều trang)
export const fetchMovies = async (pages = 500) => {
    try {
        const requests = [];
        // Gọi song song nhiều trang
        for (let i = 1; i <= pages; i++) {
            requests.push(
                fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}&language=vi-VN&page=${i}`)
                .then(res => res.json())
            );
        }
        
        const results = await Promise.all(requests);
        // Gộp kết quả lại thành 1 mảng duy nhất
        return results.flatMap(data => data.results || []);
    } catch (error) {
        console.error("Lỗi lấy danh sách phim:", error);
        return [];
    }
};

// 3. HÀM TÌM KIẾM PHIM (Cho thanh tìm kiếm)
export const searchMovies = async (keyword) => {
    try {
        if (!keyword) return [];
        const response = await fetch(
            `${BASE_URL}/search/movie?api_key=${API_KEY}&language=vi-VN&query=${encodeURIComponent(keyword)}&page=1`
        );
        const data = await response.json();
        return data.results || [];
    } catch (error) {
        console.error("Lỗi tìm kiếm:", error);
        return [];
    }
};