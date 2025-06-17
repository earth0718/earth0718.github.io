/**
 * Jekyll博客评论系统前端逻辑
 * 与Flask后端API交互，实现评论的显示和提交
 */

class CommentSystem {
  constructor(options = {}) {
    // 配置选项
    this.apiBaseUrl = options.apiBaseUrl || 'http://127.0.0.1:5000/api';
    this.pageId = options.pageId || window.location.pathname;
    this.containerId = options.containerId || 'comments-container';
    this.commentsPerPage = options.commentsPerPage || 10;
    
    // 分页相关
    this.currentPage = 1;
    this.totalPages = 1;
    this.totalComments = 0;
    
    // 获取容器元素
    this.container = document.getElementById(this.containerId);
    
    if (!this.container) {
      console.error(`评论容器 #${this.containerId} 未找到`);
      return;
    }
    
    // 初始化评论系统
    this.init();
  }
  
  /**
   * 初始化评论系统
   */
  init() {
    this.setupContainer();
    this.loadComments();
  }
  
  /**
   * 设置容器结构
   */
  setupContainer() {
    this.container.innerHTML = `
      <div class="comment-form-container">
        <h3 class="comment-title">发表评论</h3>
        <form class="comment-form" id="comment-form">
          <div class="form-group">
            <input type="text" id="username" class="form-input" placeholder="昵称" required maxlength="50">
          </div>
          <div class="form-group">
            <textarea id="content" class="form-textarea" placeholder="请输入评论内容..." required maxlength="500" rows="4"></textarea>
            <div class="char-count">
              <span id="char-counter">0</span>/500
            </div>
          </div>
          <div class="form-group">
            <label for="image-upload" class="image-upload-label">
              📷 上传图片
            </label>
            <input type="file" id="image-upload" accept="image/*" style="display: none;">
            <div class="image-preview" id="image-preview" style="display: none;">
              <img id="preview-img" src="" alt="预览图片">
              <button type="button" class="remove-image-btn" id="remove-image">×</button>
            </div>
          </div>
          <button type="submit" class="submit-btn" id="submit-btn">
            <span class="btn-text">发表评论</span>
            <span class="btn-loading" style="display: none;">发表中...</span>
          </button>
        </form>
      </div>
      
      <div class="comments-section">
        <h3 class="comments-title">评论列表</h3>
        <div class="comments-list" id="comments-list">
          <!-- 评论将在这里动态加载 -->
        </div>
        <div class="pagination" id="pagination" style="display: none;">
          <!-- 分页控件将在这里动态生成 -->
        </div>
      </div>
    `;
    
    this.bindEvents();
  }
  
  /**
   * 绑定事件
   */
  bindEvents() {
    const form = document.getElementById('comment-form');
    const contentTextarea = document.getElementById('content');
    const charCounter = document.getElementById('char-counter');
    const submitBtn = document.getElementById('submit-btn');
    const imageUpload = document.getElementById('image-upload');
    const imagePreview = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');
    const removeImageBtn = document.getElementById('remove-image');
    
    // 字符计数
    contentTextarea.addEventListener('input', () => {
      const count = contentTextarea.value.length;
      charCounter.textContent = count;
      
      // 更新计数器颜色
      if (count > 400) {
        charCounter.style.color = count > 450 ? '#e74c3c' : '#f39c12';
      } else {
        charCounter.style.color = '';
      }
    });
    
    // 图片上传预览
    imageUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        // 验证文件类型
        if (!file.type.match('image.*')) {
          this.showMessage('请上传图片文件', 'error');
          imageUpload.value = '';
          return;
        }
        
        // 验证文件大小 (最大 5MB)
        if (file.size > 5 * 1024 * 1024) {
          this.showMessage('图片大小不能超过 5MB', 'error');
          imageUpload.value = '';
          return;
        }
        
        // 显示预览
        const reader = new FileReader();
        reader.onload = (e) => {
          previewImg.src = e.target.result;
          imagePreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
      }
    });
    
    // 移除图片
    removeImageBtn.addEventListener('click', () => {
      imageUpload.value = '';
      previewImg.src = '';
      imagePreview.style.display = 'none';
    });
    
    // 防止重复提交
    let isSubmitting = false;
    
    // 表单提交
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      if (isSubmitting) return;
      
      const username = document.getElementById('username').value.trim();
      const content = contentTextarea.value.trim();
      const imageFile = imageUpload.files[0];
      
      // 验证输入
      if (!username) {
        this.showMessage('请输入昵称', 'error');
        return;
      }
      
      if (!content && !imageFile) {
        this.showMessage('请输入评论内容或上传图片', 'error');
        return;
      }
      
      if (username.length > 50) {
        this.showMessage('昵称不能超过50个字符', 'error');
        return;
      }
      
      if (content.length > 500) {
        this.showMessage('评论内容不能超过500个字符', 'error');
        return;
      }
      
      // 设置提交状态
      isSubmitting = true;
      submitBtn.classList.add('loading');
      submitBtn.querySelector('.btn-text').style.display = 'none';
      submitBtn.querySelector('.btn-loading').style.display = 'inline';
      submitBtn.disabled = true;
      
      try {
        // 创建 FormData 对象
        const formData = new FormData();
        formData.append('pageId', this.pageId);
        formData.append('username', username);
        formData.append('content', content);
        
        // 如果有图片，添加到 FormData
        if (imageFile) {
          formData.append('image', imageFile);
        }
        
        // 发送评论请求
        const response = await fetch(`${this.apiBaseUrl}/comments`, {
          method: 'POST',
          body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
          // 评论成功
          this.showMessage('评论发表成功！', 'success');
          form.reset();
          charCounter.textContent = '0';
          imagePreview.style.display = 'none';
          previewImg.src = '';
          
          // 重新加载评论
          this.loadComments();
        } else {
          // 评论失败
          this.showMessage(`评论失败: ${result.message || '未知错误'}`, 'error');
        }
      } catch (error) {
        console.error('评论提交错误:', error);
        this.showMessage('评论提交失败，请稍后重试', 'error');
      } finally {
        // 恢复按钮状态
        isSubmitting = false;
        submitBtn.classList.remove('loading');
        submitBtn.querySelector('.btn-text').style.display = 'inline';
        submitBtn.querySelector('.btn-loading').style.display = 'none';
        submitBtn.disabled = false;
      }
    });
  }
  

  
  /**
   * 加载评论列表
   */
  async loadComments() {
    const commentsList = document.getElementById('comments-list');
    
    try {
      commentsList.innerHTML = '<div class="loading-placeholder">加载评论中...</div>';
      
      const url = `${this.apiBaseUrl}/comments?pageId=${encodeURIComponent(this.pageId)}&page=${this.currentPage}&per_page=${this.commentsPerPage}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      this.renderComments(data);
      
      // 重置重试计数
      if (!this.retryCount) this.retryCount = 0;
      this.retryCount = 0;
      
    } catch (error) {
      console.error('加载评论失败:', error);
      
      // 重试机制
      if (!this.retryCount) this.retryCount = 0;
      if (this.retryCount < 3) {
        this.retryCount++;
        setTimeout(() => {
          this.loadComments();
        }, 1000 * this.retryCount);
        
        commentsList.innerHTML = `
          <div class="error-placeholder">
            加载失败，正在重试... (${this.retryCount}/3)
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
  renderComments(data) {
    const commentsList = document.getElementById('comments-list');
    const paginationContainer = document.getElementById('pagination');
    
    // 处理API响应数据结构
    let actualData = data;
    if (data.success && data.data) {
      actualData = data.data;
    }
    
    // 更新分页信息
    if (actualData.pagination) {
      this.currentPage = actualData.pagination.page;
      this.totalPages = actualData.pagination.pages;
      this.totalComments = actualData.pagination.total;
    }
    
    const comments = actualData.comments || actualData;
    
    if (!comments || comments.length === 0) {
      commentsList.innerHTML = '<div class="no-comments-placeholder">暂无评论，快来发表第一条评论吧！</div>';
      paginationContainer.style.display = 'none';
      return;
    }
    
    const commentsHtml = comments.map(comment => {
      const date = new Date(comment.timestamp || comment.created_at).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // 转义HTML内容
      const safeContent = this.escapeHtml(comment.content);
      
      const imageHtml = comment.image ? 
        `<div class="comment-image">
          <img src="${this.apiBaseUrl.replace('/api', '')}${comment.image}" alt="评论图片" onclick="this.classList.toggle('enlarged')">
        </div>` : '';
      
      return `
        <div class="comment-item">
          <div class="comment-header">
            <span class="comment-author">${this.escapeHtml(comment.nickname || comment.username)}</span>
            <span class="comment-date">${date}</span>
          </div>
          <div class="comment-content">${safeContent}</div>
          ${imageHtml}
        </div>
      `;
    }).join('');
    
    commentsList.innerHTML = commentsHtml;
    
    // 渲染分页
    this.renderPagination();
  }
  
  /**
   * 渲染分页控件
   */
  renderPagination() {
    const paginationContainer = document.getElementById('pagination');
    
    if (this.totalPages <= 1) {
      paginationContainer.style.display = 'none';
      return;
    }
    
    paginationContainer.style.display = 'block';
    
    let paginationHtml = `
      <div class="pagination-info">
        第 ${this.currentPage} 页，共 ${this.totalPages} 页 (${this.totalComments} 条评论)
      </div>
      <div class="pagination-buttons">
    `;
    
    // 上一页按钮
    if (this.currentPage > 1) {
      paginationHtml += `<button class="page-btn" onclick="commentSystem.loadPage(${this.currentPage - 1})">上一页</button>`;
    }
    
    // 页码按钮
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(this.totalPages, this.currentPage + 2);
    
    if (startPage > 1) {
      paginationHtml += `<button class="page-btn" onclick="commentSystem.loadPage(1)">1</button>`;
      if (startPage > 2) {
        paginationHtml += `<span class="page-ellipsis">...</span>`;
      }
    }
    
    for (let i = startPage; i <= endPage; i++) {
      const activeClass = i === this.currentPage ? ' active' : '';
      paginationHtml += `<button class="page-btn${activeClass}" onclick="commentSystem.loadPage(${i})">${i}</button>`;
    }
    
    if (endPage < this.totalPages) {
      if (endPage < this.totalPages - 1) {
        paginationHtml += `<span class="page-ellipsis">...</span>`;
      }
      paginationHtml += `<button class="page-btn" onclick="commentSystem.loadPage(${this.totalPages})">${this.totalPages}</button>`;
    }
    
    // 下一页按钮
    if (this.currentPage < this.totalPages) {
      paginationHtml += `<button class="page-btn" onclick="commentSystem.loadPage(${this.currentPage + 1})">下一页</button>`;
    }
    
    paginationHtml += '</div>';
    
    paginationContainer.innerHTML = paginationHtml;
  }
  
  /**
   * 加载指定页面
   */
  loadPage(page) {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }
    
    this.currentPage = page;
    this.loadComments();
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
   * 预览上传的图片
   */
  previewImage(file) {
    const preview = document.getElementById('image-preview');
    const removeBtn = document.getElementById('remove-image');
    
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        preview.src = e.target.result;
        preview.style.display = 'block';
        removeBtn.style.display = 'inline-block';
      };
      reader.readAsDataURL(file);
    }
  }
  
  /**
   * 移除图片预览
   */
  removeImagePreview() {
    const fileInput = document.getElementById('comment-image');
    const preview = document.getElementById('image-preview');
    const removeBtn = document.getElementById('remove-image');
    
    fileInput.value = '';
    preview.src = '';
    preview.style.display = 'none';
    removeBtn.style.display = 'none';
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
    const apiUrl = container.dataset.apiUrl || 'http://127.0.0.1:5000/api';
    
    commentSystem = new CommentSystem({
      pageId: pageId,
      apiBaseUrl: apiUrl
    });
  }
});