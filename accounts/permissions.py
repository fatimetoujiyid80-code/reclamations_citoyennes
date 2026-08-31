from rest_framework.permissions import BasePermission

from .models import RoleUtilisateur
 

class IsAdministrateur(BasePermission):
    """     
    Autorise uniquement les utilisateurs authentifiés dont le rôle est
    ADMINISTRATEUR. Un compte superutilisateur Django (is_superuser=True)
    est également autorisé, par sécurité, même si son rôle métier n'a pas
    été explicitement défini à ADMINISTRATEUR.
    """

    message = "Cette action est réservée aux administrateurs."

    def has_permission(self, request, view):
        user = request.user
        if not (user and user.is_authenticated):
            return False
        return user.role == RoleUtilisateur.ADMINISTRATEUR or user.is_superuser