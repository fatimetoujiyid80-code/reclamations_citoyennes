from django.urls import path

from .views import TableauDeBordCarteView, TableauDeBordKPIView

urlpatterns = [
    path("kpi/", TableauDeBordKPIView.as_view(), name="dashboard-kpi"),
    path("carte/", TableauDeBordCarteView.as_view(), name="dashboard-carte"),
]