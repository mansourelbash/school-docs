import React from 'react'

interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

export const Checkbox: React.FC<CheckboxProps> = ({ 
  checked, 
  onChange, 
  disabled = false, 
  className = '' 
}) => {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      disabled={disabled}
      className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${className}`}
    />
  )
}
