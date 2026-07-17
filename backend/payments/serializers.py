from rest_framework import serializers
from .models import Wallet, Transaction, Withdrawal
from riders.serializers import BankAccountSerializer

class WalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wallet
        fields = ('balance', 'pending_balance', 'currency')

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ('id', 'amount', 'transaction_type', 'description', 'created_at')

class WithdrawalSerializer(serializers.ModelSerializer):
    bank_account = BankAccountSerializer(read_only=True)
    requested_at = serializers.DateTimeField(source='created_at', read_only=True)
    processed_at = serializers.DateTimeField(read_only=True)

    class Meta:
        model = Withdrawal
        fields = ('id', 'amount', 'status', 'bank_account', 'requested_at', 'processed_at')
