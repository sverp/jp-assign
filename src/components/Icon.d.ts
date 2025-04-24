import React from 'react';

declare module './Icon' {
  interface IconProps {
    name: string;
    size?: number;
    className?: string;
  }

  const Icon: React.FC<IconProps>;
  export default Icon;
} 