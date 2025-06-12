/**
 * Jekyll博客评论系统前端逻辑
 * 与Flask后端API交互，实现评论的显示和提交
 */

class CommentSystem {
  constructor(options = {}) {
    // 配置选项
    this.config = {
      apiBaseUrl: options.apiBaseUrl || 'http://localhost:5000/api',
      pageId: options.pageId || window.location.pathname,
      containerId: options.containerId || 'comments-container',
      maxRetries: 3,
      retryDelay: 1000,
      ...options
    };
    
    this.container = null;
    this.comments = [];
    this.isLoading = false;
    this.retryCount = 0;
    
    this.init();
  }
  
  /**
   * 初始化评论系统
   */
  init() {
    // 等待DOM加载完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }
  
  /**
   * 设置评论系统
   */
  setup() {
    this.container = document.getElementById(this.config.containerId);
    if (!this.container) {
      console.error(`评论容器未找到: #${this.config.containerId}`);
      return;
    }
    
    this.renderCommentForm();
    this.loadComments();
  }
  
  /**
   * 渲染评论表单
   */
  renderCommentForm() {
    const formHtml = `
      <div class="comment-form-container">
        <h3 class="comment-title">发表评论</h3>
        <form id="comment-form" class="comment-form">
          <div class="form-group">
            <label for="username">昵称（可选）</label>
            <input 
              type="text" 
              id="username" 
              name="username" 
              placeholder="匿名" 
              maxlength="50"
              class="form-input"
            >
          </div>
          <div class="form-group">
            <label for="content">评论内容 *</label>
            <textarea 
              id="content" 
              name="content" 
              placeholder="请输入您的评论..." 
              required 
              maxlength="1000"
              rows="4"
              class="form-textarea"
            ></textarea>
            <div class="char-count">
              <span id="char-counter">0</span>/1000
            </div>
          </div>
          <div class="form-actions">
            <button type="submit" id="submit-btn" class="submit-btn">
              <span class="btn-text">发表评论</span>
              <span class="btn-loading" style="display: none;">提交中...</span>
            </button>
          </div>
        </form>
      </div>
      <div class="comments-section">
        <h3 class="comments-title">评论列表</h3>
        <div id="comments-list" class="comments-list">
          <div class="loading-placeholder">加载评论中...</div>
        </div>
      </div>
    `;
    
    this.container.innerHTML = formHtml;
    this.bindFormEvents();
  }
  
  /**
   * 绑定表单事件
   */
  bindFormEvents() {
    const form = document.getElementById('comment-form');
    const contentTextarea = document.getElementById('content');
    const charCounter = document.getElementById('char-counter');
    const submitBtn = document.getElementById('submit-btn');
    
    // 字符计数
    contentTextarea.addEventListener('input', (e) => {
      const length = e.target.value.length;
      charCounter.textContent = length;
      
      if (length > 1000) {
        charCounter.style.color = '#e74c3c';
      } else if (length > 800) {
        charCounter.style.color = '#f39c12';
      } else {
        charCounter.style.color = '#7f8c8d';
      }
    });
    
    // 表单提交
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.submitComment();
    });
    
    // 防止重复提交
    submitBtn.addEventListener('click', (e) => {
      if (this.isLoading) {
        e.preventDefault();
      }
    });
  }
  
  /**
   * 提交评论
   */
  async submitComment() {
    if (this.isLoading) return;
    
    const form = document.getElementById('comment-form');
    const submitBtn = document.getElementById('submit-btn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    
    const formData = new FormData(form);
    const username = formData.get('username').trim() || '匿名';
    const content = formData.get('content').trim();
    
    // 验证
    if (!content) {
      this.showMessage('请输入评论内容', 'error');
      return;
    }
    
    if (content.length > 1000) {
      this.showMessage('评论内容不能超过1000字符', 'error');
      return;
    }
    
    // 设置加载状态
    this.isLoading = true;
    submitBtn.disabled = true;
    const btnText = submitBtn.querySelector('.btn-text');
    btnText.style.display = 'none';
    btnLoading.style.display = 'inline';
    
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page_id: this.config.pageId,
          username: username,
          content: content
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        this.showMessage('评论发表成功！', 'success');
        form.reset();
        document.getElementById('char-counter').textContent = '0';
        // 重新加载评论列表
        await this.loadComments();
      } else {
        this.showMessage(result.message || '评论发表失败', 'error');
      }
      
    } catch (error) {
      console.error('提交评论失败:', error);
      this.showMessage('网络错误，请稍后重试', 'error');
    } finally {
      // 恢复按钮状态
      this.isLoading = false;
      submitBtn.disabled = false;
      btnText.style.display = 'inline';
      btnLoading.style.display = 'none';
    }
  }
  
  /**
   * 加载评论列表
   */
  async loadComments() {
    const commentsList = document.getElementById('comments-list');
    
    try {
      commentsList.innerHTML = '<div class="loading-placeholder">加载评论中...</div>';
      
      const response = await fetch(
        `${this.config.apiBaseUrl}/comments?page_id=${encodeURIComponent(this.config.pageId)}`
      );
      
      const result = await response.json();
      
      if (result.success) {
        this.comments = result.comments;
        this.renderComments();
        this.retryCount = 0; // 重置重试计数
      } else {
        throw new Error(result.message || '加载评论失败');
      }
      
    } catch (error) {
      console.error('加载评论失败:', error);
      
      // 重试机制
      if (this.retryCount < this.config.maxRetries) {
        this.retryCount++;
        setTimeout(() => {
          this.loadComments();
        }, this.config.retryDelay * this.retryCount);
        
        commentsList.innerHTML = `
          <div class="error-placeholder">
            加载失败，正在重试... (${this.retryCount}/${this.config.maxRetries})
          </div>
        `;
      } else {
        commentsList.innerHTML = `
          <div class="error-placeholder">
            <p>评论加载失败</p>
            <button onclick="commentSystem.loadComments()" class="retry-btn">重新加载</button>
          </div>
        `;
      }
    }
  }
  
  /**
   * 渲染评论列表
   */
  renderComments() {
    const commentsList = document.getElementById('comments-list');
    
    if (this.comments.length === 0) {
      commentsList.innerHTML = '<div class="no-comments">暂无评论，来发表第一条评论吧！</div>';
      return;
    }
    
    const commentsHtml = this.comments.map(comment => {
      const date = new Date(comment.created_at);
      const formattedDate = this.formatDate(date);
      
      return `
        <div class="comment-item" data-id="${comment.id}">
          <div class="comment-header">
            <span class="comment-author">${this.escapeHtml(comment.username)}</span>
            <span class="comment-date">${formattedDate}</span>
          </div>
          <div class="comment-content">
            ${this.escapeHtml(comment.content).replace(/\n/g, '<br>')}
          </div>
        </div>
      `;
    }).join('');
    
    commentsList.innerHTML = commentsHtml;
  }
  
  /**
   * 格式化日期
   */
  formatDate(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) {
      return '刚刚';
    } else if (minutes < 60) {
      return `${minutes}分钟前`;
    } else if (hours < 24) {
      return `${hours}小时前`;
    } else if (days < 7) {
      return `${days}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }
  
  /**
   * HTML转义
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  /**
   * 显示消息提示
   */
  showMessage(message, type = 'info') {
    // 移除已存在的消息
    const existingMessage = document.querySelector('.comment-message');
    if (existingMessage) {
      existingMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `comment-message comment-message-${type}`;
    messageDiv.textContent = message;
    
    // 插入到表单上方
    const form = document.getElementById('comment-form');
    form.parentNode.insertBefore(messageDiv, form);
    
    // 3秒后自动移除
    setTimeout(() => {
      if (messageDiv.parentNode) {
        messageDiv.remove();
      }
    }, 3000);
  }
}

// 全局变量，方便在HTML中调用
let commentSystem;

// 自动初始化（如果页面包含评论容器）
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('comments-container');
  if (container) {
    // 从页面获取配置
    const pageId = container.dataset.pageId || window.location.pathname;
    const apiUrl = container.dataset.apiUrl || 'http://localhost:5000/api';
    
    commentSystem = new CommentSystem({
      pageId: pageId,
      apiBaseUrl: apiUrl
    });
  }
});