const API_BASE = '/api';

class ApiService {
  getToken() {
    return localStorage.getItem('zync_token') || localStorage.getItem('zync_admin_token');
  }

  setToken(token) {
    if (token) {
      localStorage.setItem('zync_token', token);
      localStorage.setItem('zync_admin_token', token);
    } else {
      localStorage.removeItem('zync_token');
      localStorage.removeItem('zync_admin_token');
      localStorage.removeItem('zync_user');
    }
  }

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    };

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, config);
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        if (response.status === 401) {
          this.setToken(null);
          window.location.href = '/?redirect=/admin';
        }
        const error = new Error((data && data.error) || 'Request failed with status ' + response.status);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (err) {
      throw err;
    }
  }

  // Auth
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    if (data.token) {
      this.setToken(data.token);
    }
    return data;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  logout() {
    this.setToken(null);
  }

  // Dashboard
  async getDashboard() {
    return this.request('/admin/dashboard');
  }

  // Users
  async getUsers(params = {}) {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.role) query.append('role', params.role);
    if (params.sort) query.append('sort', params.sort);
    const queryString = query.toString();
    return this.request(`/admin/users${queryString ? `?${queryString}` : ''}`);
  }

  async createUser(userData) {
    return this.request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async updateUser(id, userData) {
    return this.request(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  async toggleUserStatus(id, disabled) {
    return this.request(`/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ disabled })
    });
  }

  async resetPassword(id, newPassword) {
    return this.request(`/admin/users/${id}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword })
    });
  }

  async deleteUser(id) {
    return this.request(`/admin/users/${id}`, {
      method: 'DELETE'
    });
  }

  // Quizzes
  async getQuizzes() {
    return this.request('/admin/quizzes');
  }

  async getQuizDetails(id) {
    return this.request(`/admin/quizzes/${id}`);
  }

  async deleteQuiz(id) {
    return this.request(`/admin/quizzes/${id}`, {
      method: 'DELETE'
    });
  }

  // Slides
  async getSlides() {
    return this.request('/admin/slides');
  }

  async getSlideDetails(id) {
    return this.request(`/admin/slides/${id}`);
  }

  async deleteSlide(id) {
    return this.request(`/admin/slides/${id}`, {
      method: 'DELETE'
    });
  }

  // Games
  async getGames() {
    return this.request('/admin/games');
  }

  async getGameDetails(id) {
    return this.request(`/admin/games/${id}`);
  }

  // Anime Universes / Categories
  async getAnimeCategories() {
    return this.request('/admin/anime-categories');
  }

  async createAnimeCategory(data) {
    return this.request('/admin/anime-categories', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateAnimeCategory(id, data) {
    return this.request(`/admin/anime-categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteAnimeCategory(id) {
    return this.request(`/admin/anime-categories/${id}`, {
      method: 'DELETE'
    });
  }

  // Anime Characters
  async getCharacters() {
    return this.request('/admin/characters');
  }

  async createCharacter(characterData) {
    return this.request('/admin/characters', {
      method: 'POST',
      body: JSON.stringify(characterData)
    });
  }

  async updateCharacter(id, characterData) {
    return this.request(`/admin/characters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(characterData)
    });
  }

  async toggleCharacter(id) {
    return this.request(`/admin/characters/${id}/toggle`, {
      method: 'PATCH'
    });
  }

  async deleteCharacter(id) {
    return this.request(`/admin/characters/${id}`, {
      method: 'DELETE'
    });
  }

  async seedCharacters() {
    return this.request('/admin/characters/seed', {
      method: 'POST'
    });
  }

  // AI Character Studio
  async generateAiCharacter(params) {
    return this.request('/admin/characters/generate-ai', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  async confirmAiCharacter(params) {
    return this.request('/admin/characters/confirm-ai', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  async getAiConfig() {
    return this.request('/admin/characters/ai-config');
  }

  async saveAiConfig(apiKey) {
    return this.request('/admin/characters/ai-config', {
      method: 'POST',
      body: JSON.stringify({ apiKey })
    });
  }

  // Legacy Avatars Aliases
  async getAvatars() {
    return this.request('/admin/characters');
  }

  async createAvatar(avatarData) {
    return this.request('/admin/characters', {
      method: 'POST',
      body: JSON.stringify(avatarData)
    });
  }

  async updateAvatar(id, avatarData) {
    return this.request(`/admin/characters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(avatarData)
    });
  }

  async toggleAvatar(id) {
    return this.request(`/admin/characters/${id}/toggle`, {
      method: 'PATCH'
    });
  }

  async deleteAvatar(id) {
    return this.request(`/admin/characters/${id}`, {
      method: 'DELETE'
    });
  }

  // Categories
  async getCategories() {
    return this.request('/admin/categories');
  }

  async createCategory(name) {
    return this.request('/admin/categories', {
      method: 'POST',
      body: JSON.stringify({ name })
    });
  }

  async updateCategory(id, name) {
    return this.request(`/admin/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ name })
    });
  }

  async deleteCategory(id) {
    return this.request(`/admin/categories/${id}`, {
      method: 'DELETE'
    });
  }

  // Settings
  async getSettings() {
    return this.request('/admin/settings');
  }

  async updateSettings(settings) {
    return this.request('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }
}

export const api = new ApiService();
