import uuid

from django.contrib.auth.base_user import AbstractBaseUser, BaseUserManager
from django.contrib.auth.models import PermissionsMixin
from django.db import models


class Service(models.Model):
    """Service technique municipal (voirie, eau, électricité, environnement...)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nom = models.CharField(max_length=150, unique=True)
    description = models.TextField(blank=True)
    actif = models.BooleanField(default=True)

    class Meta:
        db_table = "accounts_service"
        verbose_name = "Service"
        verbose_name_plural = "Services"
        ordering = ["nom"]

    def __str__(self):
        return self.nom


class Zone(models.Model):
    """Zone géographique de compétence, rattachée à un service."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nom = models.CharField(max_length=150)
    polygone_geo = models.JSONField(null=True, blank=True)
    service = models.ForeignKey(
        Service,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="zones",
    )

    class Meta:
        db_table = "accounts_zone"
        verbose_name = "Zone"
        verbose_name_plural = "Zones"
        ordering = ["nom"]

    def __str__(self):
        return self.nom


class RoleUtilisateur(models.TextChoices):
    CITOYEN = "CITOYEN", "Citoyen"
    AGENT = "AGENT", "Agent de service"
    SUPERVISEUR = "SUPERVISEUR", "Superviseur"
    ADMINISTRATEUR = "ADMINISTRATEUR", "Administrateur"
    DECIDEUR = "DECIDEUR", "Décideur / Élu"


class UtilisateurManager(BaseUserManager):
    """Manager personnalisé : l'email est l'identifiant de connexion."""

    use_in_migrations = True

    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError("L'adresse email est obligatoire.")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_user(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        extra_fields.setdefault("role", RoleUtilisateur.CITOYEN)
        return self._create_user(email, password, **extra_fields)

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", RoleUtilisateur.ADMINISTRATEUR)
        if extra_fields.get("is_staff") is not True:
            raise ValueError("Un superutilisateur doit avoir is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Un superutilisateur doit avoir is_superuser=True.")
        return self._create_user(email, password, **extra_fields)


class Utilisateur(AbstractBaseUser, PermissionsMixin):
    """
    Modèle utilisateur personnalisé (remplace le User Django par défaut).
    Le rôle détermine le comportement métier (citoyen, agent, superviseur...).
    NB : « Agent » n'est pas une table séparée en V1 (simplification MVP) ;
    c'est un Utilisateur avec role=AGENT et un service renseigné.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(max_length=254, unique=True)
    telephone = models.CharField(max_length=20, blank=True)
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    role = models.CharField(
        max_length=20, choices=RoleUtilisateur.choices, default=RoleUtilisateur.CITOYEN
    )
    service = models.ForeignKey(
        Service,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="agents",
        help_text="Renseigné uniquement pour les rôles AGENT / SUPERVISEUR.",
    )
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    date_creation = models.DateTimeField(auto_now_add=True)

    objects = UtilisateurManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["nom", "prenom"]

    class Meta:
        db_table = "accounts_utilisateur"
        verbose_name = "Utilisateur"
        verbose_name_plural = "Utilisateurs"
        ordering = ["nom", "prenom"]

    def __str__(self):
        return f"{self.prenom} {self.nom} ({self.role})"

    @property
    def is_agent(self):
        return self.role == RoleUtilisateur.AGENT
