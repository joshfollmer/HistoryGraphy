from django.shortcuts import render, redirect
from django.http import HttpResponse
from django.conf import settings  # MongoDB settings
import re
from django.contrib.auth.hashers import make_password
from django.contrib.auth.hashers import check_password


def home(request):
    return render(request, 'index.html')

def login_page(request):
    return render(request, 'login.html')

def create_account_page(request):
    return render(request, 'create-account.html')
from django.shortcuts import render, redirect
from django.conf import settings  # MongoDB settings
import re

def create_account(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        email = request.POST['email']

        users_collection = settings.MONGO_COLLECTION

        # Regex for validating email
        email_regex = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'

        error_message = None  # Variable to store the error message

        # Validation checks
        if not (username and password and email):
            error_message = 'Please fill in all fields'
        elif len(username) < 6:
            error_message = 'Username must be at least 6 characters long'
        elif len(password) < 8:
            error_message = 'Password must be at least 8 characters long'
        elif not re.match(email_regex, email):
            error_message = 'Invalid email address'
        elif users_collection.find_one({'username': username}):
            error_message = 'Username already exists!'
        elif users_collection.find_one({'email': email}):
            error_message = 'Email already in use!'

        # If there's any error, pass it to the template and return
        if error_message:
            return render(request, 'create-account.html', {'error_message': error_message})

        # Insert the new user if all validations pass
        new_user = {
            'username': username,
            'email': email,
            'password': make_password(password),
        }
        users_collection.insert_one(new_user)

        # Redirect to home or another page after successful account creation
        return redirect('home')

    return render(request, 'create-account.html')

def login_user(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']

        users_collection = settings.MONGO_COLLECTION

        user = users_collection.find_one({'username': username})

        if user and check_password(password, user['password']):
            # Redirect to home or another page after successful login
            return redirect('home')
        else:
            error_message = 'Invalid username or password'
            return render(request, 'login.html', {'error_message': error_message})

    return render(request, 'login.html')