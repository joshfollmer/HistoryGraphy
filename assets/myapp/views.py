from django.shortcuts import render, redirect
from django.conf import settings  # MongoDB settings
from django.contrib.auth import authenticate, login, logout
from supabase import create_client, Client
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.db import connection 
from .models  import Project
from django.views.decorators.csrf import csrf_exempt
from django.core.cache import cache
from neo4j import GraphDatabase
import os
import json
from django.http import JsonResponse
from datetime import datetime
from django.utils.html import escape


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
            project_id=project[0],  
            name=project[2],  
        )
        projects.append(project_instance)
    cache.set('global_projects', projects, timeout=60*15)
    
    return projects

def get_project_from_cache(project_id):
    projects = cache.get('global_projects')  
    if projects:
        
        project = next((p for p in projects if p.project_id == project_id), None)
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


def sanitize_input(value):
    return escape(value.strip()) if value else ""

def create_account(request):
    if request.method == 'POST':
        username = sanitize_input(request.POST.get('username', ''))
        password = request.POST.get('password', '').strip()  # Don't escape passwords
        email = sanitize_input(request.POST.get('email', ''))


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
        username = sanitize_input(request.POST.get('username', ''))
        password = request.POST.get('password', '').strip()

        
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
           name = sanitize_input(request.POST.get('project_name')),
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
            CREATE (p:Project {project_id: $project_id, name: $project_name, owner_id: $owner_id})
            """
            session.run(query, project_id=project_id, project_name=new_project.name, owner_id=new_project.owner_id.id)

            session.close() 



            
            return redirect(f'/project/{project_id}/')

        else:
                # Handle the case where the insert fails
                error_message = "Failed to create project."
                return render(request, 'index.html', {'error_message': error_message})
        


def get_nodes(project_id):
    driver = get_neo4j_driver()
    session = driver.session()

    # Query to get the project node, its neighbors, and the relationships (edges)
    query = """
    MATCH (p:Project {project_id: $project_id})-[:CONNECTED_TO]->(neighbor)
    OPTIONAL MATCH (neighbor)-[r:CITES]->(cited_neighbor)
    RETURN p, neighbor, cited_neighbor, type(r) AS relationship_type
    """



    result = session.run(query, project_id=project_id)
    
    added_nodes = set()
    nodes = []
    edges = []

    # Process each record from the query result
    for record in result:
        
        neighbor_node = record["neighbor"]
        cited = record["cited_neighbor"]

        if neighbor_node:  # Ensure there is a neighbor node
            node_title = neighbor_node.get("title", "Untitled")  # Default to "Untitled" if no title exists
            
            # Because of how the query gets returned, if we don't do this check it will process each edge as a new node
            if node_title not in added_nodes:
                date_created = neighbor_node.get("date_created", None)
                date_discovered = neighbor_node.get("date_discovered", None)

                # If the date fields exist, convert them to string (ISO format)
                if date_created:
                    date_created = date_created.isoformat()
                if date_discovered:
                    date_discovered = date_discovered.isoformat()

                # Collect node data for the neighbor
                nodes.append({
                    "data": {
                        "id": node_title,  # Use title as the ID
                        "label": node_title,  # Use title as the label
                        "author": neighbor_node.get("author", "Unknown"),
                        "date_created": date_created,
                        "ad_created" : neighbor_node.get("ad_created"),
                        "date_discovered": date_discovered,
                        "ad_discovered" : neighbor_node.get("ad_discovered"),
                        "is_primary": neighbor_node.get("is_primary", False),
                        "description": neighbor_node.get("description", ""),
                        "url": neighbor_node.get("url", ""),
                        "contributor": neighbor_node.get("contributor", ""),
                        "language": neighbor_node.get("language", ""),
                    }
                })

                added_nodes.add(node_title)

            if(cited):
                edges.append({
                    "data": {
                        "source": node_title,  
                        "target": cited["title"]  
                    }
                })

    session.close()



    
    result_json = json.dumps({
        "nodes": nodes,
        "edges": edges
    })

    return result_json



#CODE TO DELETE A NODE:
# MATCH (n:Source {title: })
# DETACH DELETE n;




def create_node(request):
    if request.method == 'POST':
        data = json.loads(request.body)

        # Date handling
        date_created_str = data.get('date_created')
        date_discovered_str = data.get('date_discovered', date_created_str)

        date_created_datetime = datetime.strptime(date_created_str, '%Y-%m-%d').date()
        date_discovered_datetime = datetime.strptime(date_discovered_str, '%Y-%m-%d').date()

        project_id = int(data.get('project_id'))  # Project ID

        # Setting the node properties
        title = sanitize_input(data.get('title', 'Untitled'))
        author = sanitize_input(data.get('author', 'Unknown'))
        date_created = date_created_datetime
        ad_created = data.get("ad_created", True)
        date_discovered = date_discovered_datetime
        ad_discovered = data.get("ad_discovered", True)
        is_primary = data.get('is_primary', False)
        description = sanitize_input(data.get('description'))
        url = sanitize_input(data.get('url'))
        language = sanitize_input(data.get('language'))
        contributor = request.user.username
        cites = data.get('selected_cites', [])

        # Neo4j connection setup
        driver = get_neo4j_driver()
        session = driver.session()

        # Check if the node with the same title exists
        query_check = """
        MATCH (n:Source {title: $title})
        RETURN n
        LIMIT 1
        """
        result = session.run(query_check, {'title': title})
        existing_node = result.single()

        if existing_node:
            node_data = existing_node['n']
            return JsonResponse({
                'title': node_data['title'],
                'author': node_data.get('author', 'Unknown'),
                'date_created': node_data.get('date_created'),
                'date_discovered': node_data.get('date_discovered'),
                'is_primary': node_data.get('is_primary', False),
                'description': node_data.get('description', ''),
                'url': node_data.get('url', ''),
                'language': node_data.get('language', ''),
                'contributor': node_data.get('contributor', ''),
                'selectedCites': list(cites)
            })

        # Query to create a new node
        query = """
        MATCH (p:Project) WHERE p.project_id = $projectId 
        CREATE (n:Source {
            title: $title,
            author: $author,
            date_created: $date_created,
            ad_created: $ad_created,
            date_discovered: $date_discovered,
            ad_discovered: $ad_discovered,
            is_primary: $is_primary,
            description: $description,
            url: $url,
            language: $language,
            contributor: $contributor
        })
        MERGE (p)-[:CONNECTED_TO]->(n) 
        WITH n 
        UNWIND $selectedCites AS citeName 
        MATCH (cited:Source {title: citeName}) 
        MERGE (n)-[:CITES]->(cited) 
        RETURN n.title AS node_id
        """

        params = {
            'title': title,
            'author': author,
            'date_created': date_created,
            'ad_created': ad_created,
            'date_discovered': date_discovered,
            'ad_discovered': ad_discovered,
            'is_primary': is_primary,
            'description': description,
            'url': url,
            'language': language,
            'contributor': contributor,
            'projectId': project_id,
            'selectedCites': list(cites)
        }

        # Run the query to create the new Source node
        session.run(query, params)

        # Return the newly created node data
        return JsonResponse({
            'title': title,
            'author': author,
            'date_created': date_created,
            'date_discovered': date_discovered,
            'is_primary': is_primary,
            'description': description,
            'url': url,
            'language': language,
            'contributor': contributor,
            'selectedCites': list(cites)
        })

    return JsonResponse({'error': 'Invalid request'}, status=400)

def view_project(request, project_id):
    graph_data = get_nodes(project_id)
    return render(request, "graph.html", {
        "project_id": project_id,
        "graphData": graph_data   
    })



def edit_source(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            node_title = data.get('title')
            new_author = sanitize_input(data.get('author', 'Unknown'))
            new_date_created = data.get('date_created')
            new_ad_created = data.get('ad_created')
            new_date_discovered = data.get('date_discovered')
            new_ad_discovered = data.get('ad_discovered')
            new_description = sanitize_input(data.get('description', ''))
            new_url = sanitize_input(data.get('url', ''))
            new_language = sanitize_input(data.get('language', 'Unknown'))
            new_contributor = request.user.username
            new_cites = data.get('selectedCites', [])
            


                   
            # Convert date strings to datetime objects
            if new_date_created:
                new_date_created = datetime.strptime(new_date_created, '%Y-%m-%d').date()
            if new_date_discovered:
                new_date_discovered = datetime.strptime(new_date_discovered, '%Y-%m-%d').date()

            if(new_date_discovered < new_date_created):
                new_date_discovered = new_date_created

            driver = get_neo4j_driver()
            session = driver.session()

            query = """
            MATCH (p:Project)-[:CONNECTED_TO]->(n:Source {title: $node_title})
            SET n.author = $new_author,
                n.date_created = $new_date_created,
                n.ad_created = $new_ad_created,
                n.date_discovered = $new_date_discovered,
                n.ad_discovered = $new_ad_discovered,
                n.description = $new_description,
                n.url = $new_url,
                n.language = $new_language,
                n.contributor = $new_contributor
                
            WITH n
            OPTIONAL MATCH (n)-[r:CITES]->(cited)
            DELETE r
            WITH n
            UNWIND $new_cites AS citeName
            MATCH (cited:Source {title: citeName})
            MERGE (n)-[:CITES]->(cited)
            RETURN n.title AS node_id
            """

            params = {
                'node_title': node_title,
                'new_author': new_author,
                'new_date_created': new_date_created,
                'new_ad_created' : new_ad_created,
                'new_date_discovered': new_date_discovered,
                'new_ad_discovered' : new_ad_discovered,
                'new_description': new_description,
                'new_url': new_url,
                'new_language': new_language,
                'new_contributor': new_contributor,
                'new_cites': list(new_cites)
            }
            print("Query Parameters:", params)

            session.run(query, params)
            session.close()

            return JsonResponse({'success': True, 'node_id': node_title})

        except Exception as e:
            import traceback
            print("Error occurred:", traceback.format_exc())  # Print full error traceback
            return JsonResponse({'error': str(e)}, status=500)


    return JsonResponse({'error': 'Invalid request'}, status=400)



def delete_source(request):
    if request.method == 'DELETE':
        try:
            data = json.loads(request.body)
            source_title = data.get('title')

            if not source_title:
                return JsonResponse({'error': 'Source title is required'}, status=400)

            driver = get_neo4j_driver()
            session = driver.session()

            query = """
            MATCH (s:Source {title: $source_title})
            DETACH DELETE s
            """

            session.run(query, {'source_title': source_title})
            session.close()

            return JsonResponse({'success': True})

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Invalid request'}, status=400)

def remove_source_from_project(request):
    if request.method == 'POST':
        try:
            # Extract the required data from the request
            data = json.loads(request.body)
            node_title = data.get('title')  
            project_id = int(data.get('project_id'))  

            driver = get_neo4j_driver()
            session = driver.session()

            # Cypher query to sever the connection between the node and the project
            query = """
            MATCH (p:Project)-[r:CONNECTED_TO]->(n:Source {title: $node_title})
            WHERE p.project_id = $project_id
            DELETE r
            RETURN p.project_id AS project_id, n.title AS node_title
            """

            params = {
                'node_title': node_title,
                'project_id': project_id
            }

            # Run the query
            result = session.run(query, params)
            session.close()

            # If the result is not empty, the connection was removed successfully
            if result.peek():
                return JsonResponse({'success': True, 'message': f'Node "{node_title}" removed from project {project_id}.'})

            return JsonResponse({'error': 'Node or Project not found'}, status=404)

        except Exception as e:
            import traceback
            print("Error occurred:", traceback.format_exc())  # Print full error traceback
            return JsonResponse({'error': str(e)}, status=500)

    return JsonResponse({'error': 'Invalid request'}, status=400)
