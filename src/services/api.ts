const API_BASE_URL = '/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: string[];
}

interface Order {
  id: string;
  order_no: string;
  title: string;
  subject: string;
  education_stage: string;
  grade_detail?: string;
  salary_min?: number;
  salary_max?: number;
  contact_fee?: number;
  district: string;
  address: string;
  latitude?: number;
  longitude?: number;
  teaching_type: string;
  requirements?: string;
  source: string;
  raw_content?: string;
  status: string;
  contact_status: string;
  view_count: number;
  geo_status: string;
  published_at?: string;
  archived_at?: string;
  created_at: string;
  updated_at: string;
}

interface OrdersResponse {
  success: boolean;
  count: number;
  orders: Order[];
}

interface OrderResponse {
  success: boolean;
  order: Order;
}

interface LoginResponse {
  success: boolean;
  token?: string;
  admin?: {
    id: string;
    username: string;
    nickname: string;
  };
  error?: string;
}

class ApiService {
  private token: string | null = null;
  private visitorId: string | null = null;

  constructor() {
    this.token = localStorage.getItem('admin_token');
    this.visitorId = localStorage.getItem('visitor_id');
    if (!this.visitorId) {
      this.visitorId = this.generateVisitorId();
      localStorage.setItem('visitor_id', this.visitorId);
    }
  }

  private generateVisitorId(): string {
    return 'vis_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
  }

  getVisitorId(): string {
    return this.visitorId || '';
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('admin_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('admin_token');
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  private async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    if (this.visitorId) {
      (headers as Record<string, string>)['X-Visitor-ID'] = this.visitorId;
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: '请求失败' }));
      throw new Error(error.error || error.errors?.[0] || '请求失败');
    }

    return response.json();
  }

  async getOrders(): Promise<Order[]> {
    const response = await this.request<OrdersResponse>('/orders');
    return response.orders || [];
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    if (response.success && response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  logout() {
    this.clearToken();
  }

  async verifyToken(): Promise<boolean> {
    if (!this.token) return false;
    try {
      await this.request('/admin/verify');
      return true;
    } catch {
      this.clearToken();
      return false;
    }
  }

  async getAdminOrders(params: { status?: string; page?: number; limit?: number } = {}): Promise<{
    orders: Order[];
    count: number;
  }> {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.set('status', params.status);
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));

    const query = searchParams.toString();
    const response = await this.request<OrdersResponse>(`/admin/orders${query ? `?${query}` : ''}`);
    return { orders: response.orders || [], count: response.count };
  }

  async createOrder(data: Partial<Order>): Promise<Order> {
    const response = await this.request<OrderResponse>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.order;
  }

  async updateOrder(id: string, data: Partial<Order>): Promise<Order> {
    const response = await this.request<OrderResponse>(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.order;
  }

  async deleteOrder(id: string): Promise<void> {
    await this.request(`/orders/${id}`, { method: 'DELETE' });
  }

  async publishOrder(id: string): Promise<Order> {
    const response = await this.request<OrderResponse>(`/orders/${id}/publish`, {
      method: 'POST',
    });
    return response.order;
  }

  async archiveOrder(id: string): Promise<Order> {
    const response = await this.request<OrderResponse>(`/orders/${id}/archive`, {
      method: 'POST',
    });
    return response.order;
  }

  async reactivateOrder(id: string): Promise<Order> {
    const response = await this.request<OrderResponse>(`/orders/${id}/reactivate`, {
      method: 'POST',
    });
    return response.order;
  }

  async recordPageView(data: { page_path: string; page_title?: string; referrer?: string }): Promise<void> {
    await this.request('/analytics/pageview', {
      method: 'POST',
      body: JSON.stringify({ visitor_id: this.visitorId, ...data }),
    });
  }

  async recordOrderView(order_id: string): Promise<void> {
    await this.request('/analytics/order-view', {
      method: 'POST',
      body: JSON.stringify({ visitor_id: this.visitorId, order_id }),
    });
  }

  async getAnalyticsSummary(): Promise<{ totalPV: number; totalUV: number; todayPV: number; todayUV: number }> {
    const response = await this.request<{ success: boolean; data: { totalPV: number; totalUV: number; todayPV: number; todayUV: number } }>('/analytics/summary');
    return response.data;
  }

  async getDailyTrend(): Promise<{ date: string; pv: number; uv: number }[]> {
    const response = await this.request<{ success: boolean; data: { date: string; pv: number; uv: number }[] }>('/analytics/daily-trend');
    return response.data;
  }

  async getDeviceStats(): Promise<{ desktop: number; mobile: number; unknown: number }> {
    const response = await this.request<{ success: boolean; data: { desktop: number; mobile: number; unknown: number } }>('/analytics/device-stats');
    return response.data;
  }

  async getPageSourceStats(): Promise<{ page: string; count: number }[]> {
    const response = await this.request<{ success: boolean; data: { page: string; count: number }[] }>('/analytics/page-source-stats');
    return response.data;
  }

  async getTopOrders(): Promise<{ order_id: string; order_no: string; title: string; subject: string; education_stage: string; district: string; view_count: number; last_viewed_at: string | null }[]> {
    const response = await this.request<{ success: boolean; data: { order_id: string; order_no: string; title: string; subject: string; education_stage: string; district: string; view_count: number; last_viewed_at: string | null }[] }>('/analytics/top-orders');
    return response.data;
  }

  async getAllOrderViewStats(): Promise<{ [order_id: string]: { total_views: number; today_views: number; last_viewed_at: string | null } }> {
    const response = await this.request<{ success: boolean; data: { [order_id: string]: { total_views: number; today_views: number; last_viewed_at: string | null } } }>('/analytics/all-order-view-stats');
    return response.data;
  }
}

export const api = new ApiService();
export type { Order };
