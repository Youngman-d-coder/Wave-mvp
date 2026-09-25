from django.db import migrations, models


def keep_latest_otp_per_phone(apps, schema_editor):
    OTPVerification = apps.get_model("accounts", "OTPVerification")
    phones = list(
        OTPVerification.objects.values_list("phone", flat=True)
        .order_by()
        .distinct()
    )
    for phone in phones:
        ids = list(
            OTPVerification.objects.filter(phone=phone)
            .order_by("-created_at", "-id")
            .values_list("id", flat=True)
        )
        if len(ids) > 1:
            OTPVerification.objects.filter(id__in=ids[1:]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0002_alter_user_managers"),
    ]

    operations = [
        migrations.RunPython(keep_latest_otp_per_phone, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="otpverification",
            name="otp_code",
            field=models.CharField(max_length=128),
        ),
        migrations.AlterField(
            model_name="otpverification",
            name="phone",
            field=models.CharField(max_length=20, unique=True),
        ),
    ]
