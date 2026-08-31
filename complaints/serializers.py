from rest_framework import serializers

from accounts.serializers import ServiceSerializer, ZoneSerializer

from .models import Categorie, HistoriqueStatut, Media, Reclamation


class CategorieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categorie
        fields = ["id", "nom", "description"]
        read_only_fields = ["id"]


class UtilisateurResumeSerializer(serializers.Serializer):
    """
    Représentation minimale d'un utilisateur (citoyen ou agent) imbriquée
    dans une réclamation. Volontairement séparée des serializers de
    accounts.serializers : ceux-ci exposent soit trop peu (email seul),
    soit trop (UtilisateurAdminSerializer attend un mot de passe).
    Lecture seule : ne sert jamais à créer/modifier un utilisateur.
    """

    id = serializers.UUIDField(read_only=True)
    email = serializers.EmailField(read_only=True)
    nom = serializers.CharField(read_only=True)
    prenom = serializers.CharField(read_only=True)


class MediaSerializer(serializers.ModelSerializer):
    """
    reclamation : read_only — assignée par la vue (à partir de l'URL),
        jamais choisie par le client.
    taille_octets : read_only — calculée depuis le fichier réellement
        reçu, jamais depuis une valeur envoyée par le client.
    """

    taille_octets = serializers.IntegerField(read_only=True)

    class Meta:
        model = Media
        fields = ["id", "reclamation", "fichier", "type_media", "taille_octets", "date_upload"]
        read_only_fields = ["id", "reclamation", "date_upload"]

    def create(self, validated_data):
        fichier = validated_data["fichier"]
        validated_data["taille_octets"] = fichier.size
        return Media.objects.create(**validated_data)


class HistoriqueStatutSerializer(serializers.ModelSerializer):
    """
    Entièrement en lecture seule : l'historique n'est jamais créé ni modifié
    via ce serializer, uniquement par Reclamation.changer_statut() (Phase 4),
    qui crée la ligne HistoriqueStatut lui-même côté serveur.
    IMPORTANT : aucune route de views.py ne doit jamais appeler .save()
    sur ce serializer (voir explication ci-dessus) — lecture seule only.
    """

    auteur = UtilisateurResumeSerializer(read_only=True)

    class Meta:
        model = HistoriqueStatut
        fields = [
            "id", "ancien_statut", "nouveau_statut",
            "commentaire", "auteur", "date_changement",
        ]
        read_only_fields = fields


class ReclamationCreationSerializer(serializers.ModelSerializer):
    """
    Seul point d'entrée en écriture pour un citoyen. N'expose ni statut,
    ni service, ni agent, ni zone, ni numero_suivi : ces champs sont
    déterminés côté serveur et n'apparaissent donc jamais dans
    validated_data.
    """

    class Meta:
        model = Reclamation
        fields = [
            "id", "numero_suivi", "titre", "description", "categorie",
            "latitude", "longitude", "adresse_approx", "statut",
            "date_creation",
        ]
        read_only_fields = ["id", "numero_suivi", "statut", "date_creation"]

    def create(self, validated_data):
        utilisateur = self.context["request"].user
        return Reclamation.objects.create(citoyen=utilisateur, **validated_data)


class ReclamationListSerializer(serializers.ModelSerializer):
    """Version allégée pour les listes : pas de médias ni d'historique imbriqués."""

    categorie = CategorieSerializer(read_only=True)

    class Meta:
        model = Reclamation
        fields = [
            "id", "numero_suivi", "titre", "categorie",
            "statut", "date_creation",
        ]
        read_only_fields = fields


class ReclamationDetailSerializer(serializers.ModelSerializer):
    """Lecture complète d'une réclamation, avec ses relations imbriquées."""

    categorie = CategorieSerializer(read_only=True)
    zone = ZoneSerializer(read_only=True)
    service = ServiceSerializer(read_only=True)
    citoyen = UtilisateurResumeSerializer(read_only=True)
    agent = UtilisateurResumeSerializer(read_only=True)
    medias = MediaSerializer(many=True, read_only=True)
    historique = HistoriqueStatutSerializer(many=True, read_only=True)

    class Meta:
        model = Reclamation
        fields = [
            "id", "numero_suivi", "titre", "description",
            "latitude", "longitude", "adresse_approx", "statut",
            "citoyen", "categorie", "zone", "service", "agent",
            "date_creation", "date_maj", "date_cloture", "note_citoyen",
            "medias", "historique",
        ]
        read_only_fields = fields


class ReclamationChangementStatutSerializer(serializers.Serializer):
    """
    Ne modifie JAMAIS l'objet directement : ce serializer valide seulement
    l'entrée. La vue (étape suivante) appellera ensuite explicitement
    reclamation.changer_statut(statut, auteur, commentaire) — c'est cette
    méthode du modèle (Phase 4) qui applique le changement et journalise.
    """

    statut = serializers.ChoiceField(choices=Reclamation._meta.get_field("statut").choices)
    commentaire = serializers.CharField(required=False, allow_blank=True, default="")