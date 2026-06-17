import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Badge } from './Badge'

describe('Badge', () => {
  it('should render with default variant', () => {
    render(<Badge>Default</Badge>)
    const badge = screen.getByText('Default')
    
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveClass('bg-gray-100')
  })
  
  it('should render with different variants', () => {
    const { rerender } = render(<Badge variant="primary">Primary</Badge>)
    let badge = screen.getByText('Primary')
    expect(badge).toHaveClass('bg-blue-100')
    
    rerender(<Badge variant="success">Success</Badge>)
    badge = screen.getByText('Success')
    expect(badge).toHaveClass('bg-green-100')
    
    rerender(<Badge variant="warning">Warning</Badge>)
    badge = screen.getByText('Warning')
    expect(badge).toHaveClass('bg-yellow-100')
    
    rerender(<Badge variant="danger">Danger</Badge>)
    badge = screen.getByText('Danger')
    expect(badge).toHaveClass('bg-red-100')
  })
  
  it('should apply custom className', () => {
    render(<Badge className="custom-class">Custom</Badge>)
    const badge = screen.getByText('Custom')
    expect(badge).toHaveClass('custom-class')
  })
})
