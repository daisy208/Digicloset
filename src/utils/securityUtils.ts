import DOMPurify from 'dompurify';

// Input sanitization utilities
export class SecurityUtils {
  // Sanitize HTML content
  static sanitizeHTML(html: string): string {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: []
    });
  }

  // Sanitize user input for database queries
  static sanitizeInput(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/['"]/g, '') // Remove quotes to prevent SQL injection
      .replace(/[;&|`$]/g, '') // Remove command injection characters
      .substring(0, 1000); // Limit length
  }

  // Validate email format
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  // Validate password strength
  static validatePassword(password: string): {
    isValid: boolean;
    errors: string[];
    strength: 'weak' | 'medium' | 'strong';
  } {
    const errors: string[] = [];
    let score = 0;

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    } else {
      score += 1;
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    } else {
      score += 1;
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    } else {
      score += 1;
    }

    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    } else {
      score += 1;
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    } else {
      score += 1;
    }

    // Check for common patterns
    if (/(.)\1{2,}/.test(password)) {
      errors.push('Password should not contain repeated characters');
      score -= 1;
    }

    if (/123|abc|qwe|password|admin/i.test(password)) {
      errors.push('Password should not contain common patterns');
      score -= 1;
    }

    let strength: 'weak' | 'medium' | 'strong' = 'weak';
    if (score >= 4) strength = 'strong';
    else if (score >= 2) strength = 'medium';

    return {
      isValid: errors.length === 0,
      errors,
      strength
    };
  }

  // Generate secure random token
  static generateSecureToken(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Hash sensitive data (client-side hashing for additional security)
  static async hashData(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Validate file upload
  static validateFileUpload(file: File): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    if (file.size > maxSize) {
      errors.push('File size must be less than 10MB');
    }

    if (!allowedTypes.includes(file.type)) {
      errors.push('File type not allowed. Only JPEG, PNG, WebP, and GIF are supported');
    }

    // Check file extension matches MIME type
    const extension = file.name.split('.').pop()?.toLowerCase();
    const mimeTypeMap: Record<string, string[]> = {
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/webp': ['webp'],
      'image/gif': ['gif']
    };

    const expectedExtensions = mimeTypeMap[file.type];
    if (!expectedExtensions || !extension || !expectedExtensions.includes(extension)) {
      errors.push('File extension does not match file type');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Rate limiting helper
  static createRateLimiter(maxRequests: number, windowMs: number) {
    const requests = new Map<string, number[]>();

    return (identifier: string): boolean => {
      const now = Date.now();
      const userRequests = requests.get(identifier) || [];
      
      // Remove old requests outside the window
      const validRequests = userRequests.filter(time => now - time < windowMs);
      
      if (validRequests.length >= maxRequests) {
        return false; // Rate limit exceeded
      }

      validRequests.push(now);
      requests.set(identifier, validRequests);
      return true;
    };
  }

  // Content Security Policy helper
  static generateCSPNonce(): string {
    return this.generateSecureToken(16);
  }

  // XSS protection for dynamic content
  static escapeHTML(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Validate URL to prevent open redirects
  static isValidRedirectURL(url: string, allowedDomains: string[]): boolean {
    try {
      const urlObj = new URL(url);
      
      // Only allow HTTPS in production
      if (process.env.NODE_ENV === 'production' && urlObj.protocol !== 'https:') {
        return false;
      }

      // Check if domain is in allowed list
      return allowedDomains.some(domain => 
        urlObj.hostname === domain || urlObj.hostname.endsWith(`.${domain}`)
      );
    } catch {
      return false;
    }
  }

  // Secure local storage wrapper
  static secureStorage = {
    setItem: (key: string, value: string): void => {
      try {
        const encrypted = btoa(value); // Basic encoding (use proper encryption in production)
        localStorage.setItem(key, encrypted);
      } catch (error) {
        console.error('Failed to store item securely:', error);
      }
    },

    getItem: (key: string): string | null => {
      try {
        const encrypted = localStorage.getItem(key);
        return encrypted ? atob(encrypted) : null;
      } catch (error) {
        console.error('Failed to retrieve item securely:', error);
        return null;
      }
    },

    removeItem: (key: string): void => {
      localStorage.removeItem(key);
    }
  };

  // CSRF token management
  static csrfToken = {
    generate: (): string => {
      const token = SecurityUtils.generateSecureToken();
      SecurityUtils.secureStorage.setItem('csrf_token', token);
      return token;
    },

    get: (): string | null => {
      return SecurityUtils.secureStorage.getItem('csrf_token');
    },

    validate: (token: string): boolean => {
      const storedToken = SecurityUtils.secureStorage.getItem('csrf_token');
      return storedToken === token;
    }
  };

  // Audit logging
  static auditLog = {
    log: (action: string, details: any): void => {
      const logEntry = {
        timestamp: new Date().toISOString(),
        action,
        details,
        userAgent: navigator.userAgent,
        url: window.location.href,
        sessionId: SecurityUtils.secureStorage.getItem('session_id')
      };

      // In production, send to secure logging service
      console.log('Security Audit:', logEntry);
    },

    logSecurityEvent: (event: string, severity: 'low' | 'medium' | 'high', details: any): void => {
      SecurityUtils.auditLog.log(`SECURITY_${event.toUpperCase()}`, {
        severity,
        ...details
      });

      // Alert for high severity events
      if (severity === 'high') {
        console.error('High severity security event:', event, details);
      }
    }
  };
}

// Security middleware for API requests
export class APISecurityMiddleware {
  private static rateLimiter = SecurityUtils.createRateLimiter(100, 60000); // 100 requests per minute

  static async secureRequest(url: string, options: RequestInit = {}): Promise<Response> {
    // Rate limiting
    const clientId = SecurityUtils.secureStorage.getItem('client_id') || 'anonymous';
    if (!this.rateLimiter(clientId)) {
      throw new Error('Rate limit exceeded');
    }

    // Add CSRF token
    const csrfToken = SecurityUtils.csrfToken.get();
    if (csrfToken) {
      options.headers = {
        ...options.headers,
        'X-CSRF-Token': csrfToken
      };
    }

    // Add security headers
    options.headers = {
      ...options.headers,
      'X-Requested-With': 'XMLHttpRequest',
      'Cache-Control': 'no-cache'
    };

    // Validate URL
    const allowedDomains = [window.location.hostname, 'api.virtualfit.com'];
    if (!SecurityUtils.isValidRedirectURL(url, allowedDomains)) {
      throw new Error('Invalid request URL');
    }

    try {
      const response = await fetch(url, options);
      
      // Log security events
      if (response.status === 401) {
        SecurityUtils.auditLog.logSecurityEvent('unauthorized_access', 'medium', { url });
      } else if (response.status === 403) {
        SecurityUtils.auditLog.logSecurityEvent('forbidden_access', 'high', { url });
      }

      return response;
    } catch (error) {
      SecurityUtils.auditLog.logSecurityEvent('request_failed', 'low', { url, error: error.message });
      throw error;
    }
  }
}

// Initialize security measures
export function initializeSecurity() {
  // Generate CSRF token if not exists
  if (!SecurityUtils.csrfToken.get()) {
    SecurityUtils.csrfToken.generate();
  }

  // Generate client ID if not exists
  if (!SecurityUtils.secureStorage.getItem('client_id')) {
    SecurityUtils.secureStorage.setItem('client_id', SecurityUtils.generateSecureToken());
  }

  // Set up security event listeners
  window.addEventListener('error', (event) => {
    SecurityUtils.auditLog.logSecurityEvent('javascript_error', 'low', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno
    });
  });

  // Detect potential XSS attempts
  const originalInnerHTML = Element.prototype.innerHTML;
  Element.prototype.innerHTML = function(value: string) {
    if (typeof value === 'string' && /<script|javascript:|on\w+=/i.test(value)) {
      SecurityUtils.auditLog.logSecurityEvent('potential_xss', 'high', { content: value });
      return originalInnerHTML.call(this, SecurityUtils.sanitizeHTML(value));
    }
    return originalInnerHTML.call(this, value);
  };

  console.log('Security measures initialized');
}

export default SecurityUtils;