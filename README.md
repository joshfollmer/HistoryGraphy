Instructions to get started

Create virtual environment if not already created
python3 -m venv venv

Activate virtual environment
venv\Scripts\activate

Install dependencies
pip install -r requirements.txt

Apply database configurations to current schema
python manage.py migrate

Start the website
python manage.py runserver

