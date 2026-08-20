import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusStepper } from '@/components/deliveries/StatusStepper';

describe('StatusStepper Component', () => {
  it('renders all 5 progressive delivery steps', () => {
    render(<StatusStepper currentStatus="in_transit" />);
    expect(screen.getByText('Placed')).toBeInTheDocument();
    expect(screen.getByText('Assigned')).toBeInTheDocument();
    expect(screen.getByText('Picked Up')).toBeInTheDocument();
    expect(screen.getByText('In Transit')).toBeInTheDocument();
    expect(screen.getByText('Delivered')).toBeInTheDocument();
  });

  it('renders exception alert box when status is cancelled or failed', () => {
    render(<StatusStepper currentStatus="cancelled" />);
    expect(screen.getByText(/Delivery cancelled/i)).toBeInTheDocument();
  });
});
