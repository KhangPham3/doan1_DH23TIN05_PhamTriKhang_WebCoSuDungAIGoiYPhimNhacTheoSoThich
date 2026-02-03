// client/src/API/musicAPI.js

const PY_SERVER = 'http://localhost:8000/api';

// 1. Tìm kiếm nhạc
export const searchMusic = async (query) => {
    try {
        const response = await fetch(`${PY_SERVER}/search?q=${encodeURIComponent(query)}`);
        return await response.json();
    } catch (error) {
        console.error("Lỗi tìm nhạc:", error);
        return [];
    }
};

// 2. Lấy BXH (Đã tăng số lượng)
export const fetchMusicCharts = async () => {
    try {
        const response = await fetch(`${PY_SERVER}/charts`);
        return await response.json();
    } catch (error) {
        console.error("Lỗi lấy BXH nhạc:", error);
        return [];
    }
};

// 3. Lấy chi tiết bài hát
export const fetchSongDetailAI = async (videoId) => {
    try {
        const response = await fetch(`${PY_SERVER}/song/${videoId}`);
        return await response.json();
    } catch (error) {
        console.error("Lỗi lấy chi tiết nhạc:", error);
        return null;
    }
};