import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

class TrackingConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = "delivery_updates"
        
        # Join group
        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()
        print(f"🔌 WebSocket connected: {self.channel_name}")

    async def disconnect(self, close_code):
        # Leave group
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )
        print(f"🔌 WebSocket disconnected: {self.channel_name}")

    async def receive(self, text_data):
        # We don't expect much client-to-server messaging, but handle if any
        try:
            data = json.loads(text_data)
            print(f"Received WebSocket message: {data}")
        except Exception as e:
            print(f"Error parsing received data: {e}")

    # Receive message from group
    async def delivery_update(self, event):
        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'type': 'delivery_update',
            'data': event['data']
        }))

# Global helper function to trigger a delivery update broadcast from synchronous code (views)
def notify_delivery_update(delivery):
    channel_layer = get_channel_layer()
    if channel_layer:
        rider_location = None
        if delivery.rider and delivery.rider.latitude is not None and delivery.rider.longitude is not None:
            rider_location = {
                'lat': delivery.rider.latitude,
                'lng': delivery.rider.longitude
            }
            
        async_to_sync(channel_layer.group_send)(
            "delivery_updates",
            {
                "type": "delivery_update",
                "data": {
                    "delivery_id": str(delivery.id),
                    "status": delivery.status,
                    "rider_location": rider_location,
                    "eta": float(delivery.estimated_duration)
                }
            }
        )
        print(f"📢 Broadcasted WebSocket update for delivery: {delivery.id}")
