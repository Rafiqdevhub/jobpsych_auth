# GitHub Actions Setup for NeonDB

## Required GitHub Secrets

To run the GitHub Actions pipeline with NeonDB, you need to configure the following secrets in your GitHub repository:

### 🔐 **Setting Up Repository Secrets**

1. Go to your GitHub repository
2. Click on **Settings** tab
3. Navigate to **Secrets and variables** → **Actions**
4. Click **New repository secret**

### 📝 **Required Secrets**

#### **NEON_DATABASE_URL** (Required)

- **Description**: Your NeonDB PostgreSQL connection string
- **Value**: `postgresql://username:password@hostname:5432/database?sslmode=require`
- **How to get**:
  1. Go to [NeonDB Console](https://console.neon.tech)
  2. Select your project
  3. Go to **Connection Details**
  4. Copy the connection string
  5. Make sure it includes `?sslmode=require` at the end

#### **CODECOV_TOKEN** (Optional)

- **Description**: Token for uploading code coverage reports
- **Value**: Your Codecov token
- **How to get**:
  1. Go to [Codecov.io](https://codecov.io)
  2. Connect your GitHub repository
  3. Copy the repository token
  4. This is optional - tests will run without it

### 🏗️ **Pipeline Overview**

The updated pipeline now works with **NeonDB** instead of local PostgreSQL:

- ✅ **No Docker containers** needed
- ✅ **Uses your NeonDB instance** for testing
- ✅ **Secure connection** with SSL enabled
- ✅ **Multiple Node.js versions** (18.x, 20.x)
- ✅ **Comprehensive test coverage**

### 🔧 **Jobs Configuration**

1. **Test Job**: Runs all tests against NeonDB
2. **Lint Job**: Code quality checks
3. **Security Job**: Vulnerability scanning
4. **Build Test**: Production build verification
5. **Performance Test**: Application startup validation (PR only)
6. **Dependency Check**: Package management validation

### 🚀 **Testing Strategy**

```yaml
# Tests run in this order:
1. Unit Tests (tests/utils, tests/middleware)
2. Integration Tests (tests/controllers, tests/integration)
3. E2E Tests (tests/e2e)
4. Full Coverage Report
```

### 🌍 **Environment Variables**

The pipeline automatically sets up these environment variables:

```bash
NODE_ENV=test
DATABASE_URL=<from_secrets.NEON_DATABASE_URL>
JWT_ACCESS_SECRET=test-access-secret-key-for-github-actions-testing-minimum-32-chars
JWT_REFRESH_SECRET=test-refresh-secret-key-for-github-actions-testing-minimum-32-chars
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
PORT=5000
```

### ⚡ **Quick Setup Checklist**

- [ ] Create NeonDB account and database
- [ ] Copy NeonDB connection string
- [ ] Add `NEON_DATABASE_URL` secret to GitHub repository
- [ ] (Optional) Add `CODECOV_TOKEN` for coverage reports
- [ ] Push code to trigger pipeline
- [ ] Check Actions tab for pipeline results

### 🔍 **Troubleshooting**

**Common Issues:**

1. **Database Connection Failed**

   - Verify `NEON_DATABASE_URL` secret is correctly formatted
   - Ensure SSL mode is enabled (`?sslmode=require`)
   - Check NeonDB database is running and accessible

2. **Tests Timeout**

   - NeonDB might be in sleep mode (free tier)
   - Pipeline will automatically retry on connection issues

3. **Migration Errors**
   - Ensure your NeonDB user has proper permissions
   - Check if tables already exist in the database

### 📊 **Pipeline Triggers**

- **Push to main/develop**: Full pipeline runs
- **Pull Request**: Full pipeline + Performance tests
- **Manual trigger**: Available in GitHub Actions tab

The pipeline is now optimized for NeonDB and will provide comprehensive testing without requiring local database services! 🎉
