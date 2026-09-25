# Deploying Quiz Master to Vercel

## Before deploying

1. Rotate the MongoDB password that was previously shared and update the Atlas connection string.
2. In MongoDB Atlas, open **Network Access** and allow connections from Vercel. Vercel uses dynamic outbound IP addresses by default. The easiest development setup is `0.0.0.0/0` with a strong database password; production systems can use Vercel Static IPs or Secure Compute.
3. Confirm the Atlas database user has read/write access to the `quiz_master` database.

## Import from GitHub

1. Open [Vercel's new project page](https://vercel.com/new).
2. Import `charukad/quess-master`.
3. Keep **Framework Preset** set to **Next.js** and leave the build, install, and output settings at their defaults.
4. Add the environment variables below before selecting **Deploy**.

## Environment variables

Add these for **Production**, **Preview**, and **Development** unless noted otherwise:

| Name | Required | Value |
| --- | --- | --- |
| `MONGODB_URI` | Yes | The rotated MongoDB Atlas URI, including `/quiz_master` |
| `NEXTAUTH_SECRET` | Yes | A random secret generated with `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Custom domains only | The canonical URL, such as `https://quiz.example.com` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | For media uploads | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | For media uploads | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | For media uploads | Cloudinary API secret |

Do not add `MONGODB_DNS_SERVERS` on Vercel unless Atlas SRV resolution actually fails. Vercel supplies `VERCEL_URL`, which NextAuth uses automatically for generated Vercel domains.

## Verify the deployment

After deployment, visit:

```text
https://YOUR-DOMAIN/api/health
```

A working deployment returns:

```json
{"status":"ok","database":"connected"}
```

Then create a test account, create a game, and start a session. Every push to `main` will create a new production deployment after the GitHub repository is connected to Vercel.

## Troubleshooting

- `503` from `/api/health`: check `MONGODB_URI`, Atlas Network Access, and the database user's permissions.
- Login loops: confirm `NEXTAUTH_SECRET` exists in every deployment environment. For a custom domain, set `NEXTAUTH_URL` to its full HTTPS URL and redeploy.
- Media upload errors: add all three Cloudinary variables and redeploy.
