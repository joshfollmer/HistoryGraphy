from django.shortcuts import render, redirect
from django.conf import settings  # MongoDB settings
from django.contrib.auth import authenticate, login, logout
from supabase import create_client, Client
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import connection 
from .models import Project, Source
from django.views.decorators.csrf import csrf_exempt
from django.core.cache import cache
from neo4j import GraphDatabase
import os
import json
from django.http import JsonResponse
from datetime import datetime


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
            id=project[0],  
            name=project[2],  
        )
        projects.append(project_instance)
    cache.set('global_projects', projects, timeout=60*15)
    
    return projects

def get_project_from_cache(project_id):
    projects = cache.get('global_projects')  
    if projects:
        
        project = next((p for p in projects if p.id == project_id), None)
        return project
    return None  


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


        error_message = None  

    try:
        validate_password(password, user=None)  
    except ValidationError as e:
        error_message = e.messages  # This contains a list of validation error messages
        return render(request, 'create-account.html', {'error_message': error_message})
    
    
    new_user = User.objects.create_user(
        username=username,
        email=email,
        password=password
    )

   
    login(request, new_user)

    # Redirect to home after successful creation
    return redirect('home')




def login_user(request):
    if request.method == 'POST':
        # Extract username and password from the POST request
        username = request.POST['username']
        password = request.POST['password']

        
        user = authenticate(request, username=username, password=password)

        if user is not None:
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

# Function to get a Neo4j driver connection
def get_neo4j_driver():
    uri = os.getenv('NEO4J_URI')
    username = os.getenv('NEO4J_USERNAME')
    password = os.getenv('NEO4J_PASSWORD')
    driver = GraphDatabase.driver(uri, auth=(username, password))
    return driver

def create_project(request):
    if request.method == 'POST':
        new_project = Project(
           name = request.POST.get('project_name'),
           # You might want to put user.id in here, but since it is a foreign key, django wants to use the whole user object and will automatically
           # set the id.
           owner_id = request.user
        )
        response = (
            supabase.table("projects")
            .insert({"project_name": new_project.name, "owner_id": new_project.owner_id.id})
            .execute()
        )

        # We need to get the response back, because there is an auto incremented field that will be used
        # to create the project node in the neo4j database

        if response.data:
            inserted_project = response.data[0] 
            project_id = inserted_project['id']  # 'id' should be the auto-incremented field


            driver = get_neo4j_driver()
            session = driver.session()

            query = """
            CREATE (p:Project {id: $project_id, name: $project_name, owner_id: $owner_id})
            """
            session.run(query, project_id=project_id, project_name=new_project.name, owner_id=new_project.owner_id.id)

            session.close() 



            # Pass the project to the template 
            return render(request, 'graph.html', {'project': new_project})

        else:
                # Handle the case where the insert fails
                error_message = "Failed to create project."
                return render(request, 'index.html', {'error_message': error_message})

def view_project(request, project_id):

    project = get_project_from_cache(project_id)

    if not project:
        # If the project is not found in cache, fetch it from the database again
        projects = get_projects(request.user.id)
        project = next((p for p in projects if p.id == project_id), None)
        if not project:
            return render(request, "error.html", {"error_message": "Project not found"})

        # After fetching, store it back in the cache
        cache.set('global_projects', projects, timeout=60*15)

    driver = get_neo4j_driver()
    session = driver.session()

    # Query to get the project node and its neighbors
    query = """
    MATCH (p:Project {id: $project_id})-[:CONNECTED_TO]-(neighbor)
    OPTIONAL MATCH (neighbor)-[r:CONNECTED_TO]-(other_neighbor)
    WHERE other_neighbor IN [(p)-[:CONNECTED_TO]-(n) | n]  // Keep only edges between project neighbors
    RETURN p, neighbor, r, other_neighbor
    """
    result = session.run(query, project_id=project_id)

    
    
    # Loop through the retrieved nodes (the neighbors of the project node) and get every unique node and connection 
    nodes = []  
    edges = []

    # Ensure result has records before looping
    if result.peek() is not None:
        seen_nodes = set()
        seen_edges = set()

        for record in result:
            project_node = record["p"]
            neighbor_node = record["neighbor"]
            relationship = record["r"]
            other_neighbor = record["other_neighbor"]



            # Add neighbor nodes (if they exist)
            if neighbor_node and neighbor_node["id"] not in seen_nodes:
                nodes.append({"id": neighbor_node["id"], "label": neighbor_node["name"]})
                seen_nodes.add(neighbor_node["id"])

            if other_neighbor and other_neighbor["id"] not in seen_nodes:
                nodes.append({"id": other_neighbor["id"], "label": other_neighbor["name"]})
                seen_nodes.add(other_neighbor["id"])

            # Add edges: between project -> neighbor and neighbor -> neighbor
            if neighbor_node and (project_node["id"], neighbor_node["id"]) not in seen_edges:
                edges.append({"source": project_node["id"], "target": neighbor_node["id"]})
                seen_edges.add((project_node["id"], neighbor_node["id"]))

            if relationship and other_neighbor:
                if (neighbor_node["id"], other_neighbor["id"]) not in seen_edges:
                    edges.append({"source": neighbor_node["id"], "target": other_neighbor["id"]})
                    seen_edges.add((neighbor_node["id"], other_neighbor["id"]))



    session.close()

    
    return render(request, "graph.html", {
        "project": project,
        "nodes": nodes,
        "edges": edges
    })


@csrf_exempt
def save_nodes(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        nodes_data = data.get('nodes', [])

        for node_data in nodes_data:
            # Save each node to the database (you might need to adjust this according to your model)
            Source.objects.create(
                name=node_data.get('name'),
                source_type=node_data.get('sourceType'),
                date_created=node_data.get('dateCreated'),
                date_discovered=node_data.get('dateDiscovered'),
                discovered_after_created=node_data.get('discoveredAfterCreated'),
                tags=node_data.get('tags')  # Assuming your model can handle tags
            )

        return JsonResponse({'success': True, 'message': 'Nodes saved successfully'})

    return JsonResponse({'success': False, 'message': 'Invalid request'})



def create_node(request):
    if request.method == 'POST':
        print("creating node")
        data = json.loads(request.body)
        
        title = data.get('title')
        if not title:
            return JsonResponse({'error': 'Title is required'}, status=400)
        
        date_created_str = data.get('date_created')
        date_discovered_str = data.get('date_discovered', date_created_str)

        date_created_datetime = datetime.strptime(date_created_str, '%Y-%m-%d').date()
        date_discovered_datetime = datetime.strptime(date_discovered_str, '%Y-%m-%d').date()


        node = Source(
            title=title,
            author=data.get('author', 'Unknown'),
            date_created=date_created_datetime,
            date_discovered=date_discovered_datetime,
            is_primary=data.get('is_primary', False),
            description=data.get('description'),
            url=data.get('url'),
            language=data.get('language'),
            tags=data.get('tags', []),
            contributor= request.user.username
        )

        # node.save()

        driver = get_neo4j_driver()
        session = driver.session()

        query = """
        CREATE (n:Source {
            title: $title, 
            author: $author, 
            date_created: $date_created, 
            date_discovered: $date_discovered, 
            is_primary: $is_primary, 
            description: $description, 
            url: $url, 
            language: $language, 
            tags: $tags, 
            contributor: $contributor
        })
        """
        
        params = {
            'title': node.title,
            'author': node.author,
            'date_created': node.date_created,
            'date_discovered': node.date_discovered,
            'is_primary': node.is_primary,
            'description': node.description,
            'url': node.url,
            'language': node.language,
            'tags': node.tags,
            'contributor': node.contributor
        }

        session.run(query, params)
         # Confirm that the node was saved
        print(f"Node saved: ID={node.id}, Title={node.title}, Contributor={node.contributor}")

        # Return all the fields in the response
        return JsonResponse({
            'title': node.title,
            'author': node.author,
            'date_created': node.date_created,
            'date_discovered': node.date_discovered,
            'is_primary': node.is_primary,
            'description': node.description,
            'url': node.url,
            'language': node.language,
            'tags': node.tags,
            'contributor' : node.contributor
        })

    return JsonResponse({'error': 'Invalid request'}, status=400)
