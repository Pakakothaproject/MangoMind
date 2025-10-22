import React from 'react';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  // Uses the .skeleton class defined in index.css for the animation
  return (
    <div
      className={`skeleton ${className || ''}`}
      {...props}
    />
  );
}

export { Skeleton };