import uuid

from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class Categorie(models.Model):
    """Catégorie de réclamation (voirie, électricité, eau, environnement...)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nom = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        db_table = "complaints_categorie"
        verbose_name = "Catégorie"
        verbose_name_plural = "Catégories"
        ordering = ["nom"]

    def __str__(self):
        return self.nom


class StatutReclamation(models.TextChoices):
    NOUVELLE = "NOUVELLE", "Nouvelle"
    RECUE = "RECUE", "Reçue"
    AFFECTEE = "AFFECTEE", "Affectée"
    EN_COURS = "EN_COURS", "En cours"
    RESOLUE = "RESOLUE", "Résolue"
    CLOTUREE = "CLOTUREE", "Clôturée"
    REJETEE = "REJETEE", "Rejetée"


class Reclamation(models.Model):
    """Entité centrale du domaine : une réclamation soumise par un citoyen."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    numero_suivi = models.CharField(max_length=20, unique=True, editable=False)
    titre = models.CharField(max_length=200)
    description = models.TextField()
    latitude = models.DecimalField(
        max_digits=9, decimal_places=6,
        validators=[MinValueValidator(-90), MaxValueValidator(90)],
    )
    longitude = models.DecimalField(
        max_digits=9, decimal_places=6,
        validators=[MinValueValidator(-180), MaxValueValidator(180)],
    )
    adresse_approx = models.CharField(max_length=255, blank=True)
    statut = models.CharField(
        max_length=20, choices=StatutReclamation.choices, default=StatutReclamation.NOUVELLE
    )

    citoyen = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="reclamations_soumises",
    )
    categorie = models.ForeignKey(
        Categorie, on_delete=models.PROTECT, related_name="reclamations"
    )
    zone = models.ForeignKey(
        "accounts.Zone", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="reclamations",
    )
    service = models.ForeignKey(
        "accounts.Service", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="reclamations_affectees",
    )
    agent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL, null=True, blank=True,
        related_name="reclamations_traitees",
    )

    date_creation = models.DateTimeField(auto_now_add=True)
    date_maj = models.DateTimeField(auto_now=True)
    date_cloture = models.DateTimeField(null=True, blank=True)
    note_citoyen = models.PositiveSmallIntegerField(
        null=True, blank=True, validators=[MinValueValidator(1), MaxValueValidator(5)]
    )

    class Meta:
        db_table = "complaints_reclamation"
        verbose_name = "Réclamation"
        verbose_name_plural = "Réclamations"
        ordering = ["-date_creation"]
        indexes = [
            models.Index(fields=["statut"], name="ix_reclamation_statut"),
            models.Index(fields=["-date_creation"], name="ix_reclamation_date_creation"),
            models.Index(fields=["service", "statut"], name="ix_reclamation_service_statut"),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(note_citoyen__isnull=True)
                | (models.Q(note_citoyen__gte=1) & models.Q(note_citoyen__lte=5)),
                name="ck_reclamation_note",
            ),
            models.CheckConstraint(
                condition=models.Q(latitude__gte=-90) & models.Q(latitude__lte=90),
                name="ck_reclamation_latitude",
            ),
            models.CheckConstraint(
                condition=models.Q(longitude__gte=-180) & models.Q(longitude__lte=180),
                name="ck_reclamation_longitude",
            ),
        ]

    def __str__(self):
        return f"{self.numero_suivi} — {self.titre}"

    def save(self, *args, **kwargs):
        if not self.numero_suivi:
            self.numero_suivi = self._generer_numero_suivi()
        super().save(*args, **kwargs)

    def _generer_numero_suivi(self):
        from django.utils import timezone
        return f"RC-{timezone.now():%Y%m}-{uuid.uuid4().hex[:8].upper()}"

    def changer_statut(self, nouveau_statut, auteur=None, commentaire=""):
        """Encapsule le changement de statut + trace l'historique (voir complaints/services.py)."""
        ancien = self.statut
        self.statut = nouveau_statut
        if nouveau_statut in (StatutReclamation.RESOLUE, StatutReclamation.CLOTUREE):
            from django.utils import timezone
            self.date_cloture = timezone.now()
        self.save()
        HistoriqueStatut.objects.create(
            reclamation=self,
            ancien_statut=ancien,
            nouveau_statut=nouveau_statut,
            commentaire=commentaire,
            auteur=auteur,
        )


class TypeMedia(models.TextChoices):
    PHOTO = "PHOTO", "Photo"
    VIDEO = "VIDEO", "Vidéo"


def chemin_media(instance, filename):
    return f"reclamations/{instance.reclamation_id}/{filename}"


class Media(models.Model):
    """Photo ou vidéo jointe à une réclamation (stockage local en V1)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reclamation = models.ForeignKey(
        Reclamation, on_delete=models.CASCADE, related_name="medias"
    )
    fichier = models.FileField(upload_to=chemin_media, max_length=255)
    type_media = models.CharField(max_length=10, choices=TypeMedia.choices)
    taille_octets = models.PositiveIntegerField()
    date_upload = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "complaints_media"
        verbose_name = "Média"
        verbose_name_plural = "Médias"
        ordering = ["date_upload"]

    def __str__(self):
        return f"{self.type_media} — {self.reclamation.numero_suivi}"


class HistoriqueStatut(models.Model):
    """Trace chaque changement de statut d'une réclamation (audit)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reclamation = models.ForeignKey(
        Reclamation, on_delete=models.CASCADE, related_name="historique"
    )
    ancien_statut = models.CharField(max_length=20, blank=True)
    nouveau_statut = models.CharField(max_length=20)
    commentaire = models.TextField(blank=True)
    auteur = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    date_changement = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "complaints_historiquestatut"
        verbose_name = "Historique de statut"
        verbose_name_plural = "Historiques de statut"
        ordering = ["-date_changement"]

    def __str__(self):
        return f"{self.reclamation.numero_suivi}: {self.ancien_statut} → {self.nouveau_statut}"
