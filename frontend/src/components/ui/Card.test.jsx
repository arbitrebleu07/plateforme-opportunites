import React from 'react'
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Card } from './Card'

describe('Card', () => {
  it('should render children', () => {
    render(<Card>Card content</Card>)
    const card = screen.getByText('Card content')
    
    expect(card).toBeInTheDocument()
  })
  
  it('should apply hover effect when hover prop is true', () => {
    render(<Card hover>Hoverable card</Card>)
    const card = screen.getByText('Hoverable card').parentElement
    
    expect(card).toHaveClass('hover:shadow-lg')
  })
  
  it('should not apply hover effect when hover prop is false', () => {
    render(<Card hover={false}>Non-hoverable card</Card>)
    const card = screen.getByText('Non-hoverable card').parentElement
    
    expect(card).not.toHaveClass('hover:shadow-lg')
  })
  
  it('should apply custom className', () => {
    render(<Card className="custom-class">Custom card</Card>)
    const card = screen.getByText('Custom card').parentElement
    
    expect(card).toHaveClass('custom-class')
  })
})
