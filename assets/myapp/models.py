from django.db import models
from neomodel import StructuredNode, StringProperty, IntegerProperty, ArrayProperty, DateProperty, BooleanProperty, RelationshipTo
from django.contrib.auth.models import User

# Project model
class Project(models.Model):
    project_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    owner_id = models.ForeignKey(User, on_delete=models.CASCADE)




class Source(StructuredNode):
    title = StringProperty(unique_index= True, required= True)
    author = StringProperty(default = "Unknown")
    date_created = DateProperty(required= True)
    date_discovered = DateProperty()
    is_primary = BooleanProperty(required= True)
    description = StringProperty()
    url = StringProperty()
    contributor = StringProperty(required= True)
    language = StringProperty(required= True)
    tags = ArrayProperty(StringProperty())

    def __init__(self, **kwargs):
        super(Source, self).__init__(**kwargs)
        
        # If date_discovered is not set, use date_created as the default value
        if not self.date_discovered:
            self.date_discovered = self.date_created

class PrimarySource(Source):
    __label__ = 'PrimarySource'
    children = RelationshipTo('SecondarySource', 'CITED_BY')

class SecondarySource(Source):
    __label__ = 'SecondarySource'
    parents = RelationshipTo('Source',  'CITES')
    children = RelationshipTo('Source', 'CITED_BY')







class Project_node(StructuredNode):
    name = StringProperty(required= True)
    owner = StringProperty(required= True)
    project_id = IntegerProperty(unique_index= True, required= True)

    nodes = RelationshipTo('Source', 'CONTAINS')