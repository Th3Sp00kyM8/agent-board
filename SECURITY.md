# Security Policy

Agent Board is a local-first development tool. It is not designed to be exposed to the public internet or an untrusted network.

## Supported Use

Run Agent Board on your own machine or on a trusted local network only.

The app does not include:

- User accounts
- Authentication
- Authorization
- Multi-tenant isolation
- Network hardening for public hosting

## Reporting A Vulnerability

If you find a vulnerability, please open a private security advisory on the repository if available. If that is not available, open an issue with enough detail to reproduce the problem, but do not include private project data or secrets.

Useful reports include:

- Steps to reproduce
- Expected behavior
- Actual behavior
- Affected version or commit
- Whether the issue can expose or overwrite local files

## Sensitive Data

Do not commit real `state.json`, `config.json`, `backups/`, logs, or `.env` files. These files are ignored by default because they may contain private project details.