// 在文件顶部添加全局变量声明
let refreshInterval = 10000; // 默认10秒
let colorScheme = 'red-up'; // 默认红涨绿跌
let language = 'zh'; // 默认中文

// 存储接口封装
const storage = {
  sync: {
    get: function(keys, callback) {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        // 扩展环境，使用 chrome.storage.sync
        chrome.storage.sync.get(keys, callback);
      } else {
        // 非扩展环境，使用 localStorage
        const result = {};
        keys.forEach(key => {
          const value = localStorage.getItem(key);
          if (value) {
            result[key] = JSON.parse(value);
          }
        });
        callback(result);
      }
    },
    set: function(data, callback) {
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.sync) {
        // 扩展环境，使用 chrome.storage.sync
        chrome.storage.sync.set(data, callback);
      } else {
        // 非扩展环境，使用 localStorage
        Object.entries(data).forEach(([key, value]) => {
          localStorage.setItem(key, JSON.stringify(value));
        });
        if (callback) callback();
      }
    }
  }
};

// 语言配置
const translations = {
  zh: {
    all: '全部',
    cnMarket: 'A股',
    hkMarket: '港股',
    usMarket: '美股',
    settings: '设置',
    lastUpdate: '最近更新',
    searchPlaceholder: '请输入股票代码或名称',
    priceAlert: '价格提醒',
    alertPrice: '提醒价格',
    enterTargetPrice: '请输入目标价格',
    currentPrice: '当前价格',
    alertPriceText: '提醒价格',
    invalidPrice: '请输入有效的价格',
    cancel: '取消',
    confirm: '确定',
    addToWatchlist: '+自选',
    refreshInterval: '自动刷新间隔',
    colorScheme: '涨跌颜色',
    displayLanguage: '显示语言',
    redUpGreenDown: '红涨绿跌',
    greenUpRedDown: '绿涨红跌',
    seconds: '秒',
    minute: '分钟',
    stockExists: '该股票已在自选列表中',
    settingsSaved: '设置已保存',
    indices: {
      sh: '上证指数',
      sz: '深证成指',
      cyb: '创业板指',
      hsi: '恒生指数',
      hscei: '国企指数',
      hstech: '恒生科技',
      dji: '道琼斯',
      ixic: '纳斯达克',
      spx: '标普500'
    }
  },
  en: {
    all: 'All',
    cnMarket: 'CN',
    hkMarket: 'HK',
    usMarket: 'US',
    settings: 'Settings',
    lastUpdate: 'Last Update',
    searchPlaceholder: 'Enter stock code or name',
    priceAlert: 'Price Alert',
    alertPrice: 'Alert Price',
    enterTargetPrice: 'Enter target price',
    currentPrice: 'Current Price',
    alertPriceText: 'Alert Price',
    invalidPrice: 'Please enter a valid price',
    cancel: 'Cancel',
    confirm: 'Confirm',
    addToWatchlist: '+Add',
    refreshInterval: 'Refresh Interval',
    colorScheme: 'Color Scheme',
    displayLanguage: 'Language',
    redUpGreenDown: 'Red Up Green Down',
    greenUpRedDown: 'Green Up Red Down',
    seconds: 'sec',
    minute: 'min',
    stockExists: 'Stock already exists in watchlist',
    settingsSaved: 'Settings saved',
    indices: {
      sh: 'SSE Index',
      sz: 'SZSE Index',
      cyb: 'ChiNext',
      hsi: 'Hang Seng',
      hscei: 'HSCEI',
      hstech: 'HSI TECH',
      dji: 'Dow Jones',
      ixic: 'NASDAQ',
      spx: 'S&P 500'
    }
  }
};

// 等待 DOM 加载完成
document.addEventListener('DOMContentLoaded', async () => {
  // 初始化存储接口
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.sync) {
    console.log('使用本地存储模式');
  }

  // 获取所有需要的DOM元素
  const tabs = document.querySelectorAll('.tab');
  const indicesGroups = document.querySelectorAll('.indices-group');
  const marketSelector = document.querySelector('.market-selector');
  const searchInput = document.querySelector('.search-input');
  const searchResults = document.querySelector('.search-results');
  const watchlistContent = document.querySelector('.watchlist-content');
  const alertDialog = document.querySelector('.alert-dialog');

  // 检查必要的DOM元素是否存在
  if (!marketSelector) {
    console.error('未找到市场选择器元素');
    return;
  }

  const currentMarket = marketSelector.querySelector('.current-market');
  if (!currentMarket) {
    console.error('未找到当前市场元素');
    return;
  }

  const marketDropdown = document.querySelector('.market-dropdown');
  if (!marketDropdown) {
    console.error('未找到市场下拉菜单元素');
    return;
  }

  const marketOptions = document.querySelectorAll('.market-option');
  if (!marketOptions.length) {
    console.error('未找到市场选项元素');
    return;
  }

  // 初始化检查
  if (!searchInput || !searchResults || !watchlistContent || !alertDialog) {
    console.error('必要的DOM元素未找到');
    return;
  }

  // 确保搜索结果和对话框的初始状态
  if (searchResults) {
    searchResults.style.display = 'none';
  }
  if (alertDialog) {
    alertDialog.style.display = 'none';
  }

  // 市场选择器功能
  if (marketSelector && marketDropdown) {
    // 市场选择器点击事件
    marketSelector.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!marketSelector.classList.contains('disabled')) {
        marketDropdown.style.display = marketDropdown.style.display === 'block' ? 'none' : 'block';
        const arrow = marketSelector.querySelector('.arrow');
        if (arrow) {
          arrow.classList.toggle('rotated');
        }
      }
    });

    // 市场选项点击事件
    marketOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        if (option.dataset.market) {
          const t = translations[language];
          const marketKey = `${option.dataset.market.toLowerCase()}Market`;
          currentMarket.textContent = t[marketKey];
          
          marketOptions.forEach(opt => opt.classList.remove('active'));
          option.classList.add('active');
          
          marketDropdown.style.display = 'none';
          const arrow = marketSelector.querySelector('.arrow');
          if (arrow) {
            arrow.classList.remove('rotated');
          }
          
          if (searchResults && searchInput) {
            searchResults.style.display = 'none';
            searchInput.value = '';
          }
        }
      });
    });

    // 点击其他地方关闭下拉菜单
    document.addEventListener('click', (e) => {
      if (!marketSelector.contains(e.target)) {
        marketDropdown.style.display = 'none';
        const arrow = marketSelector.querySelector('.arrow');
        if (arrow) {
          arrow.classList.remove('rotated');
        }
      }
    });
  }

  // 模拟股票数据库
  const stockDatabase = {
    CN: [
      { code: '601398', name: { zh: '工商银行', en: 'ICBC' }, market: 'CN', price: '4.56', change: '+0.12', percent: '+2.70' },
      { code: '601288', name: { zh: '农业银行', en: 'ABC' }, market: 'CN', price: '3.28', change: '+0.08', percent: '+2.50' },
      { code: '601939', name: { zh: '建设银行', en: 'CCB' }, market: 'CN', price: '5.67', change: '+0.15', percent: '+2.72' },
      { code: '601988', name: { zh: '中国银行', en: 'BOC' }, market: 'CN', price: '3.45', change: '+0.09', percent: '+2.68' },
      { code: '600036', name: { zh: '招商银行', en: 'CMB' }, market: 'CN', price: '34.56', change: '+0.88', percent: '+2.61' },
      { code: '601328', name: { zh: '交通银行', en: 'BOCOM' }, market: 'CN', price: '4.78', change: '+0.11', percent: '+2.36' },
      { code: '000001', name: { zh: '平安银行', en: 'PAB' }, market: 'CN', price: '15.86', change: '+0.42', percent: '+2.72' },
      { code: '600016', name: { zh: '民生银行', en: 'CMBC' }, market: 'CN', price: '3.89', change: '+0.08', percent: '+2.10' }
    ],
    HK: [
      { code: '00700', name: { zh: '腾讯控股', en: 'Tencent' }, market: 'HK', price: '298.60', change: '+4.20', percent: '+1.43' },
      { code: '09988', name: { zh: '阿里巴巴-SW', en: 'Alibaba' }, market: 'HK', price: '78.45', change: '-1.25', percent: '-1.57' },
      { code: '09618', name: { zh: '京东集团-SW', en: 'JD.com' }, market: 'HK', price: '98.50', change: '+2.30', percent: '+2.39' },
      { code: '03690', name: { zh: '美团-W', en: 'Meituan' }, market: 'HK', price: '110.20', change: '+3.40', percent: '+3.18' },
      { code: '01810', name: { zh: '小米集团-W', en: 'Xiaomi' }, market: 'HK', price: '12.78', change: '+0.32', percent: '+2.57' },
      { code: '00981', name: { zh: '中芯国际', en: 'SMIC' }, market: 'HK', price: '15.60', change: '+0.48', percent: '+3.17' },
      { code: '09999', name: { zh: '网易-S', en: 'NetEase' }, market: 'HK', price: '134.50', change: '+2.80', percent: '+2.13' },
      { code: '02382', name: { zh: '舜宇光学科技', en: 'Sunny Optical' }, market: 'HK', price: '76.85', change: '+1.65', percent: '+2.19' }
    ],
    US: [
      { code: 'AAPL', name: { zh: '苹果', en: 'Apple' }, market: 'US', price: '178.32', change: '+2.45', percent: '+1.39' },
      { code: 'MSFT', name: { zh: '微软', en: 'Microsoft' }, market: 'US', price: '378.85', change: '+5.67', percent: '+1.52' },
      { code: 'GOOGL', name: { zh: '谷歌', en: 'Google' }, market: 'US', price: '142.65', change: '+2.34', percent: '+1.67' },
      { code: 'NVDA', name: { zh: '英伟达', en: 'NVIDIA' }, market: 'US', price: '485.90', change: '+12.45', percent: '+2.63' },
      { code: 'META', name: { zh: 'Meta', en: 'Meta' }, market: 'US', price: '334.50', change: '+6.78', percent: '+2.07' },
      { code: 'TSLA', name: { zh: '特斯拉', en: 'Tesla' }, market: 'US', price: '245.67', change: '-5.43', percent: '-2.16' },
      { code: 'AMD', name: { zh: 'AMD', en: 'AMD' }, market: 'US', price: '156.78', change: '+4.32', percent: '+2.83' },
      { code: 'INTC', name: { zh: '英特尔', en: 'Intel' }, market: 'US', price: '43.85', change: '+0.95', percent: '+2.21' }
    ]
  };

  // 模拟指数数据
  const indices = {
    CN: [
      { name: { zh: '上证指数', en: 'SSE Index' }, value: '3234.56', change: '+21.45', percent: '+0.66' },
      { name: { zh: '深成指', en: 'SZSE Index' }, value: '11234.56', change: '-45.67', percent: '-0.41' },
      { name: { zh: '创业指', en: 'ChiNext' }, value: '2345.67', change: '+12.34', percent: '+0.53' }
    ],
    HK: [
      { name: { zh: '恒生指数', en: 'Hang Seng' }, value: '16589.45', change: '-132.67', percent: '-0.79' },
      { name: { zh: '国企指数', en: 'HSCEI' }, value: '5678.90', change: '-45.78', percent: '-0.80' },
      { name: { zh: '恒生科技', en: 'HSI TECH' }, value: '3456.78', change: '+23.45', percent: '+0.68' }
    ],
    US: [
      { name: { zh: '道琼斯', en: 'Dow Jones' }, value: '38789.45', change: '+245.67', percent: '+0.64' },
      { name: { zh: '纳斯达克', en: 'NASDAQ' }, value: '16234.56', change: '+189.23', percent: '+1.18' },
      { name: { zh: '标普500', en: 'S&P 500' }, value: '5123.45', change: '+34.56', percent: '+0.68' }
    ]
  };

  // 价格提醒存储
  let currentAlertStock = null;
  const priceAlerts = new Map();

  // 从存储中恢复数据
  function restoreData() {
    try {
      storage.sync.get(['watchlist', 'priceAlerts', 'settings'], function(data) {
        // 恢复设置
        if (data.settings) {
          refreshInterval = data.settings.refreshInterval || 10000;
          colorScheme = data.settings.colorScheme || 'red-up';
          language = data.settings.language || 'zh';
          
          // 更新设置界面
          document.querySelector('.refresh-interval').value = refreshInterval / 1000;
          document.querySelector('.color-scheme').value = colorScheme;
          document.querySelector('.language').value = language;
          
          // 应用设置
          applySettings();
        }

        // 恢复自选股列表
        if (data.watchlist) {
          data.watchlist.forEach(stock => {
            // 从数据库中获取完整的股票信息
            const marketData = stockDatabase[stock.market];
            const stockData = marketData.find(s => s.code === stock.code);
            if (stockData) {
              const stockInfo = {
                code: stock.code,
                name: stockData.name,
                market: stock.market
              };
              addToWatchlist(stockInfo, false);
            }
          });
        }

        // 恢复价格提醒
        if (data.priceAlerts) {
          Object.entries(data.priceAlerts).forEach(([code, alerts]) => {
            priceAlerts.set(code, new Set(alerts));
            const stockElement = document.querySelector(`.stock-item[data-code="${code}"]`);
            if (stockElement) {
              const alertPriceList = stockElement.querySelector('.alert-price-list');
              if (alertPriceList) {
                alertPriceList.style.display = 'block';
                alerts.forEach(price => {
                  const t = translations[language];
                  const alertHtml = `
                    <div class="alert-price-item" data-price="${price}">
                      <div class="price-text">
                        <img src="img/bell-02.svg" alt="bell" class="bell-icon">
                        <span>${t.alertPriceText}: ${parseFloat(price).toFixed(2)}</span>
                      </div>
                      <span class="remove-alert">
                        <img src="img/close.svg" alt="close">
                      </span>
                    </div>
                  `;
                  alertPriceList.insertAdjacentHTML('beforeend', alertHtml);
                  
                  // 为新添加的提醒价格添加删除按钮的事件监听
                  const newAlertItem = alertPriceList.querySelector(`.alert-price-item[data-price="${price}"]`);
                  if (newAlertItem) {
                    const removeBtn = newAlertItem.querySelector('.remove-alert');
                    if (removeBtn) {
                      removeBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const alerts = priceAlerts.get(code);
                        alerts.delete(price);
                        newAlertItem.remove();
                        if (alerts.size === 0) {
                          alertPriceList.style.display = 'none';
                        }
                        saveData();
                      });
                    }
                  }
                });
              }
            }
          });
        }

        // 启动自动更新
        startAutoUpdate();
      });
    } catch (error) {
      console.error('恢复数据失败:', error);
    }
  }

  // 保存数据到存储
  function saveData() {
    try {
      const stockItems = document.querySelectorAll('.stock-item');
      if (!stockItems.length) {
        console.log('没有需要保存的自选股');
        return;
      }

      const watchlist = Array.from(stockItems).map(item => {
        const code = item.dataset.code;
        const market = item.dataset.market;
        const stock = stockDatabase[market].find(s => s.code === code);
        
        if (!stock) {
          console.error('找不到股票数据');
          return null;
        }

        return {
          code: code,
          name: stock.name,
          market: market
        };
      }).filter(Boolean);

      const alertsObj = {};
      priceAlerts.forEach((alerts, code) => {
        if (alerts && alerts.size > 0) {
          alertsObj[code] = Array.from(alerts);
        }
      });

      const data = {
        watchlist: watchlist,
        priceAlerts: alertsObj
      };

      storage.sync.set(data, function() {
        console.log('数据保存成功');
      });
    } catch (error) {
      console.error('保存数据失败:', error);
    }
  }

  // 获取易时间状
  function getMarketStatus() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const time = hours * 100 + minutes;
    
    // 判断是否为交易日（周至周五）
    const isWeekday = now.getDay() > 0 && now.getDay() < 6;
    
    if (!isWeekday) return { CN: false, HK: false, US: false };
    
    return {
      // A股：9:30-11:30, 13:00-15:00
      CN: (time >= 930 && time <= 1130) || (time >= 1300 && time <= 1500),
      // 港股：9:30-12:00, 13:00-16:00
      HK: (time >= 930 && time <= 1200) || (time >= 1300 && time <= 1600),
      // 美股：21:30-4:00
      US: time >= 2130 || time <= 400
    };
  }

  // 获取当前应该显示的市场
  function getCurrentMarket() {
    const status = getMarketStatus();
    if (status.CN) return 'CN';
    if (status.HK) return 'HK';
    if (status.US) return 'US';
    return 'CN'; // 默认显示A股
  }

  // 更新指数滑块位置
  function updateIndicesSlider(market) {
    const slider = document.querySelector('.indices-slider');
    const dots = document.querySelectorAll('.dot');
    if (!slider || !dots.length) return;

    const markets = ['CN', 'HK', 'US'];
    const index = markets.indexOf(market);
    if (index === -1) return;

    slider.style.transform = `translateX(-${index * 33.33}%)`;
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
  }

  // 标签切换功能
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const market = tab.dataset.market;
      const t = translations[language];
      
      // 移除所有标签的激活状态
      tabs.forEach(t => t.classList.remove('active'));
      
      // 激活当前标签
      tab.classList.add('active');
      
      // 处理市场选择和指数显示
      if (market === 'ALL') {
        marketSelector.classList.remove('disabled');
        const currentMarket = getCurrentMarket();
        updateIndicesSlider(currentMarket);
        document.querySelector('.indices-dots').style.display = 'flex';
        // 显示所有自选股
        document.querySelectorAll('.stock-item').forEach(item => {
          item.classList.remove('hidden');
        });
      } else {
        // 禁用市场选择
        marketSelector.classList.add('disabled');
        const marketKey = `${market.toLowerCase()}Market`;
        currentMarket.textContent = t[marketKey];
        
        // 更新所有市场选项的文本
        marketOptions.forEach(option => {
          if (option && option.dataset && option.dataset.market) {
            const key = `${option.dataset.market.toLowerCase()}Market`;
            option.textContent = t[key];
          }
        });
        
        // 更新数显示
        updateIndicesSlider(market);
        document.querySelector('.indices-dots').style.display = 'none';
        // 只显示当前市场的自选股
        document.querySelectorAll('.stock-item').forEach(item => {
          item.classList.toggle('hidden', item.dataset.market !== market);
        });
      }
    });
  });

  // 点击指数翻页点
  document.querySelector('.indices-dots').addEventListener('click', (e) => {
    const dot = e.target.closest('.dot');
    if (!dot || !document.querySelector('.tab[data-market="ALL"]').classList.contains('active')) return;
    
    const market = dot.dataset.market;
    updateIndicesSlider(market);
  });

  // 自动切换到当前开盘的市场（仅"全部"标签激活时）
  function autoSwitchMarket() {
    const allTab = document.querySelector('.tab[data-market="ALL"]');
    if (!allTab || !allTab.classList.contains('active')) return;
    
    const currentMarket = getCurrentMarket();
    updateIndicesSlider(currentMarket);
  }

  // 每分钟检查一次市场状态
  setInterval(autoSwitchMarket, 60000);

  // 搜索功能
  async function searchStocks(keyword, market) {
    await new Promise(resolve => setTimeout(resolve, 300));
    const searchStr = keyword.toLowerCase();
    const marketValue = market === 'A股' ? 'CN' : 
                       market === '港股' ? 'HK' : 'US';
    
    return stockDatabase[marketValue]
      .filter(stock => 
        stock.code.toLowerCase().includes(searchStr) || 
        stock.name[language].toLowerCase().includes(searchStr)
      )
      .slice(0, 5);
  }

  async function handleSearch(keyword) {
    if (!keyword.trim()) {
      if (searchResults) {
        searchResults.style.display = 'none';
      }
      return;
    }

    const currentMarketText = currentMarket.textContent;
    const results = await searchStocks(keyword, currentMarketText);
    renderSearchResults(results);
  }

  // 获取 A 股市场标签
  function getCNMarketTag(code) {
    const t = translations[language];
    if (code.startsWith('60')) return language === 'zh' ? '沪' : 'SH';
    if (code.startsWith('00')) return language === 'zh' ? '深' : 'SZ';
    if (code.startsWith('30')) return language === 'zh' ? '创' : 'GEM';
    return language === 'zh' ? 'A' : 'CN';
  }

  function renderSearchResults(results) {
    if (results.length === 0) {
      searchResults.style.display = 'none';
      return;
    }

    const t = translations[language];
    searchResults.innerHTML = results.map(stock => `
      <div class="search-item" data-code="${stock.code}" data-market="${stock.market}">
        <div class="stock-info">
          <span class="market-tag ${stock.market.toLowerCase()}">${getMarketTag(stock)}</span>
          <span class="stock-name">${stock.name[language]}</span>
          <span class="stock-code">${stock.code}</span>
        </div>
        <button class="add-btn">${t.addToWatchlist}</button>
      </div>
    `).join('');

    searchResults.style.display = 'block';
  }

  // 获取市场标签
  function getMarketTag(stock) {
    if (stock.market === 'CN') {
      return getCNMarketTag(stock.code);
    }
    return translations[language][`${stock.market.toLowerCase()}Market`].charAt(0);
  }

  // 添加 Toast 提醒功能
  function showToast(message, duration = 2000) {
    // 检查是否已存在 toast 元素
    let toast = document.querySelector('.toast');
    if (!toast) {
      // 创建的 toast 元素
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    
    // 设置消息并显示
    toast.textContent = message;
    toast.classList.add('show');
    
    // 定时隐藏
    setTimeout(() => {
      toast.classList.remove('show');
    }, duration);
  }

  // 修改添加自选股功能
  function addToWatchlist(stock, shouldSave = true) {
    if (!watchlistContent) {
      console.error('找不到自选股列表容器');
      return;
    }

    // 检查是否已经存在
    const existingStock = document.querySelector(`.stock-item[data-code="${stock.code}"]`);
    if (existingStock) {
      showToast(translations[language].stockExists);
      return;
    }

    // 从数据库中获取完整的股票信息
    const marketData = stockDatabase[stock.market];
    const stockData = marketData.find(s => s.code === stock.code);
    if (!stockData) {
      console.error('找不到股票数据');
      return;
    }

    const stockHtml = `
      <div class="stock-item" data-code="${stock.code}" data-market="${stock.market}">
        <div class="stock-basic">
          <div class="stock-main-info">
            <span class="market-tag ${stock.market.toLowerCase()}">${getMarketTag(stockData)}</span>
            <span class="stock-name">${stockData.name[language]}</span>
            <span class="stock-code">${stock.code}</span>
            <div class="price-container">
              <div class="price-info">
                <span class="current-price">--</span>
                <span class="change-group">--</span>
              </div>
              <div class="hover-actions">
                <button class="icon-btn alert-btn" title="${translations[language].priceAlert}">
                  <img src="img/bell-ringing.svg" alt="alert">
                </button>
                <button class="icon-btn remove-btn" title="${translations[language].cancel}">
                  <img src="img/close-large.svg" alt="close">
                </button>
              </div>
            </div>
          </div>
          <div class="alert-price-list" style="display: none"></div>
        </div>
      </div>
    `;

    try {
      watchlistContent.insertAdjacentHTML('afterbegin', stockHtml);
      const newStockElement = watchlistContent.querySelector(`.stock-item[data-code="${stock.code}"]`);
      
      if (newStockElement) {
        setTimeout(() => updateStockPrice(stock.code, stock.market), 500);
      } else {
        console.error('添加股票后未找到对应元素');
      }

      if (shouldSave) {
        saveData();
      }
    } catch (error) {
      console.error('添加自选股失败:', error);
    }
  }

  // 价格更新功能
  async function fetchStockData(market, code) {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const stock = stockDatabase[market].find(s => s.code === code);
    if (!stock) return null;

    const randomChange = (Math.random() * 2 - 1).toFixed(2);
    const basePrice = parseFloat(stock.price);
    const newPrice = (basePrice + parseFloat(randomChange)).toFixed(2);
    const changePercent = (randomChange / basePrice * 100).toFixed(2);

    return {
      price: newPrice,
      change: randomChange,
      percent: changePercent
    };
  }

  async function updateStockPrice(code, market) {
    const stockElement = document.querySelector(`.stock-item[data-code="${code}"]`);
    if (!stockElement) return;

    const priceInfo = stockElement.querySelector('.price-info');
    const data = await fetchStockData(market, code);
    
    if (!data) {
      priceInfo.innerHTML = `<span class="error">获取数据失败</span>`;
      return;
    }

    const direction = parseFloat(data.change) >= 0 ? 'up' : 'down';
    priceInfo.innerHTML = `
      <span class="current-price ${direction}">${data.price}</span>
      <span class="change-group ${direction}">${data.percent}%</span>
    `;

    checkPriceAlerts(stockElement, parseFloat(data.price));
  }

  // 价格提醒功能
  function showAlertDialog(stockItem) {
    const code = stockItem.dataset.code;
    const stockName = stockItem.querySelector('.stock-name').textContent;
    const currentPrice = stockItem.querySelector('.current-price').textContent;
    const t = translations[language];
    
    alertDialog.querySelector('h3').textContent = `${stockName} - ${t.priceAlert}`;
    const priceInput = alertDialog.querySelector('.price-input');
    priceInput.placeholder = `${t.currentPrice}：${currentPrice}`;
    priceInput.value = '';
    
    alertDialog.style.display = 'flex';
    currentAlertStock = stockItem;
  }

  function addPriceAlert(stockElement, price) {
    const code = stockElement.dataset.code;
    const alertPriceList = stockElement.querySelector('.alert-price-list');
    if (!alertPriceList) return;
    
    if (!priceAlerts.has(code)) {
      priceAlerts.set(code, new Set());
    }
    const alerts = priceAlerts.get(code);
    
    if (alerts.has(price)) {
      alert(translations[language].stockExists);
      return false;
    }
    
    alerts.add(price);
    alertPriceList.style.display = 'block';
    
    const t = translations[language];
    // 添加提醒价格的HTML元素
    const alertHtml = `
      <div class="alert-price-item" data-price="${price}">
        <div class="price-text">
          <img src="img/bell-02.svg" alt="bell" class="bell-icon">
          <span>${t.alertPriceText}: ${parseFloat(price).toFixed(2)}</span>
        </div>
        <span class="remove-alert">
          <img src="img/close.svg" alt="close">
        </span>
      </div>
    `;
    alertPriceList.insertAdjacentHTML('beforeend', alertHtml);

    // 添加删除按钮的事件监听
    const newAlertItem = alertPriceList.querySelector(`.alert-price-item[data-price="${price}"]`);
    if (newAlertItem) {
      const removeBtn = newAlertItem.querySelector('.remove-alert');
      if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          alerts.delete(price);
          newAlertItem.remove();
          if (alerts.size === 0) {
            alertPriceList.style.display = 'none';
          }
          saveData();
        });
      }
    }

    // 检查是否与当前价格相同
    const currentPrice = parseFloat(stockElement.querySelector('.current-price').textContent);
    if (Math.abs(currentPrice - price) <= 0.01) {
      triggerAlert(stockElement);
    }

    return true;
  }

  function checkPriceAlerts(stockElement, currentPrice) {
    const code = stockElement.dataset.code;
    const alerts = priceAlerts.get(code);
    if (!alerts) return;
    
    alerts.forEach(targetPrice => {
      if (Math.abs(currentPrice - parseFloat(targetPrice)) <= 0.01) {
        triggerAlert(stockElement);
      }
    });
  }

  function triggerAlert(stockElement) {
    stockElement.classList.add('alerting');
    setTimeout(() => {
      stockElement.classList.remove('alerting');
    }, 10000); // 10秒后移除动画
  }

  // 事件监听
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      handleSearch(e.target.value);
    });

    // 添加点击事件监听器，防止点击搜索框时关闭拉列表
    searchInput.addEventListener('click', (e) => {
      e.stopPropagation();
      if (searchInput.value.trim()) {
        searchResults.style.display = 'block';
      }
    });
  }

  if (searchResults) {
    searchResults.addEventListener('click', (e) => {
      const addBtn = e.target.closest('.add-btn');
      if (!addBtn) return;

      const searchItem = addBtn.closest('.search-item');
      if (!searchItem) return;

      const stock = {
        code: searchItem.dataset.code,
        name: searchItem.querySelector('.stock-name')?.textContent || '',
        market: searchItem.dataset.market
      };
      
      addToWatchlist(stock);
      searchResults.style.display = 'none';
      if (searchInput) {
        searchInput.value = '';
      }
    });
  }

  if (watchlistContent) {
    watchlistContent.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.remove-btn');
      if (removeBtn) {
        const stockItem = removeBtn.closest('.stock-item');
        if (!stockItem) return;
        
        const code = stockItem.dataset.code;
        stockItem.remove();
        
        // 同时删除相关的价提醒
        if (priceAlerts.has(code)) {
          priceAlerts.delete(code);
        }
        
        saveData();
        return;
      }

      const alertBtn = e.target.closest('.alert-btn') || e.target.closest('.material-icons');
      if (alertBtn) {
        const stockItem = alertBtn.closest('.stock-item');
        if (stockItem) {
          showAlertDialog(stockItem);
        }
      }
    });
  }

  if (alertDialog) {
    const cancelBtn = alertDialog.querySelector('.cancel-btn');
    const confirmBtn = alertDialog.querySelector('.confirm-btn');

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        alertDialog.style.display = 'none';
      });
    }

    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        const priceInput = alertDialog.querySelector('.price-input');
        if (!priceInput) return;

        const targetPrice = parseFloat(priceInput.value);
        
        if (isNaN(targetPrice)) {
          alert(translations[language].invalidPrice);
          return;
        }
        
        if (!currentAlertStock) return;
        
        if (addPriceAlert(currentAlertStock, targetPrice)) {
          alertDialog.style.display = 'none';
          saveData();
        }
      });
    }

    alertDialog.addEventListener('click', (e) => {
      if (e.target === alertDialog) {
        alertDialog.style.display = 'none';
      }
    });
  }

  watchlistContent.addEventListener('click', (e) => {
    const removeAlert = e.target.closest('.remove-alert');
    if (removeAlert) {
      const alertItem = removeAlert.closest('.alert-price-item');
      const stockItem = alertItem.closest('.stock-item');
      const code = stockItem.dataset.code;
      const price = parseFloat(alertItem.dataset.price);
      
      const alerts = priceAlerts.get(code);
      alerts.delete(price);
      
      if (alerts.size === 0) {
        stockItem.querySelector('.alert-price-list').style.display = 'none';
      }
      
      alertItem.remove();
      saveData();
    }
  });

  // 自动更新功能
  function startAutoUpdate() {
    setInterval(() => {
      // 更新自选股价格
      const stockItems = document.querySelectorAll('.stock-item');
      stockItems.forEach(item => {
        const code = item.dataset.code;
        const market = item.dataset.market;
        updateStockPrice(code, market);
      });

      // 更新指数
      updateIndices();
    }, 10000);
  }

  // 更新指数
  function updateIndices() {
    Object.keys(indices).forEach(market => {
      const group = document.querySelector(`.indices-group[data-market="${market}"]`);
      if (!group) return;

      const indexElements = group.querySelectorAll('.index');
      indices[market].forEach((index, i) => {
        const element = indexElements[i];
        if (!element) return;

        const direction = parseFloat(index.change) >= 0 ? 'up' : 'down';
        element.innerHTML = `
          <div class="index-name">${index.name[language]}</div>
          <div class="index-value ${direction}">${index.value}</div>
          <div class="index-change ${direction}">${index.percent}%</div>
        `;
      });
    });
  }

  // 初始化
  searchResults.style.display = 'none';
  marketDropdown.style.display = 'none';
  
  // 初始化市场选择器
  initializeMarketSelector();
  
  // 初始化指数显示
  updateIndices();
  const initialMarket = getCurrentMarket();
  updateIndicesSlider(initialMarket);
  
  // 设置初始标签状态
  const allTab = document.querySelector('.tab[data-market="ALL"]');
  if (allTab) {
    allTab.click();
  }

  // 设置按钮点击事件
  const settingsBtn = document.querySelector('.settings-btn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
      document.querySelector('.settings-dialog').style.display = 'flex';
    });
  }

  // 设置对话框取消按钮
  const settingsCancelBtn = document.querySelector('.settings-dialog .cancel-btn');
  if (settingsCancelBtn) {
    settingsCancelBtn.addEventListener('click', () => {
      document.querySelector('.settings-dialog').style.display = 'none';
    });
  }

  // 设置对话框确认按钮
  const settingsConfirmBtn = document.querySelector('.settings-dialog .confirm-btn');
  if (settingsConfirmBtn) {
    settingsConfirmBtn.addEventListener('click', () => {
      refreshInterval = document.querySelector('.refresh-interval').value * 1000;
      colorScheme = document.querySelector('.color-scheme').value;
      language = document.querySelector('.language').value;
      
      saveSettings();
      applySettings();
      document.querySelector('.settings-dialog').style.display = 'none';
    });
  }

  // 添加点击空白处关闭搜索结果的事件监听器
  document.addEventListener('click', (e) => {
    if (!searchResults.contains(e.target) && !searchInput.contains(e.target)) {
      searchResults.style.display = 'none';
    }
  });

  // 恢复数据
  restoreData();

  // 初始化设置
  function initSettings() {
    storage.sync.get(['settings'], function(data) {
      if (data.settings) {
        refreshInterval = data.settings.refreshInterval || 10000;
        colorScheme = data.settings.colorScheme || 'red-up';
        language = data.settings.language || 'zh';
        
        // 更新设置界面
        document.querySelector('.refresh-interval').value = refreshInterval / 1000;
        document.querySelector('.color-scheme').value = colorScheme;
        document.querySelector('.language').value = language;
        
        // 应用设置
        applySettings();
      }
    });
  }

  // 保存设置
  function saveSettings() {
    const oldLanguage = language;
    const refreshInterval = document.querySelector('.refresh-interval').value;
    const colorScheme = document.querySelector('.color-scheme').value;
    const newLanguage = document.querySelector('.language').value;
    
    storage.sync.set({
      refreshInterval,
      colorScheme,
      language: newLanguage
    }, async () => {
      if (oldLanguage !== newLanguage) {
        language = newLanguage;
        updateLanguage();
        await updateAllData();
      }
      showToast(translations[language].settingsSaved);
      document.querySelector('.settings-dialog').style.display = 'none';
    });
  }

  // 应用设置
  function applySettings() {
    // 应用颜色方案
    document.body.classList.toggle('green-up', colorScheme === 'green-up');
    
    // 应用语言
    updateLanguage();
    
    // 重启自动更新时
    restartAutoUpdate();
  }

  // 更新语言
  function updateLanguage() {
    const currentLang = language;
    const t = translations[currentLang];

    // 更新标签文本
    document.querySelector('.tab[data-market="ALL"]').textContent = t.all;
    document.querySelector('.tab[data-market="CN"]').textContent = t.cnMarket;
    document.querySelector('.tab[data-market="HK"]').textContent = t.hkMarket;
    document.querySelector('.tab[data-market="US"]').textContent = t.usMarket;

    // 更新搜索框
    document.querySelector('.search-input').placeholder = t.searchPlaceholder;

    // 更新市场选择器和下拉菜单
    const currentMarketElem = document.querySelector('.current-market');
    const marketOptions = document.querySelectorAll('.market-option');
    
    // 更新当前显示的市场文本
    if (currentMarketElem) {
      const activeMarket = Array.from(marketOptions).find(opt => opt.classList.contains('active'));
      if (activeMarket && activeMarket.dataset.market) {
        const marketKey = `${activeMarket.dataset.market.toLowerCase()}Market`;
        currentMarketElem.textContent = t[marketKey];
      }
    }

    // 更新所有市场选项的文本
    marketOptions.forEach(option => {
      if (option && option.dataset && option.dataset.market) {
        const marketKey = `${option.dataset.market.toLowerCase()}Market`;
        option.textContent = t[marketKey];
      }
    });

    // 更新设置对话框
    document.querySelector('.settings-dialog h3').textContent = t.settings;
    document.querySelector('.refresh-interval').previousElementSibling.textContent = t.refreshInterval;
    document.querySelector('.color-scheme').previousElementSibling.textContent = t.colorScheme;
    document.querySelector('.language').previousElementSibling.textContent = t.displayLanguage;

    // 更新设置选项
    const refreshOptions = document.querySelector('.refresh-interval').options;
    refreshOptions[0].textContent = `5 ${t.seconds}`;
    refreshOptions[1].textContent = `10 ${t.seconds}`;
    refreshOptions[2].textContent = `30 ${t.seconds}`;
    refreshOptions[3].textContent = `1 ${t.minute}`;

    const colorOptions = document.querySelector('.color-scheme').options;
    colorOptions[0].textContent = t.redUpGreenDown;
    colorOptions[1].textContent = t.greenUpRedDown;

    // 更新按钮文本
    document.querySelectorAll('.cancel-btn').forEach(btn => btn.textContent = t.cancel);
    document.querySelectorAll('.confirm-btn').forEach(btn => btn.textContent = t.confirm);
    document.querySelectorAll('.add-btn').forEach(btn => btn.textContent = t.addToWatchlist);

    // 更新价格提醒对话框
    document.querySelector('.alert-dialog h3').textContent = t.priceAlert;
    document.querySelector('.alert-dialog .input-group label').textContent = t.alertPrice;
    document.querySelector('.price-input').placeholder = t.enterTargetPrice;

    // 更新底部栏
    document.querySelector('.last-update').textContent = `${t.lastUpdate}: ${document.querySelector('.last-update').textContent.split('：')[1]}`;

    // 更新指数名称
    const indexNames = document.querySelectorAll('.index-name');
    const indices = [t.indices.sh, t.indices.sz, t.indices.cyb, t.indices.hsi, t.indices.hscei, t.indices.hstech, t.indices.dji, t.indices.ixic, t.indices.spx];
    indexNames.forEach((name, index) => {
      name.textContent = indices[index];
    });

    // 更新所有股票名称
    document.querySelectorAll('.stock-item').forEach(item => {
      const code = item.dataset.code;
      const market = item.dataset.market;
      const stockData = stockDatabase[market].find(s => s.code === code);
      if (stockData) {
        const nameElement = item.querySelector('.stock-name');
        if (nameElement) {
          nameElement.textContent = stockData.name[currentLang];
        }
      }
    });

    // 更新搜索结果中的股票名
    document.querySelectorAll('.search-item').forEach(item => {
      const code = item.dataset.code;
      const market = item.dataset.market;
      const stockData = stockDatabase[market].find(s => s.code === code);
      if (stockData) {
        const nameElement = item.querySelector('.stock-name');
        if (nameElement) {
          nameElement.textContent = stockData.name[currentLang];
        }
      }
    });
  }

  // 重启自动更新
  function restartAutoUpdate() {
    if (window.updateTimer) {
      clearInterval(window.updateTimer);
    }
    
    window.updateTimer = setInterval(() => {
      const stockItems = document.querySelectorAll('.stock-item');
      stockItems.forEach(item => {
        const code = item.dataset.code;
        const market = item.dataset.market;
        updateStockPrice(code, market);
      });
      updateIndices();
    }, refreshInterval);
  }

  // 修改初始化市场选择器函数
  function initializeMarketSelector() {
    const t = translations[language];
    
    // 设置默认市场
    const defaultMarket = t.cnMarket;
    currentMarket.textContent = defaultMarket;
    
    // 初始化所有市场选项
    marketOptions.forEach(option => {
      if (option && option.dataset && option.dataset.market) {
        const marketKey = `${option.dataset.market.toLowerCase()}Market`;
        option.textContent = t[marketKey];
        option.classList.toggle('active', t[marketKey] === defaultMarket);
      }
    });
  }

  // 在 DOMContentLoaded 事件监听器中添加刷新按钮的事件处理
  const refreshBtn = document.querySelector('.refresh-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', async () => {
      refreshBtn.classList.add('rotating');
      await updateAllData();
      setTimeout(() => {
        refreshBtn.classList.remove('rotating');
      }, 1000);
    });
  }

  // 更新所有数据的函数
  async function updateAllData() {
    await updateIndices();
    const watchlistItems = document.querySelectorAll('.stock-item');
    for (const item of watchlistItems) {
      const code = item.dataset.code;
      const market = item.dataset.market;
      if (code && market) {
        await updateStockPrice(code, market);
      }
    }
    updateLastUpdateTime();
  }

  // 更新最后更新时间
  function updateLastUpdateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('zh-CN', { hour12: false });
    const lastUpdateSpan = document.querySelector('.last-update');
    if (lastUpdateSpan) {
      const t = translations[language];
      lastUpdateSpan.textContent = `${t.lastUpdate}：${timeString}`;
    }
  }
}); 