import { type SVGProps } from 'react'

type IconComponent = React.FC<SVGProps<SVGSVGElement>>

interface IconProps {
  icon: IconComponent
  size?: number
  className?: string
}

export function Icon({ icon: IconComponent, size = 16, className = '' }: IconProps) {
  return (
    <IconComponent
      width={size}
      height={size}
      className={`inline-block shrink-0 ${className}`}
    />
  )
}
