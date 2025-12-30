# Troubleshooting Local Database Connection

## Issue: P1001 / ECONNREFUSED
The backend cannot connect to the local PostgreSQL database.

### Diagnosis
Running `tasklist` shows no `postgres.exe` process is running. This means your local Database Server is **OFF**.

### Solution: Start PostgreSQL on Windows

#### Option 1: Via Services (GUI)
1. Press `Win + R`, type `services.msc`, and press Enter.
2. Scroll down to find **PostgreSQL**.
3. Right-click it and select **Start**.
4. If it's not there, you might not have Postgres installed locally.

#### Option 2: Via Command Line (Run as Admin)
1. Open PowerShell **as Administrator**.
2. Run:
   ```powershell
   net start postgresql-x64-16
   # Note: The version number (16) might differ on your machine (e.g., 14, 15, 17).
   # Try "net start" to list all services and find the exact name.
   ```

#### Option 3: If Postgres is NOT Installed
1. Download and install it from [postgresql.org](https://www.postgresql.org/download/windows/).
2. During installation, set the password to `password` (or update `.env` to match whatever you choose).
