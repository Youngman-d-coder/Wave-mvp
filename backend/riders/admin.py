from django.contrib import admin
from django.apps import apps
from django.contrib.admin.sites import AlreadyRegistered


# Automatically register all models in the riders app with the admin site.
# This avoids having to manually register each new model.
app_config = apps.get_app_config('riders')
for model in app_config.get_models():
	try:
		admin.site.register(model)
	except AlreadyRegistered:
		pass
