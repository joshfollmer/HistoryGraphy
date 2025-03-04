"""
URL configuration for historygraphy project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.urls import path
from . import views  # Import the view
from django.conf.urls.static import static
from django.conf import settings

urlpatterns = [
    path('', views.home, name='home'),
    path('home/', views.home, name='home'),
    path('login-page/', views.login_page, name='login-page'),
    path('create-account-page/', views.create_account_page, name='create-account-page'),
    path('create-account/', views.create_account, name='create-account'),
    path('login/', views.login_user, name='login-user'),
    path('logout_user/', views.logout_user, name='logout_user'),
    path('create-project/', views.create_project, name ='create-project'),
    path('create-node/', views.create_node, name = 'create-node'),
    path('edit-source/', views.edit_source, name = 'edit_source'),
    path('project/<int:project_id>/', views.view_project, name = 'view_project')

]


if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)