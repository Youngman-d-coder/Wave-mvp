import json

from asgiref.sync import async_to_sync
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.layers import get_channel_layer
from channels.db import database_sync_to_async

from riders.models import RiderProfile


def _user_group(user_id):
    return f"user_{user_id}"


@database_sync_to_async
def _can_receive_open_jobs(user_id):
    return RiderProfile.objects.filter(
        user_id=user_id, verification_status="verified", is_online=True
    ).exists()


class TrackingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        user = self.scope.get("user")
        if not user or user.is_anonymous:
            await self.close(code=4401)
            return

        self.groups_to_join = [_user_group(user.id)]
        if user.user_type == "rider" and await _can_receive_open_jobs(user.id):
            self.groups_to_join.append("riders")

        for group in self.groups_to_join:
            await self.channel_layer.group_add(group, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        for group in getattr(self, "groups_to_join", []):
            await self.channel_layer.group_discard(group, self.channel_name)

    async def receive(self, text_data):
        # Client-to-server commands are deliberately unsupported. State changes
        # must go through authenticated REST endpoints where permissions apply.
        return

    async def delivery_update(self, event):
        await self.send(text_data=json.dumps({"type": "delivery_update", "data": event["data"]}))

    async def delivery_request(self, event):
        await self.send(text_data=json.dumps({"type": "delivery_request", "data": event["data"]}))

    async def delivery_request_closed(self, event):
        await self.send(text_data=json.dumps({"type": "delivery_request_closed", "data": event["data"]}))


def notify_delivery_update(delivery):
    """Broadcast a delivery update only to the customer and currently assigned rider."""
    channel_layer = get_channel_layer()
    if not channel_layer:
        return

    rider_location = None
    if delivery.rider and delivery.rider.latitude is not None and delivery.rider.longitude is not None:
        rider_location = {"lat": delivery.rider.latitude, "lng": delivery.rider.longitude}

    payload = {
        "delivery_id": str(delivery.id),
        "status": delivery.status,
        "rider_location": rider_location,
        "eta": float(delivery.estimated_duration),
    }

    groups = {_user_group(delivery.customer_id)}
    if delivery.rider:
        groups.add(_user_group(delivery.rider.user_id))

    for group in groups:
        async_to_sync(channel_layer.group_send)(group, {"type": "delivery_update", "data": payload})


def notify_delivery_request(delivery):
    """Broadcast an available job to authenticated rider sockets only."""
    channel_layer = get_channel_layer()
    if not channel_layer or delivery.status != "searching_rider" or delivery.rider_id is not None:
        return

    payload = {
        "id": str(delivery.id),
        "pickup": delivery.pickup_address,
        "dropoff": delivery.dropoff_address,
        "distance": f"{delivery.estimated_distance:.1f} km",
        "estimated_fare": float(delivery.fare_total),
        "package_type": delivery.get_package_type_display(),
    }
    async_to_sync(channel_layer.group_send)("riders", {"type": "delivery_request", "data": payload})


def notify_delivery_request_closed(delivery):
    channel_layer = get_channel_layer()
    if not channel_layer:
        return
    async_to_sync(channel_layer.group_send)(
        "riders",
        {"type": "delivery_request_closed", "data": {"delivery_id": str(delivery.id)}},
    )
