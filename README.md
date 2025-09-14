# 🎨 CloudCanvas

**Interactive Cloud Service Explorer**

I needed a way to learn cloud services for the AWS Cloud Practitioner exam and really hated traditional notes because they're unorganized. So I built my own interactive learning platform for cloud services.

🌐 **Live Demo:** [https://cloudcanvas.shalev396.com](https://cloudcanvas.shalev396.com)

## ✨ Features

- **Interactive Service Explorer**: Browse cloud services organized by categories
- **Personal Notes**: Create and organize your own notes for each service
- **Service Management**: Services become available when you add notes to them
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Rich Text Editor**: Add detailed documentation with markdown support
- **Architecture Diagrams**: Embed Draw.io diagrams for visual learning

## 🚀 Tech Stack

- **Next.js 15** with TypeScript
- **Tailwind CSS** for styling
- **AWS DynamoDB** for data storage
- **Serverless Framework** for infrastructure
- **JWT Authentication**

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/your-username/cloudcanvas.git
cd cloudcanvas

# Install dependencies
npm install

# Setup environment variables
# Copy env.template to .env.local and configure

# Start development
npm run dev
```

### Environment Setup

Create `.env.development` file:

```env
ENV="dev"
AWS_REGION=""
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
SERVICES_TABLE_NAME=""
USERS_TABLE_NAME=""
JWT_SECRET=""
ADMIN_EMAIL=""
ADMIN_PASSWORD=""
ADMIN_NAME=""
```

## 🎯 Usage

This is your personal interactive notebook for cloud services, categorized and grouped by AWS service categories. Perfect for Cloud Practitioner exam preparation or general cloud learning.

## 📚 Open Source for Cloud Practitioner Prep

This project is open source specifically to help others preparing for the AWS Cloud Practitioner exam. If you're studying for the exam, you should copy this repo and deploy it yourself for your own personal notes and learning.

## 🤝 Support

- 🐛 [GitHub Issues](https://github.com/shalev396/CloudCanvas/issues)
<!-- - 💬 [GitHub Discussions](https://github.com/your-username/cloudcanvas/discussions) -->

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details. Do whatever you want with it!

---

**Built for cloud learners, by a cloud learner** ☁️
