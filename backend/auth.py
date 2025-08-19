from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredential
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import os
from .models import User, UserRole

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "hvac_assistant_jwt_secret_key_2024")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

security = HTTPBearer(auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hash a password"""
    return pwd_context.hash(password)

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Dict[str, Any]:
    """Verify and decode a JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

def get_current_user(credentials: Optional[HTTPAuthorizationCredential] = Depends(security)):
    """Get current user from JWT token"""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = verify_token(credentials.credentials)
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return payload

def require_role(required_roles: list[UserRole]):
    """Decorator to require specific user roles"""
    def role_checker(current_user: Dict[str, Any] = Depends(get_current_user)):
        user_role = current_user.get("role")
        if user_role not in [role.value for role in required_roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        return current_user
    return role_checker

def require_admin(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Require admin role"""
    if current_user.get("role") != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

def require_owner_or_admin(current_user: Dict[str, Any] = Depends(get_current_user)):
    """Require owner or admin role"""
    user_role = current_user.get("role")
    if user_role not in [UserRole.OWNER.value, UserRole.ADMIN.value]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Owner or admin access required"
        )
    return current_user

# Mock authentication for development/testing
class MockAuth:
    """Mock authentication system for development"""
    
    @staticmethod
    def get_mock_user(role: UserRole = UserRole.OWNER, company_id: str = "elite-hvac-001") -> Dict[str, Any]:
        """Get a mock user for testing"""
        return {
            "sub": f"mock-user-{role.value}",
            "email": f"mock-{role.value}@hvactech.com",
            "name": f"Mock {role.value.title()}",
            "role": role.value,
            "company_id": company_id,
            "exp": datetime.utcnow() + timedelta(hours=1)
        }
    
    @staticmethod
    def create_mock_token(role: UserRole = UserRole.OWNER, company_id: str = "elite-hvac-001") -> str:
        """Create a mock JWT token for testing"""
        mock_user = MockAuth.get_mock_user(role, company_id)
        return create_access_token(mock_user)

# Admin authentication for multi-tenant admin portal
def authenticate_admin(email: str, password: str) -> bool:
    """Authenticate admin user"""
    admin_email = os.getenv("ADMIN_EMAIL", "admin@hvactech.com")
    admin_password = os.getenv("ADMIN_PASSWORD", "HvacAdmin2024!")
    
    return email == admin_email and password == admin_password

def create_admin_token() -> str:
    """Create admin JWT token"""
    admin_data = {
        "sub": "admin",
        "email": os.getenv("ADMIN_EMAIL", "admin@hvactech.com"),
        "role": UserRole.ADMIN.value,
        "is_admin": True
    }
    return create_access_token(admin_data)