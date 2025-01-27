from django.db import models
from neomodel import StructuredNode, StringProperty, IntegerProperty, ListProperty, DateProperty, BooleanProperty, RelationshipTo, config 

# Project model
class Project(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    #created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
    


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
    tags = ListProperty(StringProperty())




class Project_node(StructuredNode):
    name = StringProperty(required= True)
    created_at = DateProperty(required= True)
    owner = StringProperty(required= True)
    project_id = IntegerProperty(unique_index= True, required= True)

    nodes = RelationshipTo('Node', 'CONTAINS')