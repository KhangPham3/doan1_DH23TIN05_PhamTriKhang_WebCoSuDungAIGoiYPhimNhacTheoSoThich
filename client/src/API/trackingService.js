// client/src/API/trackingService.js

// Hàm gửi log về server Node.js của bạn
export const logInteraction = async(itemId, itemType, actionType = 'View') => {
    
    const userId = localStorage.getItem('userId') || 1;

    try{
        await fetch('http://localhost:5000/api/log-interaction', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId,
                itemId: itemId.toString(), // Chuyển sang chuỗi cho chắc ăn
                itemType: itemType,
                actionType: actionType
            })
    });
    console.log(`📡 Đã ghi nhận: ${actionType} -> ${itemType} ${itemId}`);
} catch (error){
    console.error("Không gửi được log:",error);
}
};