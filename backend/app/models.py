from sqlalchemy import Column, String, Float, BigInteger, Boolean
from .database import Base

class Expense(Base):
    __tablename__ = "expenses"
    id = Column(String, primary_key=True, index=True)
    description = Column(String, index=True)
    amount = Column(Float)
    date = Column(BigInteger)
    category = Column(String)
    account = Column(String, nullable=True)
    paymentType = Column(String, nullable=True)
    instrumentId = Column(String, nullable=True)
    paymentMethodName = Column(String, nullable=True)

class Todo(Base):
    __tablename__ = "todos"
    id = Column(String, primary_key=True, index=True)
    title = Column(String)
    completed = Column(Boolean, default=False)
    createdAt = Column(BigInteger)

class PaymentMethod(Base):
    __tablename__ = "payment_methods"
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    type = Column(String)
    accountName = Column(String, nullable=True)
