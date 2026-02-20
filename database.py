from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from config import *

engine=create_engine(f"mysql+pymysql://{DB_CONFIG['user']}:{DB_CONFIG['password']}@{DB_CONFIG['host']}:{DB_CONFIG['port']}/{DB_CONFIG['db']}")
Base= declarative_base()
Session = sessionmaker(bind=engine)