import React, { useState, useEffect } from 'react';
import { MapPin, User, Phone, Weight, ChevronRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { Stepper } from '../../components/ui/Stepper';
import { Skeleton } from '../../components/ui/Skeleton';
import { GeoLocation, PackageType } from '../../types';

interface BookingFormProps {
  pickup: GeoLocation | null;
  dropoff: GeoLocation | null;
  pickupAddress?: string;
  dropoffAddress?: string;
  onSubmit: (data: BookingData) => void;
  fare: { total: number; currency: string } | null;
  isCalculating: boolean;
}

export interface BookingData {
  packageType: PackageType;
  weight: number;
  recipientName: string;
  recipientPhone: string;
  notes: string;
}

const packageTypes: { type: PackageType; label: string; icon: string; maxWeight: number }[] = [
  { type: 'document', label: 'Document', icon: '📄', maxWeight: 1 },
  { type: 'small_package', label: 'Small Package', icon: '📦', maxWeight: 5 },
  { type: 'medium_package', label: 'Medium Package', icon: '📦', maxWeight: 15 },
  { type: 'large_package', label: 'Large Package', icon: '📦', maxWeight: 50 },
  { type: 'fragile', label: 'Fragile', icon: '🥂', maxWeight: 10 },
];

const steps = [
  { id: 'location', label: 'Location' },
  { id: 'package', label: 'Package' },
  { id: 'recipient', label: 'Recipient' },
  { id: 'confirm', label: 'Confirm' },
];

export const BookingForm: React.FC<BookingFormProps> = ({
  pickup,
  dropoff,
  pickupAddress,
  dropoffAddress,
  onSubmit,
  fare,
  isCalculating,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [bookingData, setBookingData] = useState<BookingData>({
    packageType: 'small_package',
    weight: 1,
    recipientName: '',
    recipientPhone: '',
    notes: '',
  });

  const updateField = (field: keyof BookingData, value: any) => {
    setBookingData(prev => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return pickup && dropoff;
      case 1: return bookingData.packageType && bookingData.weight > 0;
      case 2: return bookingData.recipientName && bookingData.recipientPhone;
      case 3: return true;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onSubmit(bookingData);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  // Format package type for display
  const formatPackageType = (type: string) => {
    return type.replaceAll('_', ' ').replace(/\w/g, l => l.toUpperCase());
  };

  return (
    <div className="space-y-6">
      <Stepper steps={steps} currentStep={currentStep} />

      {/* Step 1: Location */}
      {currentStep === 0 && (
        <div className="space-y-4 animate-fade-in">
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-wave-100 dark:bg-wave-900/30 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-wave-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">Pickup Location</p>
                {pickup ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {pickupAddress || `${pickup.lat.toFixed(4)}, ${pickup.lng.toFixed(4)}`}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">
                    Tap on the map to set pickup
                  </p>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-red-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">Drop-off Location</p>
                {dropoff ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {dropoffAddress || `${dropoff.lat.toFixed(4)}, ${dropoff.lng.toFixed(4)}`}
                  </p>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-600 mt-1">
                    Tap on the map to set drop-off
                  </p>
                )}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Step 2: Package Details */}
      {currentStep === 1 && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {packageTypes.map((pkg) => (
              <button
                key={pkg.type}
                onClick={() => updateField('packageType', pkg.type)}
                className={`p-4 rounded-xl border-2 transition-all text-center ${
                  bookingData.packageType === pkg.type
                    ? 'border-wave-500 bg-wave-50 dark:bg-wave-900/20'
                    : 'border-gray-200 dark:border-dark-border hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <span className="text-2xl mb-2 block">{pkg.icon}</span>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{pkg.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Up to {pkg.maxWeight}kg</p>
              </button>
            ))}
          </div>

          <Input
            label="Package Weight (kg)"
            type="number"
            min="0.1"
            step="0.1"
            max={packageTypes.find(p => p.type === bookingData.packageType)?.maxWeight || 50}
            value={bookingData.weight}
            onChange={(e) => updateField('weight', parseFloat(e.target.value) || 0)}
            leftIcon={<Weight className="w-5 h-5" />}
            helperText={`Max weight: ${packageTypes.find(p => p.type === bookingData.packageType)?.maxWeight || 50}kg`}
          />
        </div>
      )}

      {/* Step 3: Recipient */}
      {currentStep === 2 && (
        <div className="space-y-4 animate-fade-in">
          <Input
            label="Recipient Name"
            value={bookingData.recipientName}
            onChange={(e) => updateField('recipientName', e.target.value)}
            leftIcon={<User className="w-5 h-5" />}
            placeholder="Enter recipient's full name"
            required
          />
          <Input
            label="Recipient Phone"
            type="tel"
            value={bookingData.recipientPhone}
            onChange={(e) => updateField('recipientPhone', e.target.value)}
            leftIcon={<Phone className="w-5 h-5" />}
            placeholder="+234..."
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Delivery Notes <span className="text-gray-400">(Optional)</span>
            </label>
            <textarea
              value={bookingData.notes}
              onChange={(e) => updateField('notes', e.target.value)}
              placeholder="Any special instructions..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-dark-border bg-white dark:bg-dark-card text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-wave-500 focus:border-transparent transition-all resize-none"
            />
          </div>
        </div>
      )}

      {/* Step 4: Confirm */}
      {currentStep === 3 && (
        <div className="space-y-4 animate-fade-in">
          <Card className="p-6">
            <h3 className="font-heading font-bold text-lg text-gray-900 dark:text-white mb-4">
              Booking Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Package Type</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {formatPackageType(bookingData.packageType)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Weight</span>
                <span className="font-medium text-gray-900 dark:text-white">{bookingData.weight} kg</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Recipient</span>
                <span className="font-medium text-gray-900 dark:text-white">{bookingData.recipientName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">Phone</span>
                <span className="font-medium text-gray-900 dark:text-white">{bookingData.recipientPhone}</span>
              </div>
              {bookingData.notes && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Notes</span>
                  <span className="font-medium text-gray-900 dark:text-white text-right max-w-[60%]">{bookingData.notes}</span>
                </div>
              )}
              <div className="border-t border-gray-100 dark:border-dark-border pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 dark:text-gray-400">Estimated Fare</span>
                  {isCalculating ? (
                    <div className="animate-pulse h-5 w-20 bg-gray-200 dark:bg-dark-border rounded" />
                  ) : fare ? (
                    <span className="text-2xl font-bold text-wave-500">
                      {fare.currency} {fare.total.toFixed(2)}
                    </span>
                  ) : (
                    <span className="text-gray-400">--</span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-3">
        {currentStep > 0 && (
          <Button variant="secondary" onClick={handleBack} className="flex-1">
            Back
          </Button>
        )}
        <Button
          onClick={handleNext}
          disabled={!canProceed()}
          className="flex-1"
          rightIcon={currentStep < steps.length - 1 ? <ChevronRight className="w-4 h-4" /> : undefined}
        >
          {currentStep === steps.length - 1 ? 'Confirm & Book' : 'Continue'}
        </Button>
      </div>
    </div>
  );
};

export default BookingForm;