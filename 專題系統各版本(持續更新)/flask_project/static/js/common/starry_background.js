/* ===== 統一星空背景系統 JavaScript ===== */
/* 基於 diary_list 設計 - 星空 + 往上漂浮的藍色粒子 + 些微藍紫色霧 */

// 初始化星空背景粒子系統
function initStarryBackground() {
    const particleBackground = document.getElementById('starryParticleBackground');
    if (!particleBackground) {
        console.warn('⚠️ 未找到星空背景容器 #starryParticleBackground');
        return;
    }
    
    // 創建浮動粒子（30個藍色發光球）
    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'starry-particle floating';
        particle.style.cssText = `
            position: absolute;
            border-radius: 50%;
            width: 6px;
            height: 6px;
            background: radial-gradient(circle, #64ffda 0%, #4facfe 100%);
            box-shadow: 0 0 15px rgba(100, 255, 218, 0.6);
            left: ${Math.random() * 100}%;
            animation: starryFloatParticle ${Math.random() * 8 + 8}s infinite linear;
            animation-delay: ${Math.random() * 12}s;
            pointer-events: none;
        `;
        particleBackground.appendChild(particle);
    }
    
    // 創建星星（100個閃爍星點）
    for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.className = 'starry-particle star';
        star.style.cssText = `
            position: absolute;
            border-radius: 50%;
            width: 2px;
            height: 2px;
            background: #ffffff;
            box-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: starryTwinkle ${Math.random() * 2 + 2}s infinite ease-in-out;
            animation-delay: ${Math.random() * 3}s;
            pointer-events: none;
        `;
        particleBackground.appendChild(star);
    }
    
    console.log('✨ 星空背景系統初始化完成：30個浮動粒子 + 100顆星星');
}

// 自動初始化
document.addEventListener('DOMContentLoaded', () => {
    initStarryBackground();
});
