.PHONY: dev seed test build docker-up

dev:
	@echo "Starting TrustSeat Backend and Frontend..."
	python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 &
	cd frontend && npm run dev

seed:
	@echo "Seeding synthetic dataset (~25 institutions, ~6k students, 6 planted scenarios)..."
	python seed/seed_data.py

test:
	@echo "Running backend unit tests..."
	python -m pytest backend/app/tests -v

build:
	@echo "Building frontend production bundle..."
	cd frontend && npm run build

docker-up:
	docker-compose up --build
