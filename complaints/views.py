import uuid

from django.shortcuts import get_object_or_404
from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated, SAFE_METHODS
from rest_framework.response import Response

from accounts.models import RoleUtilisateur, Service
from accounts.permissions import IsAdministrateur
from assignment.services import affecter
from notifications.services import notifier_changement_statut

from .models import Categorie, Reclamation, StatutReclamation
from .permissions import (
    EstCitoyen,
    PeutConsulterReclamation,
    PeutEvaluerReclamation,
    PeutModifierStatutReclamation,
    PeutReaffecterReclamation,
)
from .serializers import (
    CategorieSerializer,
    MediaSerializer,
    ReclamationChangementStatutSerializer,
    ReclamationCreationSerializer,
    ReclamationDetailSerializer,
    ReclamationListSerializer,
)


class CategorieViewSet(viewsets.ModelViewSet):
    """Lecture ouverte à tout authentifié, écriture réservée à l'administrateur."""

    queryset = Categorie.objects.all()
    serializer_class = CategorieSerializer

    def get_permissions(self):
        if self.request.method in SAFE_METHODS:
            return [IsAuthenticated()]
        return [IsAdministrateur()]


class ReclamationViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.ListModelMixin,
    viewsets.GenericViewSet,
):
    """
    Volontairement construit à partir de mixins (pas ModelViewSet complet) :
    aucune route PATCH/DELETE générique n'existe. Toute modification passe
    par une action explicite (changer-statut, reaffecter, evaluer), qui
    trace systématiquement l'historique via Reclamation.changer_statut().
    """

    def get_queryset(self):
        user = self.request.user
        role = getattr(user, "role", None)

        if role == RoleUtilisateur.CITOYEN:
            return Reclamation.objects.filter(citoyen=user)

        if role == RoleUtilisateur.AGENT:
            if not user.service_id:
                return Reclamation.objects.none()
            return Reclamation.objects.filter(service_id=user.service_id)

        if role in (
            RoleUtilisateur.SUPERVISEUR,
            RoleUtilisateur.ADMINISTRATEUR,
            RoleUtilisateur.DECIDEUR,
        ):
            return Reclamation.objects.all()

        return Reclamation.objects.none()

    def get_serializer_class(self):
        if self.action == "list":
            return ReclamationListSerializer

        if self.action == "create":
            return ReclamationCreationSerializer

        if self.action == "changer_statut":
            return ReclamationChangementStatutSerializer

        return ReclamationDetailSerializer

    def get_permissions(self):
        if self.action == "create":
            classes = [IsAuthenticated, EstCitoyen]

        elif self.action == "retrieve":
            classes = [IsAuthenticated, PeutConsulterReclamation]

        elif self.action == "changer_statut":
            classes = [IsAuthenticated, PeutModifierStatutReclamation]

        elif self.action == "reaffecter":
            classes = [IsAuthenticated, PeutReaffecterReclamation]

        elif self.action == "evaluer":
            classes = [IsAuthenticated, PeutEvaluerReclamation]

        else:
            classes = [IsAuthenticated]

        return [c() for c in classes]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        reclamation = serializer.save()

        service_affecte = affecter(reclamation)

        if service_affecte is not None:
            notifier_changement_statut(reclamation)

        sortie = ReclamationDetailSerializer(
            reclamation,
            context=self.get_serializer_context(),
        )

        return Response(
            sortie.data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"], url_path="changer-statut")
    def changer_statut(self, request, pk=None):
        reclamation = self.get_object()

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        reclamation.changer_statut(
            serializer.validated_data["statut"],
            auteur=request.user,
            commentaire=serializer.validated_data.get("commentaire", ""),
        )

        notifier_changement_statut(reclamation)

        sortie = ReclamationDetailSerializer(
            reclamation,
            context=self.get_serializer_context(),
        )

        return Response(sortie.data)

    @action(detail=True, methods=["post"])
    def reaffecter(self, request, pk=None):
        reclamation = self.get_object()
        service_id = request.data.get("service")

        if not service_id:
            return Response(
                {"service": ["Ce champ est obligatoire."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            uuid.UUID(str(service_id))
        except ValueError:
            return Response(
                {"service": ["UUID invalide."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        service = get_object_or_404(Service, pk=service_id)

        reclamation.service = service
        reclamation.save(update_fields=["service"])

        reclamation.changer_statut(
            StatutReclamation.AFFECTEE,
            auteur=request.user,
            commentaire=(
                f"Réaffectée au service {service.nom} "
                f"par {request.user.email}."
            ),
        )

        notifier_changement_statut(reclamation)

        sortie = ReclamationDetailSerializer(
            reclamation,
            context=self.get_serializer_context(),
        )

        return Response(sortie.data)

    @action(
        detail=True,
        methods=["post"],
        parser_classes=[MultiPartParser, FormParser, JSONParser],
    )
    def medias(self, request, pk=None):
        reclamation = self.get_object()

        if reclamation.citoyen_id != request.user.id:
            return Response(
                {
                    "detail": (
                        "Seul l'auteur de la réclamation "
                        "peut y ajouter un média."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = MediaSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        media = serializer.save(reclamation=reclamation)

        return Response(
            MediaSerializer(media).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"])
    def evaluer(self, request, pk=None):
        reclamation = self.get_object()

        note = request.data.get("note_citoyen")

        if not isinstance(note, int) or not (1 <= note <= 5):
            return Response(
                {
                    "note_citoyen": [
                        "Doit être un entier compris entre 1 et 5."
                    ]
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        reclamation.note_citoyen = note
        reclamation.save(update_fields=["note_citoyen"])

        sortie = ReclamationDetailSerializer(
            reclamation,
            context=self.get_serializer_context(),
        )

        return Response(sortie.data)