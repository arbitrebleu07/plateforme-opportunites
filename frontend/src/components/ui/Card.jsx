import React from 'react'

void React

export function Card({ children, className = '', hover = false }) {
  const hoverClass = hover ? 'hover:shadow-lg transition-shadow' : ''
  
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${hoverClass} ${className}`}>
      {children}
    </div>
  )
}
