from rest_framework import serializers

from .models import Notification


class UtilisateurResumeSerializer(serializers.Serializer):
    """
    Représentation minimale d'un utilisateur imbriquée dans une notification.
    Volontairement dupliquée (pas importée depuis complaints.serializers) :
    chaque app reste indépendante, cohérent avec la séparation déjà adoptée
    pour accounts/complaints/assignment.
    """

    id = serializers.UUIDField(read_only=True)
    email = serializers.EmailField(read_only=True)
    nom = serializers.CharField(read_only=True)
    prenom = serializers.CharField(read_only=True)


class ReclamationResumeSerializer(serializers.Serializer):
    """Représentation minimale d'une réclamation imbriquée dans une notification."""

    id = serializers.UUIDField(read_only=True)
    numero_suivi = serializers.CharField(read_only=True)
    titre = serializers.CharField(read_only=True)
    statut = serializers.CharField(read_only=True)


class NotificationSerializer(serializers.ModelSerializer):
    """
    Entièrement en lecture seule : les notifications ne sont jamais créées
    ni modifiées via l'API, uniquement par
    notifications.services.notifier_changement_statut(), appelé depuis
    complaints/views.py (pas encore branché à ce stade).
    """

    utilisateur = UtilisateurResumeSerializer(read_only=True)
    reclamation = ReclamationResumeSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = ["id", "utilisateur", "reclamation", "canal", "contenu", "statut_envoi", "date_envoi"]
        read_only_fields = fields