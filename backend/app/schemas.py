from pydantic import BaseModel
from typing import Optional, List

class ExpenseBase(BaseModel):
    id: str
    description: str
    amount: float
    date: int
    category: str
    account: Optional[str] = None
    paymentType: Optional[str] = None
    instrumentId: Optional[str] = None
    paymentMethodName: Optional[str] = None

class ExpenseCreate(ExpenseBase):
    pass

class Expense(ExpenseBase):
    class Config:
        from_attributes = True

class TodoBase(BaseModel):
    id: str
    title: str
    completed: bool
    createdAt: int

class TodoCreate(TodoBase):
    pass

class Todo(TodoBase):
    class Config:
        from_attributes = True

class PaymentMethodBase(BaseModel):
    id: str
    name: str
    type: str
    accountName: Optional[str] = None

class PaymentMethodCreate(PaymentMethodBase):
    pass

class PaymentMethod(PaymentMethodBase):
    class Config:
        from_attributes = True
