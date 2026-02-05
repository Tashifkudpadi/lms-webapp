from sqlalchemy import Column, Integer, String, Enum, DateTime
from app.database import Base
import enum


class Role(enum.Enum):
    ADMIN = "admin"
    FACULTY = "faculty"
    STUDENT = "student"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String, index=True)
    last_name = Column(String, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(Enum(Role, name="role_enum"), nullable=False)
    hashed_password = Column(String, nullable=False)
    last_active = Column(DateTime, nullable=True)

    def __repr__(self):
        return f"<User id={self.id} email={self.email} role={self.role}>"
