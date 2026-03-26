import Image from 'next/image'

interface ProductImageProps {
  src?: string | null
  alt: string
  size?: number
  className?: string
}

export function ProductImage({ src, alt, size = 80, className = '' }: ProductImageProps) {
  if (!src) {
    return (
      <div
        className={`bg-muted rounded-lg flex items-center justify-center text-muted-foreground ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-2xl">🛒</span>
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`object-contain rounded-lg ${className}`}
      unoptimized={!src.startsWith('https://images.openfoodfacts.org')}
    />
  )
}
