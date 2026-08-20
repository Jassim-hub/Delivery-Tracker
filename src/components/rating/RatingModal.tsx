import React, { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { mockStore } from '@/lib/supabase/mock-store';
import { Star, ThumbsUp, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  deliveryId: string;
  customerId: string;
  riderId: string;
  riderName?: string;
  orderReference?: string;
  onSubmitted?: () => void;
}

const QUICK_TAGS = [
  '⚡ On time',
  '😊 Friendly',
  '📦 Careful handling',
  '🧭 Good communication',
  '⭐ Professional',
  '⏱️ Minor delay',
];

export const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  deliveryId,
  customerId,
  riderId,
  riderName = 'John Mukasa',
  orderReference,
  onSubmitted,
}) => {
  const [stars, setStars] = useState<number>(5);
  const [hoveredStars, setHoveredStars] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>(['⚡ On time', '😊 Friendly']);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Save rating into mockStore / Supabase
    mockStore.addRating(
      deliveryId,
      customerId,
      riderId,
      stars,
      comment,
      selectedTags.map((t) => t.replace(/^[^\w\s]+\s*/, '')) // strip emojis
    );

    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#1D4ED8', '#F5A623', '#1E9E64'],
      });
    } catch {
      // ignore
    }

    setIsSubmitting(false);
    onSubmitted?.();
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="How was your delivery?"
      description={orderReference ? `Order #${orderReference} completed` : 'Rate your recent delivery experience'}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* Rider Profile Highlight */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/70 border border-blue-100">
          <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
            {riderName.charAt(0)}
          </div>
          <div>
            <div className="text-xs font-bold text-gray-900">{riderName}</div>
            <div className="text-[11px] text-muted">Your Delivery Partner</div>
          </div>
        </div>

        {/* Interactive Star Rating */}
        <div className="flex flex-col items-center justify-center py-2 space-y-1">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((value) => {
              const active = (hoveredStars || stars) >= value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setStars(value)}
                  onMouseEnter={() => setHoveredStars(value)}
                  onMouseLeave={() => setHoveredStars(0)}
                  className="p-1 text-gray-300 hover:scale-125 transition-transform duration-150 focus:outline-none"
                  aria-label={`${value} stars`}
                >
                  <Star
                    className={`w-8 h-8 ${
                      active ? 'fill-accent text-accent filter drop-shadow-sm' : 'text-gray-300'
                    }`}
                  />
                </button>
              );
            })}
          </div>
          <span className="text-xs font-semibold text-primary pt-1">
            {stars === 5 && '🌟 Outstanding Delivery!'}
            {stars === 4 && '👍 Great Service'}
            {stars === 3 && '👌 Good'}
            {stars === 2 && '👎 Fair'}
            {stars === 1 && '⚠️ Poor Experience'}
          </span>
        </div>

        {/* Quick Tag Chips */}
        <div>
          <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-2">
            What went well?
          </label>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_TAGS.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    isSelected
                      ? 'bg-primary text-white shadow-sm ring-1 ring-primary'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* Optional Review Comment */}
        <div>
          <label htmlFor="rating-comment" className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
            Additional Comments (Optional)
          </label>
          <textarea
            id="rating-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share feedback to help riders improve..."
            rows={2}
            className="w-full text-xs rounded-xl p-3 bg-gray-50 border border-gray-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-gray-900"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Skip for now
          </Button>
          <Button type="submit" variant="accent" size="sm" isLoading={isSubmitting} className="font-bold">
            <Sparkles className="w-3.5 h-3.5 mr-1" />
            Submit Rating
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
