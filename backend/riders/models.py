import uuid
from django.db import models
from django.conf import settings

class RiderProfile(models.Model):
    VEHICLE_CHOICES = (
        ('motorcycle', 'Motorcycle'),
        ('bicycle', 'Bicycle'),
        ('car', 'Car'),
        ('van', 'Van'),
    )
    
    VERIFICATION_CHOICES = (
        ('pending', 'Pending'),
        ('under_review', 'Under Review'),
        ('verified', 'Verified'),
        ('rejected', 'Rejected'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='rider_profile')
    vehicle_type = models.CharField(max_length=20, choices=VEHICLE_CHOICES, default='motorcycle')
    vehicle_make = models.CharField(max_length=50, null=True, blank=True)
    vehicle_model = models.CharField(max_length=50, null=True, blank=True)
    vehicle_year = models.IntegerField(null=True, blank=True)
    vehicle_color = models.CharField(max_length=30, null=True, blank=True)
    plate_number = models.CharField(max_length=20, null=True, blank=True)
    
    is_online = models.BooleanField(default=False)
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    
    rating = models.FloatField(default=5.0)
    total_reviews = models.IntegerField(default=0)
    verification_status = models.CharField(max_length=20, choices=VERIFICATION_CHOICES, default='verified') # Default verified for MVP
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Rider: {self.user.full_name} ({self.vehicle_type})"

class BankAccount(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    rider = models.ForeignKey(RiderProfile, on_delete=models.CASCADE, related_name='bank_accounts')
    bank_name = models.CharField(max_length=100)
    account_number = models.CharField(max_length=50)
    account_name = models.CharField(max_length=150)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.bank_name} - {self.account_number} ({self.account_name})"
