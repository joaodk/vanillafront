build:
	npm run build
deploy:
	npm run build
	./setups3.py deploy
invalidate:
	./setups3.py invalidate
run:
	npm run dev
