import os
import re
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from dotenv import load_dotenv

load_dotenv()

# Using your provided engine creation logic exactly
# engine = create_async_engine(
#     re.sub(r'^postgresql:', 'postgresql+psycopg:', os.getenv('DATABASE_URL') or ""), 
#     echo=True
# )
engine = create_async_engine(
    re.sub(r'^postgresql:', 'postgresql+psycopg:', os.getenv('DATABASE_URL') or ""), 
    echo=True,
    connect_args={
        "sslmode": "require",
    }
)


AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

Base = declarative_base()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
