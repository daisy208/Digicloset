# Digicloset Frontend Upgrade Pack (Minimal)
Target: React + Vite + TypeScript + Tailwind
Deployment: Docker + Nginx
Contents:
- Dockerfile             : Production Dockerfile for building and serving with Nginx
- .dockerignore          : Docker ignore file
- nginx.conf             : Nginx config optimized for single-page apps + caching
- vite.config.ts         : Vite production optimizations (hashing, build options, image plugin hints)
- package.prod.json      : Example scripts for production build & serve
- tailwind.config.cjs    : Tailwind config with content purge for production
- postcss.config.cjs     : PostCSS config
- env.example            : production env example
- github-ci-frontend.yml : Minimal GitHub Actions workflow to build and produce Docker image (optional)
- README_UPGRADE.md      : Instructions to integrate into your project
