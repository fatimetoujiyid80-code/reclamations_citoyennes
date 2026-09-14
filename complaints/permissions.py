from rest_framework.permissions import BasePermission

from accounts.models import RoleUtilisateur

from .models import StatutReclamation


def _role(user):
    return getattr(user, "role", None)


class EstCitoyen(BasePermission):
    """
    Autorise uniquement la création d'une réclamation par un citoyen.
    Vérification de rôle uniquement (aucun objet Reclamation n'existe
    encore au moment de la création) — has_permission, pas
    has_object_permission.
    """

    message = "Seul un citoyen peut soumettre une réclamation."

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and _role(user) == RoleUtilisateur.CITOYEN)


class PeutConsulterReclamation(BasePermission):
    """
    Autorise la consultation d'UNE réclamation précise si :
    - le demandeur en est l'auteur (citoyen propriétaire), OU
    - le demandeur est un agent rattaché au service actuellement affecté, OU
    - le demandeur est superviseur, administrateur ou décideur (accès large,
      cohérent avec le tableau de bord décisionnel de la Phase 1).
    """

    message = "Vous n'avez pas accès à cette réclamation."

    def has_object_permission(self, request, view, obj):
        user = request.user
        role = _role(user)
        if role == RoleUtilisateur.CITOYEN:
            return obj.citoyen_id == user.id
        if role == RoleUtilisateur.AGENT:
            return user.service_id is not None and user.service_id == obj.service_id
        return role in (
            RoleUtilisateur.SUPERVISEUR,
            RoleUtilisateur.ADMINISTRATEUR,
            RoleUtilisateur.DECIDEUR,
        ) or user.is_superuser


class PeutModifierStatutReclamation(BasePermission):
    """
    Autorise le changement de statut si :
    - agent rattaché au service actuellement affecté à la réclamation, OU
    - superviseur ou administrateur (quel que soit le service).
    """

    message = "Vous n'êtes pas autorisé à modifier le statut de cette réclamation."

    def has_object_permission(self, request, view, obj):
        user = request.user
        role = _role(user)
        if role == RoleUtilisateur.AGENT:
            return user.service_id is not None and user.service_id == obj.service_id
        return role in (
            RoleUtilisateur.SUPERVISEUR,
            RoleUtilisateur.ADMINISTRATEUR,
        ) or user.is_superuser


class PeutReaffecterReclamation(BasePermission):
    """
    Réaffectation réservée aux superviseurs/administrateurs, indépendamment
    du service actuellement affecté (un superviseur peut corriger une
    mauvaise affectation vers n'importe quel service).
    """

    message = "Seul un superviseur ou un administrateur peut réaffecter une réclamation."

    def has_object_permission(self, request, view, obj):
        user = request.user
        role = _role(user)
        return role in (
            RoleUtilisateur.SUPERVISEUR,
            RoleUtilisateur.ADMINISTRATEUR,
        ) or user.is_superuser


class PeutEvaluerReclamation(BasePermission):
    """
    Triple condition : le demandeur doit être le citoyen propriétaire, la
    réclamation doit être CLOTUREE, ET elle ne doit pas avoir déjà été
    évaluée — une seule évaluation possible, définitive (décision validée).
    """

    message = "Cette réclamation ne peut pas être évaluée (auteur, une seule fois, après clôture uniquement)."

    def has_object_permission(self, request, view, obj):
        user = request.user
        return (
            obj.citoyen_id == user.id
            and obj.statut == StatutReclamation.CLOTUREE
            and obj.note_citoyen is None
        )