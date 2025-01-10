from django.shortcuts import render, redirect
from django.conf import settings  # MongoDB settings
from django.contrib.auth import authenticate, login, logout
from supabase import create_client, Client
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import connection 
from .models import Project
from django.views.decorators.csrf import csrf_exempt

def get_supabase_client() -> Client:
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

supabase = get_supabase_client()

def get_projects(user_id):
    with connection.cursor() as cursor:
        cursor.execute("SELECT * FROM projects WHERE owner_id = %s", [user_id])
        project_data = cursor.fetchall()

    # Create a list of Project model instances
    projects = []
    for project in project_data:
        
        project_instance = Project(
            id=project[0],  # Assuming the first field is the primary key (id)
            name=project[2],  # Assuming the second field is the project_name
        )
        projects.append(project_instance)
    
    return projects


@csrf_exempt
def home(request):
    projects = []
    
    # If the user is authenticated, get their projects
    if request.user.is_authenticated:
        projects = get_projects(request.user.id)
    
    return render(request, 'index.html', {'projects': projects})
    

def login_page(request):
    return render(request, 'login.html')

def create_account_page(request):
    return render(request, 'create-account.html')


def create_account(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        email = request.POST['email']


        error_message = None  # Variable to store the error message

    try:
        validate_password(password, user=None)  
    except ValidationError as e:
        error_message = e.messages  # This contains a list of validation error messages
        return render(request, 'create-account.html', {'error_message': error_message})
    # Create the new user if all validations pass
    new_user = User.objects.create_user(
        username=username,
        email=email,
        password=password
    )

    # Log in the new user
    login(request, new_user)

    # Redirect to home after successful creation
    return redirect('home')




def login_user(request):
    if request.method == 'POST':
        # Extract username and password from the POST request
        username = request.POST['username']
        password = request.POST['password']

        # Authenticate the user
        user = authenticate(request, username=username, password=password)

        if user is not None:
            # Log the user in
            login(request, user)

            
            projects = get_projects(user.id)


            return render(request, 'index.html', {'projects': projects})  # Redirect to the home page after successful login
        else:
            # Invalid credentials; display an error message
            error_message = "Invalid username or password"
            return render(request, 'login.html', {'error_message': error_message})

    # If GET request, simply render the login page
    return render(request, 'login.html')

def logout_user(request):
    logout(request)  # This clears the session and logs out the user
    return redirect('home') 