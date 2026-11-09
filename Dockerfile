FROM python:3.14-slim

WORKDIR /app

# Install Python dependencies first for better layer caching.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application source.
COPY . .

# Persistent volume for the SQLite database and uploaded music files.
RUN mkdir -p /data/music

EXPOSE 9696

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "9696"]
