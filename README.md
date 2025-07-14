# AgentHive

<div align="center">
  <img src="docs/images/logo.png" alt="AgentHive Logo" width="200"/>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
  [![Discord](https://img.shields.io/discord/your-discord-invite-code)](https://discord.gg/your-discord-invite)
</div>

## 🚀 Deployment Options

### GitHub Pages (Frontend Only)
Deploy the frontend to GitHub Pages for free static hosting:

[![Deploy to GitHub Pages](https://github.com/marketplace/actions/deploy-to-github-pages/badge.svg)](https://github.com/marketplace/actions/deploy-to-github-pages)

1. Fork this repository
2. Go to Settings > Pages
3. Set source to "GitHub Actions"
4. Push to `main` branch to trigger deployment

Your site will be available at: `https://<your-username>.github.io/agenthive`

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

## 🚀 Overview

AgentHive is a cutting-edge platform for building and managing multi-agent AI systems. It provides a flexible, scalable infrastructure for creating intelligent agents that can collaborate, communicate, and solve complex tasks together.

![AgentHive Dashboard](docs/screenshots/dashboard.png)

## ✨ Features

- **Multi-Agent Architecture**: Build and manage multiple AI agents with different capabilities
- **Intelligent Routing**: Smart message routing between agents based on content and context
- **Modern Web Interface**: Responsive, real-time UI built with React and TypeScript
- **Scalable Backend**: Built with FastAPI for high-performance API serving
- **Persistent Storage**: PostgreSQL for reliable data storage
- **Real-time Updates**: WebSocket support for live agent interactions
- **Extensible**: Easy to add new agent types and capabilities

## 📋 Prerequisites

- Docker 20.10.0+
- Docker Compose 2.0.0+
- Node.js 18+
- Python 3.11+
- npm 9+

## 🛠 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/agenthive.git
   cd agenthive
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the services**
   ```bash
   docker-compose up -d
   ```

4. **Run database migrations**
   ```bash
   docker-compose exec backend alembic upgrade head
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - API Docs: http://localhost:8000/docs
   - Adminer (Database UI): http://localhost:8080

## 🖥️ Screenshots

### Chat Interface
![Chat Interface](docs/screenshots/chat-interface.png)

### Agent Management
![Agent Management](docs/screenshots/agent-management.png)

### Task Monitoring
![Task Monitoring](docs/screenshots/task-monitoring.png)

## 🏗 Project Structure

```
agenthive/
├── backend/               # FastAPI backend
│   ├── app/              # Application code
│   │   ├── api/          # API endpoints
│   │   ├── core/         # Core functionality
│   │   ├── models/       # Database models
│   │   └── services/     # Business logic
│   └── alembic/          # Database migrations
├── frontend/             # React frontend
│   ├── public/           # Static files
│   └── src/              # Source code
│       ├── components/   # Reusable components
│       ├── pages/        # Page components
│       └── services/     # API services
└── docker/               # Docker configuration
```

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) to get started.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [FastAPI](https://fastapi.tiangolo.com/) - The web framework used
- [React](https://reactjs.org/) - Frontend library
- [PostgreSQL](https://www.postgresql.org/) - Database
- [Redis](https://redis.io/) - Caching and message broker
