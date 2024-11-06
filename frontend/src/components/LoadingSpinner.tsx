
export default function LoadingSpinner({ 
    size = 'small',
    className = ''
  }: { 
    size?: 'small' | 'medium' | 'large'
    className?: string
  }) {
    const sizeClasses = {
      small: 'w-4 h-4 border-2',
      medium: 'w-6 h-6 border-2',
      large: 'w-8 h-8 border-3'
    };
  
    return (
      <div 
        className={`
          ${sizeClasses[size]} 
          border-current 
          border-t-transparent 
          rounded-full 
          animate-spin
          ${className}
        `}
        role="status"
        aria-label="Loading"
      />
    );
  }