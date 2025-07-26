/* === Diary List – Filtering, Sorting, Searching, Pagination === */
document.addEventListener('DOMContentLoaded', () => {
    const diaryItems      = Array.from(document.querySelectorAll('.diary-item'));
    const diaryList       = document.querySelector('.diary-list');
    const emotionFilter   = document.getElementById('emotion-filter');
    const sortOption      = document.getElementById('sort-option');
    const searchInput     = document.getElementById('search-diary');

    // 成長系統元素
    const currentLevelSpan = document.getElementById('current-level');
    const diaryCountSpan = document.getElementById('diary-count');
    const neededDiariesSpan = document.getElementById('needed-diaries');
    const progressFill = document.getElementById('progress-fill');
    const growthTree = document.getElementById('growth-tree');

    // 分頁系統變數
    let currentPage = 1;
    const itemsPerPage = 10;
    let filteredItems = [...diaryItems];

    // 初始化成長系統
    const initGrowthSystem = () => {
        const totalDiaries = diaryItems.length;
        const { level, progress, needed } = calculateLevel(totalDiaries);
        
        // 更新顯示
        currentLevelSpan.textContent = level;
        diaryCountSpan.textContent = totalDiaries;
        neededDiariesSpan.textContent = needed;
        progressFill.style.width = `${progress}%`;
        
        // 更新樹的成長狀態
        updateTreeGrowth(level);
        
        // 初始化落葉系統
        initLeafSystem(level);
    };

    // 計算等級和進度
    const calculateLevel = (diaryCount) => {
        // 每10篇日記升1級
        const level = Math.floor(diaryCount / 10) + 1;
        const currentProgress = diaryCount % 10;
        const progressPercentage = (currentProgress / 10) * 100;
        const needed = 10 - currentProgress;
        
        return {
            level,
            progress: progressPercentage,
            needed: needed === 10 ? 0 : needed
        };
    };

    // 更新樹的成長狀態
    const updateTreeGrowth = (level) => {
        // 計算當前樹的等級（每10級一棵新樹）
        const currentTreeIndex = Math.floor((level - 1) / 10);
        const treeLevel = ((level - 1) % 10) + 1;
        
        // 移除所有等級類別
        growthTree.classList.remove('level-1', 'level-2', 'level-3', 'level-4', 'level-5', 'level-6', 'level-7', 'level-8', 'level-9', 'level-10');
        
        // 根據等級添加對應的類別（樹的成長階段）
        if (treeLevel >= 1) {
            growthTree.classList.add('level-1');
            setTimeout(() => {
                if (treeLevel >= 2) growthTree.classList.add('level-2');
            }, 100);
            setTimeout(() => {
                if (treeLevel >= 3) growthTree.classList.add('level-3');
            }, 200);
            setTimeout(() => {
                if (treeLevel >= 4) growthTree.classList.add('level-4');
            }, 300);
            setTimeout(() => {
                if (treeLevel >= 5) growthTree.classList.add('level-5');
            }, 400);
            setTimeout(() => {
                if (treeLevel >= 6) growthTree.classList.add('level-6');
            }, 500);
            setTimeout(() => {
                if (treeLevel >= 7) growthTree.classList.add('level-7');
            }, 600);
            setTimeout(() => {
                if (treeLevel >= 8) growthTree.classList.add('level-8');
            }, 700);
            setTimeout(() => {
                if (treeLevel >= 9) growthTree.classList.add('level-9');
            }, 800);
            setTimeout(() => {
                if (treeLevel >= 10) growthTree.classList.add('level-10');
            }, 900);
        }
        
        // 更新樹的信息顯示
        const treeInfo = document.querySelector('.tree-info');
        if (treeInfo) {
            treeInfo.textContent = `第 ${currentTreeIndex + 1} 棵樹 - 成長階段 ${treeLevel}/10`;
        }
    };

    // 樹葉飄落動畫（增強版）
    const createLeafAnimation = () => {
        const treeContainer = document.querySelector('.tree-container');
        if (!treeContainer) return;

        const leafTypes = ['🍃', '🌿', '🍀', '🌱'];
        const leaf = document.createElement('div');
        leaf.className = 'falling-leaf';
        leaf.style.left = (Math.random() * 80 + 10) + '%';
        leaf.style.animationDuration = (Math.random() * 4 + 3) + 's';
        leaf.style.animationDelay = (Math.random() * 2) + 's';
        leaf.textContent = leafTypes[Math.floor(Math.random() * leafTypes.length)];
        
        treeContainer.appendChild(leaf);
        
        setTimeout(() => {
            if (leaf.parentNode) {
                leaf.remove();
            }
        }, 8000);
    };

    // 初始化落葉系統
    const initLeafSystem = (level) => {
        // 清除現有的落葉間隔
        if (window.leafInterval) {
            clearInterval(window.leafInterval);
        }

        // 根據等級調整落葉頻率
        if (level >= 3) {
            const frequency = Math.max(5000 - (level * 300), 1500); // 等級越高，落葉越頻繁
            window.leafInterval = setInterval(createLeafAnimation, frequency);
            
            // 高等級時額外的落葉效果
            if (level >= 7) {
                setTimeout(() => {
                    window.leafInterval2 = setInterval(createLeafAnimation, frequency * 1.5);
                }, 1000);
            }
        }
    };

    // 分頁系統
    const createPagination = () => {
        const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
        
        // 移除現有的分頁
        const existingPagination = document.querySelector('.pagination-container');
        if (existingPagination) {
            existingPagination.remove();
        }

        if (totalPages <= 1) return;

        const paginationContainer = document.createElement('div');
        paginationContainer.className = 'pagination-container';

        // 上一頁按鈕
        const prevBtn = document.createElement('button');
        prevBtn.className = 'page-nav-btn';
        prevBtn.innerHTML = '← 上一頁';
        prevBtn.disabled = currentPage === 1;
        prevBtn.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                updatePagination();
            }
        });

        // 頁碼信息
        const pageInfo = document.createElement('div');
        pageInfo.className = 'page-info';
        pageInfo.textContent = `第 ${currentPage} 頁 / 共 ${totalPages} 頁`;

        // 下一頁按鈕
        const nextBtn = document.createElement('button');
        nextBtn.className = 'page-nav-btn';
        nextBtn.innerHTML = '下一頁 →';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.addEventListener('click', () => {
            if (currentPage < totalPages) {
                currentPage++;
                updatePagination();
            }
        });

        paginationContainer.appendChild(prevBtn);
        paginationContainer.appendChild(pageInfo);
        paginationContainer.appendChild(nextBtn);

        // 插入到操作按鈕之前
        const actionButtons = document.querySelector('.action-buttons');
        if (actionButtons) {
            actionButtons.parentNode.insertBefore(paginationContainer, actionButtons);
        }
    };

    const updatePagination = () => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;

        // 隱藏所有項目
        diaryItems.forEach(item => {
            item.style.display = 'none';
        });

        // 顯示當前頁面的項目
        filteredItems.slice(startIndex, endIndex).forEach(item => {
            item.style.display = 'block';
        });

        // 更新分頁控制
        createPagination();
        
        // 滾動到頂部
        document.querySelector('.diary-container').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    };

    /* --- Helpers --- */
    const parseDate = (item) => {
      const text = item.querySelector('.diary-date').textContent.trim().replace('📅', '').trim();
      return new Date(text.replace(/-/g, '/'));      // Safari‑friendly
    };
  
    const applyFilters = () => {
        const emotionVal = emotionFilter.value;
        const keyword    = searchInput.value.trim().toLowerCase();

        filteredItems = diaryItems.filter(item => {
            const itemEmotion = item.dataset.emotion || '';
            const itemContent = item.querySelector('.diary-content').textContent.toLowerCase();

            const matchEmotion = emotionVal === 'all' || itemEmotion === emotionVal;
            const matchSearch  = keyword === '' || itemContent.includes(keyword);

            return matchEmotion && matchSearch;
        });

        // 重置到第一頁
        currentPage = 1;
        updatePagination();
    };

    const applySort = () => {
        filteredItems.sort((itemA, itemB) => {
            const dateA = parseDate(itemA);
            const dateB = parseDate(itemB);
            return sortOption.value === 'newest'
                ? dateB - dateA
                : dateA - dateB;
        });
        
        // 重新排序後更新分頁
        updatePagination();
    };

    /* --- Event Listeners --- */
    emotionFilter.addEventListener('change', applyFilters);
    searchInput.addEventListener('input', applyFilters);
    sortOption.addEventListener('change', () => {
        applySort();
    });

    /* --- 初始化 --- */
    // 初始化成長系統
    initGrowthSystem();
    
    // 初始化分頁
    applySort();
    applyFilters();
  });
