"""
Security utilities.

This module provides security-related utilities like password hashing and JWT token handling.
"""

from datetime import datetime, timedelta
from typing import Any, Union
from collections import defaultdict, deque
import asyncio
import base64
import hashlib
import hmac
import ipaddress
import json
import re
import secrets
import time
from dataclasses import dataclass, field
from enum import Enum
from uuid import UUID

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from jose import jwt
from passlib.context import CryptContext
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from app.core.settings import settings
from ..core.observability import get_logger

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against a hash.

    Args:
        plain_password: Plain text password
        hashed_password: Hashed password

    Returns:
        bool: True if password matches hash
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Hash a password.

    Args:
        password: Plain text password

    Returns:
        str: Hashed password
    """
    return pwd_context.hash(password)


def create_access_token(
    subject: Union[str, UUID], expires_delta: timedelta | None = None
) -> str:
    """
    Create a JWT access token.

    Args:
        subject: Token subject (usually user ID)
        expires_delta: Token expiration time

    Returns:
        str: JWT token
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.access_token_expire_minutes
        )
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(
        to_encode, settings.get_secret_key(), algorithm=settings.algorithm
    )
    return encoded_jwt


# Enhanced Security Components
class SecurityLevel(Enum):
    """Security threat levels"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class RateLimitType(Enum):
    """Types of rate limiting"""
    REQUESTS_PER_MINUTE = "requests_per_minute"
    REQUESTS_PER_HOUR = "requests_per_hour"
    TOKENS_PER_MINUTE = "tokens_per_minute"
    DATA_TRANSFER_PER_HOUR = "data_transfer_per_hour"


@dataclass
class SecurityThreat:
    """Security threat detection"""
    id: str
    threat_type: str
    severity: SecurityLevel
    source_ip: str
    description: str
    detected_at: datetime = field(default_factory=datetime.utcnow)
    resolved: bool = False
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class RateLimitRule:
    """Rate limiting rule configuration"""
    name: str
    limit_type: RateLimitType
    limit: int
    window_seconds: int
    burst_allowance: int = 0
    exclude_ips: List[str] = field(default_factory=list)
    exclude_user_types: List[str] = field(default_factory=list)


class AdvancedEncryptionManager:
    """Enhanced encryption manager with multiple encryption methods"""
    
    def __init__(self, encryption_key: Optional[bytes] = None):
        """Initialize encryption manager with key"""
        if encryption_key:
            self.fernet = Fernet(encryption_key)
        else:
            # Generate new key if none provided
            key = Fernet.generate_key()
            self.fernet = Fernet(key)
            
        self.logger = get_logger(__name__)
    
    @classmethod
    def from_password(cls, password: str, salt: Optional[bytes] = None) -> 'AdvancedEncryptionManager':
        """Create encryption manager from password"""
        if not salt:
            salt = secrets.token_bytes(16)
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        return cls(key)
    
    def encrypt_data(self, data: Union[str, bytes, dict]) -> str:
        """Encrypt data and return base64 encoded string"""
        try:
            if isinstance(data, dict):
                data = json.dumps(data)
            if isinstance(data, str):
                data = data.encode()
            
            encrypted = self.fernet.encrypt(data)
            return base64.urlsafe_b64encode(encrypted).decode()
        
        except Exception as e:
            self.logger.error("Encryption failed", error=str(e))
            raise
    
    def decrypt_data(self, encrypted_data: str) -> bytes:
        """Decrypt base64 encoded encrypted data"""
        try:
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_data.encode())
            return self.fernet.decrypt(encrypted_bytes)
        
        except Exception as e:
            self.logger.error("Decryption failed", error=str(e))
            raise
    
    def encrypt_json(self, data: dict) -> str:
        """Encrypt JSON data"""
        return self.encrypt_data(json.dumps(data))
    
    def decrypt_json(self, encrypted_data: str) -> dict:
        """Decrypt to JSON data"""
        decrypted = self.decrypt_data(encrypted_data)
        return json.loads(decrypted.decode())


class AdvancedRateLimiter:
    """Redis-based distributed rate limiter with multiple strategies"""
    
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.rules: Dict[str, RateLimitRule] = {}
        self.logger = get_logger(__name__)
    
    def add_rule(self, rule: RateLimitRule):
        """Add a rate limiting rule"""
        self.rules[rule.name] = rule
        self.logger.info(
            "Rate limit rule added",
            rule_name=rule.name,
            limit=rule.limit,
            window_seconds=rule.window_seconds
        )
    
    async def check_rate_limit(
        self,
        identifier: str,
        rule_name: str,
        increment: int = 1,
        metadata: Optional[Dict[str, Any]] = None
    ) -> tuple[bool, Dict[str, Any]]:
        """
        Check if request should be rate limited
        Returns (allowed, info)
        """
        if rule_name not in self.rules:
            return True, {"error": "Rule not found"}
        
        rule = self.rules[rule_name]
        current_time = int(time.time())
        window_start = current_time - rule.window_seconds
        
        # Redis key for this identifier and rule
        key = f"rate_limit:{rule_name}:{identifier}"
        
        try:
            # Use sliding window counter
            pipe = self.redis.pipeline()
            pipe.zremrangebyscore(key, 0, window_start)  # Remove old entries
            pipe.zcard(key)  # Get current count
            pipe.expire(key, rule.window_seconds)  # Set expiration
            
            results = pipe.execute()
            current_count = results[1]
            
            # Check if limit exceeded
            if current_count + increment > rule.limit:
                self.logger.warning(
                    "Rate limit exceeded",
                    identifier=identifier,
                    rule=rule_name,
                    current_count=current_count,
                    limit=rule.limit,
                    metadata=metadata
                )
                
                return False, {
                    "allowed": False,
                    "current_count": current_count,
                    "limit": rule.limit,
                    "window_seconds": rule.window_seconds,
                    "retry_after": rule.window_seconds
                }
            
            # Add current request with jitter to prevent thundering herd
            for _ in range(increment):
                score = current_time + secrets.randbelow(1000) / 1000.0
                self.redis.zadd(key, {str(score): score})
            
            return True, {
                "allowed": True,
                "current_count": current_count + increment,
                "limit": rule.limit,
                "remaining": rule.limit - (current_count + increment)
            }
        
        except Exception as e:
            self.logger.error(
                "Rate limit check failed",
                identifier=identifier,
                rule=rule_name,
                error=str(e)
            )
            # Allow request if Redis fails (fail open)
            return True, {"error": "Rate limit check failed"}


class SecurityScanner:
    """Advanced vulnerability scanner and threat detector"""
    
    def __init__(self):
        self.threats: deque = deque(maxlen=10000)
        self.blocked_ips: set = set()
        self.failed_attempts: defaultdict = defaultdict(list)
        
        # Enhanced suspicious patterns
        self.suspicious_patterns = [
            r'(?i)(union|select|insert|update|delete|drop|create|alter|exec|script)',
            r'(?i)(javascript|vbscript|onload|onerror|onclick|onmouseover)',
            r'(?i)(<script|<iframe|<object|<embed|<link|<meta)',
            r'(?i)(\.\.\/|\.\.\\|%2e%2e)',  # Path traversal
            r'(?i)(cmd|powershell|bash|sh|exec|system)(\s|=|:|;)',
            r'(?i)(base64|eval|exec|system|phpinfo)',
            r'(?i)(passwd|shadow|hosts|boot\.ini)',  # System files
            r'(?i)(http://|https://|ftp://|file://)',  # External URLs
            r'(?i)(0x[0-9a-f]+)',  # Hex values
            r'(?i)(\${.*})',  # Variable injection
        ]
        
        self.compiled_patterns = [re.compile(pattern) for pattern in self.suspicious_patterns]
        self.logger = get_logger(__name__)
    
    def scan_input(self, data: str, source_ip: str) -> List[SecurityThreat]:
        """Scan input for security threats"""
        threats = []
        
        for i, pattern in enumerate(self.compiled_patterns):
            matches = pattern.findall(data)
            if matches:
                threat = SecurityThreat(
                    id=f"threat_{int(time.time() * 1000)}_{i}",
                    threat_type="malicious_input",
                    severity=SecurityLevel.HIGH,
                    source_ip=source_ip,
                    description=f"Suspicious pattern detected: {self.suspicious_patterns[i]}",
                    metadata={
                        "pattern_index": i, 
                        "matches": matches[:5],  # First 5 matches
                        "input_sample": data[:200]
                    }
                )
                threats.append(threat)
                self.threats.append(threat)
        
        return threats
    
    def detect_brute_force(self, identifier: str, is_failed: bool = True, time_window: int = 300) -> Optional[SecurityThreat]:
        """Detect brute force attacks with time-based analysis"""
        current_time = time.time()
        
        if is_failed:
            self.failed_attempts[identifier].append(current_time)
        
        # Clean old attempts
        cutoff_time = current_time - time_window
        self.failed_attempts[identifier] = [
            t for t in self.failed_attempts[identifier] if t > cutoff_time
        ]
        
        failed_count = len(self.failed_attempts[identifier])
        
        if failed_count >= 5:  # 5 failed attempts in time window
            threat = SecurityThreat(
                id=f"brute_force_{identifier}_{int(current_time)}",
                threat_type="brute_force",
                severity=SecurityLevel.HIGH,
                source_ip=identifier,
                description=f"Brute force attack detected: {failed_count} failed attempts in {time_window}s",
                metadata={
                    "failed_attempts": failed_count, 
                    "time_window": time_window,
                    "attempt_times": self.failed_attempts[identifier][-10:]  # Last 10 attempts
                }
            )
            self.threats.append(threat)
            return threat
        
        return None
    
    def check_ip_reputation(self, ip: str) -> SecurityLevel:
        """Enhanced IP reputation checking"""
        if ip in self.blocked_ips:
            return SecurityLevel.CRITICAL
        
        try:
            ip_obj = ipaddress.ip_address(ip)
            
            # Check for private/internal IPs
            if ip_obj.is_private:
                return SecurityLevel.LOW
                
            # Check for localhost
            if ip_obj.is_loopback:
                return SecurityLevel.LOW
                
            # Check for multicast
            if ip_obj.is_multicast:
                return SecurityLevel.MEDIUM
                
            # Check for known bad IP ranges (placeholder)
            # In production, integrate with threat intelligence feeds
            
        except ValueError:
            return SecurityLevel.MEDIUM
        
        return SecurityLevel.LOW
    
    def block_ip(self, ip: str, reason: str, duration_seconds: Optional[int] = None):
        """Block an IP address with optional duration"""
        self.blocked_ips.add(ip)
        
        # If duration specified, schedule unblock
        if duration_seconds:
            # In production, use Redis with TTL for distributed blocking
            pass
        
        self.logger.warning(
            "IP blocked",
            ip=ip,
            reason=reason,
            duration_seconds=duration_seconds,
            blocked_count=len(self.blocked_ips)
        )
    
    def is_ip_blocked(self, ip: str) -> bool:
        """Check if IP is blocked"""
        return ip in self.blocked_ips
    
    def analyze_request_pattern(self, requests: List[Dict[str, Any]]) -> List[SecurityThreat]:
        """Analyze request patterns for anomalies"""
        threats = []
        
        if len(requests) > 100:  # Too many requests
            threat = SecurityThreat(
                id=f"high_volume_{int(time.time())}",
                threat_type="high_volume",
                severity=SecurityLevel.MEDIUM,
                source_ip=requests[0].get("ip", "unknown"),
                description=f"High volume of requests detected: {len(requests)}",
                metadata={"request_count": len(requests)}
            )
            threats.append(threat)
        
        return threats


class SecurityMiddleware(BaseHTTPMiddleware):
    """Enhanced security middleware with comprehensive protection"""
    
    def __init__(
        self,
        app,
        rate_limiter: AdvancedRateLimiter,
        scanner: SecurityScanner,
        encryption_manager: AdvancedEncryptionManager
    ):
        super().__init__(app)
        self.rate_limiter = rate_limiter
        self.scanner = scanner
        self.encryption_manager = encryption_manager
        self.logger = get_logger(__name__)
        
        # Request tracking for pattern analysis
        self.request_history: defaultdict = defaultdict(list)
    
    async def dispatch(self, request: Request, call_next):
        """Process request through comprehensive security filters"""
        start_time = time.time()
        client_ip = self._get_client_ip(request)
        user_agent = request.headers.get("User-Agent", "")
        
        try:
            # Track request for pattern analysis
            self._track_request(client_ip, request)
            
            # Check if IP is blocked
            if self.scanner.is_ip_blocked(client_ip):
                self.logger.warning("Blocked IP attempted access", ip=client_ip)
                return JSONResponse(
                    status_code=403,
                    content={"error": "Access denied", "code": "IP_BLOCKED"}
                )
            
            # Check IP reputation
            ip_reputation = self.scanner.check_ip_reputation(client_ip)
            if ip_reputation == SecurityLevel.CRITICAL:
                self.logger.warning("Critical IP reputation", ip=client_ip)
                return JSONResponse(
                    status_code=403,
                    content={"error": "Access denied", "code": "IP_REPUTATION"}
                )
            
            # Enhanced rate limiting with multiple rules
            await self._apply_rate_limiting(request, client_ip)
            
            # Content security scanning
            if request.method in ["POST", "PUT", "PATCH"]:
                await self._scan_request_content(request, client_ip)
            
            # Header security validation
            self._validate_headers(request)
            
            # Process request
            response = await call_next(request)
            
            # Add security headers to response
            self._add_security_headers(response)
            
            # Log security event
            duration = time.time() - start_time
            self.logger.info(
                "Security check completed",
                ip=client_ip,
                path=request.url.path,
                method=request.method,
                status_code=response.status_code,
                duration=duration,
                ip_reputation=ip_reputation.value,
                user_agent=user_agent[:100]  # Truncate user agent
            )
            
            return response
        
        except HTTPException:
            raise
        except Exception as e:
            self.logger.error(
                "Security middleware error",
                ip=client_ip,
                error=str(e),
                path=request.url.path
            )
            # Allow request to proceed if security check fails (fail open)
            return await call_next(request)
    
    def _track_request(self, ip: str, request: Request):
        """Track request for pattern analysis"""
        current_time = time.time()
        request_data = {
            "timestamp": current_time,
            "ip": ip,
            "path": request.url.path,
            "method": request.method,
            "user_agent": request.headers.get("User-Agent", "")
        }
        
        self.request_history[ip].append(request_data)
        
        # Keep only last 100 requests per IP
        if len(self.request_history[ip]) > 100:
            self.request_history[ip] = self.request_history[ip][-100:]
    
    async def _apply_rate_limiting(self, request: Request, client_ip: str):
        """Apply multiple rate limiting rules"""
        path = request.url.path
        
        # General rate limiting
        rate_limit_key = f"{client_ip}:{request.method}:{path}"
        allowed, rate_info = await self.rate_limiter.check_rate_limit(
            rate_limit_key,
            "general_requests",
            metadata={"ip": client_ip, "path": path}
        )
        
        if not allowed:
            raise HTTPException(
                status_code=429,
                detail={
                    "error": "Rate limit exceeded",
                    "retry_after": rate_info.get("retry_after", 60)
                }
            )
        
        # Auth endpoint specific rate limiting
        if "/auth" in path:
            auth_key = f"{client_ip}:auth"
            allowed, rate_info = await self.rate_limiter.check_rate_limit(
                auth_key,
                "auth_requests",
                metadata={"ip": client_ip, "endpoint": "auth"}
            )
            
            if not allowed:
                raise HTTPException(
                    status_code=429,
                    detail={
                        "error": "Authentication rate limit exceeded",
                        "retry_after": rate_info.get("retry_after", 300)
                    }
                )
    
    async def _scan_request_content(self, request: Request, client_ip: str):
        """Scan request content for security threats"""
        try:
            body = await request.body()
            if body:
                content = body.decode('utf-8')
                threats = self.scanner.scan_input(content, client_ip)
                
                if threats:
                    self.logger.warning(
                        "Security threats detected in request body",
                        ip=client_ip,
                        threat_count=len(threats),
                        threat_types=[t.threat_type for t in threats]
                    )
                    
                    # Block IP after multiple serious threats
                    high_severity_threats = [t for t in threats if t.severity in [SecurityLevel.HIGH, SecurityLevel.CRITICAL]]
                    if len(high_severity_threats) >= 2:
                        self.scanner.block_ip(client_ip, "Multiple high-severity security threats detected")
                    
                    raise HTTPException(
                        status_code=400,
                        detail={
                            "error": "Request contains potentially malicious content",
                            "code": "CONTENT_THREAT_DETECTED"
                        }
                    )
        
        except UnicodeDecodeError:
            self.logger.warning("Failed to decode request body", ip=client_ip)
            # Could be binary content or encoding issue
    
    def _validate_headers(self, request: Request):
        """Validate request headers for security"""
        # Check for suspicious headers
        suspicious_headers = ["X-Forwarded-Host", "X-Original-URL", "X-Rewrite-URL"]
        
        for header in suspicious_headers:
            if header in request.headers:
                self.logger.warning(
                    "Suspicious header detected",
                    header=header,
                    value=request.headers[header],
                    ip=self._get_client_ip(request)
                )
    
    def _add_security_headers(self, response):
        """Add security headers to response"""
        security_headers = {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            "Content-Security-Policy": "default-src 'self'",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Permissions-Policy": "geolocation=(), microphone=(), camera=()"
        }
        
        for header, value in security_headers.items():
            response.headers[header] = value
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP from request with enhanced detection"""
        # Check for forwarded headers in order of preference
        forwarded_headers = [
            "X-Forwarded-For",
            "X-Real-IP", 
            "X-Client-IP",
            "CF-Connecting-IP",  # Cloudflare
            "True-Client-IP"     # Akamai
        ]
        
        for header in forwarded_headers:
            value = request.headers.get(header)
            if value:
                # Take first IP if comma-separated
                ip = value.split(",")[0].strip()
                try:
                    # Validate IP address
                    ipaddress.ip_address(ip)
                    return ip
                except ValueError:
                    continue
        
        return request.client.host if request.client else "unknown"


def create_enhanced_security_suite(redis_client: redis.Redis, encryption_password: str, jwt_secret: str):
    """Create complete enhanced security suite"""
    
    # Initialize components
    rate_limiter = AdvancedRateLimiter(redis_client)
    scanner = SecurityScanner()
    encryption_manager = AdvancedEncryptionManager.from_password(encryption_password)
    
    # Configure comprehensive rate limiting rules
    rate_limiter.add_rule(RateLimitRule(
        name="general_requests",
        limit_type=RateLimitType.REQUESTS_PER_MINUTE,
        limit=60,  # 60 requests per minute
        window_seconds=60
    ))
    
    rate_limiter.add_rule(RateLimitRule(
        name="auth_requests",
        limit_type=RateLimitType.REQUESTS_PER_MINUTE,
        limit=5,  # 5 auth requests per minute
        window_seconds=60
    ))
    
    rate_limiter.add_rule(RateLimitRule(
        name="llm_requests",
        limit_type=RateLimitType.REQUESTS_PER_HOUR,
        limit=100,  # 100 LLM requests per hour
        window_seconds=3600
    ))
    
    rate_limiter.add_rule(RateLimitRule(
        name="file_upload",
        limit_type=RateLimitType.REQUESTS_PER_HOUR,
        limit=20,  # 20 file uploads per hour
        window_seconds=3600
    ))
    
    return rate_limiter, scanner, encryption_manager


# Enhanced security decorators
def require_ip_whitelist(allowed_ips: List[str]):
    """Decorator to restrict access to whitelisted IPs"""
    def decorator(func):
        @wraps(func)
        async def wrapper(request: Request, *args, **kwargs):
            client_ip = request.client.host
            if client_ip not in allowed_ips:
                raise HTTPException(status_code=403, detail="IP not whitelisted")
            return await func(request, *args, **kwargs)
        return wrapper
    return decorator


def security_audit_log(action: str):
    """Decorator to log security-sensitive actions"""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            logger = get_logger(__name__)
            start_time = time.time()
            
            try:
                result = await func(*args, **kwargs)
                duration = time.time() - start_time
                
                logger.info(
                    "Security action completed",
                    action=action,
                    function=func.__name__,
                    duration=duration,
                    success=True
                )
                
                return result
            
            except Exception as e:
                duration = time.time() - start_time
                
                logger.error(
                    "Security action failed",
                    action=action,
                    function=func.__name__,
                    duration=duration,
                    error=str(e),
                    success=False
                )
                
                raise
        
        return wrapper
    return decorator