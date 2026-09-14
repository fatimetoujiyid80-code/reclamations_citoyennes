from django.contrib import admin

from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("utilisateur", "canal", "statut_envoi", "date_envoi")
    list_filter = ("canal", "statut_envoi")
    readonly_fields = [f.name for f in Notification._meta.fields]

    def has_add_permission(self, request):
        return False