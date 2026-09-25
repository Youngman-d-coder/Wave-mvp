from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("riders", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="riderprofile",
            name="verification_status",
            field=models.CharField(
                choices=[
                    ("pending", "Pending"),
                    ("under_review", "Under Review"),
                    ("verified", "Verified"),
                    ("rejected", "Rejected"),
                ],
                default="pending",
                max_length=20,
            ),
        ),
    ]
