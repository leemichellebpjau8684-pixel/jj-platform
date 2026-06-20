const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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

  constructor() {
    this.token = localStorage.getItem('admin_token');
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

  // 用户端接口
  async getOrders(): Promise<Order[]> {
    const response = await this.request<OrdersResponse>('/api/orders');
    return response.orders || [];
  }

  async getOrderById(id: string): Promise<Order | null> {
    try {
      const response = await this.request<OrderResponse>(`/api/orders/${id}`);
      return response.order;
    } catch {
      return null;
    }
  }

  // 管理员接口
  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/api/admin/login', {
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
      await this.request('/api/admin/verify');
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
    const response = await this.request<OrdersResponse>(`/api/admin/orders${query ? `?${query}` : ''}`);
    return { orders: response.orders || [], count: response.count };
  }

  async createOrder(data: Partial<Order>): Promise<Order> {
    const response = await this.request<OrderResponse>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.order;
  }

  async updateOrder(id: string, data: Partial<Order>): Promise<Order> {
    const response = await this.request<OrderResponse>(`/api/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.order;
  }

  async deleteOrder(id: string): Promise<void> {
    await this.request(`/api/orders/${id}`, { method: 'DELETE' });
  }

  async publishOrder(id: string): Promise<Order> {
    const response = await this.request<OrderResponse>(`/api/orders/${id}/publish`, {
      method: 'POST',
    });
    return response.order;
  }

  async archiveOrder(id: string): Promise<Order> {
    const response = await this.request<OrderResponse>(`/api/orders/${id}/archive`, {
      method: 'POST',
    });
    return response.order;
  }
}

export const api = new ApiService();
export type { Order };
