from rest_framework import serializers

from accounts.serializers import ServiceSerializer, ZoneSerializer

from .models import (
    Categorie,
    HistoriqueStatut,
    Media,
    Reclamation,
    TypeMedia,
)


# ============================================================
# Validation des médias
# ============================================================

LIMITES_TAILLE_OCTETS = {
    TypeMedia.PHOTO: 5 * 1024 * 1024,   # 5 Mo
    TypeMedia.VIDEO: 50 * 1024 * 1024,  # 50 Mo
}


def _detecter_type_reel(fichier):
    """
    Détecte le type réel d'un fichier à partir de sa signature binaire
    ("magic bytes"), indépendamment du nom ou de l'extension.

    Le curseur est remis à 0 après lecture afin que Django puisse
    sauvegarder le fichier intégralement.
    """

    fichier.seek(0)
    entete = fichier.read(32)
    fichier.seek(0)

    # JPEG
    if entete.startswith(b"\xff\xd8\xff"):
        return TypeMedia.PHOTO

    # PNG
    if entete.startswith(b"\x89PNG\r\n\x1a\n"):
        return TypeMedia.PHOTO

    # GIF
    if entete.startswith(b"GIF87a") or entete.startswith(b"GIF89a"):
        return TypeMedia.PHOTO

    # MP4 / MOV / M4V
    if entete[4:8] == b"ftyp":
        return TypeMedia.VIDEO

    # WebM
    if entete.startswith(b"\x1a\x45\xdf\xa3"):
        return TypeMedia.VIDEO

    # Format non reconnu
    return None


# ============================================================
# Categorie
# ============================================================

class CategorieSerializer(serializers.ModelSerializer):

    class Meta:
        model = Categorie
        fields = ["id", "nom", "description"]
        read_only_fields = ["id"]


# ============================================================
# Utilisateur résumé
# ============================================================

class UtilisateurResumeSerializer(serializers.Serializer):
    """
    Représentation minimale d'un utilisateur
    (citoyen ou agent) imbriquée dans une réclamation.
    """

    id = serializers.UUIDField(read_only=True)
    email = serializers.EmailField(read_only=True)
    nom = serializers.CharField(read_only=True)
    prenom = serializers.CharField(read_only=True)


# ============================================================
# Media
# ============================================================

class MediaSerializer(serializers.ModelSerializer):
    """
    Serializer utilisé pour les médias liés aux réclamations.

    reclamation :
        Lecture seule. Assignée par la vue à partir de l'URL.

    taille_octets :
        Lecture seule. Calculée automatiquement depuis le fichier reçu.
    """

    taille_octets = serializers.IntegerField(read_only=True)

    class Meta:
        model = Media
        fields = [
            "id",
            "reclamation",
            "fichier",
            "type_media",
            "taille_octets",
            "date_upload",
        ]
        read_only_fields = [
            "id",
            "reclamation",
            "date_upload",
        ]

    def validate(self, attrs):
        """
        Vérifie :
        1. La taille maximale du fichier.
        2. Le format réel du fichier.
        3. La cohérence entre le contenu réel et type_media.
        """

        fichier = attrs.get("fichier")
        type_media = attrs.get("type_media")

        if fichier is not None:

            # ------------------------------------------------
            # 1. Vérification de la taille
            # ------------------------------------------------

            limite = LIMITES_TAILLE_OCTETS.get(type_media)

            if limite is not None and fichier.size > limite:
                limite_mo = limite // (1024 * 1024)

                raise serializers.ValidationError(
                    {
                        "fichier": [
                            f"Fichier trop volumineux "
                            f"(max {limite_mo} Mo pour {type_media})."
                        ]
                    }
                )

            # ------------------------------------------------
            # 2. Détection du type réel
            # ------------------------------------------------

            type_reel = _detecter_type_reel(fichier)

            if type_reel is None:
                raise serializers.ValidationError(
                    {
                        "fichier": [
                            "Format de fichier non reconnu "
                            "ou non supporté."
                        ]
                    }
                )

            # ------------------------------------------------
            # 3. Comparaison avec le type déclaré
            # ------------------------------------------------

            if type_reel != type_media:
                raise serializers.ValidationError(
                    {
                        "fichier": [
                            f"Le contenu du fichier ne correspond "
                            f"pas au type déclaré ({type_media})."
                        ]
                    }
                )

        return attrs

    def create(self, validated_data):
        """
        Enregistre automatiquement la taille réelle du fichier.
        """

        fichier = validated_data["fichier"]

        validated_data["taille_octets"] = fichier.size

        return Media.objects.create(**validated_data)


# ============================================================
# Historique des statuts
# ============================================================

class HistoriqueStatutSerializer(serializers.ModelSerializer):
    """
    Serializer entièrement en lecture seule.

    L'historique est créé uniquement côté serveur
    lors d'un changement de statut.
    """

    auteur = UtilisateurResumeSerializer(read_only=True)

    class Meta:
        model = HistoriqueStatut

        fields = [
            "id",
            "ancien_statut",
            "nouveau_statut",
            "commentaire",
            "auteur",
            "date_changement",
        ]

        read_only_fields = fields


# ============================================================
# Création d'une réclamation
# ============================================================

class ReclamationCreationSerializer(serializers.ModelSerializer):
    """
    Seul point d'entrée en écriture pour un citoyen.

    Certains champs sont déterminés côté serveur :
    - citoyen
    - statut
    - numero_suivi
    - date_creation
    """

    class Meta:
        model = Reclamation

        fields = [
            "id",
            "numero_suivi",
            "titre",
            "description",
            "categorie",
            "latitude",
            "longitude",
            "adresse_approx",
            "statut",
            "date_creation",
        ]

        read_only_fields = [
            "id",
            "numero_suivi",
            "statut",
            "date_creation",
        ]

    def create(self, validated_data):
        utilisateur = self.context["request"].user

        return Reclamation.objects.create(
            citoyen=utilisateur,
            **validated_data
        )


# ============================================================
# Liste des réclamations
# ============================================================

class ReclamationListSerializer(serializers.ModelSerializer):
    """
    Version allégée pour les listes.

    Les médias et l'historique ne sont pas inclus.
    """

    categorie = CategorieSerializer(read_only=True)

    class Meta:
        model = Reclamation

        fields = [
            "id",
            "numero_suivi",
            "titre",
            "categorie",
            "statut",
            "date_creation",
        ]

        read_only_fields = fields


# ============================================================
# Détail d'une réclamation
# ============================================================

class ReclamationDetailSerializer(serializers.ModelSerializer):
    """
    Lecture complète d'une réclamation avec ses relations.
    """

    categorie = CategorieSerializer(read_only=True)
    zone = ZoneSerializer(read_only=True)
    service = ServiceSerializer(read_only=True)

    citoyen = UtilisateurResumeSerializer(read_only=True)
    agent = UtilisateurResumeSerializer(read_only=True)

    medias = MediaSerializer(
        many=True,
        read_only=True
    )

    historique = HistoriqueStatutSerializer(
        many=True,
        read_only=True
    )

    class Meta:
        model = Reclamation

        fields = [
            "id",
            "numero_suivi",
            "titre",
            "description",
            "latitude",
            "longitude",
            "adresse_approx",
            "statut",
            "citoyen",
            "categorie",
            "zone",
            "service",
            "agent",
            "date_creation",
            "date_maj",
            "date_cloture",
            "note_citoyen",
            "medias",
            "historique",
        ]

        read_only_fields = fields


# ============================================================
# Changement de statut
# ============================================================

class ReclamationChangementStatutSerializer(serializers.Serializer):
    """
    Valide uniquement les données envoyées pour un changement
    de statut.

    Le changement réel est effectué côté serveur par :
    reclamation.changer_statut(...)
    """

    statut = serializers.ChoiceField(
        choices=Reclamation._meta.get_field("statut").choices
    )

    commentaire = serializers.CharField(
        required=False,
        allow_blank=True,
        default=""
    )