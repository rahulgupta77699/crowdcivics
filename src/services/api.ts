// API service layer for backend operations
// Using localStorage as a mock backend for demonstration

interface User {
  id: string;
  name: string;
  email: string;
  role?: 'admin' | 'user';
  createdAt: string;
}

interface Report {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'pending' | 'in-progress' | 'resolved';
  userId: string;
  location: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignUpData {
  name: string;
  email: string;
  password: string;
}

// Mock delay to simulate network requests
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class ApiService {
  private readonly USERS_KEY = 'civic_users';
  private readonly REPORTS_KEY = 'civic_reports';
  private readonly CURRENT_USER_KEY = 'civic_current_user';

  // User Authentication
  async signUp(userData: SignUpData): Promise<User> {
    await delay(1000); // Simulate network delay

    const users = this.getUsers();
    
    // Check if user already exists
    if (users.find(user => user.email === userData.email)) {
      throw new Error('User with this email already exists');
    }

    const newUser: User = {
      id: Date.now().toString(),
      name: userData.name,
      email: userData.email,
      role: userData.email === 'admin@example.com' ? 'admin' : 'user',
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    this.saveUsers(users);
    
    // Also save password (in real app, this would be hashed and stored securely)
    const passwords = this.getPasswords();
    passwords[newUser.id] = userData.password;
    localStorage.setItem('civic_passwords', JSON.stringify(passwords));

    return newUser;
  }

  async signIn(credentials: LoginCredentials): Promise<User> {
    await delay(800); // Simulate network delay

    const users = this.getUsers();
    const passwords = this.getPasswords();
    
    const user = users.find(user => user.email === credentials.email);
    
    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (passwords[user.id] !== credentials.password) {
      throw new Error('Invalid email or password');
    }

    // Save current user session
    localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
    
    return user;
  }

  async signOut(): Promise<void> {
    await delay(300);
    localStorage.removeItem(this.CURRENT_USER_KEY);
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem(this.CURRENT_USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  }

  // Check if email exists (useful for better UX)
  async checkEmailExists(email: string): Promise<boolean> {
    await delay(300); // Simulate network delay
    const users = this.getUsers();
    return users.some(user => user.email.toLowerCase() === email.toLowerCase());
  }

  // Reports Management
  async createReport(reportData: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>): Promise<Report> {
    await delay(1000);

    const reports = this.getReports();
    const newReport: Report = {
      ...reportData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    reports.push(newReport);
    this.saveReports(reports);
    
    return newReport;
  }

  async getUserReports(userId: string): Promise<Report[]> {
    await delay(600);
    
    const reports = this.getReports();
    return reports.filter(report => report.userId === userId);
  }

  async getAllReports(): Promise<Report[]> {
    await delay(600);
    
    return this.getReports();
  }

  async updateReportStatus(reportId: string, status: Report['status']): Promise<Report> {
    await delay(800);
    
    const reports = this.getReports();
    const reportIndex = reports.findIndex(report => report.id === reportId);
    
    if (reportIndex === -1) {
      throw new Error('Report not found');
    }

    reports[reportIndex] = {
      ...reports[reportIndex],
      status,
      updatedAt: new Date().toISOString(),
    };

    this.saveReports(reports);
    
    return reports[reportIndex];
  }

  // Helper methods
  private getUsers(): User[] {
    const usersStr = localStorage.getItem(this.USERS_KEY);
    return usersStr ? JSON.parse(usersStr) : [];
  }

  private saveUsers(users: User[]): void {
    localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
  }

  private getReports(): Report[] {
    const reportsStr = localStorage.getItem(this.REPORTS_KEY);
    return reportsStr ? JSON.parse(reportsStr) : [];
  }

  private saveReports(reports: Report[]): void {
    localStorage.setItem(this.REPORTS_KEY, JSON.stringify(reports));
  }

  private getPasswords(): Record<string, string> {
    const passwordsStr = localStorage.getItem('civic_passwords');
    return passwordsStr ? JSON.parse(passwordsStr) : {};
  }

  // Initialize with demo data
  initializeDemoData(): void {
    if (this.getUsers().length === 0) {
      const demoUsers: User[] = [
        {
          id: '1',
          name: 'Admin User',
          email: 'admin@example.com',
          role: 'admin',
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'user',
          createdAt: new Date().toISOString(),
        },
        {
          id: '3',
          name: 'Jane Smith',
          email: 'jane@example.com',
          role: 'user',
          createdAt: new Date().toISOString(),
        },
      ];

      this.saveUsers(demoUsers);
      
      // Save demo passwords
      const passwords = {
        '1': 'admin123',
        '2': 'demo123',
        '3': 'demo456',
      };
      localStorage.setItem('civic_passwords', JSON.stringify(passwords));
    }

    if (this.getReports().length === 0) {
      const demoReports: Report[] = [
        {
          id: '1',
          title: 'Pothole on Main Street',
          description: 'Large pothole causing traffic issues near the intersection.',
          category: 'Road Maintenance',
          status: 'in-progress',
          userId: '1',
          location: 'Main Street & 5th Avenue',
          createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Broken Street Light',
          description: 'Street light has been out for over a week, creating safety concerns.',
          category: 'Lighting',
          status: 'pending',
          userId: '2',
          location: 'Oak Avenue & 2nd Street',
          createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          updatedAt: new Date(Date.now() - 172800000).toISOString(),
        },
        {
          id: '3',
          title: 'Overflowing Garbage Bin',
          description: 'Public garbage bin in the park is overflowing and attracting pests.',
          category: 'Waste Management',
          status: 'resolved',
          userId: '1',
          location: 'Central Park - North Entrance',
          createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
          updatedAt: new Date(Date.now() - 86400000).toISOString(), // resolved 1 day ago
        },
      ];

      this.saveReports(demoReports);
    }
  }
}

// Export singleton instance
export const apiService = new ApiService();
export type { User, Report, LoginCredentials, SignUpData };