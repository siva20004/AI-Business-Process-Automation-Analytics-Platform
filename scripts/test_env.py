import sys
import fastapi
import sqlalchemy
import psycopg2
import pandas
import sklearn
import bcrypt

print("Python:", sys.version)
print("FastAPI:", fastapi.__version__)
print("SQLAlchemy:", sqlalchemy.__version__)
print("Psycopg2:", psycopg2.__version__)
print("Pandas:", pandas.__version__)
print("Scikit-Learn:", sklearn.__version__)
print("Bcrypt:", bcrypt.__version__)
print("ALL CORE LIBRARIES SUCCESSFULLY LOADED!")
