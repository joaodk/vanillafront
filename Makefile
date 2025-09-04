build:
	npm run build
deploy:
	npm run build
	./setups3.py deploy
	./setups3.py invalidate
	date
invalidate:
	./setups3.py invalidate
run:
	npm run dev
run-prod-api:
	npm run dev:prod-api
download-models:
	node scripts/download-models.js