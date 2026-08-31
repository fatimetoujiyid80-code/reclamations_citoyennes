import uuid

from django.conf import settings
from django.db import models


class CanalNotification(models.TextChoices):
    SMS = "SMS", "SMS"
    PUSH = "PUSH", "Notification push"


class StatutEnvoi(models.TextChoices):
    EN_ATTENTE = "EN_ATTENTE", "En attente"
    ENVOYE = "ENVOYE", "Envoyé"
    ECHEC = "ECHEC", "Échec"


class Notification(models.Model):
    """
    Notification envoyée à un utilisateur (SMS ou push), déclenchée de façon
    synchrone en V1 par notifications/services.py à chaque changement de
    statut d'une réclamation.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    utilisateur = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="notifications"
    )
    reclamation = models.ForeignKey(
        "complaints.Reclamation",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications",
    )
    canal = models.CharField(max_length=10, choices=CanalNotification.choices)
    contenu = models.TextField()
    statut_envoi = models.CharField(
        max_length=20, choices=StatutEnvoi.choices, default=StatutEnvoi.EN_ATTENTE
    )
    date_envoi = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "notifications_notification"
        verbose_name = "Notification"
        verbose_name_plural = "Notifications"
        ordering = ["-date_envoi"]
        indexes = [
            models.Index(fields=["statut_envoi"], name="ix_notification_statut_envoi"),
        ]

    def __str__(self):
        return f"{self.canal} → {self.utilisateur} ({self.statut_envoi})"
