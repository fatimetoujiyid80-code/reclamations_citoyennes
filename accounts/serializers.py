from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import RoleUtilisateur, Service, Utilisateur, Zone


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ["id", "nom", "description", "actif"]
        read_only_fields = ["id"]


class ZoneSerializer(serializers.ModelSerializer):
    class Meta:
        model = Zone
        fields = ["id", "nom", "polygone_geo", "service"]
        read_only_fields = ["id"]


class UtilisateurInscriptionSerializer(serializers.ModelSerializer):
    """
    Inscription publique (non authentifiée) d'un citoyen.
    Ne déclare volontairement AUCUN champ 'role' ni 'service' :
    ils ne peuvent donc jamais être injectés depuis le JSON reçu.
    """

    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )

    class Meta:
        model = Utilisateur
        fields = ["id", "email", "password", "nom", "prenom", "telephone"]
        read_only_fields = ["id"]

    def create(self, validated_data):
        return Utilisateur.objects.create_user(
            email=validated_data["email"],
            password=validated_data["password"],
            nom=validated_data["nom"],
            prenom=validated_data["prenom"],
            telephone=validated_data.get("telephone", ""),
            role=RoleUtilisateur.CITOYEN,
        )


class UtilisateurSerializer(serializers.ModelSerializer):
    """
    Profil "personnel" (endpoint /moi/) : un utilisateur peut lire et modifier
    ses propres informations, mais pas son rôle, son service ni son statut actif.
    """

    class Meta:
        model = Utilisateur
        fields = [
            "id", "email", "nom", "prenom", "telephone",
            "role", "service", "is_active", "date_creation",
        ]
        read_only_fields = ["id", "email", "role", "service", "is_active", "date_creation"]


class UtilisateurAdminSerializer(serializers.ModelSerializer):
    """
    Gestion complète d'un compte par un administrateur : peut créer un agent,
    changer un rôle, rattacher/détacher un service, activer/désactiver un compte.
    Le mot de passe est optionnel : requis à la création, facultatif en modification
    (DRF ignore automatiquement les champs 'required' lors d'une mise à jour partielle).
    """

    password = serializers.CharField(
        write_only=True, required=True, validators=[validate_password]
    )

    class Meta:
        model = Utilisateur
        fields = [
            "id", "email", "password", "nom", "prenom", "telephone",
            "role", "service", "is_active", "date_creation",
        ]
        read_only_fields = ["id", "date_creation"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = Utilisateur(**validated_data)
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance 