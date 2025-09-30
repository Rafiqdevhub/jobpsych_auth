# Security Policy

## Known Development Dependencies Issues

### esbuild Vulnerability (GHSA-67mh-4wv8-2f99)

- **Severity**: Moderate
- **Component**: esbuild (via drizzle-kit)
- **Impact**: Development server only - does not affect production
- **Status**: Acknowledged - waiting for drizzle-kit upstream fix
- **Mitigation**:
  - Only affects development environment
  - No production runtime impact
  - Development server should not be exposed publicly

## Reporting Security Issues

If you discover a security vulnerability in this project, please:

1. **Do not** create a public GitHub issue
2. Email the maintainers directly
3. Include details about the vulnerability and steps to reproduce

## Security Measures

### Authentication

- JWT tokens with short expiration (15 minutes)
- Refresh tokens stored as HttpOnly cookies
- bcrypt password hashing with 12 salt rounds
- Secure cookie configuration (SameSite, Secure flags)

### Database Security

- NeonDB with SSL/TLS encryption
- Parameterized queries via Drizzle ORM
- Environment-based configuration

### API Security

- CORS configuration
- Rate limiting ready (implement as needed)
- Input validation on all endpoints
- Error message sanitization

## Dependencies

### Production Dependencies

- All production dependencies are regularly audited for high/critical vulnerabilities
- Automated security scanning via GitHub Actions

### Development Dependencies

- Regularly reviewed for security issues
- Non-production vulnerabilities are assessed for actual impact
- Updates applied when available without breaking changes

## Security Headers

The application implements:

- X-Powered-By header removal
- CORS with specific origin restrictions
- Secure cookie attributes

## Best Practices

1. **Environment Variables**: Keep all secrets in environment variables
2. **Database**: Use connection strings with SSL/TLS
3. **Deployment**: Use HTTPS in production
4. **Monitoring**: Implement logging for security events

## Updates

This security policy is reviewed regularly and updated as needed.
