from neomodel import StructuredNode, StringProperty, IntegerProperty, ListProperty, DateProperty, BooleanProperty, RelationshipTo, config 


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