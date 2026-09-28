web: gunicorn -w 2 -k gthread --threads 4 -b 0.0.0.0:$PORT --access-logfile - --error-logfile - wsgi:app
release: python -c "from app import create_app; create_app()"
