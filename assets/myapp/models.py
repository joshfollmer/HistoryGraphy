from django.db import models
from django.contrib.auth.models import User

# Project model
class Project(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    #created_at = models.DateTimeField(auto_now_add=True)



    def __str__(self):
        return self.name