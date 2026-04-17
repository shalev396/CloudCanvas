# 🎨 CloudCanvas

**Interactive Cloud Service Explorer**

I needed a way to learn cloud services for the AWS Cloud Practitioner exam and really hated traditional notes because they're unorganized. So I built my own interactive learning platform for cloud services.

🌐 **Live at:** [https://cloudcanvas.shalev396.com](https://cloudcanvas.shalev396.com)

## ✨ Features

- **Interactive Service Explorer**: Browse cloud services organized by categories
- **Personal Notes**: Create and organize your own notes for each service
- **Service Management**: Services become available when you add notes to them
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Rich Text Editor**: Add detailed documentation with markdown support
- **Architecture Diagrams**: Embed Draw.io diagrams for visual learning

## 🚀 Tech Stack

- **Next.js 15** (App Router, Turbopack) with TypeScript
- **Tailwind CSS 4** + shadcn/ui (Radix primitives)
- **AWS DynamoDB** for data (services, users, categories)
- **Amazon S3 + CloudFront** for icon hosting
- **AWS CloudFormation** for all infrastructure
- **Vercel** for frontend hosting (OIDC-assumed IAM role — no static AWS keys in prod)
- **JWT Authentication** (bcrypt + 7-day tokens)

## 📦 Installation

```bash
git clone https://github.com/shalev396/CloudCanvas.git
cd CloudCanvas
npm install
cp .env.template .env.development   # fill in values — see SETUP.md
npm run dev
```

`npm install` also downloads the Playwright Chromium browser (via `postinstall`) so the test suite is ready to run without a separate install step. For the full env-file setup for dev, QA, and prod, see [**SETUP.md**](SETUP.md).

### Environment Setup

AWS credentials resolve from `~/.aws/credentials` locally. Fill `.env.development` / `.env.qa` / `.env.production` per [SETUP.md](SETUP.md#2-env-files).

### Run Locally

```bash
npm run dev    # Dev server — uses .env.development
npm run qa     # Build + start against .env.qa (requires dotenv-cli, bundled)
npm run prod   # Build + start against .env.production
```

### Deploy Infrastructure

```bash
npm run deploy:dev    # Deploy CloudFormation stack (dev)
npm run deploy:qa     # Deploy CloudFormation stack (qa)
npm run deploy:prod   # Deploy CloudFormation stack (prod)
```

## 🎯 Usage

This is your personal interactive notebook for cloud services, categorized and grouped by AWS service categories. Perfect for Cloud Practitioner exam preparation or general cloud learning.

## 🧪 Tests

Out of the box:

- **Frontend E2E** — Playwright (smoke, accessibility, visual, responsive, security, flows)
- **Backend API** — Postman (auth, services, admin)

| Doc | Description |
| --- | --- |
| [Frontend tests](tests/README.md) | Run commands, global setup, page × category matrix, artifacts |
| [Backend tests](postman/README.md) | Collection structure, CLI commands, auth model |

```bash
npm install            # Installs deps + Playwright Chromium (via postinstall)
npm run test:react:dev # Run all E2E tests vs local dev server
npm run test:react:qa  # Run all E2E tests vs QA (reads .env.qa)
npm run test:api:dev   # Run Postman collection vs local dev server
npm run test:api:qa    # Run Postman collection vs QA (reads .env.qa)
```

Full env-file setup and CI artifact download steps in [SETUP.md](SETUP.md).

Failing Playwright tests write screenshots, videos, and traces to `artifacts/` plus a full HTML report at `artifacts/report/index.html`. CI uploads the whole folder on any outcome.

PRs to `qa` run tests against a local Next.js server backed by QA's DynamoDB. PRs to `main` run tests against the live QA URL.

## 📚 Open Source for Cloud Practitioner Prep

This project is open source specifically to help others preparing for the AWS Cloud Practitioner exam. If you're studying for the exam, you should copy this repo and deploy it yourself for your own personal notes and learning.

## 🤝 Support

- 🐛 [GitHub Issues](https://github.com/shalev396/CloudCanvas/issues)
<!-- - 💬 [GitHub Discussions](https://github.com/your-username/cloudcanvas/discussions) -->

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details. Do whatever you want with it!

---

**Built for cloud learners, by a cloud learner** ☁️
