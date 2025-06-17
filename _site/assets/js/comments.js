/**
 * Jekyll博客评论系统前端逻辑
 * 与Flask后端API交互，实现评论的显示和提交
 */

class CommentSystem {
  constructor(options = {}) {
    this.apiBaseUrl = options.apiBaseUrl || 'https://bpi.liubingbing0826.xyz/api';
    this.pageId = options.pageId || window.location.pathname;
    this.containerId = options.containerId || 'comments-container';
    this.commentsPerPage = options.commentsPerPage || 10;

    this.currentPage = 1;
    this.totalPages = 1;
    this.totalComments = 0;

    this.container = document.getElementById(this.containerId);

    if (!this.container) {
      console.error(`评论容器 #${this.containerId} 未找到`);
      return;
    }

    this.init();
  }

  init() {
    this.setupContainer();
    this.loadComments();
  }

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
        <div class="comments-list" id="comments-list"></div>
        <div class="pagination" id="pagination" style="display: none;"></div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    const form = document.getElementById('comment-form');
    const contentTextarea = document.getElementById('content');
    const charCounter = document.getElementById('char-counter');
    const submitBtn = document.getElementById('submit-btn');
    const imageUpload = document.getElementById('image-upload');
    const imagePreview = document.getElementById('image-preview');
    const previewImg = document.getElementById('preview-img');
    const removeImageBtn = document.getElementById('remove-image');

    contentTextarea.addEventListener('input', () => {
      const count = contentTextarea.value.length;
      charCounter.textContent = count;
      charCounter.style.color = count > 450 ? '#e74c3c' : count > 400 ? '#f39c12' : '';
    });

    imageUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        if (!file.type.match('image.*')) {
          this.showMessage('请上传图片文件', 'error');
          imageUpload.value = '';
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          this.showMessage('图片大小不能超过5MB', 'error');
          imageUpload.value = '';
          return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          previewImg.src = e.target.result;
          imagePreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
      }
    });

    removeImageBtn.addEventListener('click', () => {
      imageUpload.value = '';
      previewImg.src = '';
      imagePreview.style.display = 'none';
    });

    let isSubmitting = false;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (isSubmitting) return;

      const username = document.getElementById('username').value.trim();
      const content = contentTextarea.value.trim();
      const imageFile = imageUpload.files[0];

      if (!username) return this.showMessage('请输入昵称', 'error');
      if (!content && !imageFile) return this.showMessage('请输入内容或上传图片', 'error');
      if (username.length > 50) return this.showMessage('昵称不能超过50字', 'error');
      if (content.length > 500) return this.showMessage('内容不能超过500字', 'error');

      isSubmitting = true;
      submitBtn.classList.add('loading');
      submitBtn.querySelector('.btn-text').style.display = 'none';
      submitBtn.querySelector('.btn-loading').style.display = 'inline';
      submitBtn.disabled = true;

      try {
        const formData = new FormData();
        formData.append('pageId', this.pageId);
        formData.append('nickname', username);
        formData.append('content', content);
        if (imageFile) formData.append('image', imageFile);

        const response = await fetch(`${this.apiBaseUrl}/comments`, {
          method: 'POST',
          body: formData
        });

        const result = await response.json();
        if (response.ok) {
          this.showMessage('评论发表成功！', 'success');
          form.reset();
          charCounter.textContent = '0';
          imagePreview.style.display = 'none';
          previewImg.src = '';
          this.loadComments();
        } else {
          this.showMessage(`评论失败: ${result.message || '未知错误'}`, 'error');
        }
      } catch (error) {
        console.error('评论提交错误:', error);
        this.showMessage('评论提交失败，请稍后重试', 'error');
      } finally {
        isSubmitting = false;
        submitBtn.classList.remove('loading');
        submitBtn.querySelector('.btn-text').style.display = 'inline';
        submitBtn.querySelector('.btn-loading').style.display = 'none';
        submitBtn.disabled = false;
      }
    });
  }

  async loadComments() {
    const commentsList = document.getElementById('comments-list');
    try {
      commentsList.innerHTML = '<div class="loading-placeholder">加载评论中...</div>';
      const url = `${this.apiBaseUrl}/comments?pageId=${encodeURIComponent(this.pageId)}&page=${this.currentPage}&per_page=${this.commentsPerPage}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      this.renderComments(data);
    } catch (error) {
      console.error('加载评论失败:', error);
      commentsList.innerHTML = '<div class="error-placeholder">评论加载失败</div>';
    }
  }

  renderComments(data) {
    const commentsList = document.getElementById('comments-list');
    const paginationContainer = document.getElementById('pagination');
    let actualData = data.success && data.data ? data.data : data;
    if (actualData.pagination) {
      this.currentPage = actualData.pagination.page;
      this.totalPages = actualData.pagination.pages;
      this.totalComments = actualData.pagination.total;
    }
    const comments = actualData.comments || actualData;
    if (!comments || comments.length === 0) {
      commentsList.innerHTML = '<div class="no-comments-placeholder">暂无评论</div>';
      paginationContainer.style.display = 'none';
      return;
    }
    const commentsHtml = comments.map(comment => {
      const raw = comment.timestamp || comment.created_at;
      const date = new Date(raw).toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
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
    this.renderPagination();
  }

  renderPagination() {
    const paginationContainer = document.getElementById('pagination');
    if (this.totalPages <= 1) {
      paginationContainer.style.display = 'none';
      return;
    }
    paginationContainer.style.display = 'block';
    let paginationHtml = `<div class="pagination-info">第 ${this.currentPage} 页，共 ${this.totalPages} 页 (${this.totalComments} 条评论)</div><div class="pagination-buttons">`;
    if (this.currentPage > 1) {
      paginationHtml += `<button class="page-btn" onclick="commentSystem.loadPage(${this.currentPage - 1})">上一页</button>`;
    }
    for (let i = 1; i <= this.totalPages; i++) {
      const activeClass = i === this.currentPage ? ' active' : '';
      paginationHtml += `<button class="page-btn${activeClass}" onclick="commentSystem.loadPage(${i})">${i}</button>`;
    }
    if (this.currentPage < this.totalPages) {
      paginationHtml += `<button class="page-btn" onclick="commentSystem.loadPage(${this.currentPage + 1})">下一页</button>`;
    }
    paginationHtml += '</div>';
    paginationContainer.innerHTML = paginationHtml;
  }

  loadPage(page) {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.currentPage = page;
    this.loadComments();
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showMessage(message, type = 'info') {
    const existingMessage = document.querySelector('.comment-message');
    if (existingMessage) existingMessage.remove();
    const messageDiv = document.createElement('div');
    messageDiv.className = `comment-message comment-message-${type}`;
    messageDiv.textContent = message;
    const form = document.getElementById('comment-form');
    form.parentNode.insertBefore(messageDiv, form);
    setTimeout(() => {
      if (messageDiv.parentNode) messageDiv.remove();
    }, 3000);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('comments-container');
  if (container) {
    const pageId = container.dataset.pageId || window.location.pathname;
    const apiUrl = container.dataset.apiUrl || 'https://bpi.liubingbing0826.xyz/api';
    window.commentSystem = new CommentSystem({ pageId, apiBaseUrl: apiUrl });
  }
});
