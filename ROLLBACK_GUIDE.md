# Rollback Guide - Inventori Project

## Current Stable Version
**Tag:** v1.0-production-stable  
**Date:** December 10, 2025  
**Status:** ✅ Production Ready

### Deployment URLs
- **Backend:** https://inventori-backend-894858667370.us-central1.run.app
- **Frontend:** https://inventori-frontend-894858667370.us-central1.run.app
- **Database:** Cloud SQL (koma2025:us-central1:koma-2025)
- **Database Name:** inventori_db

### Login Credentials
- Admin: `admin@example.com` / `admin123`
- Staff: `staff@example.com` / `staff123`

---

## How to Rollback

### 1. Rollback Code (Git)

```powershell
cd c:\Users\Lenovo\Downloads\KomaV6\inventori-project

# Lihat semua tags
git tag -l

# Lihat detail tag
git show v1.0-production-stable

# Rollback ke tag stable ini
git checkout v1.0-production-stable

# Atau rollback ke commit tertentu
git log --oneline
git reset --hard <commit-hash>

# Buat branch dari stable version (recommended)
git checkout -b rollback-from-v1.0 v1.0-production-stable
```

### 2. Rollback Backend (Cloud Run)

```powershell
# Lihat semua revisions
gcloud run revisions list \
  --service=inventori-backend \
  --region=us-central1 \
  --project=koma2025

# Current stable revision: inventori-backend-00005-wpm

# Rollback ke revision tertentu
gcloud run services update-traffic inventori-backend \
  --to-revisions=inventori-backend-00005-wpm=100 \
  --region=us-central1 \
  --project=koma2025
```

### 3. Rollback Frontend (Cloud Run)

```powershell
# Lihat revisions
gcloud run revisions list \
  --service=inventori-frontend \
  --region=us-central1 \
  --project=koma2025

# Current stable revision: inventori-frontend-00001-b4m

# Rollback
gcloud run services update-traffic inventori-frontend \
  --to-revisions=inventori-frontend-00001-b4m=100 \
  --region=us-central1 \
  --project=koma2025
```

### 4. Rollback Database (Cloud SQL)

**BEFORE making any changes, backup first:**

```powershell
# Create backup (do this BEFORE changes)
gcloud sql backups create \
  --instance=koma-2025 \
  --description="Before adding captcha feature" \
  --project=koma2025

# List backups
gcloud sql backups list \
  --instance=koma-2025 \
  --project=koma2025

# Restore from backup
gcloud sql backups restore <BACKUP_ID> \
  --backup-instance=koma-2025 \
  --backup-instance=koma-2025 \
  --project=koma2025
```

### 5. Rollback Docker Images

```powershell
# List all backend images
gcloud container images list-tags gcr.io/koma2025/inventori-backend

# Current stable: sha256:a5039de9e65f7656043aea5eed508fad01a019cae720d40670f0cf0304ccb7d1

# Deploy specific image version
gcloud run deploy inventori-backend \
  --image gcr.io/koma2025/inventori-backend@sha256:a5039de9e65f7656043aea5eed508fad01a019cae720d40670f0cf0304ccb7d1 \
  --region=us-central1 \
  --project=koma2025 \
  --add-cloudsql-instances=koma2025:us-central1:koma-2025

# List all frontend images
gcloud container images list-tags gcr.io/koma2025/inventori-frontend

# Current stable: sha256:c48992fe1cd2098b077ccbfdfbce9403b4e0b6c1055941f2b1d920f1bd4e1632

# Deploy specific image version
gcloud run deploy inventori-frontend \
  --image gcr.io/koma2025/inventori-frontend@sha256:c48992fe1cd2098b077ccbfdfbce9403b4e0b6c1055941f2b1d920f1bd4e1632 \
  --region=us-central1 \
  --project=koma2025
```

---

## Best Practice: Feature Development

### Before Making Changes

1. **Backup Database:**
```powershell
gcloud sql backups create \
  --instance=koma-2025 \
  --description="Backup before feature XYZ" \
  --project=koma2025
```

2. **Create Feature Branch:**
```powershell
git checkout -b feature/add-captcha
```

3. **Work on Feature:**
- Edit code
- Test locally
- Deploy to staging (optional)

4. **If Success:**
```powershell
git checkout main
git merge feature/add-captcha
git tag -a v1.1-with-captcha -m "Added captcha feature"
git push origin main
git push --tags
```

5. **If Failed/Need Rollback:**
```powershell
# Just switch back to main
git checkout main

# Feature branch masih ada, bisa dilanjutkan kapan saja
git checkout feature/add-captcha
```

---

## Emergency Rollback (Quick)

```powershell
# 1. Rollback code
git checkout v1.0-production-stable

# 2. Rollback backend
gcloud run services update-traffic inventori-backend \
  --to-revisions=inventori-backend-00005-wpm=100 \
  --region=us-central1 --project=koma2025

# 3. Rollback frontend
gcloud run services update-traffic inventori-frontend \
  --to-revisions=inventori-frontend-00001-b4m=100 \
  --region=us-central1 --project=koma2025

# Done! Check:
# Frontend: https://inventori-frontend-894858667370.us-central1.run.app
# Backend: https://inventori-backend-894858667370.us-central1.run.app
```

---

## Notes

- Tags: Lightweight pointers to commits
- Revisions: Cloud Run keeps all versions (auto-cleanup after 90 days)
- Images: GCR keeps all images unless manually deleted
- Database: Enable automated backups for safety

## Contact
- Repository: https://github.com/itsmefayyadh/inventori-project
- GCP Project: koma2025
