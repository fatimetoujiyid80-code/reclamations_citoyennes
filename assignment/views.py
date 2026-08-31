from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated, SAFE_METHODS

from accounts.permissions import IsAdministrateur

from .models import RegleAffectation
from .serializers import RegleAffectationSerializer


class RegleAffectationViewSet(viewsets.ModelViewSet):
    """
    Lecture ouverte à tout utilisateur authentifié (utile pour qu'un
    superviseur ou un agent comprenne comment les réclamations sont
    affectées automatiquement). Écriture (create/update/delete) réservée
    à l'administrateur — même politique que ServiceViewSet/ZoneViewSet
    dans accounts.views (déjà validés).
    """

    queryset = RegleAffectation.objects.all()
    serializer_class = RegleAffectationSerializer

    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [IsAuthenticated()]
        return [IsAdministrateur()]