# Pramaan — Makefile

.PHONY: help install dev build seed clean docker

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install all dependencies
	cd frontend && npm install
	cd backend && pip install -r requirements.txt

dev-frontend: ## Start frontend dev server
	cd frontend && npm run dev

dev-backend: ## Start backend API server
	cd backend && uvicorn app.main:app --reload --port 8000

dev-authority: ## Start authority mock service
	cd authority_mock && uvicorn main:app --reload --port 8100

seed: ## Seed the database with demo data
	cd backend && python seed_db.py

build: ## Build frontend for production
	cd frontend && npm run build

secrets: ## Generate secure keys
	cd backend && python gen_secrets.py

clean: ## Clean build artifacts and database
	rm -rf frontend/dist
	rm -f backend/pramaan.db
	rm -rf backend/uploads/*

docker: ## Start all services with Docker Compose
	docker-compose up --build

docker-down: ## Stop all Docker services
	docker-compose down

lint-frontend: ## Run TypeScript type checking
	cd frontend && npx tsc --noEmit
