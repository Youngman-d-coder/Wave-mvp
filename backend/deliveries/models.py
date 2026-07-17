import uuid
import random
import string
from django.db import models
from django.conf import settings
from riders.models import RiderProfile

class Delivery(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('searching_rider', 'Searching Rider'),
        ('rider_assigned', 'Rider Assigned'),
        ('rider_arrived', 'Rider Arrived'),
        ('picked_up', 'Picked Up'),
        ('in_transit', 'In Transit'),
        ('near_destination', 'Near Destination'),
        ('delivered', 'Delivered'),
        ('cancelled', 'Cancelled'),
        ('failed', 'Failed'),
    )

    PACKAGE_TYPE_CHOICES = (
        ('document', 'Document'),
        ('small_package', 'Small Package'),
        ('medium_package', 'Medium Package'),
        ('large_package', 'Large Package'),
        ('fragile', 'Fragile'),
    )

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tracking_number = models.CharField(max_length=20, unique=True, editable=False)
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='customer_deliveries')
    rider = models.ForeignKey(RiderProfile, on_delete=models.SET_NULL, null=True, blank=True, related_name='rider_deliveries')
    
    # Pickup details
    pickup_address = models.CharField(max_length=255)
    pickup_lat = models.FloatField()
    pickup_lng = models.FloatField()
    pickup_contact_name = models.CharField(max_length=100)
    pickup_contact_phone = models.CharField(max_length=20)
    pickup_instructions = models.TextField(null=True, blank=True)

    # Dropoff details
    dropoff_address = models.CharField(max_length=255)
    dropoff_lat = models.FloatField()
    dropoff_lng = models.FloatField()
    dropoff_contact_name = models.CharField(max_length=100)
    dropoff_contact_phone = models.CharField(max_length=20)
    dropoff_instructions = models.TextField(null=True, blank=True)

    # Package details
    package_type = models.CharField(max_length=20, choices=PACKAGE_TYPE_CHOICES, default='small_package')
    package_weight = models.FloatField(default=1.0) # in kg
    package_length = models.FloatField(default=0.0) # in cm
    package_width = models.FloatField(default=0.0)
    package_height = models.FloatField(default=0.0)
    package_description = models.TextField(null=True, blank=True)
    package_is_fragile = models.BooleanField(default=False)

    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    # Fare details
    fare_base = models.DecimalField(max_digits=10, decimal_places=2, default=500.00)
    fare_distance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    fare_weight = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    fare_surge_multiplier = models.DecimalField(max_digits=4, decimal_places=2, default=1.00)
    fare_promo_discount = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    fare_total = models.DecimalField(max_digits=10, decimal_places=2, default=500.00)
    fare_currency = models.CharField(max_length=10, default='NGN')

    # Payment details
    payment_method = models.CharField(max_length=20, default='wallet')
    payment_status = models.CharField(max_length=20, default='pending')
    payment_transaction_id = models.CharField(max_length=100, null=True, blank=True)
    payment_paid_at = models.DateTimeField(null=True, blank=True)

    # Timeline (Stores JSON list of dicts: [{'status': '...', 'timestamp': '...', 'note': '...'}])
    timeline = models.JSONField(default=list, blank=True)

    # Route details
    estimated_distance = models.FloatField(default=0.0) # in km
    estimated_duration = models.FloatField(default=0.0) # in minutes

    notes = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.tracking_number:
            self.tracking_number = 'WAVE-' + ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        super().save(*args, **kwargs)

    def add_timeline_event(self, status_val, note=None):
        from django.utils import timezone
        event = {
            'status': status_val,
            'timestamp': timezone.now().isoformat(),
            'note': note or f"Status changed to {status_val.replace('_', ' ')}"
        }
        if not self.timeline:
            self.timeline = []
        self.timeline.append(event)

    def __str__(self):
        return f"{self.tracking_number} - {self.status}"
