/**
 * 装饰效果管理器
 * 统一管理所有装饰元素的创建和动画，支持性能优化和懒加载
 */
class DecorationManager {
  constructor() {
    this.isPostPage = document.querySelector('.post-content') !== null;
    this.isMobile = window.innerWidth <= 768;
    this.particlesContainer = document.getElementById('particles-container');
    this.topDecorations = document.getElementById('top-decorations');
    
    // 性能监控
    this.performanceMode = this.detectPerformanceMode();
    this.animationFrameId = null;
    this.intersectionObserver = null;
    
    // 配置参数 - 根据性能模式调整
    this.config = {
      particles: {
        count: this.getOptimalCount('particles'),
        colors: ['#FFD700', '#FFA500', '#FF69B4', '#87CEEB', '#98FB98', '#DDA0DD']
      },
      stars: {
        floating: this.getOptimalCount('starsFloating'),
        fullscreen: this.getOptimalCount('starsFullscreen'),
        icons: ['⭐', '✨', '💫', '🌟']
      },
      moons: {
        floating: this.getOptimalCount('moonsFloating'),
        fullscreen: this.getOptimalCount('moonsFullscreen'),
        icons: ['🌙', '🌛', '🌜']
      },
      clouds: {
        count: this.getOptimalCount('clouds')
      },
      trails: {
        count: this.getOptimalCount('trails')
      }
    };
    
    // 元素池，用于复用DOM元素
    this.elementPool = {
      particles: [],
      stars: [],
      moons: [],
      clouds: [],
      trails: []
    };
    
    this.particlePool = [];
    this.maxParticles = this.config.particles.count;
  }
  
  /**
   * 检测设备性能模式
   */
  detectPerformanceMode() {
    const hardwareConcurrency = navigator.hardwareConcurrency || 2;
    const deviceMemory = navigator.deviceMemory || 2;
    const isMobile = this.isMobile;
    
    if (isMobile || hardwareConcurrency <= 2 || deviceMemory <= 2) {
      return 'low';
    } else if (hardwareConcurrency >= 8 && deviceMemory >= 8) {
      return 'high';
    }
    return 'medium';
  }
  
  /**
   * 根据性能模式获取最优元素数量
   */
  getOptimalCount(type) {
    const counts = {
      low: {
        particles: 5,
        starsFloating: 3,
        starsFullscreen: this.isPostPage ? 3 : 6,
        moonsFloating: 1,
        moonsFullscreen: this.isPostPage ? 1 : 2,
        clouds: 0,
        trails: 0
      },
      medium: {
        particles: this.isMobile ? 10 : 15,
        starsFloating: this.isMobile ? 6 : 12,
        starsFullscreen: this.isPostPage ? 4 : 8,
        moonsFloating: 2,
        moonsFullscreen: this.isPostPage ? 2 : 3,
        clouds: this.isMobile ? 1 : 2,
        trails: this.isMobile ? 0 : (this.isPostPage ? 0 : 4)
      },
      high: {
        particles: this.isMobile ? 15 : 25,
        starsFloating: this.isMobile ? 10 : 18,
        starsFullscreen: this.isPostPage ? 6 : 12,
        moonsFloating: 3,
        moonsFullscreen: this.isPostPage ? 2 : 4,
        clouds: this.isMobile ? 2 : 3,
        trails: this.isMobile ? 0 : (this.isPostPage ? 0 : 8)
      }
    };
    
    return counts[this.performanceMode][type] || 0;
  }

  // 通用装饰元素创建函数
  createDecor(type, count, className, icons, positions = null) {
    const container = document.getElementById('top-decorations');
    if (!container) return;

    for (let i = 0; i < count; i++) {
      const element = document.createElement('div');
      element.className = className;
      element.innerHTML = icons[i % icons.length];
      element.setAttribute('aria-hidden', 'true');
      element.setAttribute('role', 'presentation');
      
      if (positions && positions[i]) {
        element.style.left = positions[i].left;
        element.style.top = positions[i].top;
      } else {
        element.style.left = Math.random() * 100 + '%';
        element.style.top = Math.random() * 100 + '%';
      }
      
      element.style.animationDelay = (i * 0.5) + 's';
      container.appendChild(element);
    }
  }

  /**
   * 创建装饰元素的通用方法
   */
  createDecorElement(type, icon, position, delay = 0) {
    const element = document.createElement('div');
    element.className = `fullscreen-${type}`;
    element.innerHTML = icon;
    element.style.left = position.left;
    element.style.top = position.top;
    element.style.animationDelay = delay + 's';
    
    // 可访问性改进
    element.setAttribute('aria-hidden', 'true');
    element.setAttribute('role', 'presentation');
    element.style.pointerEvents = 'none';
    
    return element;
  }

  /**
   * 创建月亮装饰
   */
  createMoons() {
    const container = this.topDecorations;
    const moons = this.config.moons.icons;
    const count = this.config.moons.fullscreen;
    
    const positions = this.isPostPage ? [
      { left: '8%', top: '25%' },
      { left: '88%', top: '70%' }
    ] : [
      { left: '12%', top: '20%' },
      { left: '85%', top: '15%' },
      { left: '8%', top: '75%' },
      { left: '88%', top: '80%' }
    ];
    
    positions.slice(0, count).forEach((pos, i) => {
      const moon = this.createDecorElement(
        'moon',
        moons[i % moons.length],
        pos,
        i * (this.isPostPage ? 2 : 1.5)
      );
      container.appendChild(moon);
    });
  }

  /**
   * 创建星星装饰
   */
  createStars() {
    const container = this.topDecorations;
    const stars = this.config.stars.icons;
    const count = this.config.stars.fullscreen;
    
    const positions = this.isPostPage ? [
      { left: '5%', top: '10%' },
      { left: '92%', top: '12%' },
      { left: '3%', top: '50%' },
      { left: '95%', top: '45%' },
      { left: '7%', top: '90%' },
      { left: '90%', top: '88%' }
    ] : [
      { left: '15%', top: '10%' }, { left: '25%', top: '25%' },
      { left: '75%', top: '8%' }, { left: '85%', top: '30%' },
      { left: '10%', top: '45%' }, { left: '30%', top: '60%' },
      { left: '70%', top: '50%' }, { left: '90%', top: '60%' },
      { left: '20%', top: '80%' }, { left: '35%', top: '85%' },
      { left: '65%', top: '75%' }, { left: '80%', top: '90%' }
    ];
    
    positions.slice(0, count).forEach((pos, i) => {
      const star = this.createDecorElement(
        'star',
        stars[i % stars.length],
        pos,
        i * (this.isPostPage ? 1 : 0.8)
      );
      container.appendChild(star);
    });
  }

  /**
   * 创建云朵装饰
   */
  createClouds() {
    const container = this.topDecorations;
    const count = this.config.clouds.count;
    
    for (let i = 0; i < count; i++) {
      const cloud = document.createElement('div');
      cloud.className = 'fullscreen-cloud';
      cloud.innerHTML = '☁️';
      cloud.style.left = Math.random() * 80 + '%';
      cloud.style.top = Math.random() * 60 + '%';
      cloud.style.animationDelay = Math.random() * 8 + 's';
      cloud.style.animationDuration = (20 + Math.random() * 15) + 's';
      
      // 可访问性改进
      cloud.setAttribute('aria-hidden', 'true');
      cloud.setAttribute('role', 'presentation');
      cloud.style.pointerEvents = 'none';
      
      container.appendChild(cloud);
    }
  }

  /**
   * 创建拖尾效果
   */
  createTrails() {
    if (this.isPostPage) return; // 文章页面不显示拖尾
    
    const container = this.topDecorations;
    const count = this.config.trails.count;
    
    for (let i = 0; i < count; i++) {
      const trail = document.createElement('div');
      trail.className = 'comet-trail';
      trail.style.left = Math.random() * 100 + '%';
      trail.style.top = Math.random() * 10 + '%';
      trail.style.animationDelay = Math.random() * 12 + 's';
      trail.style.animationDuration = (8 + Math.random() * 6) + 's';
      
      // 可访问性改进
      trail.setAttribute('aria-hidden', 'true');
      trail.setAttribute('role', 'presentation');
      trail.style.pointerEvents = 'none';
      
      container.appendChild(trail);
    }
  }

  /**
   * 创建浮动背景粒子
   */
  createFloatingParticles() {
    const container = this.particlesContainer;
    if (!container) return;
    
    const particleCount = this.config.particles.count;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = document.createElement('div');
      particle.className = 'floating-particle';
      
      // 随机位置
      particle.style.left = Math.random() * 100 + '%';
      particle.style.top = Math.random() * 100 + '%';
      
      // 随机动画延迟
      particle.style.animationDelay = Math.random() * 6 + 's';
      particle.style.animationDuration = (4 + Math.random() * 4) + 's';
      
      // 可访问性改进
      particle.setAttribute('aria-hidden', 'true');
      particle.setAttribute('role', 'presentation');
      particle.style.pointerEvents = 'none';
      
      container.appendChild(particle);
    }
  }

  // 粒子爆炸效果（使用对象池优化性能）
  createParticleExplosion(x, y) {
    const colors = ['#FFD700', '#FFA500', '#FF69B4', '#87CEEB', '#98FB98', '#DDA0DD'];
    const particleCount = this.performanceMode === 'low' ? 5 : 
                        (this.isMobile ? 8 : 15);
    
    for (let i = 0; i < particleCount; i++) {
      let particle = this.particlePool.pop();
      
      if (!particle) {
        particle = document.createElement('div');
        particle.className = 'star-particle';
        particle.innerHTML = '★';
        particle.setAttribute('aria-hidden', 'true');
        particle.setAttribute('role', 'presentation');
      }
      
      const color = colors[Math.floor(Math.random() * colors.length)];
      particle.style.color = color;
      particle.style.textShadow = `0 0 6px ${color}`;
      
      const size = this.isMobile ? 6 + Math.random() * 4 : 8 + Math.random() * 6;
      particle.style.fontSize = size + 'px';
      
      particle.style.left = x + 'px';
      particle.style.top = y + 'px';
      
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
      const distance = this.isMobile ? 30 + Math.random() * 50 : 40 + Math.random() * 80;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;
      
      particle.style.setProperty('--dx', dx + 'px');
      particle.style.setProperty('--dy', dy + 'px');
      
      const rotation = Math.random() * 360;
      particle.style.setProperty('--rotation', rotation + 'deg');
      
      // 重置动画
      particle.style.animation = 'none';
      particle.offsetHeight; // 强制重排
      particle.style.animation = 'starExplode 1s ease-out forwards';
      
      document.body.appendChild(particle);
      
      // 使用animationend事件而不是setTimeout
      const handleAnimationEnd = () => {
        if (particle.parentNode) {
          particle.parentNode.removeChild(particle);
        }
        if (this.particlePool.length < this.maxParticles) {
          this.particlePool.push(particle);
        }
        particle.removeEventListener('animationend', handleAnimationEnd);
      };
      
      particle.addEventListener('animationend', handleAnimationEnd);
    }
  }

  /**
   * 初始化所有装饰效果
   */
  init() {
    // 设置懒加载观察器
    this.setupIntersectionObserver();
    
    // 立即创建关键装饰元素
    this.createCriticalDecorations();
    
    // 延迟创建非关键装饰元素
    this.scheduleNonCriticalDecorations();
    
    // 设置事件监听器
    this.setupEventListeners();
    
    // 监听页面可见性变化
    this.setupVisibilityListener();
    
    // 创建夜间模式切换按钮
    this.createThemeToggle();
  }
  
  /**
   * 设置交叉观察器用于懒加载
   */
  setupIntersectionObserver() {
    if ('IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              this.loadDecorationForElement(entry.target);
            }
          });
        },
        { threshold: 0.1, rootMargin: '50px' }
      );
    }
  }
  
  /**
   * 创建关键装饰元素（立即可见的）
   */
  createCriticalDecorations() {
    // 只创建视口内的装饰元素
    this.createMoons();
    this.createStars();
  }
  
  /**
   * 调度非关键装饰元素的创建
   */
  scheduleNonCriticalDecorations() {
    // 使用 requestIdleCallback 或 setTimeout 延迟创建
    const scheduleCallback = window.requestIdleCallback || 
      ((cb) => setTimeout(cb, 100));
    
    scheduleCallback(() => {
      this.createFloatingParticles();
      this.createClouds();
      this.createTrails();
    });
  }
  
  /**
   * 设置事件监听器
   */
  setupEventListeners() {
    // 添加点击事件监听器
    document.addEventListener('click', (e) => {
      this.createParticleExplosion(e.clientX, e.clientY);
    });

    // 添加鼠标移动效果（降低频率）
    let lastSparkleTime = 0;
    document.addEventListener('mousemove', (e) => {
      const now = Date.now();
      if (now - lastSparkleTime > 200 && Math.random() < 0.05) {
        lastSparkleTime = now;
        const sparkle = document.createElement('div');
        sparkle.style.cssText = `
          position: absolute;
          left: ${e.clientX}px;
          top: ${e.clientY}px;
          width: 2px;
          height: 2px;
          background: #fff;
          border-radius: 50%;
          pointer-events: none;
          animation: sparkle 0.6s ease-out forwards;
          z-index: 1000;
        `;
        sparkle.setAttribute('aria-hidden', 'true');
        
        document.body.appendChild(sparkle);
        
        sparkle.addEventListener('animationend', () => {
          if (sparkle.parentNode) {
            sparkle.parentNode.removeChild(sparkle);
          }
        });
      }
    });
  }
  
  /**
   * 设置页面可见性监听器
   */
  setupVisibilityListener() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pauseAnimations();
      } else {
        this.resumeAnimations();
      }
    });
  }
  
  /**
   * 暂停动画以节省性能
   */
  pauseAnimations() {
    const animatedElements = document.querySelectorAll(
      '.fullscreen-moon, .fullscreen-star, .fullscreen-cloud, .comet-trail, .floating-particle'
    );
    animatedElements.forEach(el => {
      el.style.animationPlayState = 'paused';
    });
  }
  
  /**
   * 恢复动画
   */
  resumeAnimations() {
    const animatedElements = document.querySelectorAll(
      '.fullscreen-moon, .fullscreen-star, .fullscreen-cloud, .comet-trail, .floating-particle'
    );
    animatedElements.forEach(el => {
      el.style.animationPlayState = 'running';
    });
  }
  
  /**
   * 创建夜间模式切换按钮
   */
  createThemeToggle() {
    const toggleButton = document.createElement('button');
    toggleButton.innerHTML = '🌙';
    toggleButton.className = 'theme-toggle';
    toggleButton.setAttribute('aria-label', '切换夜间模式');
    toggleButton.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1000;
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      width: 50px;
      height: 50px;
      font-size: 20px;
      cursor: pointer;
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
    `;
    
    // 检查本地存储的主题设置
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
      this.enableDarkMode();
      toggleButton.innerHTML = '☀️';
    }
    
    toggleButton.addEventListener('click', () => {
      this.toggleTheme(toggleButton);
    });
    
    document.body.appendChild(toggleButton);
  }
  
  /**
   * 切换主题
   */
  toggleTheme(button) {
    const isDark = document.body.classList.contains('dark-mode');
    
    if (isDark) {
      this.enableLightMode();
      button.innerHTML = '🌙';
      localStorage.setItem('theme', 'light');
    } else {
      this.enableDarkMode();
      button.innerHTML = '☀️';
      localStorage.setItem('theme', 'dark');
    }
  }
  
  /**
   * 启用夜间模式
   */
  enableDarkMode() {
    document.body.classList.add('dark-mode');
    
    // 添加夜间模式样式
    if (!document.getElementById('dark-mode-styles')) {
      const darkStyles = document.createElement('style');
      darkStyles.id = 'dark-mode-styles';
      darkStyles.textContent = `
        .dark-mode {
          background: linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%) !important;
          color: #e0e0e0 !important;
        }
        .dark-mode .page-content {
          background: rgba(0, 0, 0, 0.3) !important;
          color: #e0e0e0 !important;
        }
        .dark-mode h1, .dark-mode h2, .dark-mode h3, .dark-mode h4, .dark-mode h5, .dark-mode h6 {
          color: #ffffff !important;
        }
        .dark-mode a {
          color: #64b5f6 !important;
        }
        .dark-mode a:hover {
          color: #90caf9 !important;
        }
        .dark-mode pre[class*="language-"] {
          background: rgba(0, 0, 0, 0.6) !important;
        }
        .dark-mode .fullscreen-moon,
        .dark-mode .fullscreen-star {
          filter: brightness(1.2) contrast(1.1);
        }
      `;
      document.head.appendChild(darkStyles);
    }
  }
  
  /**
   * 启用明亮模式
   */
  enableLightMode() {
    document.body.classList.remove('dark-mode');
  }
}

// 导出装饰管理器
window.DecorationManager = DecorationManager;