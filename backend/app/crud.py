from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from . import models, schemas

# Expense CRUD
async def get_expense(db: AsyncSession, expense_id: str):
    result = await db.execute(select(models.Expense).filter(models.Expense.id == expense_id))
    return result.scalars().first()

async def get_expenses(db: AsyncSession, skip: int = 0, limit: int = 100):
    result = await db.execute(select(models.Expense).offset(skip).limit(limit))
    return result.scalars().all()

async def create_expense(db: AsyncSession, expense: schemas.ExpenseCreate):
    db_expense = models.Expense(**expense.model_dump())
    db.add(db_expense)
    await db.commit()
    await db.refresh(db_expense)
    return db_expense

async def delete_expense(db: AsyncSession, expense_id: str):
    db_expense = await get_expense(db, expense_id)
    if db_expense:
        await db.delete(db_expense)
        await db.commit()
    return db_expense

async def update_expense(db: AsyncSession, expense_id: str, expense: schemas.ExpenseCreate):
    db_expense = await get_expense(db, expense_id)
    if db_expense:
        for key, value in expense.model_dump().items():
            setattr(db_expense, key, value)
        await db.commit()
        await db.refresh(db_expense)
    return db_expense

# Todo CRUD
async def get_todos(db: AsyncSession, skip: int = 0, limit: int = 100):
    result = await db.execute(select(models.Todo).offset(skip).limit(limit))
    return result.scalars().all()

async def create_todo(db: AsyncSession, todo: schemas.TodoCreate):
    db_todo = models.Todo(**todo.model_dump())
    db.add(db_todo)
    await db.commit()
    await db.refresh(db_todo)
    return db_todo

async def update_todo(db: AsyncSession, todo_id: str, todo: schemas.TodoCreate):
    db_todo = await db.execute(select(models.Todo).filter(models.Todo.id == todo_id))
    db_todo = db_todo.scalars().first()
    if db_todo:
        for key, value in todo.model_dump().items():
            setattr(db_todo, key, value)
        await db.commit()
        await db.refresh(db_todo)
    return db_todo

async def delete_todo(db: AsyncSession, todo_id: str):
    db_todo = await db.execute(select(models.Todo).filter(models.Todo.id == todo_id))
    db_todo = db_todo.scalars().first()
    if db_todo:
        await db.delete(db_todo)
        await db.commit()
    return db_todo

# PaymentMethod CRUD
async def get_payment_methods(db: AsyncSession):
    result = await db.execute(select(models.PaymentMethod))
    return result.scalars().all()

async def create_payment_method(db: AsyncSession, payment_method: schemas.PaymentMethodCreate):
    db_method = models.PaymentMethod(**payment_method.model_dump())
    db.add(db_method)
    await db.commit()
    await db.refresh(db_method)
    return db_method

async def update_payment_method(db: AsyncSession, method_id: str, payment_method: schemas.PaymentMethodCreate):
    db_method = await db.execute(select(models.PaymentMethod).filter(models.PaymentMethod.id == method_id))
    db_method = db_method.scalars().first()
    if db_method:
        for key, value in payment_method.model_dump().items():
            setattr(db_method, key, value)
        await db.commit()
        await db.refresh(db_method)
    return db_method

async def delete_payment_method(db: AsyncSession, method_id: str):
    db_method = await db.execute(select(models.PaymentMethod).filter(models.PaymentMethod.id == method_id))
    db_method = db_method.scalars().first()
    if db_method:
        await db.delete(db_method)
        await db.commit()
    return db_method
