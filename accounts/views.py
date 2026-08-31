from rest_framework import generics, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated, SAFE_METHODS
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Service, Utilisateur, Zone
from .permissions import IsAdministrateur
from .serializers import (
    ServiceSerializer,
    UtilisateurAdminSerializer,
    UtilisateurInscriptionSerializer,
    UtilisateurSerializer,
    ZoneSerializer,
)


class UtilisateurInscriptionView(generics.CreateAPIView):
    """
    POST /api/accounts/inscription/
    Endpoint public : création d'un compte citoyen. Aucune authentification
    requise (AllowAny surcharge le IsAuthenticated global de settings.py).
    """

    queryset = Utilisateur.objects.all()
    serializer_class = UtilisateurInscriptionSerializer
    permission_classes = [AllowAny]


class MoiView(APIView):
    """
    GET   /api/accounts/moi/  -> profil de l'utilisateur connecté
    PATCH /api/accounts/moi/  -> modification de son propre profil

    Ne prend aucun identifiant en paramètre : agit toujours sur request.user,
    déjà résolu par JWTAuthentication à partir du jeton envoyé.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UtilisateurSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UtilisateurSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class UtilisateurViewSet(viewsets.ModelViewSet):
    """
    CRUD complet des comptes utilisateurs, réservé aux administrateurs.
    (création d'agents/superviseurs, changement de rôle, activation/désactivation)
    """

    queryset = Utilisateur.objects.all().order_by("nom", "prenom")
    serializer_class = UtilisateurAdminSerializer
    permission_classes = [IsAdministrateur]


class ServiceViewSet(viewsets.ModelViewSet):
    """
    Lecture ouverte à tout utilisateur authentifié (un citoyen doit pouvoir
    voir la liste des services pour choisir une catégorie, par exemple).
    Écriture (create/update/delete) réservée aux administrateurs.
    """

    queryset = Service.objects.all()
    serializer_class = ServiceSerializer

    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [IsAuthenticated()]
        return [IsAdministrateur()]


class ZoneViewSet(viewsets.ModelViewSet):
    """Même politique de permission que ServiceViewSet."""

    queryset = Zone.objects.all()
    serializer_class = ZoneSerializer

    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [IsAuthenticated()]
        return [IsAdministrateur()]