from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CategorieViewSet, ReclamationViewSet

router = DefaultRouter()
router.register("reclamations", ReclamationViewSet, basename="reclamation")
router.register("categories", CategorieViewSet, basename="categorie")

urlpatterns = [
    path("", include(router.urls)),
]