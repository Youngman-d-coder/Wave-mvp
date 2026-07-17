from rest_framework import views, status, permissions
from rest_framework.response import Response

class PaymentStatusView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({'message': 'Payments service is online'})
