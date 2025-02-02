from django.db import models
from neomodel import StructuredNode, StringProperty, IntegerProperty, ArrayProperty, DateProperty, BooleanProperty, RelationshipTo, config 
from django.contrib.auth.models import User

# Project model
class Project(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    owner_id = models.ForeignKey(User, on_delete=models.CASCADE)




class Node(StructuredNode):
    name = StringProperty(unique_index= True, required= True)
    author = StringProperty(required= True)
    date = DateProperty(required= True)
    primary_source = BooleanProperty()
    description = StringProperty()
    citation = StringProperty()
    url = StringProperty()
    contributor = StringProperty(required= True)
    language = StringProperty(required= True)
    tags = ArrayProperty(StringProperty())




class Project_node(StructuredNode):
    name = StringProperty(required= True)
    owner = StringProperty(required= True)
    project_id = IntegerProperty(unique_index= True, required= True)

    nodes = RelationshipTo('Node', 'CONTAINS')