# SECURITY

## Reporting a Vulnerability
If you discover a security vulnerability, please send a private email to security@yourcompany.example with steps to reproduce, affected versions, and contact info. We will acknowledge within 48 hours and work on a fix promptly.

## Vulnerability policy
- Acknowledge within 48 hours.
- Provide a timeline for fixes and patches.
- Coordinate disclosure with the reporter for coordinated release.

## Quick hardening checklist
- Do not commit secrets. Use `.env` and GitHub Secrets.
- Rotate tokens immediately if accidentally committed.
- Use dependency scanning in CI (configured in workflows/ci.yml).