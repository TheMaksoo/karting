# Security Policy

## 🔒 Supported Versions

We actively support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## 🚨 Reporting a Vulnerability

**Please do NOT report security vulnerabilities through public GitHub issues.**

### Preferred Method: GitHub Security Advisories
1. Go to the [Security Advisories](https://github.com/TheMaksoo/karting/security/advisories) page
2. Click "Report a vulnerability"
3. Fill in the details using the template below

### Alternative Method: Email
Send an email to: **security@karting.example.com**

### What to Include
Please include the following information in your report:

- **Type of vulnerability** (e.g., SQL injection, XSS, CSRF, authentication bypass)
- **Affected component** (e.g., API endpoint, frontend route, specific file)
- **Steps to reproduce** (detailed, numbered steps)
- **Proof of concept** (code, screenshots, or demo)
- **Impact assessment** (what an attacker could do)
- **Suggested fix** (if you have one)
- **Your name/handle** (for credit, if desired)

### Example Report Template
```markdown
## Vulnerability Type
SQL Injection

## Affected Component
POST /api/sessions/upload-eml

## Impact
An attacker could execute arbitrary SQL queries.

## Steps to Reproduce
1. Send POST request to /api/sessions/upload-eml
2. Include malicious payload in filename parameter
3. Database query executes with unsanitized input

## Proof of Concept
[Include code, curl command, or screenshot]

## Suggested Fix
Use prepared statements with parameter binding.
```

## 📋 Response Timeline

We aim to respond to security reports according to the following timeline:

| Action | Timeline |
|--------|----------|
| **Initial Response** | Within 24 hours |
| **Severity Assessment** | Within 48 hours |
| **Fix Development** | 7-14 days (depending on severity) |
| **Fix Release** | As soon as possible after fix |
| **Public Disclosure** | After fix is released and deployed |

## 🎯 Severity Levels

We classify vulnerabilities using the following severity levels:

### Critical (CVSS 9.0-10.0)
- Remote code execution
- Authentication bypass
- SQL injection leading to full database access
- **Fix Timeline**: 24-48 hours

### High (CVSS 7.0-8.9)
- XSS allowing account takeover
- CSRF with significant impact
- Privilege escalation
- **Fix Timeline**: 3-7 days

### Medium (CVSS 4.0-6.9)
- Information disclosure
- XSS (non-persistent)
- Weak cryptography
- **Fix Timeline**: 7-14 days

### Low (CVSS 0.1-3.9)
- Minor information leaks
- Security misconfigurations
- **Fix Timeline**: 14-30 days

## ✅ Security Best Practices

When using this application, follow these security best practices:

### Deployment
- [ ] Use HTTPS/TLS in production
- [ ] Enable all security headers (CSP, X-Frame-Options, etc.)
- [ ] Configure CORS whitelist for production domains only
- [ ] Use strong, unique database passwords
- [ ] Enable database encryption at rest
- [ ] Use httpOnly cookies for authentication
- [ ] Set appropriate session timeouts
- [ ] Enable rate limiting on all API endpoints

### Configuration
- [ ] Never commit `.env` files to version control
- [ ] Rotate API keys and secrets regularly
- [ ] Use environment variables for sensitive data
- [ ] Disable debug mode in production (`APP_DEBUG=false`)
- [ ] Set `APP_ENV=production` in production
- [ ] Configure Sentry for error tracking
- [ ] Enable audit logging for sensitive operations

### Updates
- [ ] Keep dependencies up-to-date (run `composer update`, `npm update`)
- [ ] Monitor security advisories (GitHub Dependabot)
- [ ] Apply security patches promptly
- [ ] Subscribe to Laravel security notifications
- [ ] Review and update security policies quarterly

## 🛡️ Security Features

This application includes the following built-in security features:

- ✅ **Authentication**: Laravel Sanctum with session-based auth (httpOnly cookies)
- ✅ **Authorization**: Role-based access control (admin/driver)
- ✅ **CSRF Protection**: Enabled for all state-changing operations
- ✅ **XSS Protection**: Input sanitization via InputSanitizer service
- ✅ **SQL Injection Protection**: Eloquent ORM with prepared statements
- ✅ **Rate Limiting**: IP-based (60/min) + per-user (120/min)
- ✅ **Password Security**: bcrypt hashing with enforced policy
- ✅ **Security Headers**: CSP, X-Frame-Options, X-Content-Type-Options, HSTS
- ✅ **Audit Logging**: All CRUD operations logged with user context
- ✅ **File Validation**: MIME type, size, content pattern checks
- ✅ **Error Tracking**: Sentry integration for production monitoring

## 📚 Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Laravel Security Documentation](https://laravel.com/docs/security)
- [Vue.js Security Best Practices](https://vuejs.org/guide/best-practices/security.html)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

## 🏆 Hall of Fame

We thank the following security researchers for responsibly disclosing vulnerabilities:

<!-- Researchers will be listed here after disclosure -->
- _No vulnerabilities reported yet_

## 📞 Contact

For non-security issues, please use:
- **GitHub Issues**: https://github.com/TheMaksoo/karting/issues
- **Discussions**: https://github.com/TheMaksoo/karting/discussions

For security concerns only:
- **Email**: security@karting.example.com
- **GitHub Security Advisories**: https://github.com/TheMaksoo/karting/security/advisories

---

**Thank you for helping keep Karting Dashboard secure!** 🙏
