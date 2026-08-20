import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RatingModal } from '@/components/rating/RatingModal';

describe('RatingModal Component', () => {
  it('renders rating modal when open with rider name and order reference', () => {
    render(
      <RatingModal
        isOpen={true}
        onClose={() => {}}
        deliveryId="d1"
        customerId="c1"
        riderId="r1"
        riderName="John Mukasa"
        orderReference="ORD-2026-8801"
      />
    );

    expect(screen.getByText(/How was your delivery\?/i)).toBeInTheDocument();
    expect(screen.getByText('John Mukasa')).toBeInTheDocument();
    expect(screen.getByText(/ORD-2026-8801/i)).toBeInTheDocument();
    expect(screen.getByText(/What went well\?/i)).toBeInTheDocument();
  });

  it('allows clicking quick tag chips to toggle tag selection', () => {
    render(
      <RatingModal
        isOpen={true}
        onClose={() => {}}
        deliveryId="d1"
        customerId="c1"
        riderId="r1"
        riderName="John Mukasa"
      />
    );

    const onTimeTag = screen.getByText(/⚡ On time/i);
    expect(onTimeTag).toBeInTheDocument();
    fireEvent.click(onTimeTag);
  });
});
