# CloudCanvas — Add a new stage

[← Back to main README](README.md)

You already have **prod** wired up: pushing to `main` deploys CloudFormation via GitHub Actions and triggers a Vercel production build at your live domain. This doc is for adding **qa** and **dev** as identical stages on their own subdomains.

The steps below are the same for both stages — swap `<stage>` for `qa` or `dev`.

---

## 1. Vercel — attach the branch to a subdomain

1. Vercel → your project → **Settings → Domains** → add `<stage>.yourdomain.com` → when prompted, attach it to the **`<stage>`** git branch.
2. **Settings → Environment Variables** → add the per-stage values to the matching Vercel environment (Development for `dev`, Preview for `qa`). Non-prod stages don't provision a Vercel OIDC IAM role (the CloudFormation template gates `VercelAppRole` on `IsProd`), so leave `AWS_ROLE_ARN` unset and provision AWS access by another means for dev/qa Vercel deploys if needed.

Vercel will now auto-deploy that subdomain every time you push to the branch.

## 2. GitHub — create the environment + secrets

Repo → **Settings → Environments → New environment** → name it `<stage>`. Add the per-stage secrets to that environment (same names as your `prod` environment, different values).

## 3. Push the branch

```bash
git checkout -b <stage>
git push -u origin <stage>
```

This triggers `push.yml`, which resolves the branch → stage, runs lint + build, then:

- Deploys the CloudFormation stack `cloudcanvas-<stage>` — DynamoDB tables, S3 bucket, CloudFront distribution, IAM role, and the Route 53 A/AAAA record for `<stage>.yourdomain.com`.
- Waits for Vercel's parallel branch-deploy to become healthy.

First deploy takes ~10 minutes (CloudFront is the slow part). Subsequent deploys are fast.

## 4. Finish the OIDC handshake (prod only)

Once the **prod** CFN stack shows `CREATE_COMPLETE`:

1. CloudFormation → stack `cloudcanvas-prod` → **Outputs** → copy `VercelRoleArn`.
2. Vercel → Settings → Environment Variables → paste it as `AWS_ROLE_ARN` for the Production environment.
3. Vercel → Deployments → latest → ⋮ → **Redeploy**.

This is what lets the deployed Next.js app assume the IAM role via OIDC and read DynamoDB / S3. Dev and qa skip this step — the template only creates `VercelAppRole`/`VercelRoleArn` when `Stage=prod`.

## 5. Seed data

The tables are empty after the first deploy. From your local machine:

```bash
npm run seed:test-admin          # creates the QA admin in the <stage> users table
```

Then log in at `https://<stage>.yourdomain.com/admin` and either **Seed services from icons** (upload the [AWS Architecture Icons ZIP](https://aws.amazon.com/architecture/icons/)) or **Restore from backup** (upload a JSON exported from prod).

Repeat all five steps for the second stage.

---

## Day-to-day flow

| Push to | Triggers |
| --- | --- |
| `dev` | Deploy dev (CFN + Vercel) |
| PR to `qa` | Run tests on the runner against the dev stage |
| `qa` (merge) | Deploy qa (CFN + Vercel) |
| PR to `main` | Run tests against the live QA URL |
| `main` (merge) | Deploy prod (CFN + Vercel) |

Playwright reports land in **Actions → workflow run → Artifacts** on every run (pass or fail).
