from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from contextlib import asynccontextmanager

from . import crud, models, schemas
from .database import engine, get_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    async with engine.begin() as conn:
        await conn.run_sync(models.Base.metadata.create_all)
    yield
    # Shutdown logic if needed
    await engine.dispose()

app = FastAPI(title="MoneyFlow API", lifespan=lifespan)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Expenses
@app.post("/expenses/", response_model=schemas.Expense)
async def create_expense(expense: schemas.ExpenseCreate, db: AsyncSession = Depends(get_db)):
    return await crud.create_expense(db=db, expense=expense)

@app.get("/expenses/", response_model=List[schemas.Expense])
async def read_expenses(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    expenses = await crud.get_expenses(db, skip=skip, limit=limit)
    return expenses

@app.put("/expenses/{expense_id}", response_model=schemas.Expense)
async def update_expense(expense_id: str, expense: schemas.ExpenseCreate, db: AsyncSession = Depends(get_db)):
    db_expense = await crud.update_expense(db, expense_id=expense_id, expense=expense)
    if db_expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    return db_expense

@app.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str, db: AsyncSession = Depends(get_db)):
    db_expense = await crud.delete_expense(db, expense_id=expense_id)
    if db_expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"message": "Successfully deleted"}

# Todos
@app.post("/todos/", response_model=schemas.Todo)
async def create_todo(todo: schemas.TodoCreate, db: AsyncSession = Depends(get_db)):
    return await crud.create_todo(db=db, todo=todo)

@app.get("/todos/", response_model=List[schemas.Todo])
async def read_todos(skip: int = 0, limit: int = 100, db: AsyncSession = Depends(get_db)):
    return await crud.get_todos(db, skip=skip, limit=limit)

@app.put("/todos/{todo_id}", response_model=schemas.Todo)
async def update_todo(todo_id: str, todo: schemas.TodoCreate, db: AsyncSession = Depends(get_db)):
    db_todo = await crud.update_todo(db, todo_id=todo_id, todo=todo)
    if db_todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    return db_todo

@app.delete("/todos/{todo_id}")
async def delete_todo(todo_id: str, db: AsyncSession = Depends(get_db)):
    db_todo = await crud.delete_todo(db, todo_id=todo_id)
    if db_todo is None:
        raise HTTPException(status_code=404, detail="Todo not found")
    return {"message": "Successfully deleted"}

# Payment Methods
@app.post("/payment-methods/", response_model=schemas.PaymentMethod)
async def create_payment_method(method: schemas.PaymentMethodCreate, db: AsyncSession = Depends(get_db)):
    return await crud.create_payment_method(db=db, payment_method=method)

@app.get("/payment-methods/", response_model=List[schemas.PaymentMethod])
async def read_payment_methods(db: AsyncSession = Depends(get_db)):
    return await crud.get_payment_methods(db)

@app.put("/payment-methods/{method_id}", response_model=schemas.PaymentMethod)
async def update_payment_method(method_id: str, method: schemas.PaymentMethodCreate, db: AsyncSession = Depends(get_db)):
    db_method = await crud.update_payment_method(db, method_id=method_id, payment_method=method)
    if db_method is None:
        raise HTTPException(status_code=404, detail="Payment method not found")
    return db_method

@app.delete("/payment-methods/{method_id}")
async def delete_payment_method(method_id: str, db: AsyncSession = Depends(get_db)):
    db_method = await crud.delete_payment_method(db, method_id=method_id)
    if db_method is None:
        raise HTTPException(status_code=404, detail="Payment method not found")
    return {"message": "Successfully deleted"}
